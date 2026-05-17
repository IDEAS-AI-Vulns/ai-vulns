import os
import shutil
import time
import logging
import asyncio
from pathlib import Path
from collections import Counter
from datetime import datetime
from langfuse import get_client, propagate_attributes
from typing import Callable, Any

from ..io.unzip import unzip_repository
from ..io.discover import discover_source_files
from ..core.chunk import chunk_source_files, detect_language
from ..core.vectorstore import VectorStore
from ..io.xlsx import calculate_metrics
from .retrieval import retrieve_chunks
from .analyzer import analyze_vulnerability
from ..testing.quality_checker import assess_batch_quality
from ..core.config import settings
from ..core.models import VulnerabilityInput
from ..core.logger import job_id_context
from ..utils.progress import tqdm

logger = logging.getLogger(__name__)


def run_pipeline(
    repo_path: Path,
    vulnerabilities: list[VulnerabilityInput],
    rebuild_index: bool = False,
    progress_callback: Callable[[Any], None] = None
):
    """Orchestrates the entire vulnerability analysis pipeline with detailed logging."""
    return asyncio.run(pipeline_async(repo_path, vulnerabilities, rebuild_index, progress_callback))

async def pipeline_async(
    repo_path: Path,
    vulnerabilities: list[VulnerabilityInput],
    rebuild_index: bool = False,
    progress_callback: Callable[[Any], None] = None
):
    """Asynchronous core of the vulnerability analysis pipeline."""
    start_time = time.time()
    base_name = repo_path.stem
    job_id = job_id_context.get()

    logger.info("=" * 80)
    logger.info("STARTING VULNERABILITY ANALYSIS PIPELINE")
    logger.info("=" * 80)
    logger.info(f"Input Path: {repo_path}")
    logger.info(f"Vulnerabilities to process: {len(vulnerabilities)}")
    logger.info(f"Rebuild index: {rebuild_index}")

    print(f"Starting enhanced vulnerability analysis for {repo_path.name}")
    print(
        f"File filter: {settings.FILE_FILTER_MODE} ({len(settings.get_allowed_extensions())} extensions)"
    )

    output_dir = Path(settings.RESULTS_DIR) / f"{job_id}_{base_name}"
    output_dir.mkdir(parents=True, exist_ok=True)

    index_dir = Path(settings.INDEX_DIR) / f"{job_id}_{base_name}.index"

    logger.info(f"Output directory: {output_dir}")
    logger.info(f"Index directory: {index_dir}")
    print(f"Vector index will be saved to: {index_dir}")

    index_dir.mkdir(parents=True, exist_ok=True)
    
    temp_repo_dir = None
    repository_info = {}
    created_temp_dir = False

    try:
        # STEP 1: Extract & Discover
        logger.info("\n" + "=" * 60)
        logger.info("STEP 1: REPOSITORY EXTRACTION AND FILE DISCOVERY")
        logger.info("=" * 60)

        if repo_path.is_file() and repo_path.suffix == '.zip':
            logger.info(f"Extracting repository from {repo_path}")
            temp_repo_dir = unzip_repository(repo_path)
            created_temp_dir = True # Flag that we created this and own it
            logger.info(f"Repository extracted to: {temp_repo_dir}")
        elif repo_path.is_dir():
            logger.info(f"Using existing repository directory: {repo_path}")
            temp_repo_dir = repo_path
        else:
            raise ValueError(f"Invalid path: {repo_path}. Must be a .zip file or directory.")
        logger.info(f"Repository extracted to: {temp_repo_dir}")

        logger.info("Discovering source files...")
        source_files = discover_source_files(temp_repo_dir)
        logger.info(f"Found {len(source_files)} source files")

        # Log discovered files by language and collect repository info
        files_by_lang = {}
        for file_path in source_files:
            lang = detect_language(file_path) or "unknown"
            if lang not in files_by_lang:
                files_by_lang[lang] = []
            files_by_lang[lang].append(file_path)

        # Build repository information for checker LLM
        repository_info = {
            'total_files': len(source_files),
            'languages': list(files_by_lang.keys()),
            'files_by_language': {lang: len(files) for lang, files in files_by_lang.items()},
            'repository_name': base_name,
            'temp_repo_dir': str(temp_repo_dir)  # Add temp_repo_dir for dependency file discovery
        }

        logger.info("Files discovered by language:")
        for lang, files in files_by_lang.items():
            logger.info(f"  {lang}: {len(files)} files")

        # STEP 2: Advanced Chunking & Indexing
        langfuse = get_client()

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        batch_session_id = f"{repository_info['repository_name']}_{timestamp}_{job_id}"

        with langfuse.start_as_current_observation(name="Code chunking and indexing") as indexing_trace:
            with propagate_attributes(
                session_id=batch_session_id,
                tags=["indexing", f"repo:{repository_info['repository_name']}", f"job_id:{job_id}"]
            ):
                logger.info("\n" + "=" * 60)
                logger.info("STEP 2: CODE CHUNKING AND INDEXING")
                logger.info("=" * 60)

                logger.info("Initializing vector store...")
                vector_store = VectorStore(index_dir=index_dir)

                need_build = rebuild_index or not vector_store.index_exists()
                logger.info(f"Index present: {not need_build}")

                if need_build:
                    logger.info("Building vector index...")
                    logger.info("Chunking source files...")
                    chunks = chunk_source_files(source_files)
                    logger.info(f"Generated {len(chunks)} chunks")

                    logger.info("Building embeddings and vector index...")
                    vector_store.set_chunks(chunks)

                index_start = time.time()
                vector_store.build_index(rebuild=rebuild_index)
                index_time = time.time() - index_start
                logger.info(f"Vector index ready in {index_time:.2f} seconds")

                indexing_trace.update(
                    metadata={
                        "job_id": job_id,
                        "rebuilt": need_build,
                        "chunks_processed": len(chunks) if need_build else "loaded_from_disk",
                    }
                )
        # STEP 4: Load Vulnerabilities
        logger.info("\n" + "=" * 60)
        logger.info("STEP 4: LOADING VULNERABILITIES")
        logger.info("=" * 60)

        logger.info(f"Received {len(vulnerabilities)} vulnerabilities from API payload")

        for i, vuln in enumerate(vulnerabilities[:3]):
            logger.info(f"  [{i+1}] {vuln.name} - {vuln.summary[:60]}...")
        if len(vulnerabilities) > 3:
            logger.info(f"  ... and {len(vulnerabilities) - 3} more vulnerabilities")

        # STEP 5: Enhanced Vulnerability Analysis Loop
        logger.info("\n" + "=" * 60)
        logger.info("STEP 5: VULNERABILITY ANALYSIS")
        logger.info("=" * 60)

        print(f"\nAnalyzing {len(vulnerabilities)} vulnerabilities...")

        results = []
        total_vulnerabilities = len(vulnerabilities)
        vuln_progress = tqdm(vulnerabilities, desc=f"[Job {job_id}] Analyzing vulnerabilities", unit="vuln")

        for vuln_index, vuln in enumerate(vuln_progress, 1):
            logger.info(f"\nAnalyzing vulnerability {vuln_index}/{total_vulnerabilities}: {vuln.name}")

            vuln_progress.set_postfix(
                {
                    "current": (
                        vuln.name[:20] + "..." if len(vuln.name) > 20 else vuln.name
                    ),
                    "completed": len(results),
                }
            )

            with langfuse.start_as_current_observation(name=f"Analyze {vuln.name}") as cve_trace:
                cve_trace.update(
                    input=vuln.model_dump()
                )
                with propagate_attributes(
                        session_id=batch_session_id,
                        tags=["end_to_end_analysis", f"repo:{repository_info['repository_name']}", vuln.name, f"job_id:{job_id}"]
                ):

                    retrieval_start = time.time()

                    repo_code_root = (
                        temp_repo_dir / base_name
                        if (temp_repo_dir / base_name).exists()
                        else temp_repo_dir
                    )
                    chunks_for_analysis = retrieve_chunks(
                        vector_store, vuln, settings.DEFAULT_TOP_K, repo_code_root
                    )
                    retrieval_time = time.time() - retrieval_start

                    if not chunks_for_analysis:
                        logger.warning(
                            f"No relevant chunks found for vulnerability: {vuln.name}"
                        )
                        logger.warning("Skipping this vulnerability...")
                        continue

                    logger.info(f"Retrieval completed in {retrieval_time:.2f} seconds")
                    logger.info(f"Selected {len(chunks_for_analysis)} chunks for analysis:")

                    files_represented = {}
                    for chunk in chunks_for_analysis:
                        file_path = chunk.file_path
                        files_represented.setdefault(file_path, []).append(chunk)

                    logger.info(f"Selected chunks from {len(files_represented)} files")
                    for file_path, file_chunks in list(files_represented.items())[:3]:
                        logger.info(f"  {file_path.name}: {len(file_chunks)} chunks")
                    if len(files_represented) > 3:
                        logger.info(f"  ... and {len(files_represented) - 3} more files")



                    total_tokens = sum(chunk.tokens_count for chunk in chunks_for_analysis)
                    logger.info(f"Analysis input: {len(chunks_for_analysis)} chunks, {total_tokens} tokens")

                    analysis_start = time.time()
                    result = await analyze_vulnerability(vuln, chunks_for_analysis, repository_info)
                    analysis_time = time.time() - analysis_start

                    cve_trace.update(output=result.model_dump())

                    logger.info(f"Analysis completed in {analysis_time:.2f}s - Status: {result.status}, Confidence: {result.confidence}")
                    logger.info(f"Result: Prob={result.predicted_probability:.3f}, Exploitable={result.predicted_exploitable}")

                    results.append(result)

                    if progress_callback:
                        progress_callback(result)


        has_ground_truth = any(vuln.has_ground_truth for vuln in vulnerabilities)
        metrics = None
        quality_assessment = None

        if has_ground_truth:
            logger.info("\n" + "=" * 60)
            logger.info("STEP 6: QUALITY ASSESSMENT (EVALUATION MODE)")
            logger.info("=" * 60)
            logger.info("📊 Ground truth available - running quality evaluation")

            with langfuse.start_as_current_observation(name="Batch Evaluation Summary") as summary_trace:
                summary_trace.update(
                    input={
                        "repository_name": repository_info["repository_name"],
                        "total_vulnerabilities_analyzed": len(results),
                        "evaluation_mode": has_ground_truth
                    }
                )
                with propagate_attributes(
                        session_id=batch_session_id,
                        tags=["batch_metrics", f"repo:{repository_info['repository_name']}", f"job_id:{job_id}"]
                ):
                    try:
                        quality_start = time.time()
                        quality_assessment = assess_batch_quality(vulnerabilities, results)
                        quality_time = time.time() - quality_start

                        logger.info(f"Quality assessment completed in {quality_time:.2f}s")
                        logger.info(f"Average quality score: {quality_assessment.average_quality_score:.2f}/5")

                    except Exception as e:
                        logger.error(f"Quality assessment failed: {e}")
                        quality_assessment = None

                    # STEP 8: Metrics Evaluation (evaluation mode only)
                    logger.info("\n" + "=" * 60)
                    logger.info("STEP 8: METRICS EVALUATION")
                    logger.info("=" * 60)
                    logger.info("🔍 Computing accuracy metrics vs ground truth")

                    try:
                        metrics = calculate_metrics(results, quality_data=quality_assessment)

                        logger.info("Metrics calculated successfully:")
                        logger.info(f"  Total vulnerabilities evaluated: {metrics.total_vulnerabilities}")
                        logger.info(f"  Probability MAE: {metrics.probability_mae:.4f}")
                        logger.info(f"  Probability RMSE: {metrics.probability_rmse:.4f}")
                        logger.info(f"  Exploitable Accuracy: {metrics.exploitable_accuracy:.4f}")
                        logger.info(f"  Exploitable Precision: {metrics.exploitable_precision:.4f}")
                        logger.info(f"  Exploitable Recall: {metrics.exploitable_recall:.4f}")
                        logger.info(f"  Exploitable F1: {metrics.exploitable_f1:.4f}")
                        logger.info(f"  Status Accuracy: {metrics.status_accuracy:.4f}")

                        if metrics.avg_quality_score is not None:
                            logger.info(f"  Average Quality Score: {metrics.avg_quality_score:.2f}/5")
                            logger.info(f"  Total Assessed for Quality: {metrics.total_quality_assessed}")

                    except Exception as e:
                        logger.error(f"Metrics calculation failed: {e}")
                        metrics = None

                    finally:
                        summary_trace.update(
                            output={
                                "metrics": metrics.model_dump() if metrics else None,
                                "quality_assessment": quality_assessment.model_dump() if quality_assessment else None
                            }
                        )
        else:
            # Production mode - skip evaluation steps
            logger.info("\n" + "=" * 60)
            logger.info("🔍 PRODUCTION MODE - ANALYSIS COMPLETE")
            logger.info("=" * 60)
            logger.info("No ground truth available - skipping quality assessment and metrics calculation")
            logger.info("Analysis complete with LLM predictions only")

        # STEP 9: Final Summary
        logger.info("\n" + "=" * 60)
        logger.info("PIPELINE COMPLETION SUMMARY")
        logger.info("=" * 60)

        total_time = time.time() - start_time

        # Results summary
        status_counts = Counter(result.status for result in results)
        avg_confidence = (
            sum(result.confidence for result in results) / len(results)
            if results
            else 0
        )
        
        # New metrics
        if results:
            avg_pred_prob = sum(r.predicted_probability for r in results if r.predicted_probability is not None) / len(results)
            pred_exploit_counts = Counter(r.predicted_exploitable for r in results if r.predicted_exploitable is not None)
        else:
            avg_pred_prob = 0
            pred_exploit_counts = Counter()

        logger.info(f"Total execution time: {total_time:.2f} seconds")
        logger.info(f"Processed {len(vulnerabilities)} vulnerabilities")
        logger.info(f"Generated {len(results)} analysis results")
        logger.info(f"Results by status:")
        for status, count in status_counts.items():
            logger.info(f"  - {status}: {count}")
        logger.info(f"Average confidence: {avg_confidence:.2f}")
        logger.info(f"Average predicted probability: {avg_pred_prob:.3f}")
        logger.info(f"Predicted exploitable distribution:")
        for exploit_val, count in pred_exploit_counts.items():
            logger.info(f"  - {exploit_val}: {count}")



        # Console summary
        print(f"\nPipeline completed in {total_time:.1f} seconds")
        print(f"Analyzed {len(vulnerabilities)} vulnerabilities")
        print(f"Results: {dict(status_counts)}")
        if metrics:
            print(f"Metrics - Prob MAE: {metrics.probability_mae:.3f}, Exploit Acc: {metrics.exploitable_accuracy:.3f}")
            if metrics.avg_quality_score is not None:
                print(f"Quality Score: {metrics.avg_quality_score:.2f}/5")
        print(f"Outputs saved to: {output_dir}")

        return results, metrics, quality_assessment

    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}")
        logger.exception("Full pipeline error details:")
        raise

    finally:
        get_client().flush()

        if created_temp_dir and temp_repo_dir and temp_repo_dir.exists():
            logger.info(f"Cleaning up temporary directory: {temp_repo_dir}")
            shutil.rmtree(temp_repo_dir, ignore_errors=True)
