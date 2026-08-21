import re
from urllib.parse import urlparse

from axe_playwright_python.sync_playwright import Axe
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

IMPACT_WEIGHTS = {"critical": 10, "serious": 6, "moderate": 3, "minor": 1}

# host[:port], where host is a dotted hostname, "localhost", or an IPv4 address
_HOST_RE = re.compile(
    r"^(localhost|(\d{1,3}\.){3}\d{1,3}|[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+)"
    r"(:\d{1,5})?$"
)

_axe = Axe()


def normalize_url(raw_url):
    raw_url = (raw_url or "").strip()
    if not raw_url or re.search(r"\s", raw_url):
        return None

    parsed = urlparse(raw_url)
    if not parsed.scheme:
        parsed = urlparse(f"https://{raw_url}")
    if not parsed.netloc or not _HOST_RE.match(parsed.netloc):
        return None
    if parsed.scheme not in ("http", "https"):
        return None
    return parsed.geturl()


def capture_and_scan(url):
    """Load the page, screenshot it, run axe-core, and grab a bounding box
    for each violation's first affected element while the page is still open
    (needed later to draw annotations on the screenshot)."""
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1366, "height": 900})
        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
            screenshot_bytes = page.screenshot(full_page=True, type="png")
            axe_response = _axe.run(page).response

            for violation in axe_response.get("violations", []):
                for node in violation.get("nodes", []):
                    target = node.get("target")
                    selector = target[0] if isinstance(target, list) and target else None
                    node["_selector"] = selector
                    node["_bounding_box"] = None
                    if selector:
                        try:
                            locator = page.locator(selector).first
                            node["_bounding_box"] = locator.bounding_box(timeout=2000)
                        except Exception:
                            node["_bounding_box"] = None
        finally:
            browser.close()
    return screenshot_bytes, axe_response


def summarize_violations(axe_response):
    violations = []
    for violation in axe_response.get("violations", []):
        nodes = violation.get("nodes", [])
        violations.append(
            {
                "id": violation.get("id"),
                "impact": violation.get("impact"),
                "description": violation.get("description"),
                "help": violation.get("help"),
                "help_url": violation.get("helpUrl"),
                "tags": violation.get("tags", []),
                "affected_elements": [
                    {
                        "target": node.get("target"),
                        "html": node.get("html"),
                        "fix_summary": node.get("failureSummary"),
                        "bounding_box": node.get("_bounding_box"),
                        "selector": node.get("_selector"),
                    }
                    for node in nodes[:5]
                ],
                "node_count": len(nodes),
            }
        )
    return violations


def compute_accessibility_score(violations):
    penalty = sum(IMPACT_WEIGHTS.get(v["impact"], 2) for v in violations)
    return max(0, min(100, 100 - penalty))
