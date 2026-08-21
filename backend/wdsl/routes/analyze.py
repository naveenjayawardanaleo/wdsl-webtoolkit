import base64
import uuid
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

from ..auth_utils import roles_required
from ..extensions import db
from ..models import Project, Report, Subscription, Violation
from ..services import ai_suggestions, annotate, cv_model, lighthouse
from ..services.scanner import capture_and_scan, compute_accessibility_score, normalize_url, summarize_violations

analyze_bp = Blueprint("analyze", __name__)


def _save_screenshot(screenshot_bytes, suffix=""):
    storage_dir = Path(current_app.config["SCREENSHOT_DIR"])
    storage_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{suffix}.png"
    path = storage_dir / filename
    path.write_bytes(screenshot_bytes)
    return str(path)


@analyze_bp.route("/analyze", methods=["POST"])
@roles_required("developer")
def analyze():
    payload = request.get_json(silent=True) or {}
    raw_url = payload.get("url")
    project_id = payload.get("project_id")
    project_name = payload.get("project_name")
    client_id = payload.get("client_id")
    client_email = payload.get("client_email")

    if not raw_url or not raw_url.strip():
        return jsonify({"error": "url is required"}), 400

    url = normalize_url(raw_url)
    if url is None:
        return jsonify({"error": "invalid url"}), 400

    developer_id = int(get_jwt_identity())

    if project_id:
        project = Project.query.filter_by(project_id=project_id, developer_id=developer_id).first()
        if not project:
            return jsonify({"error": "project not found for this developer"}), 404
    else:
        if not client_id and client_email:
            from ..models import User

            client = User.query.filter_by(email=client_email.strip().lower(), role="client").first()
            if not client:
                return jsonify({"error": f"no client account found for {client_email}"}), 404
            client_id = client.user_id

        if not project_name or not client_id:
            return jsonify({"error": "project_id, or project_name + (client_id or client_email), is required"}), 400
        project = Project(project_name=project_name, developer_id=developer_id, client_id=client_id)
        db.session.add(project)
        db.session.flush()

    try:
        screenshot_bytes, axe_response = capture_and_scan(url)
    except PlaywrightTimeoutError:
        return jsonify({"error": f"Timed out loading {url}"}), 504
    except PlaywrightError as exc:
        message = str(exc).split("\nCall log:")[0].strip()
        return jsonify({"error": f"Could not load {url}: {message}"}), 502
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Unexpected error loading {url}: {exc}"}), 500

    try:
        cv_prediction = cv_model.classify_screenshot(screenshot_bytes)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"CV classification failed: {exc}"}), 500

    violations = summarize_violations(axe_response)
    accessibility_score = compute_accessibility_score(violations)
    screenshot_path = _save_screenshot(screenshot_bytes)

    annotated_bytes = annotate.annotate_screenshot(screenshot_bytes, violations)
    annotated_path = _save_screenshot(annotated_bytes, suffix="_annotated")

    lighthouse_result = lighthouse.run_lighthouse(url)

    # Freemium model (per the project proposal): the scan itself, the axe
    # report, the score, and the screenshot are free for every developer.
    # AI-generated suggestions are the paid feature, gated on the
    # developer's own subscription status.
    sub = Subscription.query.filter_by(user_id=developer_id).first()
    if sub and sub.status == "active":
        suggestions = ai_suggestions.generate_suggestions(violations)
    else:
        suggestions = {
            "technical": [],
            "plain_language": [],
            "generated_by": "premium_required",
        }

    report = Report(
        project_id=project.project_id,
        url=url,
        screenshot_path=screenshot_path,
        annotated_screenshot_path=annotated_path,
        accessibility_score=accessibility_score,
        cv_prediction=cv_prediction["class"],
        cv_confidence=cv_prediction["confidence"],
        axe_violations=violations,
        lighthouse_result=lighthouse_result,
        ai_suggestions=suggestions,
    )
    db.session.add(report)
    db.session.flush()

    for v in violations:
        first_element = (v.get("affected_elements") or [{}])[0]
        db.session.add(
            Violation(
                report_id=report.report_id,
                axe_id=v.get("id"),
                impact=v.get("impact"),
                description=v.get("description"),
                help_url=v.get("help_url"),
                target_selector=first_element.get("selector"),
            )
        )
    db.session.commit()

    screenshot_b64 = base64.b64encode(screenshot_bytes).decode("ascii")
    annotated_b64 = base64.b64encode(annotated_bytes).decode("ascii")

    return jsonify(
        {
            "report_id": report.report_id,
            "project_id": project.project_id,
            "url": url,
            "screenshot": f"data:image/png;base64,{screenshot_b64}",
            "annotated_screenshot": f"data:image/png;base64,{annotated_b64}",
            "axe_results": {
                "violations": violations,
                "violations_count": len(violations),
                "passes_count": len(axe_response.get("passes", [])),
            },
            "lighthouse_result": lighthouse_result,
            "cv_prediction": cv_prediction,
            "accessibility_score": accessibility_score,
            "ai_suggestions": suggestions,
            "created_at": report.created_at.isoformat(),
        }
    )
