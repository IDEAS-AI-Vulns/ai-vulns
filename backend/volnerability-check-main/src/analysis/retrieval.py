from pathlib import Path
from typing import List
from collections import Counter
import logging
import time

from tenacity import RetryError
from openai import BadRequestError, APITimeoutError

from ..core.config import settings
from ..core.client import client
from ..core.models import VulnerabilityInput
from .prompts import QUERY_GENERATION_PROMPT_TEMPLATE, QUERY_GENERATION_SYSTEM_PROMPT
from ..core.vectorstore import VectorStore
from ..core.chunk import CodeChunk

logger = logging.getLogger(__name__)


def expand_query_with_llm(vulnerability: VulnerabilityInput) -> str:
    """
    Uses an LLM to expand a vulnerability name and constraints into a targeted search query.
    """
    logger.info("EXPANDING VULNERABILITY TO SEARCH QUERY")
    logger.info("=" * 40)

    prompt = QUERY_GENERATION_PROMPT_TEMPLATE.format(
        vuln_name=vulnerability.name,
        vuln_constraints=vulnerability.constraints,
    )

    logger.info(f"Using model: {settings.OPENAI_MODEL}")
    logger.info("Sending query expansion request to LLM...")
    
    logger.info("FULL QUERY EXPANSION PROMPT:")
    logger.info("-" * 40)
    logger.info(f"System: {QUERY_GENERATION_SYSTEM_PROMPT}")
    logger.info(f"User: {prompt}")
    logger.info("-" * 40)

    try:
        api_start_time = time.time()
        completion = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": QUERY_GENERATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]
        )
        api_time = time.time() - api_start_time
        
        expanded_query = completion.choices[0].message.content.strip()
        
        logger.info(f"Query expansion completed in {api_time:.2f} seconds")
        logger.info(f"Original query length: {len(prompt)} characters")
        logger.info(f"Expanded query length: {len(expanded_query)} characters")
        
        try:
            if hasattr(completion, 'usage') and completion.usage:
                usage = completion.usage
                logger.info(f"Token usage - Prompt: {usage.prompt_tokens}, Completion: {usage.completion_tokens}, Total: {usage.total_tokens}")
        except Exception as e:
            logger.debug(f"Unable to log usage info: {e}")
        
        logger.info("FULL EXPANDED QUERY:")
        logger.info("=" * 40)
        logger.info(expanded_query)
        logger.info("=" * 40)
        
        logger.info(f"Successfully generated expanded query: '{expanded_query[:100]}...'")
        return expanded_query
    except Exception as e:
        logger.error(f"LLM query expansion failed: {e}")
        logger.exception("Full error details:")
        
        if isinstance(e, RetryError):
            logger.error("RetryError detected in query expansion - all retry attempts exhausted")
            if hasattr(e, 'last_attempt') and e.last_attempt and e.last_attempt.exception():
                underlying_error = e.last_attempt.exception()
                logger.error(f"Underlying query expansion error: {type(underlying_error).__name__}: {str(underlying_error)}")
                
                if isinstance(underlying_error, BadRequestError):
                    underlying_msg = str(underlying_error)
                    if "tokens exceed" in underlying_msg or "context_length_exceeded" in underlying_msg:
                        logger.error("TOKEN LIMIT EXCEEDED in query expansion")
        
        logger.warning("Falling back to basic query construction.")
        fallback_query = f"{vulnerability.name}\n{vulnerability.constraints}"
        logger.info(f"Using fallback query: {fallback_query}")
        return fallback_query


def retrieve_chunks(
    vector_store: VectorStore,
    vulnerability: VulnerabilityInput,
    top_k: int,
    repo_root: Path,
) -> List[CodeChunk]:
    """
    Retrieves the most relevant code chunks for vulnerability analysis with detailed logging.

    Args:
        vector_store: The vector store containing code chunks
        vulnerability: Vulnerability to analyze
        top_k: Number of chunks to retrieve from vector search
        repo_root: Root path of the repository (for path validation)

    Returns:
        List of code chunks selected for analysis (limited to MAX_CHUNKS_FOR_ANALYSIS)
    """
    logger.info("STARTING CHUNK RETRIEVAL")
    logger.info("=" * 60)
    logger.info(f"Parameters: top_k={top_k}")
    logger.info(f"Max chunks for analysis: {settings.MAX_CHUNKS_FOR_ANALYSIS}")
    logger.info(f"Vulnerability: {vulnerability.name}")

    logger.info("\nSTEP 1: QUERY CONSTRUCTION (LLM-EXPANDED)")
    logger.info("-" * 30)

    query_start = time.time()
    query = expand_query_with_llm(vulnerability)
    query_time = time.time() - query_start

    logger.info(f"Query construction completed in {query_time:.3f} seconds")
    logger.info(f"Final query for vector search: '{query}'")

    logger.info("\nSTEP 2: VECTOR SIMILARITY SEARCH")
    logger.info("-" * 30)

    logger.info(f"Searching for top {top_k} similar code chunks...")
    search_start = time.time()

    try:
        similar_chunks = vector_store.search(query, top_k)
        search_time = time.time() - search_start

        logger.info(f"Vector search completed in {search_time:.3f} seconds")
        logger.info(f"Retrieved {len(similar_chunks)} chunks")

    except Exception as e:
        logger.error(f"Vector search failed: {str(e)}")
        logger.exception("Full error details:")
        return []

    if not similar_chunks:
        logger.warning("No similar chunks found")
        return []

    logger.info("Retrieved chunks details:")
    chunk_types = Counter(chunk.chunk_type.value for chunk in similar_chunks)
    chunk_languages = Counter(chunk.language for chunk in similar_chunks if chunk.language)
    
    logger.info("  Chunk types:")
    for chunk_type, count in chunk_types.most_common():
        logger.info(f"    - {chunk_type}: {count}")
    
    logger.info("  Languages:")
    for lang, count in chunk_languages.most_common():
        logger.info(f"    - {lang}: {count}")

    # Show first few chunks
    logger.info("  First few chunks:")
    for i, chunk in enumerate(similar_chunks[:5]):
        logger.info(f"    [{i+1}] {chunk.symbol_name or 'unnamed'} in {chunk.file_path.name}")
        logger.info(f"        Type: {chunk.chunk_type.value}, Lines: {chunk.start_line}-{chunk.end_line}")

    # STEP 3: Path validation and remapping
    logger.info("\nSTEP 3: PATH VALIDATION AND REMAPPING")
    logger.info("-" * 30)

    logger.info("Validating chunk file paths...")

    valid_chunks = []
    for chunk in similar_chunks:
        # If the file_path doesn't exist, attempt to remap it to the current repo_root
        candidate_path = chunk.file_path
        if not candidate_path.exists():
            # Try to rebuild the path by stripping the old extraction prefix
            base_name = repo_root.name  # e.g. 'transformers-main'
            if base_name in candidate_path.parts:
                rel_index = candidate_path.parts.index(base_name) + 1
                relative_subpath = Path(*candidate_path.parts[rel_index:])
                remapped_path = repo_root / relative_subpath
                if remapped_path.exists():
                    # Update the chunk's file_path
                    chunk.file_path = remapped_path
                    candidate_path = remapped_path

        # Final existence check
        if candidate_path.exists() and candidate_path.is_file():
            valid_chunks.append(chunk)
        else:
            logger.warning(f"Invalid or missing file for chunk: {candidate_path}")

    logger.info(f"Returning {len(valid_chunks)} valid chunks")
    if len(similar_chunks) - len(valid_chunks) > 0:
        logger.warning(
            f"{len(similar_chunks) - len(valid_chunks)} chunks were invalid and skipped"
        )

    # STEP 4: Apply analysis limit to prevent token overflow
    logger.info("\nSTEP 4: APPLYING ANALYSIS LIMIT")
    logger.info("-" * 30)
    
    if len(valid_chunks) > settings.MAX_CHUNKS_FOR_ANALYSIS:
        logger.warning(f"Limiting chunks from {len(valid_chunks)} to {settings.MAX_CHUNKS_FOR_ANALYSIS} to prevent token overflow")
        # Keep the most relevant chunks (already sorted by similarity)
        limited_chunks = valid_chunks[:settings.MAX_CHUNKS_FOR_ANALYSIS]
        logger.info("Chunks being kept:")
        for i, chunk in enumerate(limited_chunks):
            logger.info(f"  [{i+1}] {chunk.symbol_name or 'unnamed'} in {chunk.file_path.name} (lines {chunk.start_line}-{chunk.end_line})")
        
        logger.info("Chunks being dropped:")
        for i, chunk in enumerate(valid_chunks[settings.MAX_CHUNKS_FOR_ANALYSIS:]):
            logger.info(f"  [dropped] {chunk.symbol_name or 'unnamed'} in {chunk.file_path.name} (lines {chunk.start_line}-{chunk.end_line})")
        
        valid_chunks = limited_chunks

    # Final summary
    logger.info("\nFINAL SELECTION SUMMARY")
    logger.info("-" * 30)

    total_tokens = sum(chunk.tokens_count for chunk in valid_chunks)
    files_represented = len(set(chunk.file_path for chunk in valid_chunks))

    logger.info(f"Selected chunks: {len(valid_chunks)}")
    logger.info(f"Total tokens: {total_tokens}")
    logger.info(f"Files represented: {files_represented}")

    return valid_chunks
