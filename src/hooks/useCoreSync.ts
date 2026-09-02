import { useEffect } from "react";
import { getWorkspace } from "@/lib/workspace";
import { loadCore } from "@/services/core";
import { useAuth } from "@/store/useAuth";
import { useCrm } from "@/store/useCrm";
import { useUi } from "@/store/useUi";

export function useCoreSync() {
  const user = useAuth((s) => s.user);
  const status = useAuth((s) => s.status);
  const hydrateCore = useCrm((s) => s.hydrateCore);
  const pushToast = useUi((s) => s.pushToast);

  useEffect(() => {
    if (getWorkspace() !== "official" || status !== "authenticated" || !user) return;
    let cancelled = false;
    void loadCore().then((data) => {
      if (cancelled) return;
      if (!data) {
        pushToast("Núcleo comercial offline — confira a migration no Supabase.");
        return;
      }
      hydrateCore(data);
    });
    return () => {
      cancelled = true;
    };
  }, [user, status, hydrateCore, pushToast]);
}
