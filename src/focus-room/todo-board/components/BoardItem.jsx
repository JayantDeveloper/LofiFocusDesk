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
        <textarea
          className="focus-board-item-content-input"
          name="content"
          value={item.content}
          placeholder="Task details..."
          rows="1"
          onChange={handleChange}
        />
        <select
          className="focus-board-item-difficulty-input"
          name="difficulty"
          value={item.difficulty}
          onChange={handleChange}
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <button className="focus-board-delete-button" onClick={() => onDelete(item.id)}>
          🗑️
        </button>
      </div>
    </div>
  );
}
