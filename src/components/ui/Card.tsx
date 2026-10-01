import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  padded = true,
  tone = "glass",
}: {
  className?: string;
  children: ReactNode;
  padded?: boolean;
  /** `glass` = frosted default · `ink` = dark hero card (Finexa-style) */
  tone?: "glass" | "ink";
}) {
  return (
    <div
      className={cn(
        "glass rounded-[26px]",
        tone === "ink" && "glass--ink",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("glass rounded-container p-8", className)}>
      {children}
    </section>
  );
}
