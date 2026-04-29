import { createContext, useContext, useEffect, useRef, useState } from "react";
import { apiRequest } from "../utils/apiClient";
import { useAuth } from "./AuthStore";

// { data: {tasks, pomodoro} | null, ready: bool }
// ready=true means the fetch completed (data may be null if it failed).
// Hooks wait for ready=true before loading so they use this data instead
// of making separate /api/tasks and /api/pomodoro calls.
const StartupDataContext = createContext({ data: null, ready: false });

export function StartupDataProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({ data: null, ready: false });
  const fetchedForRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setState({ data: null, ready: false });
      fetchedForRef.current = null;
      return;
    }

    const userId = String(user.id ?? user.username ?? "");
    if (fetchedForRef.current === userId) return;
    fetchedForRef.current = userId;

    let isMounted = true;
    apiRequest("/api/startup")
      .then((d) => { if (isMounted) setState({ data: d, ready: true }); })
      .catch(() => { if (isMounted) setState({ data: null, ready: true }); });
    return () => { isMounted = false; };
  }, [user]);

  return (
    <StartupDataContext.Provider value={state}>
      {children}
    </StartupDataContext.Provider>
  );
}

export function useStartupData() {
  return useContext(StartupDataContext);
}
