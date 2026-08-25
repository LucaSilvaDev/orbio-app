import { useEffect, useRef } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MAX_PIN, MIN_PIN } from "@/lib/vaultCrypto";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "ok"] as const;

export function PinPad({
  value,
  onChange,
  onSubmit,
  disabled,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (code: string) => void;
  disabled?: boolean;
  label: string;
}) {
  const valueRef = useRef(value);
  valueRef.current = value;

  function apply(next: string) {
    valueRef.current = next;
    onChange(next);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (disabled) return;
      const current = valueRef.current;
      if (event.key === "Enter" && current.length >= MIN_PIN) {
        event.preventDefault();
        onSubmit(current);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        apply(current.slice(0, -1));
        return;
      }
      if (/^\d$/.test(event.key) && current.length < MAX_PIN) {
        apply(current + event.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, onChange, onSubmit]);

  function press(key: (typeof KEYS)[number]) {
    if (disabled) return;
    const current = valueRef.current;
    if (key === "back") {
      apply(current.slice(0, -1));
      return;
    }
    if (key === "ok") {
      if (current.length >= MIN_PIN) onSubmit(current);
      return;
    }
    if (current.length < MAX_PIN) apply(current + key);
  }

  const slots = Math.max(MIN_PIN, value.length);

  return (
    <div>
      <p className="mono mb-3 text-center text-[11px] text-ash-helper">{label}</p>
      <div className="mb-4 flex min-h-8 justify-center gap-1.5">
        {Array.from({ length: slots }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full ${
              i < value.length ? "bg-midnight-ink" : "bg-stone-divider"
            }`}
          />
        ))}
      </div>
      <div className="mx-auto grid w-[240px] grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => press(key)}
            className={`flex h-12 items-center justify-center rounded-2xl text-[16px] font-medium transition-colors ${
              key === "ok"
                ? "bg-midnight-ink text-snow-canvas hover:opacity-90"
                : "bg-fog-surface text-midnight-ink hover:bg-lavender-wash"
            }`}
          >
            {key === "back" ? <Delete className="h-4 w-4" /> : key === "ok" ? "OK" : key}
          </button>
        ))}
      </div>
      {value.length > 0 && value.length < MIN_PIN ? (
        <p className="mt-3 text-center text-[12px] text-ash-helper">
          {MIN_PIN - value.length === 1
            ? "Falta 1 dígito"
            : `Faltam ${MIN_PIN - value.length} dígitos`}
        </p>
      ) : null}
      <div className="mt-3 flex justify-center">
        <Button variant="ghost" size="sm" disabled={disabled || !value} onClick={() => onChange("")}>
          Limpar
        </Button>
      </div>
    </div>
  );
}
