## Prerequisites

* git configured with proxy etc.
* gitleaks command avaliable - https://github.com/gitleaks/gitleaks
* KICS command with by default link do queries - https://github.com/Checkmarx/kics (require to contain asset location to be changed in application.properties)
* bearer command with by default link to rules - https://github.com/Bearer/bearer it is required also to get bearer rules https://github.com/Bearer/bearer-rules
* have postgress db avaliable: eg. `docker run --name my-postgres-container -e POSTGRES_DB=flow -e POSTGRES_USER=flow_user -e POSTGRES_PASSWORD=flow_pass -p 5432:5432 -d postgres:latest`

## application.properties
 change to your need

## First login
`admin:admin` - then forced change

### debug postgresql
```shell
docker run --name flow_db -e POSTGRES_PASSWORD=flow_pass -e POSTGRES_USER=flow_user -e POSTGRES_DB=flow -p 5433:5432 -v pgdata:/var/lib/postgresql/data -d postgres
```

## 🏗️ Local LLM Infrastructure (Ollama + ROCm)
This deployment is based on Ollama, optimized for high-performance inference on AMD hardware.

📋 Prerequisites
* OS: Linux (Ubuntu recommended)
* Hardware: AMD iGPU/GPU with ROCm support.
* Drivers: /dev/kfd and /dev/dri are accessible.


⚙️ Configuration (.env)
```bash
OPENAI_MODEL=qwen2.5:0.5b
OPENAI_EMBEDDING_MODEL=nomic-embed-text:latest

OLLAMA_PORT=8000
OLLAMA_MAX_LOADED_MODELS=2
OLLAMA_CONTEXT_LENGTH=32768
OLLAMA_NUM_PARALLEL=1
OLLAMA_KEEP_ALIVE=-1
OLLAMA_HIP_VISIBLE_DEVICES=0
```

🐳 Docker Compose Architecture

1. Engine (llm-engine): Runs the core Ollama server with ROCm integration.
2. Initializer (llm-init): A one-time sidecar container. It handles:
* Pulling the weights for the `${OPENAI_EMBEDDING_MODEL}`.
* Pulling the weights for the `${OPENAI_MODEL}`.