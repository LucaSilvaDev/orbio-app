import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "ghost" | "outline" | "dark" | "soft" | "accent";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
};

const variants: Record<Variant, string> = {
  ghost: "bg-transparent text-graphite-body hover:bg-fog-surface",
  outline:
    "glass text-graphite-body hover:bg-snow-canvas/90 hover:-translate-y-px",
  dark: "bg-midnight-ink text-snow-canvas shadow-[0_12px_24px_-14px_var(--ink)] hover:opacity-90",
  accent:
    "bg-royal-signal text-white shadow-[0_12px_26px_-12px_var(--accent)] hover:opacity-90 hover:-translate-y-px",
  soft: "bg-midnight-ink/6 text-graphite-body hover:bg-midnight-ink/10",
};

export function Button({
  className,
  variant = "outline",
  size = "md",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-pill font-medium transition-all duration-300 disabled:opacity-40",
        size === "sm" ? "h-8 px-3 text-[12px]" : "h-10 px-4 text-[13px]",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
