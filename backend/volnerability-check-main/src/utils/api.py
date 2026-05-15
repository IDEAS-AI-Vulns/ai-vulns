import logging
import sys
import uvicorn
import uuid

from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from pathlib import Path

from ..core.config import log_openai_configuration, settings
from ..analysis.pipeline import run_pipeline
from ..io.xlsx import parse_vulnerabilities_from_dicts

class AnalyzeRequest(BaseModel):
    repo_path: str = Field(..., description="Local path to the .zip file or an extracted directory")
    vulnerabilities: List[Dict[str, Any]] = Field(..., description="List of vulnerability dictionaries")
    rebuild_index: bool = False


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),  # Explicitly use stdout
        logging.FileHandler("vulnerability_analysis.log", mode="w", encoding='utf-8'),
    ],
    force=True,
)
logger = logging.getLogger(__name__)
analysis_jobs: Dict[str, Dict[str, Any]] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
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

def process_analysis(job_id: str, repo_path: Path, vulnerabilities: list, top_k: int, rebuild_index: bool):
    try:
        logger.info(f"[Job {job_id}] Starting background pipeline for {repo_path.name}")

        results, metrics, quality_assessment = run_pipeline(
            repo_path=repo_path,
            vulnerabilities=vulnerabilities,
            top_k=top_k,
            rebuild_index=rebuild_index,
        )
        logger.info(f"✅ Analysis pipeline completed successfully for {repo_path.name}!")

        analysis_jobs[job_id]["results"] = [r.model_dump() for r in results]
        if metrics:
            analysis_jobs[job_id]["metrics"] = metrics.model_dump()
        if quality_assessment:
            analysis_jobs[job_id]["quality"] = quality_assessment.model_dump()
        analysis_jobs[job_id]["status"] = "completed"

    except Exception as e:
        logger.error(f"[Job {job_id}] ❌ Pipeline failed: {str(e)}")
        logger.exception("Full error details:")

        analysis_jobs[job_id]["status"] = "failed"
        analysis_jobs[job_id]["error"] = str(e)


@app.post("/analyze")
async def analyze_endpoint(
        request: AnalyzeRequest,
        background_tasks: BackgroundTasks
):
    repo_path = Path(request.repo_path)
    if not repo_path.exists():
        raise HTTPException(status_code=400, detail=f"Path does not exist on the server: {repo_path}")

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
        "results": None,
        "error": None
    }

    background_tasks.add_task(
        process_analysis,
        repo_path=repo_path,
        vulnerabilities=vulnerabilities,
        top_k=top_k,
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
        "error": job_data["error"]
    }


if __name__ == "__main__":
    uvicorn.run("src.api:app", host="0.0.0.0", port=settings.API_PORT, reload=True)