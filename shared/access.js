// Numeric ranks are an internal ordering only. Product surfaces use role names.
export const ACCESS_NAMES = ["Viewer", "Engineer", "Analysis", "Manager", "Admin"];
export const ROLE_RANK = { viewer: 1, engineer: 2, analyst: 3, manager: 4, admin: 5 };
export const RANK_ROLE = [null, "viewer", "engineer", "analyst", "manager", "admin"];
export const accessName = (rank) => ACCESS_NAMES[Number(rank) - 1] || "Unassigned";
export const roleName = (role) => accessName(ROLE_RANK[role]);
