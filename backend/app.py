import base64
import io
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import torch
import torch.nn as nn
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright
from torchvision import models, transforms

from axe_playwright_python.sync_playwright import Axe
import json

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "AImodels" / "wdsl_cv_finetuned.pth"
CLASS_MAPPING_PATH = BASE_DIR / "AImodels" / "class_mapping.json"

IMPACT_WEIGHTS = {"critical": 10, "serious": 6, "moderate": 3, "minor": 1}

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

IMAGE_TRANSFORM = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)

app = Flask(__name__)
CORS(app)

_model = None
_classes = None
_axe = Axe()


def load_model():
    global _model, _classes

    with open(CLASS_MAPPING_PATH, "r", encoding="utf-8") as f:
        class_mapping = json.load(f)
    _classes = [class_mapping[str(i)] for i in range(len(class_mapping))]

    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
    num_classes = checkpoint.get("num_classes", len(_classes))

    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(DEVICE)
    model.eval()

    _model = model


def normalize_url(raw_url):
    raw_url = raw_url.strip()
    parsed = urlparse(raw_url)
    if not parsed.scheme:
        parsed = urlparse(f"https://{raw_url}")
    if not parsed.netloc:
        return None
    if parsed.scheme not in ("http", "https"):
        return None
    return parsed.geturl()


def capture_and_scan(url):
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1366, "height": 900})
        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
            screenshot_bytes = page.screenshot(full_page=True, type="png")
            axe_response = _axe.run(page).response
        finally:
            browser.close()
    return screenshot_bytes, axe_response


def classify_screenshot(screenshot_bytes):
    image = Image.open(io.BytesIO(screenshot_bytes)).convert("RGB")
    tensor = IMAGE_TRANSFORM(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = _model(tensor)
        probabilities = torch.softmax(logits, dim=1)[0]
        confidence, predicted_idx = torch.max(probabilities, dim=0)

    return {
        "class": _classes[predicted_idx.item()],
        "confidence": round(confidence.item() * 100, 2),
        "all_probabilities": {
            _classes[i]: round(p.item() * 100, 2) for i, p in enumerate(probabilities)
        },
    }


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


@app.route("/")
def health_check():
    return jsonify(
        {
            "status": "ok",
            "service": "WDSL WebToolkit backend",
            "model_loaded": _model is not None,
        }
    )


@app.route("/api/analyze", methods=["POST"])
def analyze():
    payload = request.get_json(silent=True) or {}
    raw_url = payload.get("url")
    if not raw_url or not raw_url.strip():
        return jsonify({"error": "url is required"}), 400

    url = normalize_url(raw_url)
    if url is None:
        return jsonify({"error": "invalid url"}), 400

    try:
        screenshot_bytes, axe_response = capture_and_scan(url)
    except PlaywrightTimeoutError:
        return jsonify({"error": f"Timed out loading {url}"}), 504
    except PlaywrightError as exc:
        message = str(exc).split("\nCall log:")[0].strip()
        return jsonify({"error": f"Could not load {url}: {message}"}), 502
    except Exception as exc:
        return jsonify({"error": f"Unexpected error loading {url}: {exc}"}), 500

    try:
        cv_prediction = classify_screenshot(screenshot_bytes)
    except Exception as exc:
        return jsonify({"error": f"CV classification failed: {exc}"}), 500

    violations = summarize_violations(axe_response)
    accessibility_score = compute_accessibility_score(violations)
    screenshot_b64 = base64.b64encode(screenshot_bytes).decode("ascii")

    return jsonify(
        {
            "url": url,
            "screenshot": f"data:image/png;base64,{screenshot_b64}",
            "axe_results": {
                "violations": violations,
                "violations_count": len(violations),
                "passes_count": len(axe_response.get("passes", [])),
            },
            "cv_prediction": cv_prediction,
            "accessibility_score": accessibility_score,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


load_model()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
