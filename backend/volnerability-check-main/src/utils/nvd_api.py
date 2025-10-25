import requests
import logging
import time
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Legal notice as required by NVD Terms of Use
logger.info("This product uses the NVD API but is not endorsed or certified by the NVD.")

BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"

# Rate limiting: Track last request time
_last_request_time = 0
_request_interval_with_key = 0.6  # ~1.67 requests/second (safe for 50 req/30s limit)
_request_interval_no_key = 6.0   # ~10 requests/minute (safe for 5 req/30s limit)

def _validate_cve_id(cve_id: str) -> bool:
    """Validates CVE ID format (CVE-YYYY-NNNNN)."""
    import re
    pattern = r'^CVE-\d{4}-\d{4,}$'
    return bool(re.match(pattern, cve_id))

def get_cve_details(cve_id: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetches detailed information for a single CVE from the NVD API v2.0.
    
    This function implements proper rate limiting and error handling for the NVD API.
    Rate limits: 5 requests/30s (no key) or 50 requests/30s (with key).

    Args:
        cve_id: The CVE identifier (e.g., "CVE-2024-12798"). Must follow CVE format.
        api_key: An optional NVD API key for higher rate limits.

    Returns:
        A dictionary containing the parsed and structured CVE details including:
        - id: CVE identifier
        - description: English description
        - cvss_v31: CVSS v3.1 metrics if available
        - vulnerable_configurations: Affected versions/products
        - weaknesses: CWE classifications
        - published_date: Publication date
        - last_modified_date: Last modification date
        
        Returns an empty dictionary if the CVE is not found or an error occurs.
    """
    if not _validate_cve_id(cve_id):
        logger.error(f"Invalid CVE ID format: {cve_id}. Expected format: CVE-YYYY-NNNNN")
        return {}
    
    logger.info(f"Fetching details for {cve_id} from NVD API v2.0")
    
    # Rate limiting with different intervals based on API key availability
    global _last_request_time
    current_time = time.time()
    time_since_last = current_time - _last_request_time
    
    # Use appropriate rate limit based on API key availability
    request_interval = _request_interval_with_key if api_key else _request_interval_no_key
    
    if time_since_last < request_interval:
        sleep_time = request_interval - time_since_last
        logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
        time.sleep(sleep_time)
    
    _last_request_time = time.time()
    
    params = {"cveId": cve_id}
    headers = {"apiKey": api_key} if api_key else {}
    
    # Log API key status for debugging
    if api_key:
        logger.debug(f"Using NVD API key (rate limit: 50 req/30s, interval: {_request_interval_with_key}s)")
    else:
        logger.debug(f"No NVD API key - using public limits (rate limit: 5 req/30s, interval: {_request_interval_no_key}s)")
    
    try:
        response = requests.get(BASE_URL, params=params, headers=headers, timeout=30)
        
        # Enhanced error handling
        if response.status_code == 429:
            logger.warning(f"NVD API rate limit exceeded for {cve_id}. Consider getting an API key or increasing delays.")
            return {}
        elif response.status_code == 403:
            logger.error(f"NVD API access forbidden for {cve_id}. Check API key validity.")
            return {}
        elif response.status_code == 404:
            logger.warning(f"CVE {cve_id} not found in NVD database.")
            return {}
        
        response.raise_for_status()
        data = response.json()
        
        if not data.get("vulnerabilities"):
            logger.warning(f"No vulnerability data found for {cve_id} in NVD response.")
            return {}
            
        cve_data = data["vulnerabilities"][0]["cve"]
        return _parse_cve_response(cve_data)
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching NVD data for {cve_id}: {e}")
        return {}
    except (KeyError, IndexError) as e:
        logger.error(f"Error parsing NVD response for {cve_id}: Invalid structure - {e}")
        return {}

def _parse_cve_response(cve: Dict[str, Any]) -> Dict[str, Any]:
    """Parses the raw CVE JSON from NVD into a structured fact sheet."""
    
    # Extract English description
    description = "No English description available."
    for desc in cve.get("descriptions", []):
        if desc.get("lang") == "en":
            description = desc.get("value", description)
            break
            
    # Extract CVSS v3.1 metrics
    cvss_metrics = {}
    if "metrics" in cve and "cvssMetricV31" in cve["metrics"]:
        metric = cve["metrics"]["cvssMetricV31"][0]
        cvss_data = metric.get("cvssData", {})
        cvss_metrics = {
            "version": cvss_data.get("version"),
            "vector": cvss_data.get("vectorString"),
            "baseScore": cvss_data.get("baseScore"),
            "baseSeverity": cvss_data.get("baseSeverity"),
            "exploitabilityScore": metric.get("exploitabilityScore"),
            "impactScore": metric.get("impactScore"),
        }

    # Extract vulnerable configurations and version ranges
    configurations = []
    for config_node in cve.get("configurations", []):
        for node in config_node.get("nodes", []):
            if node.get("operator") == "OR":
                for cpe_match in node.get("cpeMatch", []):
                    if cpe_match.get("vulnerable"):
                        config_info = {
                            "criteria": cpe_match.get("criteria"),
                            "versionStartIncluding": cpe_match.get("versionStartIncluding"),
                            "versionEndIncluding": cpe_match.get("versionEndIncluding"),
                            "versionStartExcluding": cpe_match.get("versionStartExcluding"),
                            "versionEndExcluding": cpe_match.get("versionEndExcluding"),
                        }
                        configurations.append({k: v for k, v in config_info.items() if v is not None})
    
    # Extract CWEs
    weaknesses = []
    for weakness in cve.get("weaknesses", []):
        for desc in weakness.get("description", []):
            if desc.get("lang") == "en":
                weaknesses.append(desc.get("value"))

    return {
        "id": cve.get("id"),
        "description": description,
        "cvss_v31": cvss_metrics,
        "vulnerable_configurations": configurations,
        "weaknesses": weaknesses,
        "published_date": cve.get("published"),
        "last_modified_date": cve.get("lastModified"),
    }
