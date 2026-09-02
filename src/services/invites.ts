import { currentWorkspaceId, isOfficialCloud } from "@/services/core";
import { supabase } from "@/services/supabase";

export async function createInvite(email: string): Promise<{ token?: string; error?: string }> {
  if (!isOfficialCloud() || !supabase) {
    return { error: "Convite só existe no workspace de produção." };
  }
  const wid = currentWorkspaceId();
  if (!wid) return { error: "Workspace ainda não está pronto." };

  const token = crypto.randomUUID();
  const { error } = await supabase.from("invites").insert({
    workspace_id: wid,
    email: email.trim().toLowerCase(),
    token,
    invited_by: (await supabase.auth.getUser()).data.user?.id ?? null,
  });
  if (error) return { error: "Não deu para criar o convite. Só o dono do workspace convida." };
  return { token };
}

export function inviteUrl(token: string) {
  const origin = window.location.origin;
  return `${origin}/app/login?prod=1&invite=${token}`;
}
