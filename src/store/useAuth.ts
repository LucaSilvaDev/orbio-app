import { create } from "zustand";
import type { User } from "@/types";
import { users as demoUsers } from "@/data/seed";
import { getWorkspace } from "@/lib/workspace";
import { refreshUsers } from "@/lib/directory";
import { supabase } from "@/services/supabase";

type Status = "loading" | "authenticated" | "guest";

type RegisterResult = {
  error: string | null;
  needsConfirmation: boolean;
};

type AuthState = {
  user: User | null;
  status: Status;
  signingIn: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  init: () => () => void;
};

async function fetchProfile(id: string, email: string): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, role, avatar_hue, initials")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email,
    role: data.role,
    avatarHue: data.avatar_hue,
    initials: data.initials,
  };
}

function translateAuthError(message: string | undefined) {
  const msg = message ?? "";
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("User already registered")) return "Esse e-mail já tem conta neste workspace.";
  if (msg.includes("Password should be at least")) return "Senha muito curta.";
  return "Não deu para completar. Tenta de novo.";
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  signingIn: false,

  init: () => {
    if (getWorkspace() === "demo" || !supabase) {
      set({ status: "guest" });
      return () => {};
    }

    const client = supabase;
    let cancelled = false;

    void client.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      const session = data.session;
      if (!session) {
        set({ status: "guest", user: null });
        return;
      }
      const profile = await fetchProfile(session.user.id, session.user.email ?? "");
      set({ user: profile, status: profile ? "authenticated" : "guest" });
      if (profile) void refreshUsers();
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        set({ user: null, status: "guest" });
        return;
      }
      void fetchProfile(session.user.id, session.user.email ?? "").then((profile) => {
        set({ user: profile, status: profile ? "authenticated" : "guest" });
        if (profile) void refreshUsers();
      });
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  },

  login: async (email, password) => {
    set({ signingIn: true });

    if (getWorkspace() === "demo") {
      await new Promise((r) => setTimeout(r, 500));
      if (!password.trim()) {
        set({ signingIn: false });
        return "Informe uma senha.";
      }
      const found =
        demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? demoUsers[0];
      set({ user: found, status: "authenticated", signingIn: false });
      return null;
    }

    if (!supabase) {
      set({ signingIn: false });
      return "Supabase não está configurado neste ambiente.";
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.session) {
      set({ signingIn: false });
      return translateAuthError(error?.message);
    }
    const profile = await fetchProfile(data.session.user.id, data.session.user.email ?? "");
    set({ user: profile, status: profile ? "authenticated" : "guest", signingIn: false });
    return null;
  },

  register: async (name, email, password) => {
    if (getWorkspace() !== "official") {
      return { error: "Cadastro só existe no workspace oficial.", needsConfirmation: false };
    }
    if (!supabase) {
      return { error: "Supabase não está configurado neste ambiente.", needsConfirmation: false };
    }
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail || password.length < 6) {
      return {
        error: "Nome, e-mail e senha com pelo menos 6 caracteres.",
        needsConfirmation: false,
      };
    }

    set({ signingIn: true });
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { name: trimmedName } },
    });
    set({ signingIn: false });

    if (error) return { error: translateAuthError(error.message), needsConfirmation: false };
    if (!data.session) {
      return { error: null, needsConfirmation: true };
    }
    const profile = await fetchProfile(data.session.user.id, data.session.user.email ?? "");
    set({ user: profile, status: profile ? "authenticated" : "guest" });
    return { error: null, needsConfirmation: false };
  },

  logout: async () => {
    if (getWorkspace() === "demo" || !supabase) {
      set({ user: null, status: "guest" });
      return;
    }
    await supabase.auth.signOut();
    set({ user: null, status: "guest" });
  },
}));
