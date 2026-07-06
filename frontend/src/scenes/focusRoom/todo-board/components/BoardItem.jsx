import { useState } from "react";
import {
  TODO_DIFFICULTY_OPTIONS,
  DIFFICULTY_XP,
  TODO_STATUS_OPTIONS,
} from "../../../../constants/todoBoardConstants";

const STATUS_PILL = {
  "Not Started": { background: "#e9dfcc", color: "#8a7a60" },
  "In Progress":  { background: "#dbe6f2", color: "#46688f" },
  "Done":         { background: "#dcead2", color: "#587f45" },
};

const DIFFICULTY_PILL = {
  "Easy":      { background: "#dbe6f2", color: "#46688f" },
  "Medium":    { background: "#f4e6c4", color: "#96700f" },
  "Hard":      { background: "#f6dcc4", color: "#a3571d" },
  "Very Hard": { background: "#f4d2cc", color: "#9c3126" },
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
          autoFocus={String(item.id).startsWith("optimistic-task-")}
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
