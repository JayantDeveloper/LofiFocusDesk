import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, clearAuthToken, setAuthToken } from "../utils/apiClient";

const AuthContext = createContext(null);
const REMEMBER_SESSION_BY_DEFAULT = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEventId, setAuthEventId] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function hydrateUser() {
      try {
        const data = await apiRequest("/api/auth/me");
        if (!isMounted) return;
        const nextUser = data?.user || null;
        setUser(nextUser);
        if (!nextUser) {
          clearAuthToken();
        }
      } catch (error) {
        if (!isMounted) return;
        setUser(null);
        if (error?.status === 401) {
          clearAuthToken();
        }
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    hydrateUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username, password) => {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: {
        username: typeof username === "string" ? username.trim() : "",
        password,
        remember: REMEMBER_SESSION_BY_DEFAULT,
      },
    });

    if (data?.token) {
      setAuthToken(data.token);
    }

    setUser(data?.user || null);
    setAuthEventId((prev) => prev + 1);
  };

  const register = async (username, password) => {
    const data = await apiRequest("/api/auth/register", {
      method: "POST",
      body: {
        username: typeof username === "string" ? username.trim() : "",
        password,
        remember: REMEMBER_SESSION_BY_DEFAULT,
      },
    });

    if (data?.token) {
      setAuthToken(data.token);
    }

    setUser(data?.user || null);
    setAuthEventId((prev) => prev + 1);
  };

  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear local auth state even if the network request fails.
    }

    setUser(null);
    clearAuthToken();
  };

  const updateProfile = async (
    display_name,
    calendar_embed,
    music_urls,
    radio_sync_enabled,
    radio_focus_slot,
    radio_break_slot,
  ) => {
    const data = await apiRequest("/api/user", {
      method: "PUT",
      body: {
        display_name,
        calendar_embed,
        music_urls,
        radio_sync_enabled,
        radio_focus_slot,
        radio_break_slot,
      },
    });

    const updatedUser = data?.user || null;
    setUser(updatedUser);
    return updatedUser;
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile, authEventId }),
    [authEventId, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
