import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Columns3, GripVertical, Pencil, Trash2 } from "lucide-react";
import { WidgetBody, useWidgetResult } from "@/components/reports/WidgetView";
import { cn } from "@/lib/cn";
import type { Widget } from "@/lib/reportEngine";

const SPAN_CLASS: Record<Widget["span"], string> = {
  1: "",
  2: "md:col-span-2",
  3: "md:col-span-2 xl:col-span-3",
  4: "md:col-span-2 xl:col-span-4",
};

const BODY_CLASS: Partial<Record<Widget["type"], string>> = {
  bar: "h-[250px]",
  line: "h-[250px]",
  area: "h-[250px]",
  donut: "h-[230px]",
  gauge: "h-[170px]",
};

function IconButton({
  label,
  onClick,
  children,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full text-ash-helper transition-colors hover:bg-midnight-ink/8",
        danger ? "hover:text-coral-lost" : "hover:text-midnight-ink",
      )}
    >
      {children}
    </button>
  );
}

export function WidgetCard({
  widget,
  editing,
  onEdit,
  onRemove,
  onResize,
}: {
  widget: Widget;
  editing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onResize: () => void;
}) {
  const result = useWidgetResult(widget);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editing,
  });

  const compact = widget.type === "kpi";
  const subtitle = [result.measureLabel, result.dimensionLabel && !compact ? `por ${result.dimensionLabel.toLowerCase()}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(SPAN_CLASS[widget.span], isDragging && "relative z-30")}
    >
      <div
        className={cn(
          "glass flex h-full flex-col rounded-[26px] p-5 transition-shadow",
          compact ? "justify-between gap-4" : "gap-3",
          editing && "outline-dashed outline-1 outline-offset-2 outline-royal-signal/40",
          isDragging && "shadow-[0_30px_60px_-20px_rgb(20_30_60/0.45)]",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-1.5">
            {editing ? (
              <button
                type="button"
                aria-label="Arrastar para reordenar"
                title="Arraste para reordenar"
                className="-ml-1.5 mt-[-1px] flex h-7 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-ash-helper hover:bg-midnight-ink/8 active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            ) : null}
            <div className="min-w-0">
              <h3 className={cn("line-clamp-2 font-medium leading-tight text-midnight-ink", compact ? "text-[12px] !text-slate-caption" : "text-[16px]")}>
                {widget.title}
              </h3>
              {!compact ? <p className="truncate text-[11px] text-ash-helper">{subtitle}</p> : null}
            </div>
          </div>
          {editing ? (
            <div className="flex shrink-0 items-center">
              <IconButton label={`Largura: ${widget.span}/4 — clique para alterar`} onClick={onResize}>
                <Columns3 className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton label="Editar gráfico" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton label="Remover gráfico" onClick={onRemove} danger>
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          ) : null}
        </div>
        <div className={cn("min-h-0", BODY_CLASS[widget.type])}>
          <WidgetBody widget={widget} result={result} />
        </div>
      </div>
    </div>
  );
}
