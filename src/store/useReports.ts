import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";
import { DEFAULT_WIDGETS, newWidgetId, type Widget } from "@/lib/reportEngine";
import { getWorkspace, workspaceStorage } from "@/lib/workspace";
import { persistReportLayout } from "@/services/items";
import { can, usePermissions } from "@/store/usePermissions";
import { useUi } from "@/store/useUi";

type ReportsState = {
  widgets: Widget[];
  addWidget: (widget: Omit<Widget, "id">) => void;
  updateWidget: (id: string, patch: Partial<Widget>) => void;
  removeWidget: (id: string) => void;
  moveWidget: (activeId: string, overId: string) => void;
  resetWidgets: () => void;
  /** Applies a layout that came from the cloud, without writing it back. */
  hydrateWidgets: (widgets: Widget[]) => void;
};

/**
 * Dashboard layout, shared by the whole workspace. Demo keeps it in this browser;
 * production also saves it to `workspace_items` (kind `report_layout`).
 */
export const useReports = create<ReportsState>()(
  persist(
    (set, get) => {
      const commit = (widgets: Widget[]) => {
        if (!can(usePermissions.getState().role, "any")) {
          useUi.getState().pushToast("Seu papel não permite alterar o painel.");
          return;
        }
        set({ widgets });
        if (getWorkspace() === "official") persistReportLayout(widgets);
      };
      return {
        widgets: DEFAULT_WIDGETS,
        addWidget: (widget) => commit([...get().widgets, { ...widget, id: newWidgetId() }]),
        updateWidget: (id, patch) =>
          commit(get().widgets.map((w) => (w.id === id ? { ...w, ...patch } : w))),
        removeWidget: (id) => commit(get().widgets.filter((w) => w.id !== id)),
        moveWidget: (activeId, overId) => {
          const list = get().widgets;
          const from = list.findIndex((w) => w.id === activeId);
          const to = list.findIndex((w) => w.id === overId);
          if (from >= 0 && to >= 0) commit(arrayMove(list, from, to));
        },
        resetWidgets: () => commit(DEFAULT_WIDGETS),
        hydrateWidgets: (widgets) => set({ widgets }),
      };
    },
    {
      name: "orbio-reports-layout",
      version: 1,
      storage: createJSONStorage(() => workspaceStorage),
    },
  ),
);
