import { CalendarDays, Columns3, LayoutList, Table2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useUi, type ViewMode } from "@/store/useUi";

const modes: { id: ViewMode; label: string; icon: typeof Columns3 }[] = [
  { id: "table", label: "Tabela", icon: Table2 },
  { id: "list", label: "Lista", icon: LayoutList },
  { id: "board", label: "Kanban", icon: Columns3 },
  { id: "calendar", label: "Calendário", icon: CalendarDays },
];

export function ViewSwitcher() {
  const viewMode = useUi((s) => s.viewMode);
  const setViewMode = useUi((s) => s.setViewMode);

  return (
    <div className="inline-flex rounded-pill bg-fog-surface p-0.5">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setViewMode(mode.id)}
          title={mode.label}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-pill px-2.5 text-[12px]",
            viewMode === mode.id ? "bg-snow-canvas text-midnight-ink shadow-card" : "text-ash-helper hover:text-midnight-ink",
          )}
        >
          <mode.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
