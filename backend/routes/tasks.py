from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task

ALLOWED_DIFFICULTY = {"Easy", "Medium", "Hard"}

tasks_bp = Blueprint("tasks", __name__)


def _task_json(task: Task):
  return {
    "id": task.id,
    "title": task.title,
    "difficulty": task.difficulty,
    "done": task.done,
    "position": task.position,
  }


@tasks_bp.get("")
@jwt_required()
def list_tasks():
  uid = get_jwt_identity()
  tasks = Task.query.filter_by(user_id=uid).order_by(Task.position, Task.id).all()
  return jsonify({"tasks": [_task_json(t) for t in tasks]})


@tasks_bp.post("")
@jwt_required()
def create_task():
  uid = get_jwt_identity()
  data = request.get_json() or {}
  title = (data.get("title") or "").strip()
  difficulty = data.get("difficulty") or "Easy"
  if difficulty not in ALLOWED_DIFFICULTY:
    difficulty = "Easy"
  max_pos = db.session.query(db.func.max(Task.position)).filter_by(user_id=uid).scalar() or 0
  task = Task(user_id=uid, title=title, difficulty=difficulty, done=bool(data.get("done")), position=max_pos + 1)
  db.session.add(task)
  db.session.commit()
  return jsonify({"task": _task_json(task)}), 201


@tasks_bp.patch("/<int:task_id>")
@jwt_required()
def update_task(task_id):
  uid = get_jwt_identity()
  task = Task.query.filter_by(id=task_id, user_id=uid).first()
  if not task:
    return jsonify({"error": "Not found"}), 404
  data = request.get_json() or {}
  if "title" in data:
    task.title = (data.get("title") or "").strip()
  if "difficulty" in data:
    diff = data.get("difficulty")
    if diff in ALLOWED_DIFFICULTY:
      task.difficulty = diff
  if "done" in data:
    task.done = bool(data.get("done"))
  if "position" in data:
    try:
      task.position = int(data.get("position"))
    except Exception:
      pass
  db.session.commit()
  return jsonify({"task": _task_json(task)})


@tasks_bp.delete("/<int:task_id>")
@jwt_required()
def delete_task(task_id):
  uid = get_jwt_identity()
  task = Task.query.filter_by(id=task_id, user_id=uid).first()
  if not task:
    return jsonify({"error": "Not found"}), 404
  db.session.delete(task)
  db.session.commit()
  return jsonify({"ok": True})
