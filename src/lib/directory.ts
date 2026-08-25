import type { User } from "@/types";
import { users as demoUsers } from "@/data/seed";
import { getWorkspace } from "@/lib/workspace";
import { useAuth, type Account } from "@/store/useAuth";

export function toPublicUser(account: Account): User {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    avatarHue: account.avatarHue,
    initials: account.initials,
  };
}

export function listUsers(): User[] {
  if (getWorkspace() === "demo") return demoUsers;
  return useAuth.getState().accounts.map(toPublicUser);
}
