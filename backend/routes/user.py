from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User

user_bp = Blueprint("user", __name__)


def _user_json(user: User):
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name or "",
        "calendar_embed": user.calendar_embed or "",
    }


@user_bp.get("")
@jwt_required()
def get_user():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    return jsonify({"user": _user_json(user)})


@user_bp.put("")
@jwt_required()
def update_user():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    if "display_name" in data:
        user.display_name = (data.get("display_name") or "").strip()
    if "calendar_embed" in data:
        user.calendar_embed = data.get("calendar_embed") or ""
    db.session.commit()
    return jsonify({"user": _user_json(user)})
