import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-pipeline bg-snow-canvas/80 shadow-card backdrop-blur-xl",
        padded && "p-4",
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
    <section className={cn("rounded-container bg-snow-canvas/80 p-8 shadow-lift backdrop-blur-xl", className)}>
      {children}
    </section>
  );
}
