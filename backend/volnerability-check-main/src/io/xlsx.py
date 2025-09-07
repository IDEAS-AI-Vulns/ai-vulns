import logging
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd
from datetime import datetime

try:
    from sklearn.metrics import mean_absolute_error, mean_squared_error, f1_score, accuracy_score
except ImportError:
    # Fallback implementations if sklearn not available
    def mean_absolute_error(y_true, y_pred):
        return sum(abs(t - p) for t, p in zip(y_true, y_pred)) / len(y_true)
    
    def mean_squared_error(y_true, y_pred):
        return sum((t - p) ** 2 for t, p in zip(y_true, y_pred)) / len(y_true)
    
    def f1_score(y_true, y_pred, **kwargs):
        # Simple F1 calculation
        tp = sum(1 for t, p in zip(y_true, y_pred) if t and p)
        fp = sum(1 for t, p in zip(y_true, y_pred) if not t and p)
        fn = sum(1 for t, p in zip(y_true, y_pred) if t and not p)
        
        if tp + fp == 0 or tp + fn == 0:
            return 0.0
        
        precision = tp / (tp + fp)
        recall = tp / (tp + fn)
        
        if precision + recall == 0:
            return 0.0
        
        return 2 * (precision * recall) / (precision + recall)
    
    def accuracy_score(y_true, y_pred):
        return sum(1 for t, p in zip(y_true, y_pred) if t == p) / len(y_true)

from ..core.models import VulnerabilityInput, VulnerabilityResult


def read_vulnerabilities_from_xlsx(xlsx_path: Path) -> List[VulnerabilityInput]:
    """Read vulnerability data from XLSX file. Supports both production mode (minimal columns) and evaluation mode (with ground truth)."""
    df = pd.read_excel(xlsx_path)
    
    # Check which mode we're in based on available columns
    required_cols = {'Name', 'Constraints', 'Repository'}
    optional_cols = {'Summary', 'Probability', 'Exploitable'}
    available_cols = set(df.columns)
    
    # Validate required columns
    missing_required = required_cols - available_cols
    if missing_required:
        raise ValueError(f"Missing required columns: {missing_required}")
    
    has_ground_truth = optional_cols.issubset(available_cols)
    mode = "evaluation" if has_ground_truth else "production"
    print(f"📋 Loading vulnerabilities in {mode} mode")
    print(f"   Available columns: {sorted(available_cols)}")
    
    vulnerabilities = []
    for _, row in df.iterrows():
        vuln_data = {
            'Name': row['Name'],
            'Constraints': row['Constraints'],
            'Repository': row['Repository']
        }
        
        # Add optional fields if available
        if 'Summary' in available_cols:
            vuln_data['Summary'] = row['Summary']
            
        if 'Probability' in available_cols:
            vuln_data['Probability'] = float(row['Probability'])
            
        if 'Exploitable' in available_cols:
            # Convert string boolean values to actual booleans
            exploitable_val = row['Exploitable']
            if isinstance(exploitable_val, str):
                vuln_data['Exploitable'] = exploitable_val.lower() in ['true', '1', 'yes']
            elif isinstance(exploitable_val, (int, float)):
                vuln_data['Exploitable'] = bool(exploitable_val)
            else:
                vuln_data['Exploitable'] = bool(exploitable_val)
        
        # Create VulnerabilityInput with available data
        vuln = VulnerabilityInput(**vuln_data)
        vulnerabilities.append(vuln)
    
    return vulnerabilities


def write_results_to_xlsx(results: List[VulnerabilityResult], output_path: Path):
    """Write analysis results to XLSX file."""
    # Convert results to DataFrame
    data = [result.model_dump() for result in results]
    df = pd.DataFrame(data)
    df.to_excel(output_path, index=False)


def calculate_metrics(results: List[VulnerabilityResult]) -> Dict[str, Any]:
    """Calculate comprehensive metrics comparing LLM predictions with ground truth."""
    if not results:
        raise ValueError("No results provided for metrics calculation")
    
    # Filter results with complete ground truth and prediction data
    valid_results = [
        r for r in results 
        if (r.ground_truth_probability is not None 
            and r.ground_truth_exploitable is not None
            and r.predicted_probability is not None
            and r.predicted_exploitable is not None)
    ]
    
    if not valid_results:
        raise ValueError("No results with complete ground truth and prediction data")
    
    # Extract arrays for calculations
    gt_prob = [r.ground_truth_probability for r in valid_results]
    pred_prob = [r.predicted_probability for r in valid_results]
    
    gt_exploit = [r.ground_truth_exploitable for r in valid_results]
    pred_exploit = [r.predicted_exploitable for r in valid_results]
    
    # Status accuracy (confirmed vs ground truth exploitable)
    gt_status = [1 if r.ground_truth_exploitable else 0 for r in valid_results]
    pred_status = [1 if r.status == "confirmed" else 0 for r in valid_results]
    
    # Calculate probability metrics
    prob_mae = mean_absolute_error(gt_prob, pred_prob)
    prob_rmse = np.sqrt(mean_squared_error(gt_prob, pred_prob))
    
    # Calculate exploitability metrics
    exploit_accuracy = accuracy_score(gt_exploit, pred_exploit)
    exploit_precision = precision_score(gt_exploit, pred_exploit, zero_division=0)
    exploit_recall = recall_score(gt_exploit, pred_exploit, zero_division=0)
    exploit_f1 = f1_score(gt_exploit, pred_exploit, zero_division=0)
    
    # Calculate status accuracy
    status_accuracy = accuracy_score(gt_status, pred_status)
    
    # Calculate general metrics
    avg_confidence = np.mean([r.confidence for r in valid_results])
    
    return {
        "total_vulnerabilities": len(valid_results),
        "probability_mae": prob_mae,
        "probability_rmse": prob_rmse,
        "exploitable_accuracy": exploit_accuracy,
        "exploitable_precision": exploit_precision,
        "exploitable_recall": exploit_recall,
        "exploitable_f1": exploit_f1,
        "status_accuracy": status_accuracy,
        "avg_confidence": avg_confidence
    }
