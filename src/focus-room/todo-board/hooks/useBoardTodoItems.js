import { useCallback, useEffect, useMemo, useState } from "react";
import { BOARD_STORAGE_KEY, TODO_DIFFICULTY_OPTIONS } from "../constants";

const EDITABLE_FIELDS = new Set(["title", "difficulty", "done"]);

function normalizeDifficulty(value) {
  return TODO_DIFFICULTY_OPTIONS.includes(value) ? value : "Easy";
}

function normalizeItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const id = typeof item.id === "string" && item.id.length > 0 ? item.id : createItemId();
  const title = typeof item.title === "string" ? item.title : "";

  return {
    id,
    title,
    difficulty: normalizeDifficulty(item.difficulty),
    done: item.done === true,
  };
}

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
      const savedItems = window.localStorage.getItem(BOARD_STORAGE_KEY);
      if (!savedItems) {
        return [];
      }

      const parsed = JSON.parse(savedItems);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item) => normalizeItem(item)).filter(Boolean);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const deleteItem = useCallback((idToDelete) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== idToDelete));
  }, []);

  const updateItem = useCallback((idToUpdate, fieldName, value) => {
    if (!EDITABLE_FIELDS.has(fieldName)) {
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === idToUpdate
          ? {
              ...item,
              [fieldName]:
                fieldName === "difficulty"
                  ? normalizeDifficulty(value)
                  : fieldName === "done"
                    ? value === true
                    : String(value),
            }
          : item,
      ),
    );
  }, []);

  const addItem = useCallback(() => {
    setItems((prevItems) => [
      ...prevItems,
      {
        id: createItemId(),
        title: "",
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
