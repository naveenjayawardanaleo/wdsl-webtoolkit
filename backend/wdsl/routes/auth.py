import bcrypt
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from ..auth_utils import is_valid_email, is_valid_password
from ..extensions import db
from ..models import Subscription, User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    role = payload.get("role") or ""

    if not is_valid_email(email):
        return jsonify({"error": "A valid email is required"}), 400
    if not is_valid_password(password):
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if role not in ("developer", "client"):
        return jsonify({"error": "role must be 'developer' or 'client' (admin accounts are seeded)"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(email=email, password_hash=password_hash, role=role)
    db.session.add(user)
    db.session.flush()

    db.session.add(Subscription(user_id=user.user_id, status="inactive"))
    db.session.commit()

    token = create_access_token(identity=str(user.user_id), additional_claims={"role": user.role})
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.user_id), additional_claims={"role": user.role})
    return jsonify({"token": token, "user": user.to_dict()})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict())
