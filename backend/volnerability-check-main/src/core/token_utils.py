import re
import math
from typing import Optional

try:
    import tiktoken

    TIKTOKEN_AVAILABLE = True
except ImportError:
    TIKTOKEN_AVAILABLE = False


def count_tokens(text: str, model: str = "gpt-3.5-turbo") -> int:
    """
    Count tokens in text using tiktoken if available, otherwise estimate.
    Uses OpenAI's tokenization which is good for embedding models.
    """
    if not text.strip():
        return 0

    if TIKTOKEN_AVAILABLE:
        try:
            encoding = tiktoken.encoding_for_model(model)
            return len(encoding.encode(text))
        except Exception:
            # Fall back to estimation if tiktoken fails
            pass

    # Estimation: roughly 4 characters per token for code
    # This is a conservative estimate based on empirical observations
    return max(1, len(text) // 4)


def estimate_tokens_from_lines(num_lines: int, avg_line_length: int = 50) -> int:
    """Estimate token count from number of lines and average line length."""
    total_chars = num_lines * avg_line_length
    return max(1, total_chars // 4)


def estimate_complexity(code: str) -> float:
    """
    Estimate code complexity using basic metrics.
    Returns a score from 0.0 to 10.0 where higher means more complex.
    """
    if not code.strip():
        return 0.0

    lines = [line.strip() for line in code.split("\n") if line.strip()]
    if not lines:
        return 0.0

    # Base metrics
    num_lines = len(lines)
    num_functions = count_patterns(
        code,
        [
            r"\bdef\s+\w+\s*\(",  # Python functions
            r"\bfunction\s+\w+\s*\(",  # JS functions
            r"\b\w+\s*\([^)]*\)\s*\{",  # C-style functions
            r"\bpublic\s+\w+\s+\w+\s*\(",  # Java methods
        ],
    )

    # Control flow complexity
    control_patterns = [
        r"\bif\b",
        r"\belse\b",
        r"\belif\b",
        r"\bfor\b",
        r"\bwhile\b",
        r"\btry\b",
        r"\bcatch\b",
        r"\bswitch\b",
        r"\bcase\b",
        r"\b\?\s*:",
        r"\b&&\b",
        r"\b\|\|\b",
    ]
    control_complexity = count_patterns(code, control_patterns)

    # Nesting complexity (rough estimate based on indentation)
    max_nesting = 0
    for line in lines:
        if line:
            # Count leading whitespace as proxy for nesting
            leading_spaces = len(line) - len(line.lstrip())
            nesting_level = leading_spaces // 4  # Assume 4-space indentation
            max_nesting = max(max_nesting, nesting_level)

    # Loop and recursion indicators
    loop_patterns = [r"\bfor\b", r"\bwhile\b", r"\bdo\b"]
    loop_complexity = count_patterns(code, loop_patterns)

    # Calculate overall complexity
    base_score = min(2.0, num_lines / 20)  # Base complexity from length
    function_score = min(2.0, num_functions * 0.5)  # Multiple functions add complexity
    control_score = min(3.0, control_complexity * 0.2)  # Control flow complexity
    nesting_score = min(2.0, max_nesting * 0.3)  # Nesting complexity
    loop_score = min(1.0, loop_complexity * 0.3)  # Loop complexity

    total_score = (
        base_score + function_score + control_score + nesting_score + loop_score
    )
    return min(10.0, total_score)


def count_patterns(text: str, patterns: list[str]) -> int:
    """Count occurrences of regex patterns in text."""
    total = 0
    for pattern in patterns:
        try:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            total += len(matches)
        except re.error:
            # Skip invalid patterns
            continue
    return total


def should_split_chunk(
    chunk_content: str, max_tokens: int = 300, max_lines: int = 50
) -> bool:
    """
    Determine if a chunk should be split into smaller pieces.

    Args:
        chunk_content: The content to evaluate
        max_tokens: Maximum allowed tokens
        max_lines: Maximum allowed lines

    Returns:
        True if the chunk should be split
    """
    if not chunk_content.strip():
        return False

    token_count = count_tokens(chunk_content)
    line_count = len([line for line in chunk_content.split("\n") if line.strip()])

    return token_count > max_tokens or line_count > max_lines


def calculate_optimal_overlap(
    chunk_size: int, min_overlap: int = 3, max_overlap: int = 10
) -> int:
    """
    Calculate optimal overlap size based on chunk size.

    Args:
        chunk_size: Size of the chunk in lines
        min_overlap: Minimum overlap in lines
        max_overlap: Maximum overlap in lines

    Returns:
        Optimal overlap size in lines
    """
    # Use 15-20% of chunk size as overlap, with min/max bounds
    overlap_ratio = 0.15
    optimal_overlap = int(chunk_size * overlap_ratio)

    return max(min_overlap, min(max_overlap, optimal_overlap))


def get_chunk_priority_score(chunk_content: str, chunk_type: str) -> float:
    """
    Calculate a priority score for a chunk based on its likely importance.
    Higher scores indicate more important chunks.

    Args:
        chunk_content: The content of the chunk
        chunk_type: Type of chunk (function, class, file, etc.)

    Returns:
        Priority score (0.0 to 10.0)
    """
    if not chunk_content.strip():
        return 0.0

    base_score = 5.0  # Default score

    # Type-based scoring
    type_bonuses = {
        "class": 2.0,
        "function": 1.5,
        "method": 1.5,
        "file": 1.0,
        "lines": 0.5,
    }
    base_score += type_bonuses.get(chunk_type, 0.0)

    # Content-based indicators
    security_keywords = [
        "password",
        "auth",
        "token",
        "key",
        "secret",
        "crypto",
        "hash",
        "validate",
        "sanitize",
        "escape",
        "permission",
        "access",
        "login",
        "session",
        "cookie",
        "cors",
        "csrf",
        "xss",
        "sql",
        "injection",
    ]

    network_keywords = [
        "request",
        "response",
        "http",
        "api",
        "endpoint",
        "server",
        "client",
        "socket",
        "connection",
        "url",
        "uri",
        "fetch",
        "ajax",
        "curl",
    ]

    data_keywords = [
        "database",
        "query",
        "insert",
        "update",
        "delete",
        "select",
        "model",
        "schema",
        "migration",
        "serialize",
        "deserialize",
    ]

    # Count security-related keywords (higher priority for vulnerability analysis)
    content_lower = chunk_content.lower()
    security_score = sum(1 for keyword in security_keywords if keyword in content_lower)
    network_score = sum(1 for keyword in network_keywords if keyword in content_lower)
    data_score = sum(1 for keyword in data_keywords if keyword in content_lower)

    # Apply bonuses
    base_score += min(3.0, security_score * 0.5)  # Security code is high priority
    base_score += min(2.0, network_score * 0.3)  # Network code is medium-high priority
    base_score += min(1.5, data_score * 0.3)  # Data handling is medium priority

    # Complexity bonus (more complex code might be more interesting)
    complexity = estimate_complexity(chunk_content)
    if complexity > 5.0:
        base_score += min(1.0, (complexity - 5.0) * 0.2)

    return min(10.0, base_score)


def optimize_chunk_size_for_embedding(
    content: str, target_tokens: int = 256
) -> tuple[str, bool]:
    """
    Optimize chunk content for embedding by truncating if necessary.

    Args:
        content: Original content
        target_tokens: Target token count

    Returns:
        Tuple of (optimized_content, was_truncated)
    """
    current_tokens = count_tokens(content)

    if current_tokens <= target_tokens:
        return content, False

    # Truncate by lines, preserving structure
    lines = content.split("\n")
    truncated_lines = []
    current_size = 0

    for line in lines:
        line_tokens = count_tokens(line + "\n")
        if current_size + line_tokens > target_tokens:
            break
        truncated_lines.append(line)
        current_size += line_tokens

    # Ensure we have at least some content
    if not truncated_lines and lines:
        # Take at least the first line, even if it exceeds target
        truncated_lines = [lines[0]]

    optimized_content = "\n".join(truncated_lines)
    return optimized_content, True
