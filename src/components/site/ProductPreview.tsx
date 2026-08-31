import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { STAGES } from "@/lib/stages";

// Hues stay in the brand's blue → indigo → violet range (matches the logo mark:
// #2563eb, #7c3aed, #0ea5e9) — no green, this is illustrative, not the literal
// won/lost status colors used inside the real app.
const kpis = [
  { label: "Pipeline aberto", value: "R$ 4,2M", hint: "38 negócios" },
  { label: "Ganho no mês", value: "R$ 610 mil", hint: "12 fechamentos" },
  { label: "Contatos ativos", value: "312", hint: "48 contas" },
];

const board: { stage: (typeof STAGES)[number]; deals: { name: string; value: string; initials: string; hue: number }[] }[] = [
  {
    stage: STAGES[0],
    deals: [
      { name: "Nimbus Logística", value: "R$ 92k", initials: "NL", hue: 199 },
      { name: "Lumen Fintech", value: "R$ 64k", initials: "LF", hue: 262 },
    ],
  },
  {
    stage: STAGES[2],
    deals: [{ name: "Vértice Saúde", value: "R$ 241k", initials: "VS", hue: 222 }],
  },
  {
    stage: STAGES[3],
    deals: [{ name: "Atlas Industrial", value: "R$ 184k", initials: "AI", hue: 217 }],
  },
];

export function ProductPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [36, -36]);
  const rotate = useTransform(scrollYProgress, [0, 1], [2.5, -2.5]);

  return (
    <div ref={ref} className="relative mx-auto mt-16 max-w-4xl px-5">
      <div
        className="pointer-events-none absolute -inset-x-10 -inset-y-16 -z-10 opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 20%, color-mix(in srgb, var(--accent) 30%, transparent), transparent), radial-gradient(50% 50% at 80% 80%, #ffd8f3aa, transparent)",
        }}
        aria-hidden
      />
      <motion.div
        style={{ y, rotate }}
        initial={{ opacity: 0, y: 60, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden rounded-container border border-stone-divider bg-snow-canvas/90 shadow-lift backdrop-blur-xl"
      >
        <div className="flex items-center gap-1.5 border-b border-stone-divider px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-royal-signal/70" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-royal-signal/45" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-royal-signal/25" aria-hidden />
          <span className="mono ml-3 text-[11px] text-ash-helper">app.orbio.app.br/pipeline</span>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="rounded-pipeline bg-fog-surface p-4"
            >
              <p className="text-[11px] text-ash-helper">{kpi.label}</p>
              <p className="mt-1 font-mono text-[20px] tracking-[-0.03em] text-midnight-ink">{kpi.value}</p>
              <p className="mt-0.5 text-[11px] text-slate-caption">{kpi.hint}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-3 px-5 pb-6 sm:grid-cols-3">
          {board.map((column, ci) => (
            <div key={column.stage.id} className="rounded-pipeline bg-fog-surface/60 p-3">
              <div className="mb-2 flex items-center gap-1.5 px-1">
                <span className="h-1.5 w-1.5 rounded-full bg-royal-signal" aria-hidden />
                <span className="mono text-[10px] text-ash-helper">{column.stage.label}</span>
              </div>
              <div className="space-y-2">
                {column.deals.map((deal, di) => (
                  <motion.div
                    key={deal.name}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.25 + ci * 0.1 + di * 0.06 }}
                    className="rounded-input bg-snow-canvas p-3 shadow-card"
                  >
                    <p className="text-[12px] font-medium text-midnight-ink">{deal.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-caption">{deal.value}</span>
                      <Avatar initials={deal.initials} hue={deal.hue} size="sm" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
