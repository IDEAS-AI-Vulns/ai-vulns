"""
Memory usage utilities.
"""
import logging
import os

logger = logging.getLogger(__name__)

def get_memory_usage_mb() -> float:
    """Get current memory usage in MB."""
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024**2)
    except ImportError:
        logger.warning("psutil not available, cannot get memory usage")
        return 0


def get_memory_usage_gb() -> float:
    """Get current memory usage in GB."""
    return get_memory_usage_mb() / 1024


def check_memory_limit(limit_gb: float = None) -> bool:
    """Check if we're approaching memory limit.
    
    Returns:
        True if memory limit is exceeded (should stop processing)
        False if memory usage is within limits (can continue)
    """
    if limit_gb is None:
        try:
            from ..core.config import settings
            limit_gb = settings.MEMORY_LIMIT_GB
        except ImportError:
            limit_gb = 16.0  # Default fallback
    
    current_memory = get_memory_usage_gb()
    
    if current_memory > limit_gb * 0.8:  # 80% threshold
        logger.warning(f"High memory usage: {current_memory:.2f}GB / {limit_gb}GB limit")
        return True  # LIMIT EXCEEDED - should stop processing
    
    return False  # Memory usage is fine - can continue processing
