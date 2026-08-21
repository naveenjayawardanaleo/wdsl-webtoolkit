"""Task 4: run Google Lighthouse alongside the axe-core scan.

Lighthouse itself is a Node package (there is no maintained pure-Python
port), so this shells out to automation/run_lighthouse.js, which launches
its own headless Chrome via chrome-launcher independently of the
Playwright browser used for the axe-core scan and screenshot.
"""

import json
import logging
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

AUTOMATION_DIR = Path(__file__).resolve().parent.parent.parent.parent / "automation"
RUNNER_SCRIPT = AUTOMATION_DIR / "run_lighthouse.js"


def run_lighthouse(url, timeout=60):
    if not RUNNER_SCRIPT.exists():
        return {"error": "Lighthouse runner not installed (run `npm install` in automation/)"}

    try:
        result = subprocess.run(
            ["node", str(RUNNER_SCRIPT), url],
            cwd=str(AUTOMATION_DIR),
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        stdout = (result.stdout or "").strip()
        if stdout:
            return json.loads(stdout)
        return {"error": (result.stderr or "Lighthouse produced no output").strip()}
    except subprocess.TimeoutExpired:
        return {"error": f"Lighthouse timed out after {timeout}s"}
    except Exception as exc:  # noqa: BLE001 - Lighthouse failures must not break the analyze request
        logger.warning("Lighthouse run failed: %s", exc)
        return {"error": str(exc)}
