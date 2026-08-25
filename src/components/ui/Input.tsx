import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
export { Field } from "@/components/ui/Field";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-pill bg-fog-surface px-4 text-[13px] text-graphite-body placeholder:text-ash-helper",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-[22px] bg-fog-surface px-4 py-3 text-[13px] text-graphite-body placeholder:text-ash-helper",
        className,
      )}
      {...props}
    />
  );
}
