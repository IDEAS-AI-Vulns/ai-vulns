import asyncio
import time
import logging
import statistics
from pathlib import Path
from tenacity import retry, wait_random_exponential, stop_after_attempt
from langfuse import get_client, propagate_attributes, observe

from ..core.setup import prepare_repository_environment
from ..core.config import settings
from ..core.client import client
from ..core.models import ChunkEvaluation
from ..io.xlsx import read_vulnerabilities_from_xlsx
from ..analysis.retrieval import retrieve_chunks
from ..analysis.prompts import LangfusePrompt
from ..utils.llm import ask_llm_for_structured_data, create_llm_fallback

logger = logging.getLogger(__name__)


@retry(
    wait=wait_random_exponential(min=1, max=60),
    stop=stop_after_attempt(3),
    retry_error_callback=create_llm_fallback(
        "RETRIEVAL JUDGE",
        lambda rs, e: ChunkEvaluation.create_fallback(f"API Failure after retries: {e}")
    )
)
@observe(as_type="span", name="Evaluate Chunk")
def _evaluate_single_chunk(vuln_name: str, vuln_constraints: str, chunk_content: str) -> ChunkEvaluation:
    prompt_variables = {
        "vuln_name": vuln_name,
        "vuln_constraints": vuln_constraints,
        "code_chunk": chunk_content
    }

    return ask_llm_for_structured_data(
        client=client,
        model_name=settings.OPENAI_MODEL,
        prompt_name=LangfusePrompt.RETRIEVAL_JUDGE.value,
        prompt_variables=prompt_variables,
        response_model=ChunkEvaluation,
        temperature=0.0,
        max_tokens=200
    )

def run_offline_evaluation(zip_path: Path, xlsx_path: Path, top_k: int, rebuild_index: bool):
    return asyncio.run(_run_offline_evaluation_async(zip_path, xlsx_path, top_k, rebuild_index))

async def _run_offline_evaluation_async(zip_path: Path, xlsx_path: Path, top_k: int, rebuild_index: bool):
    """Runs the LLM-as-a-Judge evaluation loop to test vector retrieval accuracy."""
    base_name = zip_path.stem
    index_dir = Path("./index") / f"{base_name}.index"
    langfuse = get_client()

    logger.info("=" * 60)
    logger.info("🧪 STARTING OFFLINE RETRIEVAL EVALUATION")
    logger.info("=" * 60)

    temp_repo_dir = None

    try:
        logger.info("DISCOVER AND CHUNK")
        temp_repo_dir, vector_store, repository_info, batch_session_id = prepare_repository_environment(
            zip_path, index_dir, rebuild_index
        )

        vulnerabilities = read_vulnerabilities_from_xlsx(xlsx_path)
        logger.info(f"Loaded {len(vulnerabilities)} test vulnerabilities.")

        precision_scores = []
        hit_rate_scores = []
        mrr_scores = []
        cve_relevant_sim_averages = []
        cve_noise_sim_averages = []

        repo_code_root = temp_repo_dir / base_name if (temp_repo_dir / base_name).exists() else temp_repo_dir

        for vuln in vulnerabilities:
            logger.info(f"\n🧪 Evaluating Retrieval for {vuln.name}")

            with langfuse.start_as_current_observation(name=f"Eval Retrieval: {vuln.name}") as cve_trace:
                cve_trace.update(input={"vuln_name": vuln.name, "constraints": vuln.constraints, "top_k": top_k})

                with propagate_attributes(
                    session_id=batch_session_id,
                    tags=["eval_retrieval", repository_info["repository_name"], "llm_as_a_judge"]
                ):
                    retrieved_chunks = retrieve_chunks(vector_store, vuln, top_k, repo_code_root)

                    if not retrieved_chunks:
                        logger.error(f"❌ No chunks retrieved for {vuln.name}. Complete retrieval failure.")

                        precision_scores.append(0.0)
                        cve_trace.update(output={"context_precision": 0.0, "error": "No chunks retrieved"})
                        cve_trace.score(
                            name="context_precision",
                            value=0.0,
                            comment=f"Top K: {top_k}. 0 chunks retrieved. Complete retrieval failure."
                        )
                        continue

                    chunk_scores = []
                    first_relevant_rank = None
                    relevant_sim_scores = []
                    noise_sim_scores = []

                    for i, chunk in enumerate(retrieved_chunks):
                        logger.info(f"Judging chunk {i+1}/{len(retrieved_chunks)}...")

                        eval_result = _evaluate_single_chunk(
                            vuln_name=vuln.name,
                            vuln_constraints=vuln.constraints,
                            chunk_content=chunk.content
                        )

                        score = 1 if eval_result.is_relevant else 0
                        chunk_scores.append(score)

                        sim = chunk.similarity_score or 0.0
                        if score == 1:
                            relevant_sim_scores.append(sim)
                        else:
                            noise_sim_scores.append(sim)

                        if score == 1 and first_relevant_rank is None:
                            first_relevant_rank = i + 1

                        logger.info(f"  -> Score: {score} | Reason: {eval_result.reasoning}")
                        time.sleep(1.5)

            # =================================================================
            # 📊 CALCULATE METRICS FOR THIS CVE
            # =================================================================
            cve_precision = statistics.mean(chunk_scores) if chunk_scores else 0.0
            precision_scores.append(cve_precision)

            cve_hit_rate = 1.0 if first_relevant_rank is not None else 0.0
            hit_rate_scores.append(cve_hit_rate)

            cve_mrr = (1.0 / first_relevant_rank) if first_relevant_rank else 0.0
            mrr_scores.append(cve_mrr)

            cve_avg_relevant_sim = statistics.mean(relevant_sim_scores) if relevant_sim_scores else 0.0
            cve_avg_noise_sim = statistics.mean(noise_sim_scores) if noise_sim_scores else 0.0

            if relevant_sim_scores:
                cve_relevant_sim_averages.append(cve_avg_relevant_sim)
            if noise_sim_scores:
                cve_noise_sim_averages.append(cve_avg_noise_sim)

            logger.info(f"📊 {vuln.name} | Precision: {cve_precision:.2f} | Hit: {int(cve_hit_rate)} | MRR: {cve_mrr:.2f}")
            logger.info(f"   ↳ Similarity -> Relevant Avg: {cve_avg_relevant_sim:.3f} | Noise Avg: {cve_avg_noise_sim:.3f}")

            cve_trace.update(output={
                "context_precision": cve_precision,
                "hit_rate": cve_hit_rate,
                "mrr": cve_mrr,
                "avg_relevant_sim": cve_avg_relevant_sim, # NEW
                "avg_noise_sim": cve_avg_noise_sim,       # NEW
                "total_chunks": len(retrieved_chunks),
                "first_hit_at": first_relevant_rank
            })

            cve_trace.score(name="context_precision", value=cve_precision)
            cve_trace.score(name="hit_rate", value=cve_hit_rate)
            cve_trace.score(name="mrr", value=cve_mrr)

            if relevant_sim_scores:
                cve_trace.score(name="avg_relevant_sim", value=cve_avg_relevant_sim)
            if noise_sim_scores:
                cve_trace.score(name="avg_noise_sim", value=cve_avg_noise_sim)

        # =================================================================
        # 🏆 FINAL SYSTEM AVERAGES
        # =================================================================
        overall_precision = statistics.mean(precision_scores) if precision_scores else 0.0
        overall_hit_rate = statistics.mean(hit_rate_scores) if hit_rate_scores else 0.0
        overall_mrr = statistics.mean(mrr_scores) if mrr_scores else 0.0

        overall_relevant_sim = statistics.mean(cve_relevant_sim_averages) if cve_relevant_sim_averages else 0.0
        overall_noise_sim = statistics.mean(cve_noise_sim_averages) if cve_noise_sim_averages else 0.0
        sim_gap = overall_relevant_sim - overall_noise_sim

        logger.info("\n" + "=" * 60)
        logger.info(f"🏆 OVERALL CONTEXT PRECISION : {overall_precision:.2f} (How much garbage we retrieved)")
        logger.info(f"🏆 OVERALL HIT RATE          : {overall_hit_rate:.2f} (How often we found the vuln)")
        logger.info(f"🏆 OVERALL MRR               : {overall_mrr:.2f} (How high up the results it was)")
        logger.info("-" * 60)
        logger.info(f"🔍 AVG SIGNAL SIMILARITY     : {overall_relevant_sim:.3f} (The score of good chunks)")
        logger.info(f"🔍 AVG NOISE SIMILARITY      : {overall_noise_sim:.3f} (The score of garbage chunks)")
        logger.info(f"📐 SIMILARITY GAP            : {sim_gap:.3f} (Bigger is better)")
        logger.info("=" * 60)

        with langfuse.start_as_current_observation(name="Retrieval Eval Summary") as summary_trace:
            summary_trace.update(output={
                "overall_precision": overall_precision,
                "overall_hit_rate": overall_hit_rate,
                "overall_mrr": overall_mrr,
                "overall_relevant_sim": overall_relevant_sim,
                "overall_noise_sim": overall_noise_sim,
                "similarity_gap": sim_gap,
                "cves_tested": len(vulnerabilities)
            })
            with propagate_attributes(session_id=batch_session_id):
                summary_trace.score(name="overall_context_precision", value=overall_precision)
                summary_trace.score(name="overall_hit_rate", value=overall_hit_rate)
                summary_trace.score(name="overall_mrr", value=overall_mrr)

                # Push the similarity scores to the summary
                if cve_relevant_sim_averages:
                    summary_trace.score(name="overall_relevant_sim", value=overall_relevant_sim)
                if cve_noise_sim_averages:
                    summary_trace.score(name="overall_noise_sim", value=overall_noise_sim)
                if cve_relevant_sim_averages and cve_noise_sim_averages:
                    summary_trace.score(name="similarity_gap", value=sim_gap)

    finally:
        import shutil

        logger.info("Flushing Langfuse logs...")
        langfuse.flush()

        if temp_repo_dir and temp_repo_dir.exists():
            logger.info(f"Cleaning up temporary directory: {temp_repo_dir}")
            shutil.rmtree(temp_repo_dir, ignore_errors=True)