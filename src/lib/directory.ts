import type { User } from "@/types";
import { users as demoUsers } from "@/data/seed";
import { getWorkspace } from "@/lib/workspace";
import { supabase } from "@/services/supabase";

let officialUsersCache: User[] = [];

export function listUsers(): User[] {
  if (getWorkspace() === "demo") return demoUsers;
  return officialUsersCache;
}

export async function refreshUsers(): Promise<User[]> {
  if (getWorkspace() === "demo") return demoUsers;
  if (!supabase) return officialUsersCache;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, role, avatar_hue, initials, email");
  if (error || !data) return officialUsersCache;
  officialUsersCache = data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarHue: row.avatar_hue,
    initials: row.initials,
  }));
  return officialUsersCache;
}
