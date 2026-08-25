import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@/types";
import { users as demoUsers } from "@/data/seed";
import { initials, hueFrom, uid } from "@/lib/cn";
import { hashPassword, newSalt, verifyPassword } from "@/lib/password";
import { getWorkspace, workspaceStorage } from "@/lib/workspace";

export type Account = User & {
  passwordHash: string;
  salt: string;
};

type AuthState = {
  user: User | null;
  accounts: Account[];
  signingIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
};

function publicUser(account: Account): User {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    avatarHue: account.avatarHue,
    initials: account.initials,
  };
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: [],
      signingIn: false,
      login: async (email, password) => {
        set({ signingIn: true });
        await new Promise((r) => setTimeout(r, 500));
        if (!password.trim()) {
          set({ signingIn: false });
          return false;
        }

        if (getWorkspace() === "demo") {
          const found =
            demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? demoUsers[0];
          set({ user: found, signingIn: false });
          return true;
        }

        const account = get().accounts.find(
          (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!account || !(await verifyPassword(password, account.salt, account.passwordHash))) {
          set({ signingIn: false });
          return false;
        }
        set({ user: publicUser(account), signingIn: false });
        return true;
      },
      register: async (name, email, password) => {
        if (getWorkspace() !== "official") return "Cadastro só existe no workspace oficial.";
        const trimmed = email.trim().toLowerCase();
        if (!name.trim() || !trimmed || password.length < 6) {
          return "Nome, e-mail e senha com pelo menos 6 caracteres.";
        }
        if (get().accounts.some((item) => item.email.toLowerCase() === trimmed)) {
          return "Esse e-mail já tem conta neste workspace.";
        }
        set({ signingIn: true });
        const salt = newSalt();
        const passwordHash = await hashPassword(password, salt);
        const account: Account = {
          id: uid("u"),
          name: name.trim(),
          email: trimmed,
          role: get().accounts.length === 0 ? "Owner" : "Membro",
          avatarHue: hueFrom(trimmed),
          initials: initials(name),
          passwordHash,
          salt,
        };
        set({
          accounts: [...get().accounts, account],
          user: publicUser(account),
          signingIn: false,
        });
        return null;
      },
      logout: () => set({ user: null }),
    }),
    {
      name: "orbio-auth",
      storage: createJSONStorage(() => workspaceStorage),
      partialize: (state) => ({
        user: state.user,
        accounts: state.accounts,
      }),
    },
  ),
);
