import { useUi } from "@/store/useUi";

type Result = { error: { message: string; code?: string } | null };

let lastToast = 0;

/**
 * Writes to Supabase are fire-and-forget so the UI stays instant. Without this guard a
 * rejected write (no permission, offline, expired session) looked like a success and the
 * data silently vanished on next load. Now the user is told, at most once every 4 seconds.
 */
export function guard(query: PromiseLike<Result>) {
  void Promise.resolve(query).then(
    ({ error }) => {
      if (error) notify(error.code === "42501" ? "Você não tem permissão para esta ação." : `Não foi possível salvar: ${error.message}`);
    },
    () => notify("Sem conexão: a alteração não foi salva."),
  );
}

function notify(message: string) {
  const now = Date.now();
  if (now - lastToast < 4000) return;
  lastToast = now;
  useUi.getState().pushToast(message);
}
