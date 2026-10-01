import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Spark } from "@/components/ui/Viz";
import { useCrm } from "@/store/useCrm";
import { useUi } from "@/store/useUi";
import {
  formatValue,
  resolveColor,
  runWidget,
  SERIES_COLORS,
  type Format,
  type Point,
  type Widget,
  type WidgetResult,
} from "@/lib/reportEngine";

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid rgb(255 255 255 / 0.8)",
  background: "rgb(255 255 255 / 0.9)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 18px 40px -20px rgb(20 30 60 / 0.35)",
  fontSize: 12,
  color: "#1c1c1c",
};
const axisTick = { fill: "#8a90a0", fontSize: 11 };

export function useWidgetResult(widget: Widget): WidgetResult {
  const { deals, leads, invoices, activities, contacts, companies } = useCrm();
  return useMemo(
    () => runWidget(widget, { deals, leads, invoices, activities, contacts, companies }),
    [widget, deals, leads, invoices, activities, contacts, companies],
  );
}

function Empty() {
  return (
    <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1 text-center">
      <p className="text-[13px] font-medium text-slate-caption">Sem dados para mostrar</p>
      <p className="text-[12px] text-ash-helper">Cadastre registros ou troque a fonte deste gráfico.</p>
    </div>
  );
}

/** Semi-circle meter made of rounded ticks (Glucose gauge in the references). */
function Gauge({ value, goal, format, color }: { value: number; goal: number; format: Format; color: string }) {
  const ratio = goal > 0 ? Math.min(1, value / goal) : 0;
  const segments = 32;
  const filled = Math.round(ratio * segments);
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <svg viewBox="0 0 200 118" className="w-full max-w-[260px]" role="img" aria-label={`${Math.round(ratio * 100)}% da meta`}>
        {Array.from({ length: segments }).map((_, i) => {
          const angle = Math.PI - (i / (segments - 1)) * Math.PI;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const on = i < filled;
          return (
            <line
              key={i}
              x1={100 + cos * 62}
              y1={104 - sin * 62}
              x2={100 + cos * 86}
              y2={104 - sin * 86}
              stroke={on ? color : "currentColor"}
              strokeOpacity={on ? 0.35 + (i / segments) * 0.65 : 0.12}
              strokeWidth={5}
              strokeLinecap="round"
              className={on ? undefined : "text-midnight-ink"}
            />
          );
        })}
        <text x="100" y="86" textAnchor="middle" className="fill-midnight-ink" style={{ fontSize: 26, fontWeight: 300, letterSpacing: "-0.04em" }}>
          {Math.round(ratio * 100)}%
        </text>
        <text x="100" y="104" textAnchor="middle" className="fill-ash-helper" style={{ fontSize: 9 }}>
          {formatValue(value, format, true)} de {formatValue(goal, format, true)}
        </text>
      </svg>
    </div>
  );
}

function Donut({ series, format }: { series: Point[]; format: Format }) {
  const total = series.reduce((sum, p) => sum + p.value, 0);
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative h-44 flex-1 sm:h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={series}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={series.length > 1 ? 3 : 0}
              cornerRadius={8}
              stroke="none"
            >
              {series.map((_, i) => (
                <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatValue(Number(v), format)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="app-display text-[24px] text-midnight-ink">{formatValue(total, format, true)}</p>
          <p className="text-[10px] text-ash-helper">total</p>
        </div>
      </div>
      <ul className="grid shrink-0 gap-1.5 text-[12px] sm:w-[42%]">
        {series.slice(0, 6).map((p, i) => (
          <li key={p.name} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-slate-caption">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
              <span className="truncate">{p.name}</span>
            </span>
            <span className="font-medium text-midnight-ink">{total ? Math.round((p.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Funnel({ series, format }: { series: Point[]; format: Format }) {
  const total = series.reduce((sum, p) => sum + p.value, 0);
  return (
    <div className="flex h-full flex-col justify-center gap-5">
      <div className="flex h-10 w-full gap-1 overflow-hidden rounded-[14px]">
        {series.map((p, i) => (
          <div
            key={p.name}
            title={`${p.name}: ${formatValue(p.value, format)}`}
            className="hatch rounded-[6px] transition-all duration-700"
            style={{
              width: `${total ? Math.max(3, (p.value / total) * 100) : 100 / series.length}%`,
              background: SERIES_COLORS[i % SERIES_COLORS.length],
            }}
          />
        ))}
      </div>
      <ul className="grid gap-2">
        {series.map((p, i) => (
          <li key={p.name} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 font-medium text-midnight-ink">
              <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
              {p.name}
            </span>
            <span className="text-slate-caption">
              {formatValue(p.value, format)}
              <span className="ml-2 text-[11px] text-ash-helper">{total ? Math.round((p.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ranking({ series, format, color }: { series: Point[]; format: Format; color: string }) {
  const sorted = [...series].sort((a, b) => b.value - a.value).slice(0, 6);
  const max = Math.max(...sorted.map((p) => p.value), 1);
  return (
    <ul className="grid gap-2.5">
      {sorted.map((p, i) => (
        <li key={p.name} className="rounded-[16px] bg-midnight-ink/5 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2 font-medium text-midnight-ink">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-midnight-ink/8 text-[10px] text-slate-caption">
                {i + 1}
              </span>
              <span className="truncate">{p.name}</span>
            </span>
            <span className="shrink-0 font-medium text-midnight-ink">{formatValue(p.value, format)}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-midnight-ink/8">
            <div className="hatch h-full rounded-full transition-all duration-700" style={{ width: `${(p.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Bars({ series, format, color, id }: { series: Point[]; format: Format; color: string; id: string }) {
  const top = series.reduce((best, p, i) => (p.value > series[best].value ? i : best), 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={series} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={`bar-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.07} strokeDasharray="3 5" />
        <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" tickFormatter={(v: string) => (v.length > 11 ? `${v.slice(0, 10)}…` : v)} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => formatValue(Number(v), format, true)} width={64} />
        <Tooltip cursor={{ fill: "currentColor", fillOpacity: 0.05 }} contentStyle={tooltipStyle} formatter={(v) => formatValue(Number(v), format)} />
        <Bar dataKey="value" radius={[12, 12, 12, 12]} maxBarSize={44}>
          {series.map((_, i) => (
            <Cell key={i} fill={`url(#bar-${id})`} fillOpacity={i === top ? 1 : 0.62} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Trend({ series, format, color, id, filled }: { series: Point[]; format: Format; color: string; id: string; filled: boolean }) {
  const common = {
    data: series,
    margin: { top: 8, right: 8, left: -12, bottom: 0 },
  };
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.07} strokeDasharray="3 5" />
      <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
      <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => formatValue(Number(v), format, true)} width={64} />
      <Tooltip
        cursor={{ stroke: color, strokeOpacity: 0.25, strokeDasharray: "3 4" }}
        contentStyle={tooltipStyle}
        formatter={(v) => formatValue(Number(v), format)}
      />
    </>
  );
  const dot = { r: 3.5, fill: color, stroke: "#fff", strokeWidth: 2 };
  return (
    <ResponsiveContainer width="100%" height="100%">
      {filled ? (
        <AreaChart {...common}>
          <defs>
            <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {axes}
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.2} fill={`url(#area-${id})`} dot={dot} activeDot={{ ...dot, r: 5 }} />
        </AreaChart>
      ) : (
        <LineChart {...common}>
          {axes}
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.4} dot={dot} activeDot={{ ...dot, r: 5 }} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}

function Kpi({ result, color, hasTrend }: { result: WidgetResult; color: string; hasTrend: boolean }) {
  const values = result.series.map((p) => p.value);
  return (
    <div className="flex h-full items-end justify-between gap-3">
      <p className="app-display text-[32px] text-midnight-ink">{formatValue(result.total, result.format)}</p>
      {hasTrend && values.length > 1 ? <Spark values={values} color={color} /> : null}
    </div>
  );
}

/** Renders the right chart for a widget. Height is driven by the parent. */
export function WidgetBody({ widget, result: given }: { widget: Widget; result?: WidgetResult }) {
  const accent = useUi((s) => s.accent);
  const computed = useWidgetResult(widget);
  const result = given ?? computed;
  const color = resolveColor(widget.color, accent);
  const { series, format } = result;

  if (widget.type === "kpi") return <Kpi result={result} color={color} hasTrend={Boolean(widget.dimension)} />;
  if (widget.type === "gauge") return <Gauge value={result.total} goal={widget.goal ?? 0} format={format} color={color} />;
  if (!series.length || series.every((p) => p.value === 0)) return <Empty />;

  switch (widget.type) {
    case "bar":
      return <Bars series={series} format={format} color={color} id={widget.id} />;
    case "line":
      return <Trend series={series} format={format} color={color} id={widget.id} filled={false} />;
    case "area":
      return <Trend series={series} format={format} color={color} id={widget.id} filled />;
    case "donut":
      return <Donut series={series} format={format} />;
    case "funnel":
      return <Funnel series={series} format={format} />;
    case "table":
      return <Ranking series={series} format={format} color={color} />;
    default:
      return <Empty />;
  }
}
