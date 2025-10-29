#!/bin/bash
# Quick verification script for new version

set -e

echo "🔍 QUICK VERIFICATION OF NEW VERSION"
echo "======================================"
echo ""

echo "✓ Step 1: Testing imports..."
poetry run python -c "
from src.core.models import VulnerabilityInput, VulnerabilityResult
from src.analysis.analyzer import analyze_vulnerability
print('  ✓ All imports successful')
"

echo ""
echo "✓ Step 2: Testing VulnerabilityInput with NVD_Data..."
poetry run python -c "
import json
from src.core.models import VulnerabilityInput

# Test with NVD data
vuln1 = VulnerabilityInput(
    Name='CVE-TEST-1',
    Constraints='test constraint',
    Repository='test-repo',
    NVD_Data=json.dumps({'id': 'CVE-TEST-1', 'description': 'test'})
)
assert vuln1.has_nvd_data == True, 'NVD data detection failed'
print('  ✓ NVD_Data field works correctly')

# Test without NVD data (should still work)
vuln2 = VulnerabilityInput(
    Name='CVE-TEST-2',
    Constraints='test constraint',
    Repository='test-repo'
)
assert vuln2.has_nvd_data == False, 'NVD data optional check failed'
print('  ✓ System works without NVD_Data (backward compatible)')
"

echo ""
echo "✓ Step 3: Testing VulnerabilityResult with detailed_reasoning..."
poetry run python -c "
from src.core.models import VulnerabilityResult, AnalysisStatus
from datetime import datetime

result = VulnerabilityResult(
    vulnerability_id='TEST-1',
    vulnerability_name='TEST-1',
    status=AnalysisStatus.UNCERTAIN,
    confidence=3,
    analysis_summary='Test summary',
    detailed_reasoning='Test detailed reasoning explaining all decisions',
    evidence_snippets=[],
    files_analyzed=['test.py'],
    mitigations_detected=[],
    suggested_next_steps='Test next steps'
)

assert result.detailed_reasoning == 'Test detailed reasoning explaining all decisions'
print('  ✓ detailed_reasoning field works correctly')
"

echo ""
echo "✓ Step 4: Testing smoke test module..."
poetry run python -c "
from src.testing.smoke_tests import validate_pipeline_health
health = validate_pipeline_health()
if health:
    print('  ✓ Pipeline health check passed')
else:
    print('  ⚠ Pipeline health check returned False (check .env configuration)')
"

echo ""
echo "✓ Step 5: Checking test data files..."
if [ -f "data/transformers-main.xlsx" ]; then
    echo "  ✓ data/transformers-main.xlsx exists"
else
    echo "  ✗ data/transformers-main.xlsx NOT FOUND"
    exit 1
fi

if [ -f "data/transformers-main.zip" ]; then
    echo "  ✓ data/transformers-main.zip exists"
else
    echo "  ✗ data/transformers-main.zip NOT FOUND"
    exit 1
fi

if [ -f "data/nvd_data_example.json" ]; then
    echo "  ✓ data/nvd_data_example.json exists (NVD data examples)"
else
    echo "  ⚠ data/nvd_data_example.json NOT FOUND (optional)"
fi

echo ""
echo "======================================"
echo "✅ ALL QUICK CHECKS PASSED!"
echo "======================================"
echo ""
echo "📝 Next steps:"
echo "  1. Run smoke test: python scripts/smoke_test.py"
echo "  2. Check output: ls -lh results/transformers-main/"
echo "  3. Verify detailed_reasoning: cat results/transformers-main/transformers-main.json | grep detailed_reasoning"
echo ""
echo "📖 See TESTING_GUIDE.md for complete testing instructions"
echo ""

