const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
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
