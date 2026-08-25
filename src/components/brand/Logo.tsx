import { cn } from "@/lib/cn";
import { useUi, type LogoVariant } from "@/store/useUi";

export const LOGO_OPTIONS: { id: LogoVariant; label: string; note: string }[] = [
  { id: "orbit", label: "Órbita", note: "Núcleo + anel elíptico" },
  { id: "rings", label: "Anéis", note: "Dois raios em sentidos opostos" },
  { id: "pulse", label: "Sinal", note: "Ondas de radar saindo do centro" },
  { id: "trio", label: "Trio", note: "Empresa, pessoa e deal" },
  { id: "loop", label: "Loop", note: "O de Orbio em traço contínuo" },
];

export function OrbMark({
  size = 24,
  className,
  variant,
  animated = true,
}: {
  size?: number;
  className?: string;
  variant?: LogoVariant;
  animated?: boolean;
}) {
  const stored = useUi((s) => s.logoVariant);
  const kind = variant ?? stored;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("orb-mark", animated && "is-live", `orb-mark--${kind}`, className)}
      aria-hidden
    >
      {kind === "orbit" ? (
        <>
          <circle className="orb-core" cx="24" cy="24" r="8.5" />
          <g className="orb-spin-g">
            <ellipse className="orb-ring" cx="24" cy="24" rx="16" ry="7.2" />
            <circle className="orb-sat" cx="40" cy="24" r="2.4" />
          </g>
        </>
      ) : null}
      {kind === "rings" ? (
        <>
          <circle className="orb-ring orb-ring-dash" cx="24" cy="24" r="11.5" />
          <circle className="orb-ring orb-ring-dash-outer" cx="24" cy="24" r="18" />
          <circle className="orb-core" cx="24" cy="24" r="5.2" />
          <g className="orb-spin-g">
            <circle className="orb-sat" cx="35.5" cy="24" r="2.2" />
          </g>
          <g className="orb-spin-rev">
            <circle className="orb-p2" cx="24" cy="6" r="2.4" />
            <circle className="orb-p3" cx="42" cy="24" r="1.8" />
          </g>
        </>
      ) : null}
      {kind === "pulse" ? (
        <>
          <circle className="orb-wave orb-wave-a" cx="24" cy="24" r="11" />
          <circle className="orb-wave orb-wave-b" cx="24" cy="24" r="16" />
          <circle className="orb-core" cx="24" cy="24" r="7" />
        </>
      ) : null}
      {kind === "trio" ? (
        <>
          <circle className="orb-path" cx="24" cy="24" r="15" />
          <g className="orb-planets">
            <circle className="orb-p3" cx="16.5" cy="11" r="3" />
            <circle className="orb-p2" cx="11" cy="31.5" r="2.7" />
            <circle className="orb-p1" cx="37" cy="31.5" r="2.9" />
          </g>
        </>
      ) : null}
      {kind === "loop" ? (
        <path
          className="orb-loop"
          d="M16 24c0-6.6 4.5-11 8.8-11 5.8 0 8.7 5.2 8.7 11s-2.9 11-8.7 11c-3.4 0-6.2-2-7.6-5.2"
        />
      ) : null}
    </svg>
  );
}

export function Logo({
  size = 24,
  className,
  wordmark = false,
  inverted = false,
  variant,
}: {
  size?: number;
  className?: string;
  wordmark?: boolean;
  inverted?: boolean;
  variant?: LogoVariant;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <OrbMark size={size} variant={variant} />
      {wordmark ? (
        <span
          className={cn(
            "text-[15px] font-medium tracking-[-0.04em]",
            inverted ? "text-white" : "text-midnight-ink",
          )}
        >
          orbio
        </span>
      ) : null}
    </div>
  );
}
