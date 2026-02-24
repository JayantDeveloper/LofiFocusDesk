from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, PomodoroState

pomodoro_bp = Blueprint("pomodoro", __name__)


def _state_json(state: PomodoroState):
    return state.data if state else {}


@pomodoro_bp.get("")
@jwt_required()
def get_state():
    uid = get_jwt_identity()
    state = PomodoroState.query.filter_by(user_id=uid).first()
    return jsonify({"state": _state_json(state)})


@pomodoro_bp.put("")
@jwt_required()
def put_state():
    uid = get_jwt_identity()
    data = request.get_json() or {}
    state = PomodoroState.query.filter_by(user_id=uid).first()
    if not state:
        state = PomodoroState(user_id=uid, data=data)
        db.session.add(state)
    else:
        state.data = data
    db.session.commit()
    return jsonify({"state": _state_json(state)})
