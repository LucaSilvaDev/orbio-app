import { useEffect } from "react";
import { getWorkspace } from "@/lib/workspace";
import { loadCore } from "@/services/core";
import { loadDurable, markDurableReady } from "@/services/durable";
import {
  ITEM_KINDS,
  loadItems,
  markItemsReady,
  persistItem,
  type AnyItem,
  type ItemKey,
  type ItemsPayload,
} from "@/services/items";
import { startRealtime } from "@/services/realtime";
import { loadMyRole } from "@/services/team";
import { useAuth } from "@/store/useAuth";
import { useCrm } from "@/store/useCrm";
import { usePermissions } from "@/store/usePermissions";
import { useReports } from "@/store/useReports";
import { useUi } from "@/store/useUi";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * First login after the cloud modules shipped: anything the user had only in this
 * browser (leads, tasks, notes…) is uploaded once, with fresh UUIDs, so nothing is lost.
 */
function importLocalItems(remote: ItemsPayload): ItemsPayload {
  const keys = Object.keys(ITEM_KINDS) as ItemKey[];
  if (keys.some((key) => (remote[key]?.length ?? 0) > 0)) return remote;

  const state = useCrm.getState();
  const idMap = new Map<string, string>();
  const imported: ItemsPayload = { ...remote };
  let count = 0;

  for (const key of keys) {
    const local = state[key] as unknown as AnyItem[];
    imported[key] = local.map((item) => {
      const id = UUID.test(item.id) ? item.id : crypto.randomUUID();
      idMap.set(item.id, id);
      return { ...item, id };
    });
    count += local.length;
  }
  if (!count) return remote;

  // flow edges point at node ids, which just changed
  imported.flowEdges = (imported.flowEdges ?? []).map((edge) => ({
    ...edge,
    from: idMap.get(String(edge.from)) ?? edge.from,
    to: idMap.get(String(edge.to)) ?? edge.to,
  }));
  for (const key of keys) for (const item of imported[key] ?? []) persistItem(key, item);
  return imported;
}

export function useCoreSync() {
  const user = useAuth((s) => s.user);
  const status = useAuth((s) => s.status);
  const hydrateCore = useCrm((s) => s.hydrateCore);
  const pushToast = useUi((s) => s.pushToast);

  useEffect(() => {
    if (getWorkspace() !== "official" || status !== "authenticated" || !user) return;
    let cancelled = false;
    let stopRealtime = () => {};
    let lastSync = 0;

    const load = async (first: boolean) => {
      const data = await loadCore();
      if (cancelled) return;
      if (!data) {
        if (first) pushToast("Núcleo comercial offline — confira as migrations no Supabase.");
        return;
      }
      const [durable, items] = await Promise.all([loadDurable(), loadItems()]);
      if (cancelled) return;

      if (first) usePermissions.getState().setRole(await loadMyRole(user.id));
      lastSync = Date.now();
      markDurableReady(Boolean(durable));
      markItemsReady(Boolean(items));

      const payload = items && first ? importLocalItems(items) : items;
      hydrateCore({ ...data, ...(durable ?? {}), ...(payload ? { items: payload } : {}) });
      if (payload?.reportLayout) useReports.getState().hydrateWidgets(payload.reportLayout);

      if (first) {
        stopRealtime = startRealtime();
        if (!durable) pushToast("Arquivos, faturas e chat ainda neste navegador — rode as migrations.");
        else if (!items) pushToast("Tarefas, leads e notas ainda neste navegador — rode a migration de papéis.");
      }
    };

    void load(true);

    // Safety net for missed live events (laptop asleep, network drop).
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastSync > 60_000) void load(false);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      stopRealtime();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, status, hydrateCore, pushToast]);
}
