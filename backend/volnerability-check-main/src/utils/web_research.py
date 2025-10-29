import logging
import time
from typing import Dict, Any, Optional
from ..core.config import settings
from ..core.client import client
from ..utils.llm import parse_llm_json
from ..analysis.prompts import WEB_RESEARCH_SYSTEM_PROMPT, WEB_RESEARCH_USER_PROMPT
from .rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

async def conduct_web_research(vuln_name: str, vuln_constraints: str) -> Dict[str, Any]:
    """
    Conducts comprehensive web research about a vulnerability using LLM with web search capability.
    
    Args:
        vuln_name: CVE identifier or vulnerability name
        vuln_constraints: Vulnerability analysis constraints/context
        
    Returns:
        Dictionary containing structured web research findings
    """
    logger.info(f"Conducting web research for {vuln_name}")
    
    try:
        # Prepare research prompt
        research_prompt = WEB_RESEARCH_USER_PROMPT.format(
            vuln_name=vuln_name,
            vuln_constraints=vuln_constraints
        )
        
        logger.info(f"Starting web research (prompt length: {len(research_prompt)} chars)")
        
        # Execute research using new LLM API with web search
        await rate_limiter.wait_if_needed()  # Rate limiting
        completion = client.chat.completions.create(
            model=settings.OPENAI_WEB_SEARCH_MODEL,  # Use dedicated web search model
            messages=[
                {"role": "system", "content": WEB_RESEARCH_SYSTEM_PROMPT},
                {"role": "user", "content": f"{research_prompt}\n\nCRITICAL: Return valid JSON only as specified in the output format."}
            ],
            timeout=settings.OPENAI_TIMEOUT_SECONDS,
        )
        
        llm_output = completion.choices[0].message.content.strip()
        logger.info("Web research completed.")
        
        # Parse the research findings
        research_data = parse_llm_json(llm_output, "web_research")
        
        if not research_data:
            logger.warning(f"Failed to parse web research results for {vuln_name}")
            return _create_fallback_research_report(vuln_name, "Failed to parse research results")
            
        # Enhance with metadata
        research_data["research_metadata"] = {
            "vuln_name": vuln_name,
            "research_timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "research_agent": "LLM Web Research Agent",
            "constraints_analyzed": vuln_constraints
        }
        
        logger.info(f"Web research successful for {vuln_name}")
        return research_data
        
    except Exception as e:
        logger.error(f"Web research failed for {vuln_name}: {e}")
        logger.exception("Full web research error details:")
        return _create_fallback_research_report(vuln_name, f"Research failed: {e}")

def _create_fallback_research_report(vuln_name: str, error_message: str) -> Dict[str, Any]:
    """Creates a fallback research report when web research fails."""
    
    return {
        "vulnerability_details": {
            "title": f"Research unavailable for {vuln_name}",
            "description": f"Web research could not be completed: {error_message}",
            "impact": "Unknown - research failed",
            "attack_vector": "Unknown - research failed", 
            "root_cause": "Unknown - research failed"
        },
        "version_intelligence": {
            "affected_versions": [],
            "patched_versions": [],
            "version_details": "Version information unavailable due to research failure",
            "upgrade_recommendations": "Consult official sources for version information"
        },
        "exploit_intelligence": {
            "public_exploits": [],
            "poc_available": False,
            "exploit_complexity": "unknown",
            "attack_scenarios": [],
            "exploitation_requirements": []
        },
        "mitigation_intelligence": {
            "vendor_patches": [],
            "workarounds": [],
            "configuration_fixes": [],
            "defensive_measures": []
        },
        "security_advisories": [],
        "real_world_context": {
            "known_incidents": [],
            "industry_impact": "Unknown due to research failure",
            "timeline": "Timeline unavailable",
            "vendor_response": "Vendor response information unavailable"
        },
        "research_quality": {
            "sources_consulted": [],
            "information_confidence": "low",
            "gaps_identified": ["All information unavailable due to research failure"],
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        },
        "research_metadata": {
            "vuln_name": vuln_name,
            "research_timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "research_agent": "LLM Web Research Agent (Fallback)",
            "error": error_message
        }
    }
