import { currentWorkspaceId, isOfficialCloud } from "@/services/core";
import { guard } from "@/services/guard";
import { supabase } from "@/services/supabase";
import type { Widget } from "@/lib/reportEngine";

/**
 * Small modules (leads, tasks, notes, calendar, products, campaigns, maps) share one
 * table, `workspace_items`, with the record stored as JSON. One RLS policy, one audit
 * trigger and one Realtime subscription cover all of them.
 */
export const ITEM_KINDS = {
  leads: "lead",
  activities: "activity",
  products: "product",
  campaigns: "campaign",
  notes: "note",
  reminders: "reminder",
  calendarEvents: "event",
  notifications: "notification",
  flowNodes: "flow_node",
  flowEdges: "flow_edge",
  mindNodes: "mind_node",
} as const;

export type ItemKey = keyof typeof ITEM_KINDS;

const KIND_TO_KEY = Object.fromEntries(
  Object.entries(ITEM_KINDS).map(([key, kind]) => [kind, key]),
) as Record<string, ItemKey>;

let itemsReady = false;
export const isItemsReady = () => itemsReady;
export const markItemsReady = (value: boolean) => {
  itemsReady = value;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidOrNull = (value: unknown) => (typeof value === "string" && UUID.test(value) ? value : null);

export type AnyItem = { id: string } & Record<string, unknown>;
type ItemRow = { id: string; kind: string; data: Record<string, unknown> | null };

/** `{ id, ...data }` — the shape the stores already use. */
export function itemFromRow(row: ItemRow): AnyItem {
  return { ...(row.data ?? {}), id: row.id };
}

export function itemKeyOfKind(kind: string): ItemKey | undefined {
  return KIND_TO_KEY[kind];
}

export type ItemsPayload = Partial<Record<ItemKey, AnyItem[]>> & { reportLayout?: Widget[] | null };

let layoutRowId: string | null = null;

export function setLayoutRowId(id: string) {
  layoutRowId = id;
}

export async function loadItems(): Promise<ItemsPayload | null> {
  const wid = currentWorkspaceId();
  if (!isOfficialCloud() || !supabase || !wid) return null;
  const { data, error } = await supabase
    .from("workspace_items")
    .select("id, kind, data")
    .eq("workspace_id", wid)
    .order("created_at", { ascending: false });
  if (error || !data) return null;

  const payload: ItemsPayload = {};
  for (const key of Object.keys(ITEM_KINDS) as ItemKey[]) payload[key] = [];
  payload.reportLayout = null;
  for (const row of data as ItemRow[]) {
    if (row.kind === "report_layout") {
      layoutRowId = row.id;
      const widgets = (row.data as { widgets?: Widget[] } | null)?.widgets;
      payload.reportLayout = Array.isArray(widgets) ? widgets : null;
      continue;
    }
    const key = KIND_TO_KEY[row.kind];
    if (key) payload[key]!.push(itemFromRow(row));
  }
  return payload;
}

const timers = new Map<string, number>();

function itemRow(key: ItemKey, item: AnyItem) {
  const { id, ...data } = item;
  return {
    id,
    workspace_id: currentWorkspaceId(),
    kind: ITEM_KINDS[key],
    data,
    owner_id: uuidOrNull(item.ownerId) ?? uuidOrNull(item.authorId),
  };
}

/** Upserts are debounced per record so dragging a map node doesn't write on every pixel. */
export function persistItem(key: ItemKey, item: AnyItem, mode: "upsert" | "delete" = "upsert") {
  if (!isOfficialCloud() || !supabase || !currentWorkspaceId() || !UUID.test(item.id)) return;
  const pending = timers.get(item.id);
  if (pending) window.clearTimeout(pending);
  timers.delete(item.id);

  if (mode === "delete") {
    guard(supabase.from("workspace_items").delete().eq("id", item.id));
    return;
  }
  const client = supabase;
  timers.set(
    item.id,
    window.setTimeout(() => {
      timers.delete(item.id);
      guard(client.from("workspace_items").upsert(itemRow(key, item)));
    }, 300),
  );
}

let layoutTimer = 0;

export function persistReportLayout(widgets: Widget[]) {
  if (!isOfficialCloud() || !supabase || !currentWorkspaceId()) return;
  window.clearTimeout(layoutTimer);
  const client = supabase;
  layoutTimer = window.setTimeout(() => {
    layoutRowId ??= crypto.randomUUID();
    guard(
      client.from("workspace_items").upsert({
        id: layoutRowId,
        workspace_id: currentWorkspaceId(),
        kind: "report_layout",
        data: { widgets },
      }),
    );
  }, 800);
}
