from flask import Blueprint, jsonify, request

from ..auth_utils import roles_required
from ..extensions import db
from ..models import Project, Report, Subscription, User

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/users", methods=["GET"])
@roles_required("admin")
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@admin_bp.route("/users/<int:user_id>/subscription", methods=["PATCH"])
@roles_required("admin")
def set_subscription(user_id):
    payload = request.get_json(silent=True) or {}
    new_status = payload.get("status")
    if new_status not in ("active", "inactive"):
        return jsonify({"error": "status must be 'active' or 'inactive'"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    sub = Subscription.query.filter_by(user_id=user_id).first()
    if not sub:
        sub = Subscription(user_id=user_id, status=new_status)
        db.session.add(sub)
    else:
        sub.status = new_status
    db.session.commit()
    return jsonify({"user_id": user_id, "subscription_status": sub.status})


@admin_bp.route("/overview", methods=["GET"])
@roles_required("admin")
def usage_overview():
    return jsonify(
        {
            "users_count": User.query.count(),
            "developers_count": User.query.filter_by(role="developer").count(),
            "clients_count": User.query.filter_by(role="client").count(),
            "active_subscriptions": Subscription.query.filter_by(status="active").count(),
            "projects_count": Project.query.count(),
            "reports_count": Report.query.count(),
        }
    )
