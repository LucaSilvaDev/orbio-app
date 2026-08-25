import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "blue" | "mint" | "coral" | "amber" | "neutral";

const tones: Record<Tone, string> = {
  blue: "bg-lavender-wash text-royal-signal",
  mint: "bg-[#e9f8ef] text-[#177245]",
  coral: "bg-[#fdeeee] text-[#b42318]",
  amber: "bg-[#fff6e5] text-[#a15c07]",
  neutral: "bg-fog-surface text-slate-caption",
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
        "inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
