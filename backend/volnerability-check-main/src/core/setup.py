import uuid
import time
import logging
from pathlib import Path
from datetime import datetime
from langfuse import get_client, propagate_attributes

from ..io.unzip import unzip_repository
from ..io.discover import discover_source_files
from ..core.chunk import chunk_source_files, detect_language
from ..core.vectorstore import VectorStore

logger = logging.getLogger(__name__)

def prepare_repository_environment(zip_path: Path, index_dir: Path, rebuild_index: bool):
    base_name = zip_path.stem
    langfuse = get_client()

    logger.info(f"Extracting repository from {zip_path}")
    temp_repo_dir = unzip_repository(zip_path)
    logger.info(f"Repository extracted to: {temp_repo_dir}")

    logger.info("Discovering source files...")
    source_files = discover_source_files(temp_repo_dir)
    logger.info(f"Found {len(source_files)} source files")

    files_by_lang = {}
    for file_path in source_files:
        lang = detect_language(file_path) or "unknown"
        files_by_lang.setdefault(lang, []).append(file_path)

    repository_info = {
        'total_files': len(source_files),
        'languages': list(files_by_lang.keys()),
        'files_by_language': {lang: len(files) for lang, files in files_by_lang.items()},
        'repository_name': base_name,
        'temp_repo_dir': str(temp_repo_dir)
    }

    logger.info("Files discovered by language:")
    for lang, files in files_by_lang.items():
        logger.info(f"  {lang}: {len(files)} files")

    batch_session_id = f"{base_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"

    with langfuse.start_as_current_observation(name="Code chunking and indexing") as indexing_trace:
        with propagate_attributes(session_id=batch_session_id, tags=["indexing", base_name]):

            logger.info("Initializing vector store...")
            vector_store = VectorStore(index_dir=index_dir)
            need_build = rebuild_index or not vector_store.index_exists()
            logger.info(f"Index present: {not need_build}")

            if need_build:
                logger.info("Chunking source files and building embeddings...")
                chunks = chunk_source_files(source_files)
                logger.info(f"Generated {len(chunks)} chunks")
                logger.info("Building embeddings and vector index...")
                vector_store.set_chunks(chunks)

            index_start = time.time()
            vector_store.build_index(rebuild=rebuild_index)
            index_time = time.time() - index_start
            logger.info(f"Vector index ready in {index_time:.2f} seconds")

            indexing_trace.update(metadata={
                "rebuilt": need_build,
                "chunks_processed": len(chunks) if need_build else "loaded_from_disk",
            })

    return temp_repo_dir, vector_store, repository_info, batch_session_id