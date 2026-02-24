const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export async function apiRequest(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
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
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}
