from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class VulnerabilityInput(BaseModel):
    """Input data for vulnerability analysis from XLSX file."""
    name: str = Field(..., alias="Name")
    constraints: str = Field(..., alias="Constraints")  # What the LLM analyzes
    repository: str = Field(..., alias="Repository")
    
    # Optional fields for evaluation mode (when ground truth is available)
    summary: Optional[str] = Field(None, alias="Summary")  # Ground truth summary (not shown to LLM)
    probability: Optional[float] = Field(None, alias="Probability")  # Ground truth probability
    exploitable: Optional[bool] = Field(None, alias="Exploitable")  # Ground truth exploitability
    
    @property
    def has_ground_truth(self) -> bool:
        """Check if this vulnerability has ground truth data for evaluation."""
        return self.probability is not None and self.exploitable is not None


class AnalysisStatus(str, Enum):
    CONFIRMED = "confirmed"
    NOT_CONFIRMED = "not_confirmed"
    UNCERTAIN = "uncertain"


class EvidenceSnippet(BaseModel):
    """Code snippet that provides evidence for vulnerability."""
    file: str
    start_line: int
    end_line: int
    snippet: str


class VulnerabilityResult(BaseModel):
    """Result of vulnerability analysis."""
    vulnerability_id: str
    vulnerability_name: str
    status: AnalysisStatus
    confidence: int = Field(..., ge=1, le=5)
    analysis_summary: str
    evidence_snippets: List[EvidenceSnippet]
    files_analyzed: List[str]
    mitigations_detected: List[str]
    suggested_next_steps: str
    timestamp_utc: datetime = Field(default_factory=datetime.utcnow)
    
    # LLM predictions
    predicted_probability: Optional[float] = None  # LLM's predicted probability (0.0-1.0)
    predicted_exploitable: Optional[bool] = None   # LLM's predicted exploitability
    
    # Ground truth for evaluation
    ground_truth_probability: Optional[float] = None  # From the dataset
    ground_truth_exploitable: Optional[bool] = None   # From the dataset


class MetricsResult(BaseModel):
    """Metrics comparing LLM predictions with ground truth."""
    total_vulnerabilities: int
    
    # Probability metrics
    probability_mae: float  # Mean Absolute Error for probability
    probability_rmse: float  # Root Mean Square Error for probability
    
    # Exploitability metrics
    exploitable_accuracy: float
    exploitable_precision: float
    exploitable_recall: float
    exploitable_f1: float
    
    # Status metrics
    status_accuracy: float  # Accuracy for vulnerability status
    
    # General metrics
    avg_confidence: float
    
    # LLM-based quality assessment metrics
    avg_quality_score: Optional[float] = None  # Average LLM quality score (1-5)
    quality_distribution: Optional[dict] = None  # Distribution of quality scores
    total_quality_assessed: Optional[int] = None  # Number of results assessed for quality
