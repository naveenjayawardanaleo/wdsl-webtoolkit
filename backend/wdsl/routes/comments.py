"""Task 3: Collaboration Hub.

Three role-gated actions on a report's comment thread:
  - client opens a new top-level thread
  - developer replies to an open thread
  - the client who owns the thread (or an admin) closes it
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from ..extensions import db
from ..models import Comment, Report

comments_bp = Blueprint("comments", __name__)


def _project_ids_for(user_id, role):
    from ..models import Project

    if role == "admin":
        return None
    if role == "developer":
        rows = Project.query.filter_by(developer_id=user_id).all()
    else:
        rows = Project.query.filter_by(client_id=user_id).all()
    return {p.project_id for p in rows}


def _assert_report_access(report, user_id, role):
    project_ids = _project_ids_for(user_id, role)
    return project_ids is None or report.project_id in project_ids


@comments_bp.route("/reports/<int:report_id>/comments", methods=["GET"])
@jwt_required()
def list_comments(report_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "report not found"}), 404
    if not _assert_report_access(report, user_id, role):
        return jsonify({"error": "forbidden"}), 403

    comments = Comment.query.filter_by(report_id=report_id).order_by(Comment.created_at.asc()).all()
    roots = [c for c in comments if c.parent_comment_id is None]
    by_parent = {}
    for c in comments:
        if c.parent_comment_id is not None:
            by_parent.setdefault(c.parent_comment_id, []).append(c)

    def build(node):
        data = node.to_dict()
        data["replies"] = [build(child) for child in by_parent.get(node.comment_id, [])]
        return data

    return jsonify([build(r) for r in roots])


@comments_bp.route("/reports/<int:report_id>/comments", methods=["POST"])
@jwt_required()
def open_comment(report_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    if role != "client":
        return jsonify({"error": "only a client can open a new comment thread"}), 403

    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "report not found"}), 404
    if not _assert_report_access(report, user_id, role):
        return jsonify({"error": "forbidden"}), 403

    text = (request.get_json(silent=True) or {}).get("comment_text", "").strip()
    if not text:
        return jsonify({"error": "comment_text is required"}), 400

    comment = Comment(report_id=report_id, user_id=user_id, comment_text=text, status="open")
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201


@comments_bp.route("/comments/<int:comment_id>/replies", methods=["POST"])
@jwt_required()
def reply_to_comment(comment_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    if role != "developer":
        return jsonify({"error": "only a developer can reply to a comment thread"}), 403

    parent = Comment.query.get(comment_id)
    if not parent:
        return jsonify({"error": "comment not found"}), 404
    if parent.parent_comment_id is not None:
        return jsonify({"error": "replies must target the thread's top-level comment"}), 400
    if parent.status != "open":
        return jsonify({"error": "cannot reply to a closed thread"}), 400

    report = Report.query.get(parent.report_id)
    if not _assert_report_access(report, user_id, role):
        return jsonify({"error": "forbidden"}), 403

    text = (request.get_json(silent=True) or {}).get("comment_text", "").strip()
    if not text:
        return jsonify({"error": "comment_text is required"}), 400

    reply = Comment(
        report_id=parent.report_id,
        user_id=user_id,
        parent_comment_id=parent.comment_id,
        comment_text=text,
        status="open",
    )
    db.session.add(reply)
    db.session.commit()
    return jsonify(reply.to_dict()), 201


@comments_bp.route("/comments/<int:comment_id>/close", methods=["PATCH"])
@jwt_required()
def close_thread(comment_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({"error": "comment not found"}), 404
    if comment.parent_comment_id is not None:
        return jsonify({"error": "only the top-level comment of a thread can be closed"}), 400

    is_owning_client = role == "client" and comment.user_id == user_id
    if not (is_owning_client or role == "admin"):
        return jsonify({"error": "only the client who opened this thread or an admin can close it"}), 403

    comment.status = "closed"
    db.session.commit()
    return jsonify(comment.to_dict())
