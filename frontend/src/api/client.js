const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const AUTH_TOKEN_STORAGE_KEY = "focusdesk.auth-token";

function readStorageToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function getAuthToken() {
  return readStorageToken();
}

export function setAuthToken(token) {
  try {
    if (typeof token === "string" && token.trim()) {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token.trim());
      return;
    }
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore localStorage restrictions.
  }
}

export function clearAuthToken() {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore localStorage restrictions.
  }
}

export async function apiRequest(path, { method = "GET", body } = {}) {
  const token = readStorageToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error(`Cannot reach the server at ${API_BASE}. Check VITE_API_BASE and backend status.`);
    err.status = 0;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      clearAuthToken();
    }
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}
