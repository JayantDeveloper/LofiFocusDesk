import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEventId, setAuthEventId] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiRequest("/api/auth/me");
        setUser(data.user || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const login = async (username, password, remember) => {
    const data = await apiRequest("/api/auth/login", { method: "POST", body: { username, password, remember } });
    setUser(data.user);
    setAuthEventId((prev) => prev + 1);
  };

  const register = async (username, password, remember) => {
    const data = await apiRequest("/api/auth/register", { method: "POST", body: { username, password, remember } });
    setUser(data.user);
    setAuthEventId((prev) => prev + 1);
  };

  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
  };

  const updateProfile = async (display_name, calendar_embed) => {
    const data = await apiRequest("/api/user", { method: "PUT", body: { display_name, calendar_embed } });
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile, authEventId }),
    [authEventId, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
