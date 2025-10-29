"""
Progress bar utilities.
"""

try:
    from tqdm import tqdm
    TQDM_AVAILABLE = True
except ImportError:
    def tqdm(iterable, *args, **kwargs):
        """Fallback when tqdm is not available."""
        return iterable
    TQDM_AVAILABLE = False
