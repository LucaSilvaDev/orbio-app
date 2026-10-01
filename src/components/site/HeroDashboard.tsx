import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Bell, CheckCircle2, MessageSquare, Workflow } from "lucide-react";
import { MiniBars, TickMeter } from "@/components/ui/Viz";
import { Avatar } from "@/components/ui/Avatar";

/** Product mock built from the same visual language as the app. Sample data, no screenshots. */

function Count({ to, money = false }: { to: number; money?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const format = (v: number) =>
      money
        ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
        : Math.round(v).toLocaleString("pt-BR");
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [inView, to, money]);
  return <span ref={ref}>{money ? "R$ 0" : "0"}</span>;
}

function smooth(points: [number, number][]) {
  return points.reduce((path, [x, y], i, all) => {
    if (i === 0) return `M${x} ${y}`;
    const [px, py] = all[i - 1];
    const cx = (px + x) / 2;
    return `${path} C${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, "");
}

const WON: [number, number][] = [[0, 104], [60, 96], [120, 84], [180, 88], [240, 62], [300, 48], [360, 30], [400, 22]];
const PIPE: [number, number][] = [[0, 70], [60, 64], [120, 72], [180, 52], [240, 56], [300, 38], [360, 42], [400, 34]];

function AreaChart() {
  const line = smooth(WON);
  return (
    <svg viewBox="0 0 400 130" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[30, 62, 94].map((y) => (
        <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 5" />
      ))}
      <motion.path
        d={smooth(PIPE)}
        fill="none"
        stroke="#7c9cff"
        strokeWidth="1.6"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />
      <motion.path
        d={`${line} L400 130 L0 130 Z`}
        fill="url(#hero-area)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.6 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: "easeOut" }}
      />
      <motion.circle
        cx="400"
        cy="22"
        r="4.5"
        fill="var(--accent)"
        stroke="#fff"
        strokeWidth="2"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.7, type: "spring" }}
      />
    </svg>
  );
}

const SEGMENTS = [
  { color: "#7c9cff", value: 34 },
  { color: "#a78bfa", value: 26 },
  { color: "#f2ae40", value: 18 },
  { color: "#22c07a", value: 22 },
];

function Donut() {
  const r = 38;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
      {SEGMENTS.map((seg, i) => {
        const length = (seg.value / 100) * c - 4;
        const el = (
          <motion.circle
            key={seg.color}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDashoffset={-offset}
            initial={{ opacity: 0, strokeDasharray: `0 ${c}` }}
            whileInView={{ opacity: 1, strokeDasharray: `${length} ${c}` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3 + i * 0.18 }}
          />
        );
        offset += (seg.value / 100) * c;
        return el;
      })}
    </svg>
  );
}

const DEALS = [
  { name: "Vértice — CRM clínico", who: "Marina", stage: "Negociação", value: "R$ 78.000", tone: "bg-[#f2ae40]/18 text-[#a15c07]" },
  { name: "Aurora — Revenue OS", who: "Lucas", stage: "Proposta", value: "R$ 42.000", tone: "bg-royal-signal/10 text-royal-signal" },
  { name: "Costa — Hoteleiro", who: "Sofia", stage: "Ganho", value: "R$ 26.500", tone: "bg-[#2ee47a]/15 text-[#177245]" },
];

function Floating({
  className,
  delay,
  children,
  depth,
  mx,
  my,
}: {
  className: string;
  delay: number;
  children: React.ReactNode;
  depth: number;
  mx: ReturnType<typeof useSpring>;
  my: ReturnType<typeof useSpring>;
}) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth);
  return (
    <motion.div style={{ x, y }} className={`absolute z-20 hidden lg:block ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: [0, -9, 0] }}
        transition={{
          opacity: { delay, duration: 0.6 },
          scale: { delay, duration: 0.6 },
          y: { delay, duration: 6, repeat: Infinity, ease: "easeInOut" },
        }}
        className="glass flex items-center gap-3 rounded-[20px] px-4 py-3 shadow-[0_24px_50px_-24px_rgb(30_40_90/0.4)]"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function HeroDashboard() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 95%", "start 30%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.92, 1]);

  const mx = useSpring(useMotionValue(0), { stiffness: 50, damping: 18 });
  const my = useSpring(useMotionValue(0), { stiffness: 50, damping: 18 });
  const onMove = (event: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    mx.set((event.clientX - box.left) / box.width - 0.5);
    my.set((event.clientY - box.top) / box.height - 0.5);
  };

  return (
    <div ref={ref} onMouseMove={onMove} className="relative mx-auto mt-14 max-w-[1080px] px-1 sm:mt-20" style={{ perspective: 1800 }}>
      <Floating className="-left-6 top-24" delay={1.2} depth={26} mx={mx} my={my}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a78bfa]/20 text-[#7c5cf5]">
          <Workflow className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[12px] font-medium text-midnight-ink">Marina moveu um deal</p>
          <p className="text-[11px] text-ash-helper">Aurora → Negociação</p>
        </div>
      </Floating>
      <Floating className="-right-4 top-10" delay={1.5} depth={-22} mx={mx} my={my}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-royal-signal/12 text-royal-signal">
          <MessageSquare className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[12px] font-medium text-midnight-ink">#comercial</p>
          <p className="text-[11px] text-ash-helper">“Cliente pediu proposta até sexta”</p>
        </div>
      </Floating>
      <Floating className="-right-8 bottom-24" delay={1.8} depth={30} mx={mx} my={my}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2ee47a]/18 text-[#177245]">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[12px] font-medium text-midnight-ink">Fatura #1042 paga</p>
          <p className="text-[11px] text-ash-helper">R$ 12.400 · Costa Atlântica</p>
        </div>
      </Floating>

      <motion.div
        style={{ rotateX, scale, transformOrigin: "50% 100%" }}
        className="glass relative rounded-[34px] p-3 sm:p-5"
      >
        <div className="grid gap-4 md:grid-cols-[56px_1fr]">
          <div className="hidden flex-col items-center gap-3 rounded-[24px] bg-midnight-ink/[0.04] py-4 md:flex">
            <span className="h-3 w-3 rounded-full bg-royal-signal" />
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className={`h-8 w-8 rounded-full ${i === 0 ? "bg-midnight-ink/10" : "bg-midnight-ink/[0.05]"}`} />
            ))}
          </div>

          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="app-eyebrow !text-[10px]">Workspace · exemplo</p>
                <p className="app-display text-[26px] text-midnight-ink sm:text-[32px]">
                  Bom dia<span className="text-ash-helper">, Ana</span>
                </p>
              </div>
              <span className="glass flex h-9 w-9 items-center justify-center rounded-full">
                <Bell className="h-4 w-4 text-slate-caption" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Pipeline aberto", value: 2051000, viz: <MiniBars values={[4, 6, 5, 8, 7, 9, 12]} /> },
                { label: "Receita ganha", value: 540000, viz: <MiniBars values={[2, 3, 3, 5, 4, 7, 8]} /> },
                { label: "Forecast", value: 926650, viz: <TickMeter value={0.44} ticks={14} /> },
                { label: "Contatos", value: 128, viz: null, plain: true },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-[22px] bg-white/55 p-3.5 ring-1 ring-white/70">
                  <p className="text-[11px] font-medium text-slate-caption">{kpi.label}</p>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <p className="app-display text-[20px] text-midnight-ink sm:text-[24px]">
                      <Count to={kpi.value} money={!kpi.plain} />
                    </p>
                    <div className="hidden sm:block">{kpi.viz}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1.7fr_1fr]">
              <div className="rounded-[22px] bg-white/55 p-4 ring-1 ring-white/70">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-midnight-ink">Receita ganha vs pipeline</p>
                  <span className="rounded-full bg-[var(--highlight)] px-2 py-0.5 text-[10px] font-medium text-[#1c1c1c]">Ao vivo</span>
                </div>
                <div className="h-[130px] text-midnight-ink">
                  <AreaChart />
                </div>
              </div>
              <div className="rounded-[22px] bg-white/55 p-4 ring-1 ring-white/70">
                <p className="text-[13px] font-medium text-midnight-ink">Fluxo de oportunidades</p>
                <div className="relative mx-auto mt-1 h-[118px] w-[118px]">
                  <Donut />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="app-display text-[24px] text-midnight-ink">50%</p>
                    <p className="text-[9px] text-ash-helper">taxa de ganho</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 hidden space-y-1.5 sm:block">
              {DEALS.map((deal, i) => (
                <motion.div
                  key={deal.name}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.12 }}
                  className="flex items-center gap-3 rounded-[18px] bg-midnight-ink/[0.04] px-3 py-2"
                >
                  <Avatar initials={deal.who.slice(0, 2).toUpperCase()} hue={i * 70 + 200} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-midnight-ink">{deal.name}</p>
                    <p className="text-[11px] text-ash-helper">{deal.who}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${deal.tone}`}>{deal.stage}</span>
                  <p className="w-20 text-right text-[12px] font-medium text-midnight-ink">{deal.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
