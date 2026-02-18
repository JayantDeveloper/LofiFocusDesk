import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "focusdesk-board-todo-items";

function createItemId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useBoardTodoItems() {
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [items, setItems] = useState(() => {
    try {
      const savedItems = window.localStorage.getItem(STORAGE_KEY);
      if (!savedItems) {
        return [];
      }

      const parsed = JSON.parse(savedItems);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item) => ({
        ...item,
        difficulty: item.difficulty || "Easy",
        done: item.done ?? false,
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const deleteItem = useCallback((idToDelete) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== idToDelete));
  }, []);

  const updateItem = useCallback((idToUpdate, fieldName, value) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === idToUpdate ? { ...item, [fieldName]: value } : item,
      ),
    );
  }, []);

  const addItem = useCallback(() => {
    setItems((prevItems) => [
      ...prevItems,
      {
        id: createItemId(),
        title: "",
        content: "",
        difficulty: "Easy",
        done: false,
      },
    ]);
  }, []);

  const removeDoneItems = useCallback(() => {
    setItems((prevItems) => prevItems.filter((item) => item.done !== true));
  }, []);

  const handleDragStart = useCallback((id) => {
    setDraggedItemId(id);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((targetId) => {
    if (!draggedItemId || draggedItemId === targetId) {
      return;
    }

    setItems((prevItems) => {
      const fromIndex = prevItems.findIndex((item) => item.id === draggedItemId);
      const toIndex = prevItems.findIndex((item) => item.id === targetId);
      if (fromIndex === -1 || toIndex === -1) {
        return prevItems;
      }

      const reordered = [...prevItems];
      const [movedItem] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, movedItem);
      return reordered;
    });
  }, [draggedItemId]);

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
  }, []);

  return useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
}
