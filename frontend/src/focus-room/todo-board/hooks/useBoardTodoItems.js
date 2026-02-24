import { useCallback, useEffect, useMemo, useState } from "react";
import { TODO_DIFFICULTY_OPTIONS } from "../constants";
import { useAuth } from "../../../auth/AuthContext";
import { apiRequest } from "../../../api/client";

const EDITABLE_FIELDS = new Set(["title", "difficulty", "done"]);

function normalizeDifficulty(value) {
  return TODO_DIFFICULTY_OPTIONS.includes(value) ? value : "Easy";
}

function normalizeItem(item) {
  if (!item || typeof item !== "object") return null;
  const id = typeof item.id === "string" || typeof item.id === "number" ? String(item.id) : createItemId();
  const title = typeof item.title === "string" ? item.title : "";
  return {
    id,
    title,
    difficulty: normalizeDifficulty(item.difficulty),
    done: item.done === true,
    position: Number.isFinite(item.position) ? item.position : 0,
  };
}

function createItemId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useBoardTodoItems() {
  const { user, token } = useAuth();
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load tasks: from API if logged in, else from localStorage
  useEffect(() => {
    async function load() {
      if (token && user) {
        setLoading(true);
        try {
          const data = await apiRequest("/api/tasks", { token });
          setItems((data.tasks || []).map(normalizeItem).filter(Boolean));
        } catch {
          setItems([]);
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const saved = window.localStorage.getItem("focusdesk-local-tasks");
          if (!saved) return;
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setItems(parsed.map(normalizeItem).filter(Boolean));
        } catch {}
      }
    }
    load();
  }, [token, user]);

  useEffect(() => {
    if (!token) {
      try {
        window.localStorage.setItem("focusdesk-local-tasks", JSON.stringify(items));
      } catch {}
    }
  }, [items, token]);

  const deleteItem = useCallback(
    async (idToDelete) => {
      if (token) {
        try {
          await apiRequest(`/api/tasks/${idToDelete}`, { method: "DELETE", token });
        } catch {}
      }
      setItems((prevItems) => prevItems.filter((item) => item.id !== idToDelete));
    },
    [token],
  );

  const updateItem = useCallback(
    async (idToUpdate, fieldName, value) => {
      if (!EDITABLE_FIELDS.has(fieldName)) return;
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
      if (token) {
        const body = {};
        body[fieldName] = value;
        try {
          await apiRequest(`/api/tasks/${idToUpdate}`, { method: "PATCH", token, body });
        } catch {}
      }
    },
    [token],
  );

  const addItem = useCallback(async () => {
    if (token) {
      const data = await apiRequest("/api/tasks", {
        method: "POST",
        token,
        body: { title: "", difficulty: "Easy", done: false },
      });
      setItems((prev) => [...prev, normalizeItem(data.task)].filter(Boolean));
    } else {
      setItems((prevItems) => [
        ...prevItems,
        {
          id: createItemId(),
          title: "",
          difficulty: "Easy",
          done: false,
          position: prevItems.length + 1,
        },
      ]);
    }
  }, [token]);

  const removeDoneItems = useCallback(async () => {
    const doneIds = items.filter((i) => i.done).map((i) => i.id);
    if (doneIds.length === 0) return;
    if (token) {
      await Promise.all(
        doneIds.map((id) => apiRequest(`/api/tasks/${id}`, { method: "DELETE", token }).catch(() => {})),
      );
    }
    setItems((prev) => prev.filter((i) => !i.done));
  }, [items, token]);

  const handleDragStart = useCallback((id) => {
    setDraggedItemId(id);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (targetId) => {
      if (!draggedItemId || draggedItemId === targetId) return;
      setItems((prevItems) => {
        const fromIndex = prevItems.findIndex((item) => item.id === draggedItemId);
        const toIndex = prevItems.findIndex((item) => item.id === targetId);
        if (fromIndex === -1 || toIndex === -1) return prevItems;
        const reordered = [...prevItems];
        const [movedItem] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, movedItem);
        return reordered;
      });
      if (token) {
        try {
          await apiRequest(`/api/tasks/${draggedItemId}`, {
            method: "PATCH",
            token,
            body: { position: items.findIndex((i) => i.id === targetId) + 1 },
          });
        } catch {}
      }
    },
    [draggedItemId, items, token],
  );

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
      resetTaskScore: () => {},
      updateItem,
      doneDeletedTasks: 0,
      totalCreatedTasks: items.length,
      loading,
    }),
    [addItem, deleteItem, draggedItemId, handleDragEnd, handleDragOver, handleDragStart, handleDrop, items, removeDoneItems, updateItem, loading],
  );
}
