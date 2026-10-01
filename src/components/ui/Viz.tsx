import { useId } from "react";
import { cn } from "@/lib/cn";

/** Tiny vertical bars (Flux / CareNest header stats). Values are normalised to the max. */
export function MiniBars({
  values,
  className,
  highlightLast = true,
}: {
  values: number[];
  className?: string;
  highlightLast?: boolean;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className={cn("flex h-9 items-end gap-[3px]", className)} aria-hidden>
      {values.map((value, index) => {
        const last = highlightLast && index === values.length - 1;
        return (
          <span
            key={index}
            style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
            className={cn(
              "w-[5px] rounded-full transition-all",
              last ? "bg-royal-signal" : "bg-midnight-ink/15",
            )}
          />
        );
      })}
    </div>
  );
}

/** Dotted progress strip — filled ticks in accent, empty ticks muted (Flux "Cost" meter). */
export function TickMeter({
  value,
  ticks = 28,
  className,
}: {
  value: number;
  ticks?: number;
  className?: string;
}) {
  const filled = Math.round(Math.min(1, Math.max(0, value)) * ticks);
  return (
    <div className={cn("flex h-7 items-end gap-[3px]", className)} aria-hidden>
      {Array.from({ length: ticks }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "w-[3px] rounded-full",
            index < filled ? "h-full bg-royal-signal" : "h-[55%] bg-midnight-ink/15",
          )}
        />
      ))}
    </div>
  );
}

/** Smooth sparkline (SVG) with a soft area fill. */
export function Spark({
  values,
  className,
  color = "var(--accent)",
}: {
  values: number[];
  className?: string;
  color?: string;
}) {
  const gradId = useId();
  const data = values.length > 1 ? values : [0, ...values, ...values];
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const w = 120;
  const h = 36;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - 4 - ((v - min) / span) * (h - 8),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-9 w-[120px]", className)} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3" fill={color} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

/** Small pill used for deltas / context (e.g. "▲ 42% conversão"). */
export function Chip({
  children,
  tone = "mint",
  className,
}: {
  children: React.ReactNode;
  tone?: "mint" | "coral" | "neutral" | "blue";
  className?: string;
}) {
  const tones = {
    mint: "bg-[#2ee47a]/15 text-[#177245] [html[data-theme=dark]_&]:text-[#6fe9a4]",
    coral: "bg-[#f04438]/12 text-[#b42318] [html[data-theme=dark]_&]:text-[#ff8f86]",
    blue: "bg-royal-signal/10 text-royal-signal [html[data-theme=dark]_&]:text-[#aab6ff]",
    neutral: "bg-midnight-ink/6 text-slate-caption",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
