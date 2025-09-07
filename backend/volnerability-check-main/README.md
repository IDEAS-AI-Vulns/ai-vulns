# Vulnerability Analysis System

An advanced code analysis tool that uses AST-based chunking and Large Language Models to identify security vulnerabilities in source code repositories. Features a multi-agent analysis pipeline with comprehensive quality assessment and robust error handling.

## Quick Start

### Installation

**Using Poetry (Recommended):**
```bash
git clone <repository-url>
cd vulnerability-check
poetry install
poetry shell
```

**Using pip:**
```bash
git clone <repository-url>
cd vulnerability-check
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

Copy the example configuration file and fill in your API keys:
```bash
cp .env.example .env
```

**Minimum Required Configuration:**
```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Getting NVD API Key (Optional but Recommended):**
- Visit: https://nvd.nist.gov/developers/request-an-api-key
- Benefits: 50 requests/30s (vs 5 requests/10s without key)
- Provides access to enhanced CVE metadata and vulnerability intelligence

### Basic Usage

#### Quick Start - Smoke Test
Test the system with provided sample data:
```bash
# Run end-to-end smoke test with transformers-main.zip sample
python scripts/smoke_test.py
```

**What the smoke test does:**
1. Uses sample data: `data/transformers-main.zip` and `data/transformers-main.xlsx`
2. Runs full vulnerability analysis pipeline with `--top-k 30 --rebuild-index`
3. Validates all output files and data structures
4. Checks LLM prediction accuracy and quality scores
5. Verifies JSON/Excel exports and metrics calculation

#### Full Analysis
Run complete vulnerability analysis on your own data:

**🔍 Production Mode (Normal Analysis):**
```bash
# Basic analysis - generates LLM predictions
poetry run python -m src analyze /path/to/repo.zip /path/to/vulnerabilities.xlsx

# Advanced analysis with options
poetry run python -m src analyze repo.zip vulnerabilities.xlsx \
    --top-k 50 \
    --rebuild-index

# Using environment variables for configuration
export MAX_FILES_FOR_TESTING=100
export MAX_CONCURRENT_API_CALLS=1
poetry run python -m src analyze repo.zip vulnerabilities.xlsx
```

**💡 How it works without ground truth:**
- The system analyzes your code and generates LLM predictions
- `Probability` and `Exploitable` columns in XLSX can be placeholder values (e.g., 0.5, False)
- LLM generates its own `predicted_probability` and `predicted_exploitable` values
- No comparison with ground truth - just pure analysis and prediction

**📊 Evaluation Mode (With Ground Truth):**
```bash
# Use the smoke test for evaluation with known correct answers
python scripts/smoke_test.py
```

#### Output Files
Results are saved in `./results/<repository-name>/`:

**🔍 Production Mode Output:**
- `<repo_name>.json`: LLM predictions (`predicted_probability`, `predicted_exploitable`) + evidence
- `<repo_name>.results.xlsx`: Excel with LLM predictions and analysis details
- `<repo_name>.quality.json`: LLM-based quality assessment (1-5 scale)
- `<repo_name>.analysis.log`: Detailed execution logs

**📊 Evaluation Mode Output (includes all above plus):**
- `<repo_name>.metrics.json`: Accuracy metrics comparing predictions vs ground truth (MAE, RMSE, F1-score)

**Key difference:** Metrics file only appears when ground truth is available for comparison.

## Features

- **Multi-language Support**: Python, JavaScript, TypeScript, Java, Go, C/C++, C#, Rust, PHP, and 40+ more
- **AST-based Chunking**: Tree-sitter powered intelligent code parsing with hierarchical organization  
- **Vector-based Search**: Efficient similarity search using FAISS and OpenAI embeddings
- **Asynchronous Pipeline**: High-performance async processing with rate limiting and error handling
- **Multi-Agent Analysis**: 4-stage intelligent analysis pipeline:
  - **Code Triage Agent**: Extract objective facts from source code chunks
  - **NVD API Agent**: Fetch official CVE data and vulnerability intelligence  
  - **Web Research Agent**: Gather security advisories and exploit intelligence
  - **Synthesis Agent**: Integrate all sources for comprehensive risk assessment
- **Quality Assessment**: LLM-based analysis quality evaluation and scoring
- **Robust Error Handling**: Comprehensive fallback mechanisms and detailed logging
- **Performance Optimization**: Memory-efficient processing with configurable resource limits
- **Comprehensive Reporting**: JSON and Excel outputs with detailed metrics, quality scores, and analysis logs

## Environment Variables

### Required
```env
OPENAI_API_KEY=sk-...                    # OpenAI API key (required)
```

### Optional APIs
```env
NVD_API_KEY=your_nvd_api_key_here        # NVD API key (optional but recommended)
                                         # Get from: https://nvd.nist.gov/developers/request-an-api-key
                                         # Benefits: Higher rate limits + enhanced CVE data
```

### OpenAI Configuration
```env
OPENAI_BASE_URL=https://api.openai.com/v1     # API endpoint
OPENAI_MODEL=o3-mini                          # Main analysis model (cheaper + reasoning)
OPENAI_WEB_SEARCH_MODEL=gpt-4o-search-preview # Dedicated web research model
OPENAI_EMBEDDING_MODEL=text-embedding-3-small # Embedding model  
OPENAI_ORG_ID=                                # Optional organization ID
OPENAI_TIMEOUT_SECONDS=300.0                  # API timeout (5 minutes)
OPENAI_MAX_RETRIES=3                          # Max API retries
MAX_CONCURRENT_API_CALLS=2                    # Rate limiting
API_CALL_DELAY_SECONDS=2.0                    # Delay between API calls
```

### Analysis Parameters
```env
DEFAULT_TOP_K=30                            # Default chunks to retrieve
MAX_CHUNKS_FOR_ANALYSIS=10                  # Max chunks sent to LLM
MAX_PREPROCESSING_CHARS=200000              # Max chars for preprocessing (~50k tokens)
MAX_ORGANIZATION_CHARS=50000                # Max chars for organization (~12k tokens)
```

### File Processing
```env
FILE_FILTER_MODE=all                        # Options: "python", "all", "custom"
CUSTOM_EXTENSIONS=                           # Custom file extensions (when mode=custom)
MAX_FILES_FOR_TESTING=0                     # Limit files for testing (0=no limit)
MAX_FILE_SIZE_MB=0.5                        # Skip files larger than 0.5MB 
MAX_FILE_LINES=1000                         # Skip files with more than 1000 lines
WARN_FILE_SIZE_MB=0.2                       # Warn about files larger than 0.2MB
WARN_FILE_LINES=800                         # Warn about files with more than 800 lines
```

### Resource Optimization
```env
EMBEDDING_BATCH_SIZE=10                     # Process embeddings in batches
MAX_CHUNK_SIZE_MB=10.0                      # Max size per chunk
MAX_TOTAL_CHUNKS=50000                      # Max chunks to process
MEMORY_LIMIT_GB=16.0                        # Memory limit
```

### Chunking Configuration
```env
ENABLE_CHUNK_SUBDIVISION=false              # Enable chunk subdivision
MAX_CHUNKS_PER_FILE=15                      # Max chunks per file
CHUNKING_PARALLEL_WORKERS=4                 # Parallel file processing workers
REDUCE_CHUNKING_LOGS=true                   # Reduce verbose chunking logs
```

## Input Formats

### Repository ZIP
ZIP file containing the source code repository to analyze.

### Vulnerability Excel File
Excel file with required columns:

| Column | Description |
|--------|-------------|
| Name | Vulnerability name/identifier (CVE ID or custom identifier) |
| Summary | Description of vulnerability (for reference, not shown to LLM during analysis) |
| Constraints | Analysis constraints - what the LLM should focus on when analyzing code |
| Repository | Target repository name |
| Probability | Expected exploitability probability (0.0-1.0) |
| Exploitable | Expected exploitability (true/false or Yes/No) |

**📝 Column Usage Modes:**

**🔍 Production Mode (Normal Analysis):**
- `Probability` and `Exploitable` can be placeholder values (e.g., 0.5, False)
- LLM ignores these values and generates its own predictions
- Only `Name`, `Constraints`, and `Repository` are actually used for analysis

**📊 Evaluation Mode (Ground Truth Comparison):**
- `Probability` and `Exploitable` contain correct answers for validation
- System compares LLM predictions vs ground truth values
- Used for measuring accuracy, MAE, F1-score, etc.

#### Excel File Format Requirements

**📋 Required Columns (Production Mode):**
For normal vulnerability analysis, you only need these 3 columns:

| Name | Constraints | Repository |
|------|-------------|------------|

**📊 Additional Columns (Evaluation Mode):**
For testing system accuracy against ground truth, add these columns:

| Name | Summary | Constraints | Repository | Probability | Exploitable |
|------|---------|-------------|------------|-------------|-------------|

**🔧 Column Details:**

**`Name`** (Required)
- CVE identifier (e.g., "CVE-2024-1234") or custom vulnerability name
- Used for logging and output file naming
- Examples: `CVE-2024-45490`, `SQL_INJECTION_CHECK`, `BUFFER_OVERFLOW_ANALYSIS`

**`Summary`** (Required - Reference Only)
- Brief description of the vulnerability
- **NOT shown to LLM** during analysis (prevents bias)
- Used only for documentation and report generation
- Example: `"Remote command execution via torch.load() function"`

**`Constraints`** (Required - Core Analysis Input)
- **Most important column** - tells LLM what to look for
- Specific analysis instructions and focus areas
- Be detailed and specific about patterns, functions, or code constructs
- Examples:
  - `"Look for torch.load() calls with user-controlled input, even with weights_only=True"`
  - `"Find SQL queries constructed with string concatenation or f-strings"`
  - `"Check for buffer operations without bounds checking (strcpy, strcat, gets)"`

**`Repository`** (Required)
- Target repository name (usually matches your ZIP filename)
- Example: `"transformers-main"`, `"my-project"`

**`Probability`** (Required - Can be Placeholder)
- **Production Mode**: Use placeholder like `0.5`
- **Evaluation Mode**: Correct probability value (0.0-1.0)
- LLM generates its own `predicted_probability`

**`Exploitable`** (Required - Can be Placeholder)
- **Production Mode**: Use placeholder like `False`
- **Evaluation Mode**: Correct boolean value (True/False)
- LLM generates its own `predicted_exploitable`

#### Complete Excel Examples

**🔍 Production Mode Example:**
```csv
Name,Constraints,Repository
CVE-2024-1234,Look for direct SQL query construction with user input without parameterization or prepared statements,my-app
XSS_VULN_CHECK,Find unescaped user input in HTML output or template rendering,my-app
BUFFER_OVERFLOW,Check for unsafe string operations like strcpy without bounds checking,my-app
```

**📊 Evaluation Mode Example (with ground truth):**
```csv
Name,Summary,Constraints,Repository,Probability,Exploitable
CVE-2024-45490,PyTorch torch.load RCE,Look for torch.load() calls with user-controlled input even with weights_only=True,transformers-main,0.75,True
CVE-2024-2148,Memory corruption in profiler,Check for usage of torch.ops.profiler._call_end_callbacks_on_jit_fut with None argument,transformers-main,0.0,False
```

#### Creating Your Excel File

**Option 1: Using Excel/LibreOffice**

**For Production Mode:**
1. Create new spreadsheet
2. Add headers in row 1: `Name | Constraints | Repository`
3. Fill in your vulnerability data
4. Save as `.xlsx` format

**For Evaluation Mode:**
1. Create new spreadsheet  
2. Add headers in row 1: `Name | Summary | Constraints | Repository | Probability | Exploitable`
3. Fill in your vulnerability data with correct answers
4. Save as `.xlsx` format

**Option 2: Using Python**

**Production Mode:**
```python
import pandas as pd

vulnerabilities = [
    {
        'Name': 'CVE-2024-1234',
        'Constraints': 'Look for direct SQL query construction with user input without parameterization',
        'Repository': 'my-project'
    },
    {
        'Name': 'XSS_CHECK',
        'Constraints': 'Find unescaped user input in HTML output or template rendering',
        'Repository': 'my-project'
    }
]

df = pd.DataFrame(vulnerabilities)
df.to_excel('my_vulnerabilities.xlsx', index=False)
```

**Evaluation Mode:**
```python
import pandas as pd

vulnerabilities = [
    {
        'Name': 'CVE-2024-1234',
        'Summary': 'SQL injection vulnerability',
        'Constraints': 'Look for direct SQL query construction with user input without parameterization',
        'Repository': 'my-project',
        'Probability': 0.75,  # Ground truth
        'Exploitable': True   # Ground truth
    }
]

df = pd.DataFrame(vulnerabilities)
df.to_excel('my_evaluation_data.xlsx', index=False)
```

**💡 Pro Tips:**
- **Constraints is key**: This is the most important column - be very specific and detailed
- **Include specific patterns**: Mention function names, code constructs, or patterns to look for
- **One vulnerability per row**: Each row should check for one specific vulnerability type
- **Consistent repository naming**: Use the same name in `Repository` column for all rows
- **Production mode**: Only needs 3 columns (Name, Constraints, Repository) - no ground truth needed
- **Evaluation mode**: Requires all 6 columns with correct Probability/Exploitable values for accuracy testing

## Architecture

```
src/
├── core/                    # Core functionality
│   ├── config.py           # Configuration settings
│   ├── models.py           # Pydantic data models
│   ├── chunk.py            # AST-based code chunking
│   ├── ast_chunker.py      # Tree-sitter AST parsers
│   ├── vectorstore.py      # FAISS vector storage and search
│   ├── token_utils.py      # Token/text utilities
│   └── client.py           # Shared OpenAI client
│
├── analysis/               # Multi-agent analysis pipeline
│   ├── pipeline.py         # Async pipeline orchestration
│   ├── retrieval.py        # Semantic code retrieval
│   ├── preprocessor.py     # Code preprocessing and organization
│   ├── analyzer.py         # 4-stage vulnerability analysis
│   └── prompts.py          # All LLM prompts and templates
│
├── testing/                # Quality assurance
│   ├── quality_checker.py  # LLM-based quality assessment
│   └── smoke_tests.py      # Pipeline validation tests
│
├── io/                     # Input/Output operations
│   ├── xlsx.py            # Excel file operations
│   ├── json.py            # JSON file operations
│   ├── unzip.py           # Repository extraction
│   └── discover.py        # Multi-language file discovery
│
└── utils/                  # Utilities and helpers
    ├── cli.py             # Command line interface
    ├── llm.py             # LLM utility functions
    ├── progress.py        # Progress indicators
    ├── rate_limiter.py    # API rate limiting
    └── web_research.py    # Web research agent
```

### Pipeline Flow

1. **Repository Extraction**: Unpack ZIP and discover source files across 40+ languages
2. **AST-based Code Chunking**: Parse code into logical units using Tree-sitter (functions, classes, files)
3. **Vector Store Building**: Generate OpenAI embeddings and build FAISS searchable index
4. **Vulnerability Processing**: Load vulnerability definitions from Excel file
5. **Semantic Retrieval**: Query expansion and similarity search for relevant code chunks
6. **Asynchronous Multi-Agent Analysis**:
   - **Code Triage Agent**: Extract objective facts from retrieved code chunks
   - **NVD API Agent**: Fetch official CVE data and CVSS metrics with rate limiting
   - **Web Research Agent**: Gather intelligence from security advisories and online sources  
   - **Synthesis Agent**: Integrate all findings into comprehensive risk assessment
7. **LLM Quality Assessment**: Validate analysis quality with detailed scoring (1-5 scale)
8. **Comprehensive Results Export**: Generate JSON, Excel, metrics, quality, and log outputs

## Supported Languages

**Primary Languages:**
- Python (.py, .pyx, .pyi)
- JavaScript/TypeScript (.js, .jsx, .ts, .tsx, .mjs)
- Java (.java), Kotlin (.kt), Scala (.scala)
- C/C++ (.c, .cpp, .cc, .cxx, .h, .hpp, .hxx)
- C# (.cs)
- Go (.go)
- Rust (.rs)
- Ruby (.rb)
- PHP (.php)
- Swift (.swift)
- Dart (.dart)

**And many more:** Shell, Lua, R, SQL, etc. (40+ languages supported)

## Command Line Usage

**Production Analysis (normal mode - generates LLM predictions):**
```bash
# Basic analysis
python -m src analyze repo.zip vulnerabilities.xlsx

# With custom parameters
python -m src analyze repo.zip vulnerabilities.xlsx --top-k 50 --rebuild-index

# Using specific configuration
export MAX_FILES_FOR_TESTING=100
python -m src analyze repo.zip vulnerabilities.xlsx
```

**Evaluation Mode (compares with ground truth):**
```bash
# Run smoke test with known correct answers
python scripts/smoke_test.py
```

## Python API

```python
from pathlib import Path
from src.analysis.pipeline import run_pipeline

# Run analysis
results, metrics = run_pipeline(
    zip_path=Path("repository.zip"),
    xlsx_path=Path("vulnerabilities.xlsx"),
    top_k=30,
    rebuild_index=True
)

# Access results
for result in results:
    print(f"Vulnerability: {result.vulnerability_name}")
    print(f"Status: {result.status}")
    print(f"Confidence: {result.confidence}")
```

## Testing

### Smoke Testing
The smoke test validates the entire pipeline end-to-end:
```bash
# Run comprehensive smoke test with sample data
python scripts/smoke_test.py
```

**Smoke test validation:**
- ✅ Extracts `transformers-main.zip` repository
- ✅ Processes 3,600+ source files with AST chunking
- ✅ Builds vector index with OpenAI embeddings
- ✅ Runs 4-stage vulnerability analysis (Code Triage → NVD → Web Research → Synthesis)
- ✅ Validates Pydantic models and data structures
- ✅ Checks probability ranges (0.0-1.0) and exploitability predictions
- ✅ Verifies quality assessment scoring (1-5 scale)
- ✅ Exports to JSON, Excel, metrics, and log files

### Other Tests
```bash
# Test chunking system
python test_chunking.py

# Verify installation and dependencies
python verify_installation.py

# Manual pipeline testing
python -c "from src.analysis.pipeline import run_pipeline; print('Pipeline import successful')"
```

## Performance Optimization

### Large Repositories
- Use incremental indexing (don't use `--rebuild-index`)
- Set `MAX_FILES_FOR_TESTING` to limit file processing
- Optimize resource usage with `MAX_CONCURRENT_API_CALLS=1`
- Reduce chunking overhead with `REDUCE_CHUNKING_LOGS=true`

### Memory Management
- Set `MEMORY_LIMIT_GB` appropriately (default: 16GB)
- Use `MAX_TOTAL_CHUNKS` to control memory usage (default: 50000)
- Set `MAX_FILE_SIZE_MB` to skip large files (default: 0.5MB)
- Reduce `MAX_CHUNKS_PER_FILE` for memory-constrained systems (default: 15)

## Troubleshooting

**OpenAI API Issues:**
```bash
# Check API key
echo $OPENAI_API_KEY

# Test API connection
python -c "from openai import OpenAI; print(OpenAI().models.list())"
```

**Memory Issues:**
- Reduce `MAX_TOTAL_CHUNKS` (default: 50000)
- Increase `MEMORY_LIMIT_GB` (default: 16GB)
- Use smaller `EMBEDDING_BATCH_SIZE` (default: 10)
- Reduce `MAX_CHUNKS_PER_FILE` (default: 15)

**API Rate Limiting Issues:**
- Increase `API_CALL_DELAY_SECONDS` (default: 2.0)
- Reduce `MAX_CONCURRENT_API_CALLS` (default: 2)
- Check your OpenAI plan limits

**Tree-sitter Issues:**
```bash
pip install --upgrade tree-sitter-language-pack
```

## Output Formats

### JSON Output
Detailed results with vulnerability analysis, evidence snippets, confidence scores, and predicted probabilities.

### Excel Output  
Summary report with vulnerability overview, analysis results, metrics comparison, and quality scores.

### Metrics Output
Performance evaluation including probability MAE/RMSE, exploitability accuracy, status accuracy, and quality distribution.

## Quality Assessment

Built-in quality validation includes:
- **Accuracy**: Correct vulnerability identification
- **Completeness**: All constraints addressed
- **Evidence Quality**: Relevant code snippets
- **Reasoning**: Logical analysis flow
- **Consistency**: Aligned status/probability/exploitability

**Quality Scoring (1-5):**
- 1: Poor (major errors, inconsistent)
- 2: Below Average (some errors/omissions)
- 3: Average (generally correct, adequate evidence)
- 4: Good (accurate, clear reasoning)
- 5: Excellent (comprehensive, perfect reasoning)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Run tests: `python scripts/smoke_test.py`
5. Submit a pull request
