from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from ..auth_utils import roles_required
from ..extensions import db
from ..models import Project, Report, Violation

reports_bp = Blueprint("reports", __name__)


def _accessible_project_ids(user_id, role):
    if role == "admin":
        return None  # sentinel meaning "no restriction"
    if role == "developer":
        rows = Project.query.filter_by(developer_id=user_id).all()
    else:
        rows = Project.query.filter_by(client_id=user_id).all()
    return {p.project_id for p in rows}


@reports_bp.route("/projects", methods=["GET"])
@jwt_required()
def list_projects():
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    if role == "developer":
        projects = Project.query.filter_by(developer_id=user_id).all()
    elif role == "client":
        projects = Project.query.filter_by(client_id=user_id).all()
    else:
        projects = Project.query.all()
    return jsonify([p.to_dict() for p in projects])


@reports_bp.route("/reports", methods=["GET"])
@jwt_required()
def list_reports():
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    project_ids = _accessible_project_ids(user_id, role)

    query = Report.query
    if project_ids is not None:
        if not project_ids:
            return jsonify([])
        query = query.filter(Report.project_id.in_(project_ids))

    include_technical = role in ("developer", "admin")
    reports = query.order_by(Report.created_at.desc()).all()
    return jsonify([r.to_dict(include_technical=include_technical) for r in reports])


@reports_bp.route("/reports/<int:report_id>", methods=["GET"])
@jwt_required()
def get_report(report_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "report not found"}), 404

    project_ids = _accessible_project_ids(user_id, role)
    if project_ids is not None and report.project_id not in project_ids:
        return jsonify({"error": "forbidden"}), 403

    include_technical = role in ("developer", "admin")
    return jsonify(report.to_dict(include_technical=include_technical))


@reports_bp.route("/violations/<int:violation_id>/status", methods=["PATCH"])
@roles_required("developer", "admin")
def update_violation_status(violation_id):
    payload = request.get_json(silent=True) or {}
    new_status = payload.get("status")
    if new_status not in ("todo", "in_progress", "completed"):
        return jsonify({"error": "status must be one of todo, in_progress, completed"}), 400

    violation = Violation.query.get(violation_id)
    if not violation:
        return jsonify({"error": "violation not found"}), 404

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    project_ids = _accessible_project_ids(user_id, role)
    if project_ids is not None and violation.report.project_id not in project_ids:
        return jsonify({"error": "forbidden"}), 403

    violation.status = new_status
    db.session.commit()
    return jsonify(violation.to_dict())
