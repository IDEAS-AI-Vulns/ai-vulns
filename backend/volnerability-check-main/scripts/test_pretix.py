#!/usr/bin/env python3
"""
Mock test for pretix-pretix vulnerability analysis.
Tests the entire pipeline on the pretix repository.
"""
import os
import subprocess
import json
from pathlib import Path


def run_pretix_test():
    """Runs an end-to-end test of the analysis pipeline on pretix-pretix."""
    print("="*80)
    print("PRETIX-PRETIX VULNERABILITY ANALYSIS TEST")
    print("="*80)
    print()

    zip_path = Path("./data/pretix-master.zip")
    xlsx_path = Path("./data/pretix-pretix.xlsx")

    if not zip_path.exists():
        print(f"❌ ERROR: ZIP file not found: {zip_path}")
        return False
    
    if not xlsx_path.exists():
        print(f"❌ ERROR: XLSX file not found: {xlsx_path}")
        return False

    print(f"✓ Found ZIP file: {zip_path} ({zip_path.stat().st_size / (1024*1024):.1f} MB)")
    print(f"✓ Found XLSX file: {xlsx_path}")
    print()

    # Configuration
    os.environ["MAX_FILES_FOR_TESTING"] = "0"  # No limit
    os.environ["MAX_CHUNKS_FOR_ANALYSIS"] = "30"  # Good balance for pretix

    base_name = "pretix-master"
    results_dir = Path(f"./results/{base_name}")
    results_dir.mkdir(parents=True, exist_ok=True)
    os.environ["OUTPUT_DIR"] = str(results_dir)

    command = [
        "poetry",
        "run",
        "python",
        "-m",
        "src",
        "analyze",
        str(zip_path),
        str(xlsx_path),
        "--top-k",
        "50",  # Retrieve more chunks for better context
        # "--rebuild-index",  # Uncomment to force rebuild
    ]

    print("Running analysis pipeline...")
    print(f"Command: {' '.join(command)}")
    print()
    print("-"*80)

    try:
        if not Path(".env").exists():
            print("⚠️  WARNING: .env file not found. The test will likely fail.")
            print("Please copy .env.example to .env and configure it.")
            return False

        # Run the pipeline (output streams in real-time)
        result = subprocess.run(command, check=True, text=True)

        print("-"*80)
        print()
        print("Analysis completed! Verifying outputs...")
        print()

        # Define expected output files
        json_output = results_dir / f"{base_name}.json"
        xlsx_output = results_dir / f"{base_name}.results.xlsx"
        metrics_output = results_dir / f"{base_name}.metrics.json"
        quality_output = results_dir / f"{base_name}.quality.json"

        # Verify all outputs exist
        missing_files = []
        for filepath in [json_output, xlsx_output, metrics_output, quality_output]:
            if not filepath.exists():
                missing_files.append(filepath)
                print(f"❌ Missing: {filepath}")
            else:
                print(f"✓ Found: {filepath}")

        if missing_files:
            print()
            print(f"❌ TEST FAILED: {len(missing_files)} output file(s) missing")
            return False

        print()
        print("="*80)
        print("VALIDATING OUTPUT STRUCTURE")
        print("="*80)
        print()

        # Validate JSON output
        print("📄 JSON Output Validation:")
        with open(json_output, 'r') as f:
            results_data = json.load(f)
        
        if not results_data:
            print("⚠️  WARNING: No results in JSON output")
        else:
            first_result = results_data[0]
            required_fields = [
                'vulnerability_name', 'predicted_probability', 'predicted_exploitable',
                'ground_truth_probability', 'ground_truth_exploitable',
                'status', 'confidence', 'analysis_summary', 'detailed_reasoning'
            ]
            
            missing_fields = [f for f in required_fields if f not in first_result]
            if missing_fields:
                print(f"❌ Missing required fields: {missing_fields}")
                return False
            
            print(f"✓ Contains {len(results_data)} vulnerability analysis results")
            print(f"✓ All required fields present")
            
            # Check probability values are in valid range
            prob_values = [r.get('predicted_probability') for r in results_data if r.get('predicted_probability') is not None]
            if prob_values:
                min_prob, max_prob = min(prob_values), max(prob_values)
                if not (0.0 <= min_prob <= 1.0 and 0.0 <= max_prob <= 1.0):
                    print(f"❌ Probability values out of range: {min_prob:.3f} - {max_prob:.3f}")
                    return False
                print(f"✓ Probability range: {min_prob:.3f} - {max_prob:.3f}")
            
            # Check reasoning quality
            avg_reasoning_length = sum(len(r.get('detailed_reasoning', '')) for r in results_data) // len(results_data)
            print(f"✓ Average reasoning length: {avg_reasoning_length} characters")
            
            # Count statuses
            status_counts = {}
            for r in results_data:
                status = str(r.get('status', 'UNKNOWN')).split('.')[-1]
                status_counts[status] = status_counts.get(status, 0) + 1
            print(f"✓ Status distribution: {status_counts}")
        
        print()

        # Validate Metrics
        print("📊 Metrics Validation:")
        with open(metrics_output, 'r') as f:
            metrics_data = json.load(f)
        
        required_metrics = [
            'total_vulnerabilities', 'probability_mae', 'probability_rmse',
            'exploitable_accuracy', 'exploitable_precision', 'exploitable_recall',
            'exploitable_f1', 'status_accuracy'
        ]
        
        missing_metrics = [m for m in required_metrics if m not in metrics_data]
        if missing_metrics:
            print(f"❌ Missing required metrics: {missing_metrics}")
            return False
        
        print(f"✓ All required metrics present")
        print(f"  • Total vulnerabilities: {metrics_data['total_vulnerabilities']}")
        print(f"  • Probability MAE: {metrics_data['probability_mae']:.4f}")
        print(f"  • Probability RMSE: {metrics_data['probability_rmse']:.4f}")
        print(f"  • Exploitable Accuracy: {metrics_data['exploitable_accuracy']:.2%}")
        print(f"  • Exploitable Precision: {metrics_data['exploitable_precision']:.4f}")
        print(f"  • Exploitable Recall: {metrics_data['exploitable_recall']:.4f}")
        print(f"  • Exploitable F1: {metrics_data['exploitable_f1']:.4f}")
        print(f"  • Status Accuracy: {metrics_data['status_accuracy']:.2%}")
        
        if 'avg_quality_score' in metrics_data and metrics_data['avg_quality_score'] is not None:
            quality_score = metrics_data['avg_quality_score']
            if not (1.0 <= quality_score <= 5.0):
                print(f"❌ Quality score out of range: {quality_score}")
                return False
            print(f"  • Average Quality Score: {quality_score:.2f}/5")
        
        print()

        # Validate Quality Assessment
        print("🎯 Quality Assessment Validation:")
        with open(quality_output, 'r') as f:
            quality_data = json.load(f)
        
        required_quality_fields = [
            'average_quality_score', 'quality_distribution', 'total_assessed'
        ]
        
        missing_quality = [f for f in required_quality_fields if f not in quality_data]
        if missing_quality:
            print(f"❌ Missing required quality fields: {missing_quality}")
            return False
        
        quality_score = quality_data['average_quality_score']
        if not (1.0 <= quality_score <= 5.0):
            print(f"❌ Quality score out of range: {quality_score}")
            return False
        
        print(f"✓ Average Quality Score: {quality_score:.2f}/5")
        print(f"✓ Total Assessed: {quality_data['total_assessed']}")
        print(f"✓ Quality Distribution: {quality_data['quality_distribution']}")
        
        print()

        # Validate XLSX output
        print("📈 XLSX Output Validation:")
        import pandas as pd
        df = pd.read_excel(xlsx_output)
        
        print(f"✓ Contains {len(df)} rows and {len(df.columns)} columns")
        
        expected_columns = [
            'vulnerability_name', 'predicted_probability', 'predicted_exploitable',
            'ground_truth_probability', 'ground_truth_exploitable', 'status'
        ]
        
        missing_columns = [c for c in expected_columns if c not in df.columns]
        if missing_columns:
            print(f"⚠️  Missing columns: {missing_columns}")
        else:
            print(f"✓ All expected columns present")
        
        print(f"✓ Columns: {', '.join(df.columns.tolist())}")
        
        print()
        print("="*80)
        print("✅ PRETIX-PRETIX TEST PASSED!")
        print("="*80)
        print()
        print(f"Results saved to: {results_dir}")
        print(f"  • JSON:    {json_output.name}")
        print(f"  • XLSX:    {xlsx_output.name}")
        print(f"  • Metrics: {metrics_output.name}")
        print(f"  • Quality: {quality_output.name}")
        print()
        
        return True

    except subprocess.CalledProcessError as e:
        print()
        print("="*80)
        print("❌ TEST FAILED: Pipeline execution error")
        print("="*80)
        print(f"Return code: {e.returncode}")
        return False
    
    except AssertionError as e:
        print()
        print("="*80)
        print(f"❌ TEST FAILED: {e}")
        print("="*80)
        return False
    
    except Exception as e:
        print()
        print("="*80)
        print(f"❌ TEST FAILED: Unexpected error")
        print("="*80)
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_pretix_test()
    exit(0 if success else 1)

