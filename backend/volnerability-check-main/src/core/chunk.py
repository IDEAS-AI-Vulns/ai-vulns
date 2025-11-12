from pathlib import Path
from typing import List, Optional, Dict, Any
from enum import Enum as PyEnum
import logging
import time
import gc
import os

from pydantic import BaseModel

# Import progress utilities from shared module
from ..utils.progress import tqdm, TQDM_AVAILABLE


# Try to import psutil for memory monitoring
try:
    import psutil

    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

# Set up detailed logging for chunking
logger = logging.getLogger(__name__)


# Memory usage functions moved to utils.memory for shared use
from ..utils.memory import get_memory_usage_mb, get_memory_usage_gb, check_memory_limit


class ChunkType(str, PyEnum):
    """Types of code chunks for hierarchical organization."""

    FUNCTION = "function"
    METHOD = "method"
    CLASS = "class"
    FILE = "file"
    MODULE = "module"
    LINES = "lines"  # fallback line-based chunks


class CodeChunk(BaseModel):
    file_path: Path
    content: str
    start_line: int
    end_line: int

    language: Optional[str] = None
    symbol_name: Optional[str] = None
    chunk_type: ChunkType = ChunkType.LINES
    parent_symbol: Optional[str] = None
    tokens_count: int = 0
    chars_count: int = 0
    context_before: Optional[str] = None
    context_after: Optional[str] = None
    complexity_score: float = 0.0
    imports: List[str] = []
    dependencies: List[str] = []
    priority_score: float = 5.0


def chunk_file_by_lines(
    file_path: Path, window_size: int = 20, overlap: int = 5
) -> List[CodeChunk]:
    """Chunks a file into overlapping line-based windows."""
    from .config import settings
    
    if not settings.REDUCE_CHUNKING_LOGS:
        logger.info(f"LINE-BASED CHUNKING: {file_path.name}")
        logger.info(f"  Parameters: window_size={window_size}, overlap={overlap}")

    chunks = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        if not settings.REDUCE_CHUNKING_LOGS:
            logger.info(f"  File read: {len(lines)} lines")
    except Exception as e:
        if not settings.REDUCE_CHUNKING_LOGS:
            logger.warning(f"  Failed to read file: {e}")
        return []

    if not lines:
        if not settings.REDUCE_CHUNKING_LOGS:
            logger.warning("  File is empty")
        return []

    start_line = 0
    step = window_size - overlap
    chunk_count = 0

    while start_line < len(lines):
        end_line_idx = min(start_line + window_size, len(lines))
        content = "".join(lines[start_line:end_line_idx])

        context_before = ""
        context_after = ""
        if start_line > 0:
            context_start = max(0, start_line - overlap)
            context_before = "".join(lines[context_start:start_line])

        if end_line_idx < len(lines):
            context_end = min(len(lines), end_line_idx + overlap)
            context_after = "".join(lines[end_line_idx:context_end])

        chunks.append(
            CodeChunk(
                file_path=file_path,
                content=content,
                start_line=start_line + 1,
                end_line=end_line_idx,
                chunk_type=ChunkType.LINES,
                chars_count=len(content),
                context_before=context_before if context_before else None,
                context_after=context_after if context_after else None,
            )
        )
        start_line += step
        chunk_count += 1

    if not settings.REDUCE_CHUNKING_LOGS:
        logger.info(f"  Created {chunk_count} line-based chunks")
    return chunks


def chunk_source_files(
    file_paths: List[Path],
) -> List[CodeChunk]:
    """
    Processes a list of files and chunks them using advanced strategies with detailed logging.
    Uses AST-based chunking where possible, falls back to line-based chunking.
    Includes resource optimization to prevent memory issues.
    """
    from .config import settings
    from concurrent.futures import ThreadPoolExecutor, as_completed
    import threading

    logger.info("STARTING ADVANCED CODE CHUNKING")
    logger.info("=" * 60)
    logger.info(f"Processing {len(file_paths)} files")
    logger.info(f"Optimization settings:")
    logger.info(f"  - Subdivision: {'enabled' if settings.ENABLE_CHUNK_SUBDIVISION else 'disabled'}")
    logger.info(f"  - Max chunks per file: {settings.MAX_CHUNKS_PER_FILE}")
    logger.info(f"  - Parallel workers: {settings.CHUNKING_PARALLEL_WORKERS}")
    logger.info(f"  - Reduced logging: {settings.REDUCE_CHUNKING_LOGS}")

    # Memory monitoring
    initial_memory = get_memory_usage_mb()
    logger.info(f"Initial memory usage: {initial_memory:.1f}MB")
    print(f"Processing {len(file_paths)} files for chunking... (Memory: {initial_memory:.1f}MB)")

    # Filter files by size and line count with warnings
    valid_files = []
    oversized_files = []
    large_line_files = []
    warning_files = []
    max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    warn_size_bytes = settings.WARN_FILE_SIZE_MB * 1024 * 1024

    for file_path in file_paths:
        try:
            # Check file size first
            file_size = file_path.stat().st_size
            file_size_mb = file_size / (1024 * 1024)
            
            if file_size > max_size_bytes:
                oversized_files.append((file_path, file_size_mb))
                if not settings.REDUCE_CHUNKING_LOGS:
                    logger.debug(f"Skipping oversized file: {file_path.name} ({file_size_mb:.1f}MB)")
                continue
            
            # Check line count if limit is set
            line_count = 0
            if settings.MAX_FILE_LINES > 0:
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        line_count = sum(1 for _ in f)
                    
                    if line_count > settings.MAX_FILE_LINES:
                        large_line_files.append((file_path, line_count))
                        if not settings.REDUCE_CHUNKING_LOGS:
                            logger.debug(f"Skipping large file: {file_path.name} ({line_count} lines)")
                        continue
                        
                except Exception as e:
                    if not settings.REDUCE_CHUNKING_LOGS:
                        logger.debug(f"Could not count lines in {file_path.name}: {e}")
                    # Continue with file if we can't count lines
            
            # Check for warnings (large but not oversized files)
            should_warn = False
            warn_reason = []
            
            if file_size > warn_size_bytes:
                should_warn = True
                warn_reason.append(f"{file_size_mb:.1f}MB")
                
            if line_count > settings.WARN_FILE_LINES:
                should_warn = True
                warn_reason.append(f"{line_count} lines")
            
            if should_warn:
                warning_files.append((file_path, " + ".join(warn_reason)))
            
            valid_files.append(file_path)
            
        except Exception as e:
            logger.warning(f"Could not check file {file_path}: {e}")
            valid_files.append(file_path)  # Include if we can't check

    # Log filtered and warning files
    if oversized_files:
        logger.info(f"Filtered out {len(oversized_files)} oversized files (>{settings.MAX_FILE_SIZE_MB}MB)")
        print(f"⚠️  Skipped {len(oversized_files)} files larger than {settings.MAX_FILE_SIZE_MB}MB:")
        for file_path, file_size_mb in oversized_files[:3]:
            print(f"  - {file_path.name}: {file_size_mb:.1f}MB")
        if len(oversized_files) > 3:
            print(f"  ... and {len(oversized_files) - 3} more files")
        
    if large_line_files:
        logger.info(f"Filtered out {len(large_line_files)} files with too many lines (>{settings.MAX_FILE_LINES} lines)")
        print(f"⚠️  Skipped {len(large_line_files)} files with more than {settings.MAX_FILE_LINES} lines:")
        for file_path, line_count in large_line_files[:3]:
            print(f"  - {file_path.name}: {line_count} lines")
        if len(large_line_files) > 3:
            print(f"  ... and {len(large_line_files) - 3} more files")
            
    if warning_files:
        logger.info(f"Warning: {len(warning_files)} unusually large files (will be processed)")
        print(f"📋 Large files being processed (>{settings.WARN_FILE_SIZE_MB*1000}KB or >{settings.WARN_FILE_LINES} lines):")
        for file_path, reason in warning_files[:5]:
            print(f"  - {file_path.name}: {reason}")
        if len(warning_files) > 5:
            print(f"  ... and {len(warning_files) - 5} more large files")

    # Import here to avoid circular imports
    from .ast_chunker import ASTChunker

    all_chunks = []
    ast_chunker = ASTChunker()

    # Statistics tracking
    stats = {
        "total_files": len(file_paths),
        "valid_files": len(valid_files),
        "oversized_files": len(oversized_files),
        "large_line_files": len(large_line_files),
        "warning_files": len(warning_files),
        "processed_files": 0,
        "failed_files": 0,
        "ast_successful": 0,
        "fallback_used": 0,
        "total_chunks": 0,
        "total_tokens": 0,
    }

    # Thread-safe counter for progress tracking
    progress_lock = threading.Lock()
    
    def process_single_file(file_path: Path) -> tuple:
        """Process a single file and return (file_path, chunks, success_type)."""
        try:
            language = detect_language(file_path)
            if not language:
                return file_path, [], "failed"

            if not settings.REDUCE_CHUNKING_LOGS:
                logger.info(f"PROCESSING FILE: {file_path.name}")
                logger.info(f"    Path: {file_path}")
                logger.info(f"    Detected language: {language}")
                logger.info(f"    Attempting AST-based chunking...")

            # Try AST-based chunking first
            try:
                file_chunks = ast_chunker.chunk_file(file_path, language)
                if file_chunks:
                    if not settings.REDUCE_CHUNKING_LOGS:
                        logger.info(f"    AST chunking successful: {len(file_chunks)} chunks")
                    return file_path, file_chunks, "ast"
                else:
                    if not settings.REDUCE_CHUNKING_LOGS:
                        logger.warning(f"    AST chunking returned no chunks")
            except Exception as e:
                if not settings.REDUCE_CHUNKING_LOGS:
                    logger.warning(f"    AST chunking failed: {e}")

            # Fallback to line-based chunking
            if not settings.REDUCE_CHUNKING_LOGS:
                logger.info(f"    Falling back to line-based chunking...")
            
            file_chunks = chunk_file_by_lines(file_path)
            if file_chunks:
                if not settings.REDUCE_CHUNKING_LOGS:
                    logger.info(f"    Line-based chunking successful: {len(file_chunks)} chunks")
                return file_path, file_chunks, "fallback"
            else:
                if not settings.REDUCE_CHUNKING_LOGS:
                    logger.warning(f"    Line-based chunking also failed")
                return file_path, [], "failed"

        except Exception as e:
            logger.error(f"Failed to process file {file_path}: {e}")
            return file_path, [], "failed"

    # Process files with progress tracking
    if settings.CHUNKING_PARALLEL_WORKERS > 1:
        # Parallel processing
        logger.info(f"Using {settings.CHUNKING_PARALLEL_WORKERS} parallel workers")
        
        with ThreadPoolExecutor(max_workers=settings.CHUNKING_PARALLEL_WORKERS) as executor:
            # Submit all tasks
            future_to_file = {executor.submit(process_single_file, file_path): file_path 
                             for file_path in valid_files}
            
            # Process results with progress bar
            progress_bar = (
                tqdm(total=len(valid_files), desc="Chunking files", unit="file")
                if TQDM_AVAILABLE else None
            )
            
            for future in as_completed(future_to_file):
                file_path, chunks, success_type = future.result()
                
                with progress_lock:
                    stats["processed_files"] += 1
                    
                    if success_type == "ast":
                        stats["ast_successful"] += 1
                    elif success_type == "fallback":
                        stats["fallback_used"] += 1
                    else:
                        stats["failed_files"] += 1
                    
                    if chunks:
                        all_chunks.extend(chunks)
                        stats["total_chunks"] += len(chunks)
                        stats["total_tokens"] += sum(chunk.tokens_count for chunk in chunks)
                    
                    if progress_bar:
                        progress_bar.set_postfix({
                            "file": file_path.name[:15] + "..." if len(file_path.name) > 15 else file_path.name,
                            "ast": stats["ast_successful"],
                            "fallback": stats["fallback_used"],
                            "failed": stats["failed_files"],
                            "mem": f"{get_memory_usage_mb():.0f}MB"
                        })
                        progress_bar.update(1)
                        
                # Memory check
                if check_memory_limit():
                    logger.warning("Memory limit reached, stopping chunking")
                    break
                    
                # Check total chunks limit
                if settings.MAX_TOTAL_CHUNKS > 0 and len(all_chunks) >= settings.MAX_TOTAL_CHUNKS:
                    logger.warning(f"Reached maximum chunks limit ({settings.MAX_TOTAL_CHUNKS}), stopping")
                    break
            
            if progress_bar:
                progress_bar.close()
    else:
        # Sequential processing (original logic)
        progress_bar = (
            tqdm(valid_files, desc="Chunking files", unit="file")
            if TQDM_AVAILABLE else valid_files
        )

        for file_index, file_path in enumerate(progress_bar, 1):
            # Memory check
            if check_memory_limit():
                logger.warning("Memory limit reached, stopping chunking early")
                break

            # Check total chunks limit
            if settings.MAX_TOTAL_CHUNKS > 0 and len(all_chunks) >= settings.MAX_TOTAL_CHUNKS:
                logger.warning(f"Reached maximum chunks limit ({settings.MAX_TOTAL_CHUNKS}), stopping early")
                break

            file_path, chunks, success_type = process_single_file(file_path)
            
            stats["processed_files"] += 1
            
            if success_type == "ast":
                stats["ast_successful"] += 1
            elif success_type == "fallback":
                stats["fallback_used"] += 1
            else:
                stats["failed_files"] += 1
            
            if chunks:
                all_chunks.extend(chunks)
                stats["total_chunks"] += len(chunks)
                stats["total_tokens"] += sum(chunk.tokens_count for chunk in chunks)

            # Update progress bar
            if TQDM_AVAILABLE and hasattr(progress_bar, 'set_postfix'):
                progress_bar.set_postfix({
                    "file": file_path.name[:15] + "..." if len(file_path.name) > 15 else file_path.name,
                    "ast": stats["ast_successful"],
                    "fallback": stats["fallback_used"],
                    "failed": stats["failed_files"],
                    "mem": f"{get_memory_usage_mb():.0f}MB"
                })

    # Final memory check
    final_memory = get_memory_usage_mb()
    memory_delta = final_memory - initial_memory

    # Final statistics
    logger.info("\nCHUNKING COMPLETION SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Total input files: {stats['total_files']}")
    logger.info(f"Filtered out: {stats['oversized_files']} oversized, {stats['large_line_files']} too many lines")
    logger.info(f"Large files (warnings): {stats['warning_files']}")
    logger.info(f"Valid files: {stats['valid_files']}")
    logger.info(f"Files processed: {stats['processed_files']}/{stats['valid_files']}")
    logger.info(f"AST successful: {stats['ast_successful']}")
    logger.info(f"Fallback used: {stats['fallback_used']}")
    logger.info(f"Failed: {stats['failed_files']}")
    logger.info(f"Total chunks created: {len(all_chunks)}")
    logger.info(f"Total tokens: {stats['total_tokens']:,}")
    logger.info(f"Average chunks per file: {len(all_chunks) / max(1, stats['processed_files']):.1f}")
    logger.info(f"Memory usage: {final_memory:.1f}MB (delta: +{memory_delta:.1f}MB)")

    # Console summary
    print(f"Chunking completed: {len(all_chunks)} chunks from {stats['processed_files']}/{stats['total_files']} files")
    if stats['oversized_files'] > 0 or stats['large_line_files'] > 0:
        print(f"Filtered out: {stats['oversized_files']} oversized + {stats['large_line_files']} large files")
    if stats['warning_files'] > 0:
        print(f"Large files processed: {stats['warning_files']}")
    print(f"Success rate: AST={stats['ast_successful']}, Fallback={stats['fallback_used']}, Failed={stats['failed_files']}")
    print(f"Memory: {final_memory:.1f}MB (+{memory_delta:.1f}MB)")

    return all_chunks


def detect_language(file_path: Path) -> Optional[str]:
    """Detect programming language from file extension with logging."""
    extension_to_language = {
        # All languages now supported via tree-sitter-language-pack
        ".py": "python",
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".java": "java",
        ".go": "go",
        ".c": "c",
        ".h": "c",
        ".cpp": "cpp",
        ".cc": "cpp",
        ".cxx": "cpp",
        ".hpp": "cpp",
        ".hxx": "cpp",
        ".cs": "c_sharp",
        ".rs": "rust",
        ".kt": "kotlin",
        ".rb": "ruby",
        ".php": "php",
        ".scala": "scala",
        ".swift": "swift",
        ".dart": "dart",
        ".sh": "bash",
        ".bash": "bash",
        ".zsh": "bash",
        ".lua": "lua",
        ".r": "r",
        ".R": "r",
        ".sql": "sql",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".json": "json",
        ".xml": "xml",
        ".html": "html",
        ".css": "css",
        ".scss": "scss",
        ".sass": "sass",
        ".vue": "vue",
        ".svelte": "svelte",
    }

    extension = file_path.suffix.lower()
    language = extension_to_language.get(extension)

    if language:
        logger.debug(f"{file_path.name}: {extension} -> {language}")
    else:
        logger.debug(f"{file_path.name}: {extension} -> unknown")

    return language
