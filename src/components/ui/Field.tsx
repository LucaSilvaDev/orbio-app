import type { ReactNode } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mono mb-1.5 block text-[11px] text-ash-helper">
        {label}
      </span>
      {children}
    </label>
  );
}
