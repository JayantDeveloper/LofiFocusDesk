import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("focusdesk_token") || sessionStorage.getItem("focusdesk_token") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (token) {
          const data = await apiRequest("/api/auth/me", { token });
          setUser(data.user);
        }
      } catch {
        setUser(null);
        setToken("");
        localStorage.removeItem("focusdesk_token");
        sessionStorage.removeItem("focusdesk_token");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const login = async (username, password, remember) => {
    const data = await apiRequest("/api/auth/login", { method: "POST", body: { username, password, remember } });
    setUser(data.user);
    setToken(data.token);
    if (remember) {
      localStorage.setItem("focusdesk_token", data.token);
      sessionStorage.removeItem("focusdesk_token");
    } else {
      sessionStorage.setItem("focusdesk_token", data.token);
      localStorage.removeItem("focusdesk_token");
    }
  };

  const register = async (username, password, remember) => {
    const data = await apiRequest("/api/auth/register", { method: "POST", body: { username, password } });
    setUser(data.user);
    setToken(data.token);
    if (remember) {
      localStorage.setItem("focusdesk_token", data.token);
      sessionStorage.removeItem("focusdesk_token");
    } else {
      sessionStorage.setItem("focusdesk_token", data.token);
      localStorage.removeItem("focusdesk_token");
    }
  };

  const logout = async () => {
    try {
      if (token) await apiRequest("/api/auth/logout", { method: "POST", token });
    } catch {}
    setUser(null);
    setToken("");
    localStorage.removeItem("focusdesk_token");
    sessionStorage.removeItem("focusdesk_token");
  };

  const updateProfile = async (display_name, calendar_embed) => {
    const data = await apiRequest("/api/user", { method: "PUT", token, body: { display_name, calendar_embed } });
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, updateProfile }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
