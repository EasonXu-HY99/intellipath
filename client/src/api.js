const BASE = "/api";

const storage =
  typeof localStorage !== "undefined"
    ? localStorage
    : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

let token = storage.getItem("intellipath.token") || null;

export function setToken(t) {
  token = t;
  if (t) storage.setItem("intellipath.token", t);
  else storage.removeItem("intellipath.token");
}

export function getToken() {
  return token;
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    // Session expired / invalid — clear and let the auth gate take over.
    setToken(null);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  // Auth
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  changePassword: (currentPassword, newPassword) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  // Users
  getUsers: () => request("/users"),
  createUser: (payload) => request("/users", { method: "POST", body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),

  // Data
  getHealth: () => request("/health"),
  getMetrics: () => request("/metrics"),
  getResources: (userId) =>
    request(`/resources${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),
  createResource: (payload) =>
    request("/resources", { method: "POST", body: JSON.stringify(payload) }),
  getPeople: () => request("/people"),
  getLevelRules: () => request("/level-rules"),
  getPermissionRequests: () => request("/permission-requests"),
  createPermissionRequest: (payload) =>
    request("/permission-requests", { method: "POST", body: JSON.stringify(payload) }),
  getAuditLogs: () => request("/audit-logs"),
  getSystemLogs: () => request("/system-logs"),
  addAuditLog: (payload) =>
    request("/audit-logs", { method: "POST", body: JSON.stringify(payload) }),
  getRecommendations: () => request("/ai/recommendations"),
  askAI: (prompt) =>
    request("/ai/ask", { method: "POST", body: JSON.stringify({ prompt }) }),
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),
  getSettings: () => request("/settings"),
  updateSettings: (payload) =>
    request("/settings", { method: "PUT", body: JSON.stringify(payload) }),
};
