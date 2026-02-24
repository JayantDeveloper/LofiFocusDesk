from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from models import db, User

bcrypt = Bcrypt()
auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(username=username, password_hash=pw_hash, display_name=username)
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": _user_json(user)})


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    remember = bool(data.get("remember"))
    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401
    token = create_access_token(identity=str(user.id), expires_delta=None if remember else None)
    return jsonify({"token": token, "user": _user_json(user)})


@auth_bp.post("/logout")
@jwt_required()
def logout():
    # Client can just drop token; stateless JWT.
    return jsonify({"ok": True})


@auth_bp.get("/me")
@jwt_required(optional=True)
def me():
    uid = get_jwt_identity()
    if not uid:
        return jsonify({"user": None})
    user = User.query.get(uid)
    return jsonify({"user": _user_json(user) if user else None})


def _user_json(user: User):
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "calendar_embed": user.calendar_embed or "",
    }
