from pathlib import Path
from typing import List
import logging

# Updated import for new structure
from ..core.config import settings

logger = logging.getLogger(__name__)


def discover_source_files(repo_dir: Path) -> List[Path]:
    """
    Discovers source files in the repository based on configured file filter.
    Now supports filtering by file type to focus analysis.
    """
    logger.info("DISCOVERING SOURCE FILES")
    logger.info("=" * 40)
    logger.info(f"Repository directory: {repo_dir}")
    logger.info(f"Directory exists: {repo_dir.exists()}")

    if repo_dir.exists():
        logger.info(f"Directory contents (first 10 items):")
        try:
            items = list(repo_dir.iterdir())[:10]
            for item in items:
                logger.info(f"  {item.name} ({'dir' if item.is_dir() else 'file'})")
        except Exception as e:
            logger.error(f"Could not list directory contents: {e}")

    allowed_extensions = settings.get_allowed_extensions()
    filter_mode = settings.FILE_FILTER_MODE

    # Directories to exclude (only truly irrelevant: build artifacts, version control, caches)
    excluded_dirs = {
        "node_modules",
        "venv",
        "env",
        ".venv",
        ".env",
        "dist",
        "build",
        "target",
        "bin",
        "obj",
        "out",
        ".git",
        ".svn",
        ".hg",
        "__pycache__",
        ".pytest_cache",
        ".mypy_cache",
        ".idea",
        ".vscode",
        ".vs",
        "temp",
        "tmp",
        "cache",
        ".cache",
    }

    logger.info(f"File filter mode: {filter_mode}")
    logger.info(f"Allowed extensions: {allowed_extensions}")
    logger.info(f"Excluded directories: {len(excluded_dirs)} patterns")

    # Check if we should limit files for testing
    max_files = settings.MAX_FILES_FOR_TESTING
    if max_files > 0:
        logger.info(f"Testing mode: limiting to {max_files} files maximum")

    source_files = []
    all_files_found = 0
    filtered_files = 0
    excluded_by_dir = 0
    extension_mismatches = 0

    # Walk through all files in the repository
    for file_path in repo_dir.rglob("*"):
        if file_path.is_file():
            all_files_found += 1

            # Debug: log first few files found
            if all_files_found <= 20:
                logger.info(
                    f"  Found file: {file_path.relative_to(repo_dir)} (ext: {file_path.suffix})"
                )

            # Check if file is in an excluded directory
            # Only check relative path parts within the repository
            relative_path = file_path.relative_to(repo_dir)
            relative_parts = set(relative_path.parts)
            excluded_intersection = relative_parts.intersection(excluded_dirs)
            if excluded_intersection:
                excluded_by_dir += 1
                if excluded_by_dir <= 10:  # Log first few exclusions
                    logger.info(
                        f"  Excluded by dir: {relative_path} (matched: {excluded_intersection})"
                    )
                continue

            # Check if file extension is allowed
            if file_path.suffix.lower() in allowed_extensions:
                source_files.append(file_path)
                filtered_files += 1
                if filtered_files <= 10:  # Log first few matches
                    logger.info(f"  Matched: {relative_path}")

                # Check if we've reached the testing limit
                if max_files > 0 and len(source_files) >= max_files:
                    logger.info(
                        f"Reached testing limit of {max_files} files, stopping discovery"
                    )
                    break
            else:
                extension_mismatches += 1

    logger.info(f"File discovery summary:")
    logger.info(f"  Total files found: {all_files_found}")
    logger.info(f"  Excluded by directory: {excluded_by_dir}")
    logger.info(f"  Extension mismatches: {extension_mismatches}")
    logger.info(f"  Matching filter ({filter_mode}): {filtered_files}")
    logger.info(f"  Final result: {len(source_files)} files")

    # Log some examples of found files
    if source_files:
        logger.info("Sample files found:")
        for file_path in source_files[:5]:
            logger.info(f"  {file_path.relative_to(repo_dir)}")
        if len(source_files) > 5:
            logger.info(f"  ... and {len(source_files) - 5} more files")
    else:
        logger.warning("NO FILES FOUND! This might be a configuration issue.")

    return source_files
