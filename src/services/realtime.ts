import { currentWorkspaceId, isOfficialCloud, mapCompany, mapContact, mapDeal } from "@/services/core";
import { mapDocument, mapInvoice, mapMessage, mapThread } from "@/services/durable";
import { ITEM_KINDS, itemFromRow, itemKeyOfKind, type ItemKey } from "@/services/items";
import { supabase } from "@/services/supabase";
import { useCrm } from "@/store/useCrm";
import { useReports } from "@/store/useReports";
import type { Widget } from "@/lib/reportEngine";

type Row = Record<string, unknown>;
type Event = "INSERT" | "UPDATE" | "DELETE";

function upsert<T extends { id: string }>(list: T[], item: T, append = false): T[] {
  if (list.some((entry) => entry.id === item.id)) return list.map((entry) => (entry.id === item.id ? item : entry));
  return append ? [...list, item] : [item, ...list];
}

const without = <T extends { id: string }>(list: T[], id: string) => list.filter((entry) => entry.id !== id);

function apply<K extends keyof ReturnType<typeof useCrm.getState>>(
  key: K,
  event: Event,
  row: Row,
  old: Row,
  map: (row: Row) => { id: string },
  append = false,
) {
  const state = useCrm.getState();
  const list = state[key] as unknown as { id: string }[];
  if (event === "DELETE") {
    const id = String(old.id ?? "");
    if (id && list.some((entry) => entry.id === id)) useCrm.setState({ [key]: without(list, id) } as never);
    return;
  }
  useCrm.setState({ [key]: upsert(list, map(row), append) } as never);
}

/**
 * Live updates: when a teammate creates a deal, sends a chat message or edits a task,
 * it appears here without a reload. RLS still decides which rows each user receives.
 * (Realtime cannot filter DELETE events by column, so these subscriptions are unfiltered;
 * a delete only carries the row id, which is ignored if it isn't in this workspace's state.)
 */
export function startRealtime(): () => void {
  const wid = currentWorkspaceId();
  if (!isOfficialCloud() || !supabase || !wid) return () => {};
  const client = supabase;
  const channel = client.channel(`orbio:${wid}`);

  const listen = (table: string, handler: (event: Event, row: Row, old: Row) => void) =>
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => handler(payload.eventType as Event, payload.new as Row, payload.old as Row),
    );

  listen("companies", (e, r, o) => apply("companies", e, r, o, mapCompany));
  listen("contacts", (e, r, o) => apply("contacts", e, r, o, mapContact));
  listen("deals", (e, r, o) => apply("deals", e, r, o, mapDeal));
  listen("documents", (e, r, o) => apply("documents", e, r, o, mapDocument));
  listen("invoices", (e, r, o) => apply("invoices", e, r, o, mapInvoice));
  listen("chat_threads", (e, r, o) => apply("threads", e, r, o, mapThread));
  listen("chat_messages", (e, r, o) => apply("messages", e, r, o, mapMessage, true));

  listen("workspace_items", (event, row, old) => {
    if (event === "DELETE") {
      const id = String(old.id ?? "");
      const patch: Record<string, unknown> = {};
      for (const key of Object.keys(ITEM_KINDS) as ItemKey[]) {
        const list = useCrm.getState()[key] as unknown as { id: string }[];
        if (list.some((entry) => entry.id === id)) patch[key] = without(list, id);
      }
      if (Object.keys(patch).length) useCrm.setState(patch as never);
      return;
    }
    const kind = String(row.kind ?? "");
    if (kind === "report_layout") {
      const widgets = (row.data as { widgets?: Widget[] } | null)?.widgets;
      if (Array.isArray(widgets)) useReports.getState().hydrateWidgets(widgets);
      return;
    }
    const key = itemKeyOfKind(kind);
    if (!key) return;
    const item = itemFromRow({ id: String(row.id), kind, data: row.data as Row | null });
    const list = useCrm.getState()[key] as unknown as { id: string }[];
    useCrm.setState({ [key]: upsert(list, item as { id: string }) } as never);
  });

  channel.subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}
