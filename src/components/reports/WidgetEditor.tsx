import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Gauge,
  Hash,
  Layers,
  PieChart,
  Table2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { WidgetBody } from "@/components/reports/WidgetView";
import { useCrm } from "@/store/useCrm";
import { useUi } from "@/store/useUi";
import { cn } from "@/lib/cn";
import {
  CHART_TYPES,
  filterOptions,
  resolveColor,
  runWidget,
  SOURCES,
  WIDGET_COLORS,
  type ChartType,
  type SourceId,
  type Widget,
} from "@/lib/reportEngine";

const ICONS: Record<ChartType, LucideIcon> = {
  kpi: Hash,
  bar: BarChart3,
  line: TrendingUp,
  area: Activity,
  donut: PieChart,
  gauge: Gauge,
  funnel: Layers,
  table: Table2,
};

const SPANS: { id: Widget["span"]; label: string }[] = [
  { id: 1, label: "Pequeno" },
  { id: 2, label: "Médio" },
  { id: 3, label: "Grande" },
  { id: 4, label: "Largura total" },
];

type Draft = Omit<Widget, "id">;

const selectClass =
  "h-10 w-full rounded-pill bg-midnight-ink/5 px-3 text-[13px] text-midnight-ink outline-none focus:shadow-focus";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="app-eyebrow mb-1.5 block !text-[10px]">{children}</span>;
}

function firstDraft(): Draft {
  return { type: "bar", title: "", source: "deals", measure: "count", dimension: "stage", span: 2, color: "accent" };
}

export function WidgetEditor({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Widget | null;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const accent = useUi((s) => s.accent);
  const { deals, leads, invoices, activities, contacts, companies } = useCrm();
  const [draft, setDraft] = useState<Draft>(firstDraft);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const { id: _id, ...rest } = initial;
      setDraft(rest);
    } else {
      setDraft(firstDraft());
    }
  }, [open, initial]);

  const source = SOURCES[draft.source];
  const typeInfo = CHART_TYPES.find((t) => t.id === draft.type)!;
  const temporalDims = source.dims.filter((d: { temporal?: boolean }) => d.temporal);
  const dimOptions = draft.type === "kpi" ? temporalDims : source.dims;
  const crm = useMemo(
    () => ({ deals, leads, invoices, activities, contacts, companies }),
    [deals, leads, invoices, activities, contacts, companies],
  );
  const filterValues = useMemo(
    () => (draft.filterDim ? filterOptions(draft.source, draft.filterDim, crm, { companies }) : []),
    [draft.source, draft.filterDim, crm, companies],
  );

  const patch = (next: Partial<Draft>) => setDraft((d) => ({ ...d, ...next }));

  const setType = (type: ChartType) => {
    const info = CHART_TYPES.find((t) => t.id === type)!;
    const temporal = source.dims.find((d: { temporal?: boolean }) => d.temporal)?.id as string | undefined;
    let dimension = draft.dimension;
    if (type === "gauge") dimension = undefined;
    else if (type === "kpi") dimension = temporal;
    else if (info.needsDimension) {
      const preferred = type === "line" || type === "area" ? temporal : undefined;
      dimension = preferred ?? (source.dims.some((d: { id: string }) => d.id === dimension) ? dimension : source.dims[0].id);
      if (type === "line" || type === "area") dimension = temporal ?? dimension;
    }
    patch({
      type,
      dimension,
      goal: type === "gauge" ? (draft.goal ?? 100000) : draft.goal,
      span: type === "kpi" ? 1 : draft.span === 1 && type !== "gauge" && type !== "donut" ? 2 : draft.span,
    });
  };

  const setSource = (id: SourceId) => {
    const next = SOURCES[id];
    const temporal = next.dims.find((d: { temporal?: boolean }) => d.temporal)?.id as string | undefined;
    patch({
      source: id,
      measure: next.measures[0].id,
      dimension:
        draft.type === "gauge" ? undefined : draft.type === "kpi" ? temporal : next.dims[0].id,
      filterDim: undefined,
      filterVal: undefined,
    });
  };

  const autoTitle = () => {
    const m = source.measures.find((x: { id: string }) => x.id === draft.measure)?.label ?? "";
    const d = source.dims.find((x: { id: string }) => x.id === draft.dimension)?.label;
    return d && draft.type !== "kpi" ? `${m} por ${d.toLowerCase()}` : m;
  };

  const preview: Widget = { ...draft, id: "preview", title: draft.title || autoTitle() };
  const previewResult = runWidget(preview, crm);
  const valid = draft.type === "gauge" ? (draft.goal ?? 0) > 0 : !typeInfo.needsDimension || Boolean(draft.dimension);

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Editar gráfico" : "Novo gráfico"} wide>
      <div className="grid max-h-[72vh] gap-6 overflow-y-auto pr-1 md:grid-cols-[1.05fr_1fr]">
        <div className="space-y-4">
          <div>
            <Label>Tipo de gráfico</Label>
            <div className="grid grid-cols-4 gap-2">
              {CHART_TYPES.map((t) => {
                const Icon = ICONS[t.id];
                const on = draft.type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    title={t.hint}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-[16px] px-1 py-2.5 text-[11px] transition-colors",
                      on
                        ? "bg-royal-signal/12 font-medium text-royal-signal ring-1 ring-royal-signal/40"
                        : "bg-midnight-ink/5 text-slate-caption hover:bg-midnight-ink/10",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-ash-helper">{typeInfo.hint}</p>
          </div>

          <label className="block">
            <Label>Título</Label>
            <input
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder={autoTitle()}
              className={selectClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <Label>Fonte dos dados</Label>
              <select value={draft.source} onChange={(e) => setSource(e.target.value as SourceId)} className={selectClass}>
                {Object.values(SOURCES).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <Label>O que medir</Label>
              <select value={draft.measure} onChange={(e) => patch({ measure: e.target.value })} className={selectClass}>
                {source.measures.map((m: { id: string; label: string }) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {draft.type !== "gauge" ? (
            <label className="block">
              <Label>{draft.type === "kpi" ? "Tendência por" : "Agrupar por"}</Label>
              <select
                value={draft.dimension ?? ""}
                onChange={(e) => patch({ dimension: e.target.value || undefined })}
                className={selectClass}
              >
                {draft.type === "kpi" ? <option value="">Sem tendência</option> : null}
                {dimOptions.map((d: { id: string; label: string }) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block">
              <Label>Meta (na mesma unidade da métrica)</Label>
              <input
                type="number"
                min={1}
                value={draft.goal ?? ""}
                onChange={(e) => patch({ goal: Number(e.target.value) })}
                className={selectClass}
              />
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <Label>Filtrar por (opcional)</Label>
              <select
                value={draft.filterDim ?? ""}
                onChange={(e) => patch({ filterDim: e.target.value || undefined, filterVal: undefined })}
                className={selectClass}
              >
                <option value="">Sem filtro</option>
                {source.dims.map((d: { id: string; label: string }) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <Label>Valor do filtro</Label>
              <select
                value={draft.filterVal ?? ""}
                disabled={!draft.filterDim}
                onChange={(e) => patch({ filterVal: e.target.value || undefined })}
                className={cn(selectClass, "disabled:opacity-40")}
              >
                <option value="">Todos</option>
                {filterValues.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <Label>Largura no painel</Label>
            <div className="grid grid-cols-4 gap-2">
              {SPANS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => patch({ span: s.id })}
                  className={cn(
                    "rounded-pill px-2 py-2 text-[11px] transition-colors",
                    draft.span === s.id
                      ? "bg-midnight-ink text-snow-canvas"
                      : "bg-midnight-ink/5 text-slate-caption hover:bg-midnight-ink/10",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Cor</Label>
            <div className="flex gap-2">
              {WIDGET_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={c.label}
                  title={c.label}
                  onClick={() => patch({ color: c.id })}
                  className={cn(
                    "h-7 w-7 rounded-full transition-transform hover:scale-110",
                    draft.color === c.id && "ring-2 ring-midnight-ink ring-offset-2 ring-offset-snow-canvas",
                  )}
                  style={{ background: resolveColor(c.id, accent) }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="md:sticky md:top-0 md:self-start">
          <Label>Pré-visualização</Label>
          <div className="glass rounded-[24px] p-5">
            <p className="text-[14px] font-medium text-midnight-ink">{preview.title}</p>
            <p className="mb-3 text-[11px] text-ash-helper">
              {previewResult.sourceLabel} · {previewResult.measureLabel}
              {previewResult.dimensionLabel ? ` · por ${previewResult.dimensionLabel.toLowerCase()}` : ""}
            </p>
            <div className={cn(draft.type === "table" || draft.type === "funnel" || draft.type === "kpi" ? "" : "h-[230px]")}>
              <WidgetBody widget={preview} result={previewResult} />
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ash-helper">
            Os dados vêm do seu CRM em tempo real. Não é preciso escrever consultas: combine fonte, métrica e agrupamento.
          </p>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="soft" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="dark"
          disabled={!valid}
          onClick={() => onSave({ ...draft, title: draft.title.trim() || autoTitle() })}
        >
          {initial ? "Salvar alterações" : "Adicionar ao painel"}
        </Button>
      </div>
    </Modal>
  );
}
