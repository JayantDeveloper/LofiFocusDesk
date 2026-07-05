import { useCallback, useEffect, useMemo, useState } from "react";
import { DIFFICULTY_XP, TODO_DIFFICULTY_OPTIONS, TODO_STATUS_OPTIONS } from "../constants/todoBoardConstants";
import { useAuth } from "../store/AuthStore";
import { useStartupData } from "../store/StartupDataStore";
import { apiRequest } from "../utils/apiClient";

const EDITABLE_FIELDS = new Set(["title", "difficulty", "status"]);
const OPTIMISTIC_TASK_PREFIX = "optimistic-task-";

function normalizeDifficulty(value) {
  return TODO_DIFFICULTY_OPTIONS.includes(value) ? value : "Easy";
}

function normalizeStatus(value) {
  return TODO_STATUS_OPTIONS.includes(value) ? value : "Not Started";
}

function normalizeItem(item) {
  if (!item || typeof item !== "object") return null;
  const id = typeof item.id === "string" || typeof item.id === "number" ? String(item.id) : createItemId();
  const title = typeof item.title === "string" ? item.title : "";
  return {
    id,
    title,
    difficulty: normalizeDifficulty(item.difficulty),
    position: Number.isFinite(item.position) ? item.position : 0,
    status: normalizeStatus(item.status),
  };
}

function createItemId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  const { data: startupData, ready: startupReady } = useStartupData();
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [items, setItems] = useState([]);
  const [doneDeletedTasks, setDoneDeletedTasks] = useState(0);
  const [totalCreatedTasks, setTotalCreatedTasks] = useState(0);
  const [earnedTokens, setEarnedTokens] = useState(0);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    if (user && !startupReady) return; // wait for startup fetch before loading
    let isMounted = true;
    async function load() {
      if (user) {
        setIsHydrating(true);
        try {
          const data = startupData ?? await apiRequest("/api/tasks");
          const stats = startupData
            ? startupData.taskStats
            : await apiRequest("/api/tasks/stats").then((res) => res.stats).catch(() => null);
          if (!isMounted) return;
          const normalizedItems = (data.tasks || [])
            .map(normalizeItem)
            .filter((item) => item && item.status !== "Done");
          setItems(normalizedItems);
          setDoneDeletedTasks(stats?.doneTasks ?? 0);
          setTotalCreatedTasks(Math.max(normalizedItems.length, stats?.createdTasks ?? 0));
          setEarnedTokens(stats?.earnedTokens ?? 0);
        } catch {
          if (!isMounted) return;
          setItems([]);
          setDoneDeletedTasks(0);
          setTotalCreatedTasks(0);
        } finally {
          if (isMounted) {
            setIsHydrating(false);
          }
        }
      } else {
        setIsHydrating(true);
        setItems([]);
        setDoneDeletedTasks(0);
        setTotalCreatedTasks(0);
        setEarnedTokens(0);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [user, startupReady]); // eslint-disable-line react-hooks/exhaustive-deps

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

      // Marking a task Done auto-removes it and counts toward the score.
      // The backend deletes the row and owns the score counters; the local
      // increments below are optimistic and reconciled from its response.
      if (fieldName === "status" && value === "Done") {
        const completedItem = items.find((item) => item.id === idToUpdate);
        const tokensForTask = DIFFICULTY_XP[completedItem?.difficulty] ?? 25;
        setItems((prev) => prev.filter((item) => item.id !== idToUpdate));
        setDoneDeletedTasks((prev) => prev + 1);
        setEarnedTokens((prev) => prev + tokensForTask);
        if (!isOptimisticTaskId(idToUpdate)) {
          try {
            const data = await apiRequest(`/api/tasks/${idToUpdate}`, {
              method: "PATCH",
              body: { status: "Done" },
            });
            if (data?.stats) {
              setDoneDeletedTasks(data.stats.doneTasks);
              setEarnedTokens(data.stats.earnedTokens);
              setTotalCreatedTasks((prev) => Math.max(prev, data.stats.createdTasks));
            }
          } catch {
            // Keep removed from UI even if the request fails.
          }
        }
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
    [items, user],
  );

  const addItem = useCallback(async () => {
    if (!user) return;
    const optimisticId = `${OPTIMISTIC_TASK_PREFIX}${createItemId()}`;
    const optimisticItem = {
      id: optimisticId,
      title: "",
      difficulty: "Easy",
      position: items.length + 1,
      status: "Not Started",
    };

    setItems((prev) => [...prev, optimisticItem]);
    setTotalCreatedTasks((prev) => prev + 1);
    try {
      const data = await apiRequest("/api/tasks", {
        method: "POST",
        body: { title: "", difficulty: "Easy", status: "Not Started" },
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

  const resetTaskScore = useCallback(async () => {
    setDoneDeletedTasks(0);
    setTotalCreatedTasks(items.length);
    setEarnedTokens(0);
    if (!user) return;
    try {
      const data = await apiRequest("/api/tasks/stats/reset", { method: "POST" });
      if (data?.stats) {
        setDoneDeletedTasks(data.stats.doneTasks);
        setTotalCreatedTasks(Math.max(items.length, data.stats.createdTasks));
        setEarnedTokens(data.stats.earnedTokens);
      }
    } catch {
      // The optimistic local reset stands; server will resync on next load.
    }
  }, [items.length, user]);

  return useMemo(
    () => ({
      addItem,
      deleteItem,
      draggedItemId,
      handleDragEnd,
      handleDragOver,
      handleDragStart,
      handleDrop,
      isHydrating,
      isReady: !isHydrating,
      items,
      resetTaskScore,
      updateItem,
      doneDeletedTasks,
      earnedTokens,
      totalCreatedTasks: Math.max(items.length, totalCreatedTasks),
    }),
    [
      addItem,
      deleteItem,
      doneDeletedTasks,
      draggedItemId,
      earnedTokens,
      handleDragEnd,
      handleDragOver,
      handleDragStart,
      handleDrop,
      isHydrating,
      items,
      resetTaskScore,
      totalCreatedTasks,
      updateItem,
    ],
  );
}
