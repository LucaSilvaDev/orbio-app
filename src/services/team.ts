import { currentWorkspaceId, isOfficialCloud } from "@/services/core";
import { supabase } from "@/services/supabase";
import type { Role } from "@/store/usePermissions";

export type Member = { userId: string; role: Role; active: boolean };
export type AuditEntry = {
  id: number;
  actor: string | null;
  tableName: string;
  rowId: string | null;
  action: "insert" | "update" | "delete";
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  at: string;
};

function friendly(message: string) {
  return message.replace(/^.*?:\s*/, "") || message;
}

export async function loadMyRole(userId: string): Promise<Role | null> {
  const wid = currentWorkspaceId();
  if (!isOfficialCloud() || !supabase || !wid) return null;
  const { data } = await supabase
    .from("memberships")
    .select("role")
    .eq("workspace_id", wid)
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  return (data?.role as Role | undefined) ?? null;
}

export async function loadMembers(): Promise<Member[]> {
  const wid = currentWorkspaceId();
  if (!isOfficialCloud() || !supabase || !wid) return [];
  const { data } = await supabase
    .from("memberships")
    .select("user_id, role, active")
    .eq("workspace_id", wid);
  return (data ?? []).map((row) => ({
    userId: String(row.user_id),
    role: row.role as Role,
    active: Boolean(row.active),
  }));
}

export async function setMemberRole(target: string, role: string): Promise<string | null> {
  const wid = currentWorkspaceId();
  if (!supabase || !wid) return "Workspace indisponível.";
  const { error } = await supabase.rpc("set_member_role", { wid, target, new_role: role });
  return error ? friendly(error.message) : null;
}

export async function offboardMember(target: string, transferTo: string): Promise<string | null> {
  const wid = currentWorkspaceId();
  if (!supabase || !wid) return "Workspace indisponível.";
  const { error } = await supabase.rpc("offboard_member", { wid, target, transfer_to: transferTo });
  return error ? friendly(error.message) : null;
}

export async function loadAudit(limit = 60): Promise<AuditEntry[]> {
  const wid = currentWorkspaceId();
  if (!isOfficialCloud() || !supabase || !wid) return [];
  const { data } = await supabase
    .from("audit_log")
    .select("id, actor, table_name, row_id, action, old_data, new_data, at")
    .eq("workspace_id", wid)
    .order("at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    id: Number(row.id),
    actor: row.actor ? String(row.actor) : null,
    tableName: String(row.table_name),
    rowId: row.row_id ? String(row.row_id) : null,
    action: row.action as AuditEntry["action"],
    oldData: (row.old_data as Record<string, unknown> | null) ?? null,
    newData: (row.new_data as Record<string, unknown> | null) ?? null,
    at: String(row.at),
  }));
}

export async function restoreAudit(id: number): Promise<string | null> {
  if (!supabase) return "Workspace indisponível.";
  const { error } = await supabase.rpc("restore_audit_row", { audit_id: id });
  return error ? friendly(error.message) : null;
}
