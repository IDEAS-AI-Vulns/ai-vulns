import logging
import sys
import uvicorn
import uuid
import threading

from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from pathlib import Path

from ..core.config import log_openai_configuration, settings
from ..core.models import VulnerabilityInput
from ..core.logger import JobIdFilter, job_id_context
from ..analysis.pipeline import run_pipeline
from ..io.xlsx import parse_vulnerabilities_from_dicts

class AnalyzeRequest(BaseModel):
    repo_filename: str = Field(..., description="The name of the ZIP file in the shared directory")
    vulnerabilities: List[Dict[str, Any]] = Field(..., description="List of vulnerability dictionaries")
    rebuild_index: bool = False


logger = logging.getLogger(__name__)
analysis_jobs: Dict[str, Dict[str, Any]] = {}


def setup_logging():
    logs_dir = Path(settings.LOGS_DIR).resolve()
    logs_dir.mkdir(parents=True, exist_ok=True)

    stdout_handler = logging.StreamHandler(sys.stdout)
    file_handler = logging.FileHandler(logs_dir / "vulnerability_analysis.log", mode="a", encoding='utf-8')

    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - [Job %(job_id)s] %(message)s")
    stdout_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    job_filter = JobIdFilter()
    stdout_handler.addFilter(job_filter)
    file_handler.addFilter(job_filter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.handlers = [stdout_handler, file_handler]


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()

    logger.info("Starting API server...")
    log_openai_configuration()

    yield

    logger.info("Shutting down API server...")


app = FastAPI(
    title="Vulnerability Analysis API",
    description="API for running the enhanced vulnerability analysis pipeline",
    version="1.0.0",
    lifespan=lifespan
)


def cleanup_job(job_id: str):
    """Deletes job data from memory. Triggered by a timer."""
    if job_id in analysis_jobs:
        del analysis_jobs[job_id]
        logger.info(f"Cleaned up old job {job_id} from memory")


def process_analysis(
    job_id: str,
    repo_path: Path,
    vulnerabilities: list[VulnerabilityInput],
    rebuild_index: bool
):
    job_id_context.set(job_id)

    def on_vuln_complete(result):
        analysis_jobs[job_id]["results"].append(result.model_dump())
        analysis_jobs[job_id]["completed_count"] += 1

    try:
        logger.info(f"Starting background pipeline for {repo_path.name}")

        results, metrics, quality_assessment = run_pipeline(
            repo_path=repo_path,
            vulnerabilities=vulnerabilities,
            rebuild_index=rebuild_index,
            progress_callback=on_vuln_complete
        )
        logger.info(f"✅ Analysis pipeline completed successfully for {repo_path.name}!")

        if metrics:
            analysis_jobs[job_id]["metrics"] = metrics.model_dump()
        if quality_assessment:
            analysis_jobs[job_id]["quality"] = quality_assessment.model_dump()
        analysis_jobs[job_id]["status"] = "completed"

    except Exception as e:
        logger.error(f"❌ Pipeline failed: {str(e)}")
        logger.exception("Full error details:")

        analysis_jobs[job_id]["status"] = "failed"
        analysis_jobs[job_id]["error"] = str(e)

    finally:
        timer = threading.Timer(3600.0, cleanup_job, args=[job_id])
        timer.daemon = True
        timer.start()
        logger.info(f"Cleanup timer started for job {job_id}. Will remove in 1 hour.")


@app.post("/analyze")
async def analyze_endpoint(
        request: AnalyzeRequest,
        background_tasks: BackgroundTasks
):
    base_dir = Path(settings.SHARED_REPOS_DIR).resolve()
    repo_path = (base_dir / request.repo_filename).resolve()

    if not repo_path.is_relative_to(base_dir):
        raise HTTPException(status_code=403, detail="Invalid filename: Path traversal detected.")

    if not repo_path.exists() or not repo_path.is_file():
        raise HTTPException(status_code=404, detail=f"File {request.repo_filename} not found in shared directory.")

    try:
        vulnerabilities = parse_vulnerabilities_from_dicts(request.vulnerabilities)
        if not vulnerabilities:
            raise ValueError("No valid vulnerabilities found in the payload.")
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


    job_id = str(uuid.uuid4())

    analysis_jobs[job_id] = {
        "status": "running",
        "repo_name": repo_path.name,
        "results": [],
        "completed_count": 0,
        "total_count": len(vulnerabilities),
        "error": None
    }

    background_tasks.add_task(
        process_analysis,
        job_id=job_id,
        repo_path=repo_path,
        vulnerabilities=vulnerabilities,
        rebuild_index=request.rebuild_index
    )

    return {
        "status": "Accepted",
        "message": "Analysis started in the background.",
        "job_id": job_id,
        "vulnerabilities_queued": len(vulnerabilities)
    }


@app.get("/status/{job_id}")
async def get_analysis_status(job_id: str):
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job ID not found")

    job_data = analysis_jobs[job_id]

    return {
        "job_id": job_id,
        "status": job_data["status"],
        "repo_name": job_data["repo_name"],
        "results": job_data["results"],
        "completed_count": job_data["completed_count"],
        "total_count": job_data["total_count"],
        "metrics": job_data.get("metrics"),
        "quality": job_data.get("quality"),
        "error": job_data["error"]
    }


if __name__ == "__main__":
    uvicorn.run("src.utils.api:app", host="0.0.0.0", port=settings.API_PORT, reload=True)