import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from "../api/client";

const AuthContext = createContext(null);
const AUTH_SESSION_HINT_KEY = "focusdesk.session-hint";

function readSessionHint() {
  try {
    return window.localStorage.getItem(AUTH_SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSessionHint(hasSession) {
  try {
    window.localStorage.setItem(AUTH_SESSION_HINT_KEY, hasSession ? "1" : "0");
  } catch {
    // Ignore private mode/localStorage restrictions.
  }
}

export function AuthProvider({ children }) {
  const [hasSessionHint, setHasSessionHint] = useState(() => readSessionHint());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => readSessionHint() || Boolean(getAuthToken()));
  const [authEventId, setAuthEventId] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (readSessionHint() || getAuthToken()) {
        setLoading(true);
      }
      try {
        const data = await apiRequest("/api/auth/me");
        if (!isMounted) return;
        const nextUser = data.user || null;
        setUser(nextUser);
        const nextHint = Boolean(nextUser);
        setHasSessionHint(nextHint);
        writeSessionHint(nextHint);
        if (!nextUser) {
          clearAuthToken();
        }
      } catch {
        if (!isMounted) return;
        setUser(null);
        setHasSessionHint(false);
        writeSessionHint(false);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username, password, remember) => {
    const data = await apiRequest("/api/auth/login", { method: "POST", body: { username, password, remember } });
    if (data?.token) {
      setAuthToken(data.token);
    }
    setUser(data.user);
    setHasSessionHint(true);
    writeSessionHint(true);
    setAuthEventId((prev) => prev + 1);
  };

  const register = async (username, password, remember) => {
    const data = await apiRequest("/api/auth/register", { method: "POST", body: { username, password, remember } });
    if (data?.token) {
      setAuthToken(data.token);
    }
    setUser(data.user);
    setHasSessionHint(true);
    writeSessionHint(true);
    setAuthEventId((prev) => prev + 1);
  };

  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setHasSessionHint(false);
    writeSessionHint(false);
    clearAuthToken();
  };

  const updateProfile = async (display_name, calendar_embed, music_urls) => {
    const data = await apiRequest("/api/user", {
      method: "PUT",
      body: { display_name, calendar_embed, music_urls },
    });
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({ user, loading, hasSessionHint, login, register, logout, updateProfile, authEventId }),
    [authEventId, hasSessionHint, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
