import { TODO_DIFFICULTY_OPTIONS } from "../constants";

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
  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    const fieldName = name || (type === "checkbox" ? "done" : "");
    const fieldValue = type === "checkbox" ? checked : value;
    if (!fieldName) {
      return;
    }
    onChange(item.id, fieldName, fieldValue);
  }

  return (
    <div
      className={`focus-board-item ${isDragging ? "dragging" : ""}`}
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(item.id)}
      onDragEnd={onDragEnd}
    >
      <div className="focus-board-item-fields-row">
        <input type="checkbox" name="done" checked={item.done} onChange={handleChange} />
        <input
          className="focus-board-item-title-input"
          name="title"
          value={item.title}
          placeholder="Title"
          onChange={handleChange}
        />
        <select
          className="focus-board-item-difficulty-input"
          name="difficulty"
          value={item.difficulty}
          onChange={handleChange}
        >
          {TODO_DIFFICULTY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button className="focus-board-delete-button" onClick={() => onDelete(item.id)} type="button">
          🗑️
        </button>
      </div>
    </div>
  );
}
