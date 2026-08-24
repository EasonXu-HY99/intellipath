// Role-based access control (RBAC) + auth middleware.
import { db, getSessionUser } from "./db.js";

// Role definitions. Permissions are fine-grained strings shared with the
// frontend so nav items and controls can be toggled by the same rules.
export const ROLES = {
  admin: {
    label: "Administrator",
    permissions: [
      "overview",
      "ai",
      "search",
      "resources.read",
      "resources.write",
      "audit.read",
      "audit.write",
      "settings",
      "users",
    ],
  },
  manager: {
    label: "Operations Manager",
    permissions: [
      "overview",
      "ai",
      "search",
      "resources.read",
      "resources.write",
      "audit.read",
      "audit.write",
      "settings",
    ],
  },
  analyst: {
    label: "Security Analyst",
    permissions: [
      "overview",
      "ai",
      "search",
      "resources.read",
      "audit.read",
      "audit.write",
    ],
  },
  viewer: {
    label: "Viewer",
    permissions: ["overview", "search", "resources.read"],
  },
};

export function rolePermissions(role) {
  return ROLES[role]?.permissions || [];
}

export function userHasPermission(role, perm) {
  return rolePermissions(role).includes(perm);
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    roleLabel: ROLES[user.role]?.label || user.role,
    email: user.email,
    permissions: rolePermissions(user.role),
  };
}

export function extractToken(req) {
  const auth = req.headers.authorization || "";
  return auth.replace(/^Bearer\s+/i, "").trim() || null;
}

export function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required" });
  const user = getSessionUser(db, token);
  if (!user) return res.status(401).json({ error: "Session expired or invalid" });
  req.user = user;
  req.token = token;
  next();
}

export function requirePermission(perm) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!userHasPermission(req.user.role, perm)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
