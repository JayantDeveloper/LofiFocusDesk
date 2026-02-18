import { BoardItem } from "./components/BoardItem";
import { BoardPomodoro } from "./components/BoardPomodoro";
import { useBoardTodoItems } from "./hooks/useBoardTodoItems";
import "./FocusTodoBoardApp.css";

export function FocusTodoBoardApp({ boardPomodoro, boardTodo }) {
  const localBoardTodo = useBoardTodoItems();
  const resolvedBoardTodo = boardTodo ?? localBoardTodo;
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
  } = resolvedBoardTodo;

  const year = new Date().getFullYear();

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
            Done
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
