import json
import re
import time
import logging
from pathlib import Path
from typing import List, Dict, Any

from tenacity import retry, stop_after_attempt, wait_random_exponential, RetryError
from openai import BadRequestError

from ..core.client import client
from ..core.config import settings
from ..core.models import VulnerabilityInput, VulnerabilityResult
from ..utils.llm import parse_llm_json
from ..utils.web_research import conduct_web_research
from ..utils.rate_limiter import rate_limiter
from .prompts import (
    CODE_TRIAGE_SYSTEM_PROMPT,
    CODE_TRIAGE_USER_PROMPT,
    SYNTHESIS_ANALYSIS_SYSTEM_PROMPT,
    SYNTHESIS_ANALYSIS_USER_PROMPT,
    VULNERABILITY_ANALYSIS_SYSTEM_PROMPT,
)
from ..core.chunk import CodeChunk
from .preprocessor import check_and_organize_chunks, reorder_chunks_by_priority, preprocess_code_chunks
from ..utils.progress import tqdm

logger = logging.getLogger(__name__)


async def analyze_vulnerability(
    vuln: VulnerabilityInput,
    chunks_for_analysis: List[CodeChunk],
    repository_info: Dict[str, Any]
) -> VulnerabilityResult:
    """
    Analyzes a vulnerability using a multi-agent chain:
    1. Code Triage Agent: Extracts objective facts from code.
    2. NVD API Agent: Fetches ground truth CVE data.
    3. Web Research Agent: Gathers additional intelligence from online sources.
    4. Synthesis Agent: Combines all reports for a final analysis.
    """
    start_time = time.time()
    
    logger.info("STAGE 1: CODE TRIAGE")
    logger.info("-" * 20)
    
    code_triage_report_str = await _run_code_triage(vuln, chunks_for_analysis)
    code_triage_report = parse_llm_json(code_triage_report_str, "code_triage_report")
    if not code_triage_report:
        return _create_fallback_result(vuln, chunks_for_analysis, "Failed to parse Code Triage Agent response.")

    logger.info("\nSTAGE 2: NVD DATA PROCESSING")
    logger.info("-" * 20)
    
    # Use pre-fetched NVD data from input if available
    if vuln.has_nvd_data:
        logger.info(f"Using pre-fetched NVD data for {vuln.name}")
        try:
            nvd_fact_sheet = json.loads(vuln.nvd_data)
            logger.info("NVD data successfully parsed from input")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse NVD data JSON: {e}")
            nvd_fact_sheet = {
                "id": vuln.name,
                "description": "NVD data parsing failed.",
                "vulnerable_configurations": []
            }
    else:
        logger.warning(f"No NVD data provided for {vuln.name}. Proceeding without it.")
        nvd_fact_sheet = {
            "id": vuln.name,
            "description": "NVD data was not provided in input.",
            "vulnerable_configurations": []
        }

    logger.info("\nSTAGE 3: WEB RESEARCH")
    logger.info("-" * 20)
    
    web_research_report = await conduct_web_research(vuln.name, vuln.constraints)
    if not web_research_report:
        logger.warning(f"Could not retrieve web research data for {vuln.name}. Using placeholder data.")
        web_research_report = {
            "vulnerability_details": {"description": "Web research data could not be retrieved."},
            "research_quality": {"information_confidence": "low"}
        }

    logger.info("\nSTAGE 4: SYNTHESIS ANALYSIS")
    logger.info("-" * 20)

    try:
        synthesis_prompt = SYNTHESIS_ANALYSIS_USER_PROMPT.format(
            vuln_name=vuln.name,
            original_constraints=vuln.constraints,
            code_triage_report=json.dumps(code_triage_report, indent=2),
            nvd_fact_sheet=json.dumps(nvd_fact_sheet, indent=2),
            web_research_report=json.dumps(web_research_report, indent=2)
        )
        
        logger.info(f"Sending synthesis request (prompt length: {len(synthesis_prompt)} chars)")
        await rate_limiter.wait_if_needed()
        
        completion = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYNTHESIS_ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": f"{synthesis_prompt}\n\nIMPORTANT: Respond with valid JSON only."}
            ],
            timeout=settings.OPENAI_TIMEOUT_SECONDS,
        )
        
        llm_output = completion.choices[0].message.content.strip()
        logger.info("Synthesis analysis completed.")
        
    except Exception as e:
        logger.error(f"Synthesis Agent failed: {e}")
        logger.exception("Full error details:")
        return _create_fallback_result(vuln, chunks_for_analysis, f"Synthesis Agent failed: {e}")

    logger.info("\nSTAGE 5: RESULT CONSTRUCTION")
    logger.info("-" * 20)
    
    try:
        normalized_output = _normalize_llm_output(parse_llm_json(llm_output, "final_analysis"), vuln.name, chunks_for_analysis)
        
        result = VulnerabilityResult(
            vulnerability_name=vuln.name,
            **normalized_output
        )
        logger.info("Result object constructed successfully")
        return result
        
    except Exception as e:
        logger.error(f"Failed to construct final result object: {e}")
        logger.exception("Full error details:")
        return _create_fallback_result(vuln, chunks_for_analysis, f"Result construction failed: {e}")

async def _run_code_triage(vuln: VulnerabilityInput, chunks: List[CodeChunk]) -> str:
    """Runs the Code Triage agent to extract facts from code."""
    
    # This reuses the existing `preprocess_code_chunks` which already prepares
    # the code and dependency info in a text format.
    structured_code = preprocess_code_chunks(vuln, chunks)
    
    if not structured_code.strip():
        logger.error("Preprocessing returned empty code, cannot run triage.")
        return "{}"

    triage_prompt = CODE_TRIAGE_USER_PROMPT.format(
        vuln_name=vuln.name,
        vuln_constraints=vuln.constraints,
        structured_code=structured_code
    )
    
    logger.info(f"Sending code triage request (prompt length: {len(triage_prompt)} chars)")
    
    try:
        await rate_limiter.wait_if_needed()  # Rate limiting
        completion = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": CODE_TRIAGE_SYSTEM_PROMPT},
                {"role": "user", "content": f"{triage_prompt}\n\nCRITICAL: Output must be valid JSON only, no other text."}
            ],
            timeout=settings.OPENAI_TIMEOUT_SECONDS,
        )
        
        report = completion.choices[0].message.content.strip()
        logger.info("Code triage completed successfully.")
        return report
        
    except Exception as e:
        logger.error(f"Code Triage Agent failed: {e}")
        logger.exception("Full error details:")
        return "{}"

def _normalize_llm_output(llm_json: Dict[str, Any], vuln_name: str, chunks_for_analysis: List[CodeChunk]) -> Dict[str, Any]:
    """Normalize LLM output to ensure required fields exist with correct types."""
    normalized = dict(llm_json or {})
    
    # Required scalar fields with defaults
    normalized.setdefault("status", "uncertain")
    
    # Confidence (1-5)
    try:
        confidence = int(normalized.get("confidence", 2))
        normalized["confidence"] = min(5, max(1, confidence))
    except (ValueError, TypeError):
        normalized["confidence"] = 2
    
    # Probability (0.0-1.0)
    try:
        probability = float(normalized.get("probability", 0.5))
        normalized["probability"] = min(1.0, max(0.0, probability))
    except (ValueError, TypeError):
        normalized["probability"] = 0.5
    
    # Exploitable (boolean)
    exploitable_val = normalized.get("exploitable")
    if isinstance(exploitable_val, bool):
        normalized["exploitable"] = exploitable_val
    elif isinstance(exploitable_val, str):
        normalized["exploitable"] = exploitable_val.lower() in ['true', '1', 'yes']
    else:
        normalized["exploitable"] = False
    
    # Required strings with defaults
    analysis_summary = normalized.get("analysis_summary", "No summary provided.")
    normalized["analysis_summary"] = analysis_summary
    
    # Detailed reasoning field (comprehensive justification)
    detailed_reasoning = normalized.get("detailed_reasoning", "No detailed reasoning provided.")
    normalized["detailed_reasoning"] = detailed_reasoning
    
    suggested_next_steps = normalized.get(
        "suggested_next_steps",
        "Review code areas with highest suspicion and add targeted unit tests.",
    )
    normalized["suggested_next_steps"] = suggested_next_steps
    
    # Required lists with defaults
    if not isinstance(normalized.get("mitigations_detected"), list):
        normalized["mitigations_detected"] = []
    if not isinstance(normalized.get("evidence_snippets"), list):
        normalized["evidence_snippets"] = []
    
    # Handle new fields introduced by synthesis agent
    if "mitigations" in normalized and isinstance(normalized["mitigations"], list):
        mitigations_detected = []
        for mig in normalized["mitigations"]:
            if isinstance(mig, dict):
                name = mig.get("name", "Unknown Mitigation")
                impact = mig.get("impact", "unknown")
                assessment = mig.get("assessment", "")
                mitigations_detected.append(f"{name} (Impact: {impact}) - Assessment: {assessment}")
            else:
                mitigations_detected.append(str(mig))
        normalized["mitigations_detected"] = mitigations_detected
        del normalized["mitigations"]
    
    # Also handle cases where mitigations_detected itself contains dict objects
    if "mitigations_detected" in normalized and isinstance(normalized["mitigations_detected"], list):
        fixed_mitigations = []
        for mig in normalized["mitigations_detected"]:
            if isinstance(mig, dict):
                name = mig.get("name", "Unknown Mitigation")
                impact = mig.get("impact", "unknown")
                assessment = mig.get("assessment", "")
                description = mig.get("description", "")
                # Create a comprehensive string representation
                mig_str = name
                if impact and impact != "unknown":
                    mig_str += f" (Impact: {impact})"
                if assessment:
                    mig_str += f" - Assessment: {assessment}"
                elif description:
                    mig_str += f" - {description}"
                fixed_mitigations.append(mig_str)
            else:
                fixed_mitigations.append(str(mig))
        normalized["mitigations_detected"] = fixed_mitigations

    # Ensure predicted fields exist, falling back to main ones
    normalized.setdefault("predicted_probability", normalized.get("probability"))
    normalized.setdefault("predicted_exploitable", normalized.get("exploitable"))

    # Remove fields not in the VulnerabilityResult model
    # Pydantic v2 compatibility: use model_fields instead of __fields__
    allowed_fields = set(VulnerabilityResult.model_fields.keys())
    final_output = {k: v for k, v in normalized.items() if k in allowed_fields}
    
    # Set required fields that aren't in the LLM output
    if "vulnerability_id" not in final_output:
        final_output["vulnerability_id"] = vuln_name
    
    if "files_analyzed" not in final_output:
        final_output["files_analyzed"] = [str(chunk.file_path) for chunk in chunks_for_analysis]
    
    # Validate and fix evidence_snippets structure
    if "evidence_snippets" in final_output and isinstance(final_output["evidence_snippets"], list):
        valid_snippets = []
        for snippet in final_output["evidence_snippets"]:
            if isinstance(snippet, dict):
                # Check if it has the required fields for EvidenceSnippet
                if all(field in snippet for field in ['file', 'start_line', 'end_line', 'snippet']):
                    valid_snippets.append(snippet)
                else:
                    # Try to create a valid snippet from available data
                    valid_snippet = {
                        'file': snippet.get('file', 'unknown'),
                        'start_line': snippet.get('start_line', 1),
                        'end_line': snippet.get('end_line', snippet.get('start_line', 1)),
                        'snippet': snippet.get('snippet', snippet.get('content', 'No snippet available'))
                    }
                    valid_snippets.append(valid_snippet)
        final_output["evidence_snippets"] = valid_snippets
    
    # Ensure all required fields have a default value (Pydantic v2 compatibility)
    for field_name, field_info in VulnerabilityResult.model_fields.items():
        if field_info.is_required() and field_name not in final_output and field_name != 'vulnerability_name':
            final_output[field_name] = field_info.default if field_info.default is not None else _get_default_for_type(field_info.annotation)

    return final_output

def _get_default_for_type(t):
    """Provides a sensible default for a given type."""
    if t == str:
        return "N/A"
    if t == bool:
        return False
    if t == float:
        return 0.0
    if t == int:
        return 0
    if t == list:
        return []
    if t == dict:
        return {}
    return None

def _create_fallback_result(
    vulnerability: VulnerabilityInput, 
    chunks_to_analyze: List[CodeChunk], 
    error_message: str,
    confidence: int = 1
) -> VulnerabilityResult:
    """Create a more informative fallback result when analysis fails."""
    # Create more informative fallback analysis based on vulnerability type
    enhanced_summary = f"Analysis failed for {vulnerability.name}: {error_message}. "
    enhanced_summary += f"This vulnerability affects {len(chunks_to_analyze)} code files. "
    enhanced_summary += f"Expected exploitability: {vulnerability.exploitable}, Expected probability: {vulnerability.probability:.2f}. "
    enhanced_summary += "Manual analysis required due to processing error."
    
    # Detailed reasoning for fallback
    detailed_reasoning = f"ANALYSIS FAILURE REPORT:\n\n"
    detailed_reasoning += f"Error: {error_message}\n\n"
    detailed_reasoning += f"Context: Analysis pipeline encountered an error while processing {vulnerability.name}.\n"
    detailed_reasoning += f"Chunks available: {len(chunks_to_analyze)}\n"
    detailed_reasoning += f"Constraints: {vulnerability.constraints}\n\n"
    detailed_reasoning += "Manual review is required as automated analysis could not complete successfully."
    
    # Provide more actionable next steps based on vulnerability constraints
    enhanced_next_steps = f"1. Review {vulnerability.name} constraints: {vulnerability.constraints}. "
    enhanced_next_steps += "2. Check logs for specific error details. "
    enhanced_next_steps += "3. Verify code chunks contain relevant patterns. "
    enhanced_next_steps += "4. Consider manual code review focusing on constraint areas."
    
    # Include all analyzed files
    files_analyzed = [str(chunk.file_path) for chunk in chunks_to_analyze]
    
    return VulnerabilityResult(
        vulnerability_id=vulnerability.name,
        vulnerability_name=vulnerability.name,
        files_analyzed=files_analyzed,
        status="uncertain",
        confidence=confidence,
        analysis_summary=enhanced_summary,
        detailed_reasoning=detailed_reasoning,
        evidence_snippets=[],
        mitigations_detected=["Processing error - no mitigations assessed"],
        suggested_next_steps=enhanced_next_steps,
        predicted_probability=0.5,
        predicted_exploitable=False,
        ground_truth_probability=vulnerability.probability,
        ground_truth_exploitable=vulnerability.exploitable,
    )

def _truncate_text(text: str, max_length: int) -> str:
    """Truncates text to a maximum length without breaking words."""
    if len(text) <= max_length:
        return text
    return text[:max_length].rsplit(' ', 1)[0] + "..."
