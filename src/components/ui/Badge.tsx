import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "blue" | "mint" | "coral" | "amber" | "neutral" | "lime";

const tones: Record<Tone, string> = {
  blue: "bg-royal-signal/10 text-royal-signal [html[data-theme=dark]_&]:text-[#aab6ff]",
  mint: "bg-[#2ee47a]/15 text-[#177245] [html[data-theme=dark]_&]:text-[#6fe9a4]",
  coral: "bg-[#f04438]/12 text-[#b42318] [html[data-theme=dark]_&]:text-[#ff8f86]",
  amber: "bg-[#f2ae40]/18 text-[#a15c07] [html[data-theme=dark]_&]:text-[#f7c167]",
  neutral: "bg-midnight-ink/6 text-slate-caption",
  lime: "bg-[var(--highlight)] text-[#1c1c1c]",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
