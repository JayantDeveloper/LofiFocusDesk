import { BoardItem } from "./components/BoardItem";
import { BoardPomodoro } from "./components/BoardPomodoro";
import "./FocusTodoBoardApp.css";

export function FocusTodoBoardApp({ boardPomodoro, boardTodo }) {
  if (!boardTodo) {
    return (
      <div
        className="focus-board-screen-shell bulletin-board-screen"
        style={{ display: "grid", placeItems: "center", color: "#5a3b24", fontFamily: "Avenir Next, Trebuchet MS, sans-serif" }}
      >
        Loading board...
      </div>
    );
  }

  const {
    addItem,
    deleteItem,
    draggedItemId,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    handleDrop,
    items,
    updateItem,
  } = boardTodo;

  const year = new Date().getFullYear();

  return (
    <div className="focus-board-app">
      <section className="focus-board-shell">
        <header className="focus-board-navbar">
          <h1>To Do List</h1>
        </header>

        <div className="focus-board-table-header">
          <span>Task Name</span>
          <span>Status</span>
          <span>Difficulty</span>
          <span>XP</span>
          <span></span>
        </div>

        <main className="focus-board-items-section">
          {items.length === 0 ? (
            <p className="focus-board-empty-state">
              Nothing on the board yet.
              <br />
              Hit &quot;+ Add Item&quot; below, give it a name, and get to work.
            </p>
          ) : (
            items.map((item) => (
              <BoardItem
                key={item.id}
                item={item}
                isDragging={draggedItemId === item.id}
                onDelete={deleteItem}
                onChange={updateItem}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            ))
          )}
        </main>

        <div className="focus-board-action-row">
          <button className="focus-board-add-button" onClick={addItem}>
            + Add Item
          </button>
        </div>

        <footer className="focus-board-footer">Created {year}.</footer>
      </section>

      <aside className="focus-board-right-pane">
        <BoardPomodoro pomodoro={boardPomodoro} />
      </aside>
    </div>
  );
}
