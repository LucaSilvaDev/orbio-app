import type { Activity, Company, Contact, Deal, Invoice, Lead } from "@/types";
import { STAGES } from "@/lib/stages";
import { findUser } from "@/lib/records";
import { brl, compactBrl } from "@/lib/cn";

/**
 * Semantic layer for the report builder.
 *
 * Instead of asking users for SQL, every data source exposes a closed list of
 * "dimensions" (how to group: stage, month, owner…) and "measures" (what to
 * compute: count, sum, average…). A widget is just a choice from those lists,
 * so any combination is valid and safe by construction.
 */

export type SourceId = "deals" | "leads" | "invoices" | "activities" | "contacts" | "companies";
export type Format = "money" | "number" | "percent";
export type ChartType = "kpi" | "bar" | "line" | "area" | "donut" | "gauge" | "funnel" | "table";

export type CrmData = {
  deals: Deal[];
  leads: Lead[];
  invoices: Invoice[];
  activities: Activity[];
  contacts: Contact[];
  companies: Company[];
};

type Ctx = { companies: Company[] };

type Dim<T> = {
  id: string;
  label: string;
  temporal?: boolean;
  order?: string[];
  get: (row: T, ctx: Ctx) => string;
};

type Measure<T> = {
  id: string;
  label: string;
  format: Format;
  compute: (rows: T[]) => number;
};

type Source<T> = {
  id: SourceId;
  label: string;
  pick: (crm: CrmData) => T[];
  dims: Dim<T>[];
  measures: Measure<T>[];
};

const sum = <T,>(rows: T[], fn: (row: T) => number) => rows.reduce((acc, row) => acc + fn(row), 0);
const avg = <T,>(rows: T[], fn: (row: T) => number) => (rows.length ? sum(rows, fn) / rows.length : 0);

const month = (value: string | undefined) => (value && /^\d{4}-\d{2}/.test(value) ? value.slice(0, 7) : "Sem data");
const owner = (id: string) => findUser(id)?.name ?? "Sem responsável";
const companyName = (ctx: Ctx, id: string) => ctx.companies.find((c) => c.id === id)?.name ?? "Sem empresa";

const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label ?? id;
const leadStatus: Record<string, string> = {
  new: "Novo",
  working: "Em contato",
  qualified: "Qualificado",
  unqualified: "Desqualificado",
};
const invoiceStatus: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  paid: "Paga",
  overdue: "Vencida",
};
const activityType: Record<string, string> = {
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
  task: "Tarefa",
  note: "Nota",
};
const priority: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta" };

const isOpen = (d: Deal) => d.stage !== "won" && d.stage !== "lost";

const dealsSource: Source<Deal> = {
  id: "deals",
  label: "Oportunidades",
  pick: (crm) => crm.deals,
  dims: [
    { id: "stage", label: "Estágio", get: (d) => stageLabel(d.stage), order: STAGES.map((s) => s.label) },
    { id: "source", label: "Origem", get: (d) => d.source || "Sem origem" },
    { id: "owner", label: "Responsável", get: (d) => owner(d.ownerId) },
    { id: "company", label: "Empresa", get: (d, ctx) => companyName(ctx, d.companyId) },
    { id: "priority", label: "Prioridade", get: (d) => priority[d.priority] ?? d.priority },
    { id: "month", label: "Mês (atualização)", temporal: true, get: (d) => month(d.updatedAt) },
  ],
  measures: [
    { id: "count", label: "Quantidade de deals", format: "number", compute: (r) => r.length },
    { id: "sum", label: "Valor total", format: "money", compute: (r) => sum(r, (d) => d.value) },
    { id: "avg", label: "Ticket médio", format: "money", compute: (r) => avg(r, (d) => d.value) },
    { id: "won", label: "Valor ganho", format: "money", compute: (r) => sum(r.filter((d) => d.stage === "won"), (d) => d.value) },
    { id: "open", label: "Valor em aberto", format: "money", compute: (r) => sum(r.filter(isOpen), (d) => d.value) },
    {
      id: "weighted",
      label: "Forecast ponderado",
      format: "money",
      compute: (r) => sum(r.filter(isOpen), (d) => (d.value * d.probability) / 100),
    },
    {
      id: "winrate",
      label: "Taxa de ganho",
      format: "percent",
      compute: (r) => {
        const won = r.filter((d) => d.stage === "won").length;
        const closed = won + r.filter((d) => d.stage === "lost").length;
        return closed ? (won / closed) * 100 : 0;
      },
    },
    { id: "prob", label: "Probabilidade média", format: "percent", compute: (r) => avg(r, (d) => d.probability) },
  ],
};

const leadsSource: Source<Lead> = {
  id: "leads",
  label: "Leads",
  pick: (crm) => crm.leads,
  dims: [
    { id: "status", label: "Status", get: (l) => leadStatus[l.status] ?? l.status, order: Object.values(leadStatus) },
    { id: "source", label: "Origem", get: (l) => l.source || "Sem origem" },
    { id: "owner", label: "Responsável", get: (l) => owner(l.ownerId) },
    { id: "month", label: "Mês (criação)", temporal: true, get: (l) => month(l.createdAt) },
  ],
  measures: [
    { id: "count", label: "Quantidade de leads", format: "number", compute: (r) => r.length },
    { id: "score", label: "Score médio", format: "number", compute: (r) => avg(r, (l) => l.score) },
  ],
};

const invoicesSource: Source<Invoice> = {
  id: "invoices",
  label: "Faturas",
  pick: (crm) => crm.invoices,
  dims: [
    { id: "status", label: "Status", get: (i) => invoiceStatus[i.status] ?? i.status, order: Object.values(invoiceStatus) },
    { id: "company", label: "Empresa", get: (i, ctx) => companyName(ctx, i.companyId) },
    { id: "month", label: "Mês (emissão)", temporal: true, get: (i) => month(i.issuedAt) },
  ],
  measures: [
    { id: "count", label: "Quantidade de faturas", format: "number", compute: (r) => r.length },
    { id: "sum", label: "Valor total", format: "money", compute: (r) => sum(r, (i) => i.amount) },
    { id: "avg", label: "Valor médio", format: "money", compute: (r) => avg(r, (i) => i.amount) },
    { id: "paid", label: "Valor recebido", format: "money", compute: (r) => sum(r.filter((i) => i.status === "paid"), (i) => i.amount) },
  ],
};

const activitiesSource: Source<Activity> = {
  id: "activities",
  label: "Tarefas e atividades",
  pick: (crm) => crm.activities,
  dims: [
    { id: "type", label: "Tipo", get: (a) => activityType[a.type] ?? a.type },
    { id: "owner", label: "Responsável", get: (a) => owner(a.ownerId) },
    { id: "done", label: "Situação", get: (a) => (a.done ? "Concluída" : "Em aberto"), order: ["Em aberto", "Concluída"] },
    { id: "month", label: "Mês (prazo)", temporal: true, get: (a) => month(a.dueAt) },
  ],
  measures: [
    { id: "count", label: "Quantidade", format: "number", compute: (r) => r.length },
    {
      id: "donerate",
      label: "% concluídas",
      format: "percent",
      compute: (r) => (r.length ? (r.filter((a) => a.done).length / r.length) * 100 : 0),
    },
  ],
};

const contactsSource: Source<Contact> = {
  id: "contacts",
  label: "Pessoas",
  pick: (crm) => crm.contacts,
  dims: [
    { id: "owner", label: "Responsável", get: (c) => owner(c.ownerId) },
    { id: "company", label: "Empresa", get: (c, ctx) => companyName(ctx, c.companyId) },
    { id: "location", label: "Localização", get: (c) => c.location || "Sem local" },
    { id: "month", label: "Mês (último contato)", temporal: true, get: (c) => month(c.lastTouch) },
  ],
  measures: [
    { id: "count", label: "Quantidade de pessoas", format: "number", compute: (r) => r.length },
    { id: "score", label: "Score médio", format: "number", compute: (r) => avg(r, (c) => c.score) },
  ],
};

const companiesSource: Source<Company> = {
  id: "companies",
  label: "Empresas",
  pick: (crm) => crm.companies,
  dims: [
    { id: "industry", label: "Setor", get: (c) => c.industry || "Sem setor" },
    { id: "city", label: "Cidade", get: (c) => c.city || "Sem cidade" },
    { id: "owner", label: "Responsável", get: (c) => owner(c.ownerId) },
    { id: "month", label: "Mês (cadastro)", temporal: true, get: (c) => month(c.createdAt) },
  ],
  measures: [
    { id: "count", label: "Quantidade de empresas", format: "number", compute: (r) => r.length },
    { id: "arr", label: "Receita recorrente (ARR)", format: "money", compute: (r) => sum(r, (c) => c.arr) },
    { id: "health", label: "Saúde média", format: "number", compute: (r) => avg(r, (c) => c.health) },
  ],
};

// The union of row types is erased on purpose: widgets pick source/dim/measure by id.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SOURCES: Record<SourceId, Source<any>> = {
  deals: dealsSource,
  leads: leadsSource,
  invoices: invoicesSource,
  activities: activitiesSource,
  contacts: contactsSource,
  companies: companiesSource,
};

export type Widget = {
  id: string;
  type: ChartType;
  title: string;
  source: SourceId;
  measure: string;
  /** Group-by dimension. Optional for `kpi` (adds a trend) and `gauge` (unused). */
  dimension?: string;
  filterDim?: string;
  filterVal?: string;
  /** Gauge target, in the measure's own unit. */
  goal?: number;
  /** Column span in the 4-column grid. */
  span: 1 | 2 | 3 | 4;
  color: string;
};

export const CHART_TYPES: { id: ChartType; label: string; hint: string; needsDimension: boolean }[] = [
  { id: "kpi", label: "Indicador", hint: "Número grande com tendência", needsDimension: false },
  { id: "bar", label: "Barras", hint: "Comparar categorias", needsDimension: true },
  { id: "line", label: "Linha", hint: "Evolução no tempo", needsDimension: true },
  { id: "area", label: "Área", hint: "Evolução com volume", needsDimension: true },
  { id: "donut", label: "Rosca", hint: "Participação no total", needsDimension: true },
  { id: "gauge", label: "Medidor", hint: "Progresso até uma meta", needsDimension: false },
  { id: "funnel", label: "Funil", hint: "Faixa segmentada", needsDimension: true },
  { id: "table", label: "Ranking", hint: "Lista ordenada", needsDimension: true },
];

export const WIDGET_COLORS = [
  { id: "accent", label: "Destaque" },
  { id: "blue", label: "Azul", value: "#7c9cff" },
  { id: "violet", label: "Violeta", value: "#a78bfa" },
  { id: "pink", label: "Rosa", value: "#f472b6" },
  { id: "amber", label: "Âmbar", value: "#f2ae40" },
  { id: "mint", label: "Menta", value: "#22c07a" },
] as const;

export const SERIES_COLORS = ["#7c9cff", "#a78bfa", "#f2ae40", "#22c07a", "#f472b6", "#f04438", "#9aa0ae", "#4ac2d6"];

export function resolveColor(id: string, accent: string) {
  if (id === "accent") return accent;
  const found = WIDGET_COLORS.find((c) => c.id === id);
  return found && "value" in found ? found.value : accent;
}

export function monthLabel(key: string) {
  if (!/^\d{4}-\d{2}$/.test(key)) return key;
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${names[Number(key.slice(5)) - 1]}/${key.slice(2, 4)}`;
}

export function formatValue(value: number, format: Format, compact = false) {
  if (format === "money") return compact ? compactBrl.format(value) : brl.format(value);
  if (format === "percent") return `${Math.round(value)}%`;
  return Math.round(value * 10) / 10 === Math.round(value)
    ? Math.round(value).toLocaleString("pt-BR")
    : value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

export type Point = { name: string; value: number };
export type WidgetResult = {
  total: number;
  series: Point[];
  format: Format;
  measureLabel: string;
  dimensionLabel?: string;
  sourceLabel: string;
  rows: number;
};

export function filterOptions(sourceId: SourceId, dimId: string, crm: CrmData, ctx: Ctx) {
  const source = SOURCES[sourceId];
  const dim = source.dims.find((d) => d.id === dimId);
  if (!dim) return [];
  const values = new Set<string>();
  for (const row of source.pick(crm)) values.add(dim.get(row, ctx));
  return [...values].map((v) => (dim.temporal ? { value: v, label: monthLabel(v) } : { value: v, label: v }));
}

export function runWidget(widget: Widget, crm: CrmData): WidgetResult {
  const ctx: Ctx = { companies: crm.companies };
  const source = SOURCES[widget.source] ?? dealsSource;
  const measure = source.measures.find((m) => m.id === widget.measure) ?? source.measures[0];
  const dim = widget.dimension ? source.dims.find((d) => d.id === widget.dimension) : undefined;
  let rows = source.pick(crm);

  if (widget.filterDim && widget.filterVal) {
    const filterDim = source.dims.find((d) => d.id === widget.filterDim);
    if (filterDim) rows = rows.filter((row) => filterDim.get(row, ctx) === widget.filterVal);
  }

  const base = {
    total: measure.compute(rows),
    format: measure.format,
    measureLabel: measure.label,
    dimensionLabel: dim?.label,
    sourceLabel: source.label,
    rows: rows.length,
  };
  if (!dim) return { ...base, series: [] };

  const groups = new Map<string, unknown[]>();
  for (const row of rows) {
    const key = dim.get(row, ctx);
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }
  let series = [...groups.entries()].map(([key, bucket]) => ({ key, value: measure.compute(bucket) }));

  if (dim.temporal) {
    series = series.sort((a, b) => a.key.localeCompare(b.key)).slice(-12);
  } else if (dim.order) {
    const order = dim.order;
    series = series.sort((a, b) => {
      const ia = order.indexOf(a.key);
      const ib = order.indexOf(b.key);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  } else {
    series = series.sort((a, b) => b.value - a.value).slice(0, 10);
  }

  return {
    ...base,
    series: series.map((p) => ({ name: dim.temporal ? monthLabel(p.key) : p.key, value: p.value })),
  };
}

let seq = 0;
export const newWidgetId = () => `w_${Date.now().toString(36)}${(seq++).toString(36)}`;

export const DEFAULT_WIDGETS: Widget[] = [
  { id: "d1", type: "kpi", title: "Valor ganho", source: "deals", measure: "won", dimension: "month", span: 1, color: "accent" },
  { id: "d2", type: "kpi", title: "Valor em aberto", source: "deals", measure: "open", dimension: "month", span: 1, color: "blue" },
  { id: "d3", type: "kpi", title: "Faturas emitidas", source: "invoices", measure: "count", dimension: "month", span: 1, color: "violet" },
  { id: "d4", type: "kpi", title: "Leads no funil", source: "leads", measure: "count", dimension: "month", span: 1, color: "mint" },
  { id: "d5", type: "bar", title: "Valor por estágio", source: "deals", measure: "sum", dimension: "stage", span: 2, color: "accent" },
  { id: "d6", type: "donut", title: "Origem das oportunidades", source: "deals", measure: "count", dimension: "source", span: 1, color: "accent" },
  { id: "d7", type: "gauge", title: "Meta de receita", source: "deals", measure: "won", goal: 1000000, span: 1, color: "accent" },
  { id: "d8", type: "area", title: "Receita ganha por mês", source: "deals", measure: "won", dimension: "month", span: 2, color: "accent" },
  { id: "d9", type: "funnel", title: "Pipeline por estágio", source: "deals", measure: "sum", dimension: "stage", span: 2, color: "accent" },
  { id: "d10", type: "table", title: "Maiores empresas por valor", source: "deals", measure: "sum", dimension: "company", span: 2, color: "blue" },
  { id: "d11", type: "donut", title: "Faturas por status", source: "invoices", measure: "count", dimension: "status", span: 1, color: "accent" },
  { id: "d12", type: "bar", title: "Atividades por tipo", source: "activities", measure: "count", dimension: "type", span: 1, color: "violet" },
];
