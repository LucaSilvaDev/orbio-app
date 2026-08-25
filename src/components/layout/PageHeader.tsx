import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker ? (
          <p className="mono mb-1 text-[11px] text-ash-helper">{kicker}</p>
        ) : null}
        <h1 className="text-[28px] leading-[1.15] text-midnight-ink md:text-[32px]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-xl text-[13px] text-slate-caption">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full max-w-xs rounded-pill bg-fog-surface px-4 text-[13px] text-graphite-body placeholder:text-ash-helper"
    />
  );
}

export { Button };
