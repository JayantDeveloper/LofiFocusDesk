import { useCallback, useEffect, useMemo, useState } from "react";
import { TODO_DIFFICULTY_OPTIONS } from "../constants/todoBoardConstants";
import { useAuth } from "../store/AuthStore";
import { apiRequest } from "../utils/apiClient";

const EDITABLE_FIELDS = new Set(["title", "difficulty", "done"]);
const TASK_SCORE_STORAGE_PREFIX = "focusdesk.task-score";
const OPTIMISTIC_TASK_PREFIX = "optimistic-task-";

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

function toNonNegativeInteger(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function getTaskScoreStorageKey(user) {
  if (!user) return "";
  const identity = user.id ?? user.username;
  if (identity === undefined || identity === null || identity === "") return "";
  return `${TASK_SCORE_STORAGE_PREFIX}.${identity}`;
}

function readTaskScoreSnapshot(storageKey) {
  if (!storageKey) return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      doneDeletedTasks: toNonNegativeInteger(parsed.doneDeletedTasks, 0),
      totalCreatedTasks: toNonNegativeInteger(parsed.totalCreatedTasks, 0),
    };
  } catch {
    return null;
  }
}

function writeTaskScoreSnapshot(storageKey, snapshot) {
  if (!storageKey) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    // Ignore private mode/localStorage restrictions.
  }
}

function isOptimisticTaskId(taskId) {
  return typeof taskId === "string" && taskId.startsWith(OPTIMISTIC_TASK_PREFIX);
}

function sortByPositionThenId(items) {
  return [...items].sort((a, b) => {
    const positionDiff = (a.position ?? 0) - (b.position ?? 0);
    if (positionDiff !== 0) return positionDiff;
    return String(a.id).localeCompare(String(b.id));
  });
}

export function useBoardTodoItems() {
  const { user } = useAuth();
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [items, setItems] = useState([]);
  const [doneDeletedTasks, setDoneDeletedTasks] = useState(0);
  const [totalCreatedTasks, setTotalCreatedTasks] = useState(0);
  const taskScoreStorageKey = useMemo(() => getTaskScoreStorageKey(user), [user]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (user) {
        try {
          const data = await apiRequest("/api/tasks");
          if (!isMounted) return;
          const normalizedItems = (data.tasks || []).map(normalizeItem).filter(Boolean);
          setItems(normalizedItems);
          const visibleTaskCount = normalizedItems.length;
          const snapshot = readTaskScoreSnapshot(taskScoreStorageKey);
          const nextDoneDeletedTasks = snapshot?.doneDeletedTasks ?? 0;
          const nextTotalCreatedTasks = Math.max(visibleTaskCount, snapshot?.totalCreatedTasks ?? visibleTaskCount);
          setDoneDeletedTasks(nextDoneDeletedTasks);
          setTotalCreatedTasks(nextTotalCreatedTasks);
          writeTaskScoreSnapshot(taskScoreStorageKey, {
            doneDeletedTasks: nextDoneDeletedTasks,
            totalCreatedTasks: nextTotalCreatedTasks,
          });
        } catch {
          if (!isMounted) return;
          setItems([]);
          setDoneDeletedTasks(0);
          setTotalCreatedTasks(0);
        }
      } else {
        setItems([]);
        setDoneDeletedTasks(0);
        setTotalCreatedTasks(0);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [taskScoreStorageKey, user]);

  useEffect(() => {
    if (!taskScoreStorageKey || !user) return;
    writeTaskScoreSnapshot(taskScoreStorageKey, {
      doneDeletedTasks,
      totalCreatedTasks: Math.max(items.length, totalCreatedTasks),
    });
  }, [doneDeletedTasks, items.length, taskScoreStorageKey, totalCreatedTasks, user]);

  const deleteItem = useCallback(
    async (idToDelete) => {
      if (!user) return;
      const deletedItem = items.find((item) => item.id === idToDelete) || null;
      if (!deletedItem) return;

      setItems((prevItems) => prevItems.filter((item) => item.id !== idToDelete));
      if (isOptimisticTaskId(idToDelete)) {
        return;
      }

      try {
        await apiRequest(`/api/tasks/${idToDelete}`, { method: "DELETE" });
      } catch {
        setItems((prevItems) => {
          const exists = prevItems.some((item) => item.id === idToDelete);
          if (exists) return prevItems;
          return sortByPositionThenId([...prevItems, deletedItem]);
        });
      }
    },
    [items, user],
  );

  const updateItem = useCallback(
    async (idToUpdate, fieldName, value) => {
      if (!EDITABLE_FIELDS.has(fieldName)) return;
      if (!user) return;
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
      if (isOptimisticTaskId(idToUpdate)) {
        return;
      }
      const body = {};
      body[fieldName] = value;
      try {
        await apiRequest(`/api/tasks/${idToUpdate}`, { method: "PATCH", body });
      } catch {
        return;
      }
    },
    [user],
  );

  const addItem = useCallback(async () => {
    if (!user) return;
    const optimisticId = `${OPTIMISTIC_TASK_PREFIX}${createItemId()}`;
    const optimisticItem = {
      id: optimisticId,
      title: "",
      difficulty: "Easy",
      done: false,
      position: items.length + 1,
    };

    setItems((prev) => [...prev, optimisticItem]);
    setTotalCreatedTasks((prev) => prev + 1);
    try {
      const data = await apiRequest("/api/tasks", {
        method: "POST",
        body: { title: "", difficulty: "Easy", done: false },
      });
      const persistedItem = normalizeItem(data.task);
      if (!persistedItem) throw new Error("Failed to normalize created task");
      setItems((prev) =>
        prev.map((item) =>
          item.id === optimisticId
            ? { ...item, id: persistedItem.id, position: persistedItem.position }
            : item,
        ),
      );
    } catch {
      setItems((prev) => prev.filter((item) => item.id !== optimisticId));
      setTotalCreatedTasks((prev) => Math.max(0, prev - 1));
    }
  }, [items.length, user]);

  const removeDoneItems = useCallback(async () => {
    if (!user) return;
    const doneItems = items.filter((item) => item.done);
    if (doneItems.length === 0) return;

    setItems((prev) => prev.filter((item) => !item.done));
    setDoneDeletedTasks((prev) => prev + doneItems.length);

    const persistedDoneItems = doneItems.filter((item) => !isOptimisticTaskId(item.id));
    if (persistedDoneItems.length === 0) return;

    const deletionResults = await Promise.allSettled(
      persistedDoneItems.map((item) => apiRequest(`/api/tasks/${item.id}`, { method: "DELETE" })),
    );
    const failedItems = persistedDoneItems.filter((_, index) => deletionResults[index].status === "rejected");
    if (failedItems.length === 0) return;

    // Keep completed items removed from the UI even if a delete request fails.
    // This avoids tasks popping back into the board after the user clicks Done.
    setDoneDeletedTasks((prev) => Math.max(0, prev - failedItems.length));
  }, [items, user]);

  const handleDragStart = useCallback((id) => {
    setDraggedItemId(id);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (targetId) => {
      if (!draggedItemId || draggedItemId === targetId) return;
      if (!user) return;
      setItems((prevItems) => {
        const fromIndex = prevItems.findIndex((item) => item.id === draggedItemId);
        const toIndex = prevItems.findIndex((item) => item.id === targetId);
        if (fromIndex === -1 || toIndex === -1) return prevItems;
        const reordered = [...prevItems];
        const [movedItem] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, movedItem);
        return reordered;
      });
      if (isOptimisticTaskId(draggedItemId)) {
        return;
      }
      try {
        await apiRequest(`/api/tasks/${draggedItemId}`, {
          method: "PATCH",
          body: { position: items.findIndex((i) => i.id === targetId) + 1 },
        });
      } catch {
        return;
      }
    },
    [draggedItemId, items, user],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
  }, []);

  const resetTaskScore = useCallback(() => {
    setDoneDeletedTasks(0);
    setTotalCreatedTasks(items.length);
  }, [items.length]);

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
      resetTaskScore,
      updateItem,
      doneDeletedTasks,
      totalCreatedTasks: Math.max(items.length, totalCreatedTasks),
    }),
    [
      addItem,
      deleteItem,
      doneDeletedTasks,
      draggedItemId,
      handleDragEnd,
      handleDragOver,
      handleDragStart,
      handleDrop,
      items,
      removeDoneItems,
      resetTaskScore,
      totalCreatedTasks,
      updateItem,
    ],
  );
}
