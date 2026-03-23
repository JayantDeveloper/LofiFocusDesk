import { useState } from "react";
import {
  TODO_DIFFICULTY_OPTIONS,
  DIFFICULTY_XP,
  TODO_STATUS_OPTIONS,
} from "../../../../constants/todoBoardConstants";

const STATUS_PILL = {
  "Not Started": { background: "#2a2a2a", color: "#888882" },
  "In Progress":  { background: "#1c3050", color: "#5b9bd5" },
  "Done":         { background: "#1a3320", color: "#58a65c" },
};

const DIFFICULTY_PILL = {
  "Easy":      { background: "#1c2e48", color: "#5b9bd5" },
  "Medium":    { background: "#3a2e06", color: "#c9920c" },
  "Hard":      { background: "#3a1e06", color: "#d97530" },
  "Very Hard": { background: "#3a0a0a", color: "#c94040" },
};

export function BoardItem({
  item,
  isDragging,
  onDelete,
  onChange,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    if (!name) return;
    onChange(item.id, name, value);
  }

  const xp = DIFFICULTY_XP[item.difficulty] ?? 25;
  const statusStyle = STATUS_PILL[item.status ?? "Not Started"] ?? STATUS_PILL["Not Started"];
  const difficultyStyle = DIFFICULTY_PILL[item.difficulty] ?? DIFFICULTY_PILL["Easy"];

  return (
    <div
      className={`focus-board-item ${isDragging ? "dragging" : ""}`}
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(item.id)}
      onDragEnd={onDragEnd}
    >
      <div className="focus-board-item-row">
        <input
          className={`focus-board-item-title-input${isExpanded ? " expanded" : ""}`}
          name="title"
          value={item.title}
          placeholder="Task name…"
          onChange={handleChange}
          onDoubleClick={() => setIsExpanded((p) => !p)}
          title="Double-click to expand"
        />

        <select
          className="focus-board-item-status-select"
          name="status"
          value={item.status ?? "Not Started"}
          onChange={handleChange}
          data-status={item.status ?? "Not Started"}
          style={statusStyle}
        >
          {TODO_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="focus-board-item-difficulty-input"
          name="difficulty"
          value={item.difficulty}
          onChange={handleChange}
          data-difficulty={item.difficulty}
          style={difficultyStyle}
        >
          {TODO_DIFFICULTY_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        <span className="focus-board-xp-badge">✨ {xp}</span>

        <button
          className="focus-board-delete-button"
          onClick={() => onDelete(item.id)}
          type="button"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
