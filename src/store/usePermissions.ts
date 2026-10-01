import { create } from "zustand";

export type Role = "owner" | "admin" | "finance" | "sales" | "viewer" | "member";

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Dono",
  admin: "Administrador",
  finance: "Financeiro",
  sales: "Vendedor",
  viewer: "Somente leitura",
  member: "Vendedor",
};

export const ROLE_HINT: Record<Exclude<Role, "member">, string> = {
  owner: "Poder total, inclusive promover administradores.",
  admin: "Gerencia a equipe, vê o histórico e restaura exclusões.",
  finance: "Edita faturas e produtos.",
  sales: "Edita empresas, contatos, oportunidades, leads e tarefas.",
  viewer: "Só consulta e conversa no chat.",
};

type PermissionsState = {
  role: Role | null;
  setRole: (role: Role | null) => void;
};

export const usePermissions = create<PermissionsState>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
}));

/** `null` = demo workspace or not loaded yet: nothing is restricted on screen (the database still enforces). */
export function isReadOnly(role: Role | null) {
  return role === "viewer";
}

export function isAdmin(role: Role | null) {
  return role === "owner" || role === "admin";
}

export type Area = "crm" | "finance" | "any";

// Mirrors the database policies (can_edit_crm / can_edit_finance / can_write).
const ALLOWED: Record<Area, Role[]> = {
  crm: ["owner", "admin", "sales", "member"],
  finance: ["owner", "admin", "finance"],
  any: ["owner", "admin", "finance", "sales", "member"],
};

/** `null` role (demo workspace, or not loaded yet) never blocks anything on screen. */
export function can(role: Role | null, area: Area) {
  return role === null || ALLOWED[area].includes(role);
}
