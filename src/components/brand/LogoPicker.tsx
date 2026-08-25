import { cn } from "@/lib/cn";
import { useUi } from "@/store/useUi";
import { LOGO_OPTIONS, OrbMark } from "@/components/brand/Logo";

export function LogoPicker({
  className,
  title = "Símbolo animado · clique para usar no CRM",
}: {
  className?: string;
  title?: string;
}) {
  const logoVariant = useUi((s) => s.logoVariant);
  const setLogoVariant = useUi((s) => s.setLogoVariant);

  return (
    <div className={className}>
      <p className="mb-2 px-1 text-[11px] text-ash-helper">{title}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {LOGO_OPTIONS.map((option) => {
          const selected = logoVariant === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setLogoVariant(option.id)}
              className={cn(
                "rounded-2xl px-3 py-3 text-left transition",
                selected
                  ? "bg-white shadow-card ring-2 ring-midnight-ink"
                  : "bg-fog-surface hover:bg-lavender-wash",
              )}
            >
              <OrbMark size={36} variant={option.id} />
              <p className="mt-2 text-[12px] font-medium text-midnight-ink">{option.label}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-ash-helper">{option.note}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
