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
    removeDoneItems,
    updateItem,
  } = boardTodo;

  const year = new Date().getFullYear();
  const selectedItemsCount = items.reduce((count, item) => count + (item.done ? 1 : 0), 0);

  return (
    <div className="focus-board-app">
      <section className="focus-board-shell">
        <header className="focus-board-navbar">
          <h1>To Do List</h1>
        </header>

        <main className="focus-board-items-section">
          {items.length === 0 ? (
            <p className="focus-board-empty-state">No tasks yet. Add your first item.</p>
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
          <button className="focus-board-done-button" onClick={removeDoneItems}>
            <span>Done With Task</span>
            {selectedItemsCount > 0 && (
              <span className="focus-board-done-count">
                ({selectedItemsCount} {selectedItemsCount === 1 ? "Item" : "Items"} selected)
              </span>
            )}
          </button>
          <button className="focus-board-add-button" onClick={addItem}>
            Add Item
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
