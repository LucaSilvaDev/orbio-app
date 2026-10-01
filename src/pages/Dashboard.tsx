import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Chip, MiniBars, Spark, TickMeter } from "@/components/ui/Viz";
import { CountUp } from "@/components/motion/CountUp";
import { fadeItem, Stagger } from "@/components/motion/PageFade";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { Reveal } from "@/components/motion/Reveal";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { brl, compactBrl, hueFrom, initials } from "@/lib/cn";
import { findCompany, findUser } from "@/lib/records";
import { STAGES } from "@/lib/stages";
import { revenueSeries } from "@/data/seed";
import { getWorkspace } from "@/lib/workspace";
import { useUi } from "@/store/useUi";

const STAGE_COLOR: Record<string, string> = {
  qualification: "#7c9cff",
  proposal: "#a78bfa",
  negotiation: "#f2ae40",
  won: "#2ee47a",
  lost: "#f04438",
};

const STAGE_TONE: Record<string, "blue" | "amber" | "mint" | "coral"> = {
  qualification: "blue",
  proposal: "blue",
  negotiation: "amber",
  won: "mint",
  lost: "coral",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardPage() {
  const accent = useUi((s) => s.accent);
  const { deals, activities, companies, contacts, reminders, calendarEvents, messages, threads } = useCrm();
  const user = useAuth((s) => s.user);
  const meId = user?.id;
  const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const won = deals.filter((d) => d.stage === "won");
  const lost = deals.filter((d) => d.stage === "lost");
  const pipelineValue = open.reduce((sum, deal) => sum + deal.value, 0);
  const wonValue = won.reduce((sum, deal) => sum + deal.value, 0);
  const weighted = open.reduce(
    (sum, deal) => sum + (deal.value * deal.probability) / 100,
    0,
  );
  const closed = won.length + lost.length;
  const winRate = closed ? Math.round((won.length / closed) * 100) : 0;
  const avgProbability = open.length
    ? Math.round(open.reduce((sum, d) => sum + d.probability, 0) / open.length)
    : 0;
  const firstName = user?.name?.split(" ")[0];

  const chart =
    getWorkspace() === "official"
      ? (() => {
          const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
          const wonMap = new Map<string, number>();
          const openMap = new Map<string, number>();
          for (const deal of deals) {
            const month = months[new Date(deal.updatedAt).getMonth()];
            if (deal.stage === "won") wonMap.set(month, (wonMap.get(month) ?? 0) + deal.value / 1000);
            if (deal.stage !== "won" && deal.stage !== "lost") {
              openMap.set(month, (openMap.get(month) ?? 0) + deal.value / 1000);
            }
          }
          const keys = [...new Set([...wonMap.keys(), ...openMap.keys()])];
          if (!keys.length) return [{ month: "—", won: 0, pipeline: 0 }];
          return keys.map((month) => ({
            month,
            won: Math.round(wonMap.get(month) ?? 0),
            pipeline: Math.round(openMap.get(month) ?? 0),
          }));
        })()
      : revenueSeries;

  const pipelineSeries = chart.map((point) => point.pipeline);
  const wonSeries = chart.map((point) => point.won);

  const stageRows = STAGES.map((stage) => {
    const items = deals.filter((d) => d.stage === stage.id);
    return {
      ...stage,
      count: items.length,
      total: items.reduce((sum, d) => sum + d.value, 0),
      color: STAGE_COLOR[stage.id],
    };
  });
  const funnelRows = stageRows.filter((row) => row.id !== "lost");
  const funnelTotal = funnelRows.reduce((sum, row) => sum + row.total, 0);
  const donutData = stageRows.filter((row) => row.count > 0);

  const topDeals = [...open].sort((a, b) => b.value - a.value).slice(0, 5);

  const kpis = [
    {
      label: "Pipeline aberto",
      value: pipelineValue,
      money: true,
      chip: <Chip tone="blue">{open.length} deals</Chip>,
      viz: <MiniBars values={pipelineSeries} />,
    },
    {
      label: "Receita ganha",
      value: wonValue,
      money: true,
      chip: (
        <Chip tone={winRate >= 50 ? "mint" : "neutral"}>
          {winRate}% conversão
        </Chip>
      ),
      viz: <Spark values={wonSeries} />,
    },
    {
      label: "Forecast ponderado",
      value: weighted,
      money: true,
      chip: <Chip tone="neutral">{avgProbability}% prob.</Chip>,
      viz: <TickMeter value={pipelineValue ? weighted / pipelineValue : 0} />,
    },
    {
      label: "Contatos ativos",
      value: contacts.length,
      money: false,
      chip: <Chip tone="neutral">{companies.length} contas</Chip>,
      viz: (
        <div className="flex -space-x-2">
          {contacts.slice(0, 4).map((contact) => (
            <Avatar
              key={contact.id}
              initials={initials(contact.name)}
              hue={hueFrom(contact.id)}
              size="md"
              className="ring-2 ring-white/80"
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Hero — big light greeting over the aurora, actions on the right */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="app-eyebrow mb-2">Workspace · visão geral</p>
          <h1 className="app-display text-[40px] text-midnight-ink md:text-[52px]">
            {greeting()}
            {firstName ? <span className="text-ash-helper">, {firstName}</span> : null}
          </h1>
          <p className="mt-2 max-w-xl text-[13px] text-slate-caption">
            Empresas, pessoas, agenda e o que a operação precisa lembrar — num só lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportMenu
            title="dashboard-orbio"
            headers={["KPI", "Valor"]}
            rows={[
              ["Pipeline aberto", pipelineValue],
              ["Ganho", wonValue],
              ["Forecast", Math.round(weighted)],
              ["Contatos", contacts.length],
            ]}
          />
          <Link
            to="/app/pipeline"
            className="inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--highlight)] px-4 text-[13px] font-medium text-[#1c1c1c] shadow-[0_12px_26px_-14px_rgb(120,140,0)] transition-transform hover:-translate-y-px"
          >
            Ver oportunidades <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={fadeItem}>
            <Card className="flex h-full flex-col justify-between gap-5 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-medium text-slate-caption">{kpi.label}</p>
                {kpi.chip}
              </div>
              <div className="flex items-end justify-between gap-3">
                <p className="app-display text-[30px] text-midnight-ink">
                  <CountUp value={Math.round(kpi.value)} money={kpi.money} />
                </p>
                {kpi.viz}
              </div>
            </Card>
          </motion.div>
        ))}
      </Stagger>

      {/* Revenue + donut */}
      <div className="mt-5 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Reveal>
          <Card className="h-full">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-[18px] font-medium text-midnight-ink">Receita ganha vs pipeline</h2>
                <p className="text-[12px] text-ash-helper">Últimos meses · valores em milhares</p>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-slate-caption">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: accent }} /> Ganho
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#7c9cff]" /> Pipeline
                </span>
                <Badge tone="lime">Ao vivo</Badge>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="won" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.07} strokeDasharray="3 5" />
                  <XAxis dataKey="month" tick={{ fill: "#8a90a0", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8a90a0", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ stroke: accent, strokeOpacity: 0.25, strokeDasharray: "3 4" }}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid rgb(255 255 255 / 0.8)",
                      background: "rgb(255 255 255 / 0.85)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 18px 40px -20px rgb(20 30 60 / 0.35)",
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="pipeline" stroke="#7c9cff" strokeWidth={1.6} fill="none" dot={false} />
                  <Area
                    type="monotone"
                    dataKey="won"
                    stroke={accent}
                    strokeWidth={2.2}
                    fill="url(#won)"
                    dot={{ r: 3.5, fill: accent, stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: accent, stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-medium text-midnight-ink">Fluxo de oportunidades</h2>
              <Badge tone="neutral">{deals.length} no total</Badge>
            </div>
            <div className="relative mt-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData.length ? donutData : [{ id: "none", count: 1, color: "#d9dce6" }]}
                    dataKey="count"
                    nameKey="label"
                    innerRadius="68%"
                    outerRadius="94%"
                    startAngle={210}
                    endAngle={-30}
                    paddingAngle={donutData.length > 1 ? 3 : 0}
                    cornerRadius={8}
                    stroke="none"
                  >
                    {(donutData.length ? donutData : [{ id: "none", color: "#d9dce6" }]).map((row) => (
                      <Cell key={row.id} fill={row.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid rgb(255 255 255 / 0.8)",
                      background: "rgb(255 255 255 / 0.9)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
                <p className="app-display text-[40px] text-midnight-ink">{winRate}%</p>
                <p className="text-[11px] text-ash-helper">taxa de ganho</p>
              </div>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
              {stageRows.map((row) => (
                <div key={row.id} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2 text-slate-caption">
                    <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                    {row.label}
                  </span>
                  <span className="font-medium text-midnight-ink">{row.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>

      {/* Funnel + top deals */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Reveal>
          <Card className="h-full">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-[18px] font-medium text-midnight-ink">Pipeline por estágio</h2>
                <p className="text-[12px] text-ash-helper">Distribuição do valor em aberto e ganho</p>
              </div>
              <p className="app-display text-[26px] text-midnight-ink">{compactBrl.format(funnelTotal)}</p>
            </div>
            <div className="flex h-9 w-full gap-1 overflow-hidden rounded-[14px]">
              {funnelRows.map((row) => (
                <motion.div
                  key={row.id}
                  initial={{ width: 0 }}
                  animate={{ width: `${funnelTotal ? Math.max(4, (row.total / funnelTotal) * 100) : 25}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  title={`${row.label}: ${brl.format(row.total)}`}
                  className={row.id === "won" ? "rounded-[6px]" : "hatch rounded-[6px]"}
                  style={{ background: row.color }}
                />
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {funnelRows.map((row) => (
                <div key={row.id} className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 font-medium text-midnight-ink">
                    <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: row.color }} />
                    {row.label}
                    <span className="text-[11px] font-normal text-ash-helper">{row.count} {row.count === 1 ? "deal" : "deals"}</span>
                  </span>
                  <span className="font-medium text-midnight-ink">{brl.format(row.total)}</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="h-full">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[18px] font-medium text-midnight-ink">Maiores oportunidades</h2>
              <Link to="/app/pipeline" className="text-[12px] font-medium text-royal-signal">
                Ver todas
              </Link>
            </div>
            {topDeals.length ? (
              <div className="space-y-1.5">
                {topDeals.map((deal) => {
                  const company = findCompany(companies, deal.companyId);
                  const owner = findUser(deal.ownerId);
                  return (
                    <Link
                      key={deal.id}
                      to={`/app/pipeline/${deal.id}`}
                      className="flex items-center gap-3 rounded-[18px] bg-midnight-ink/5 px-3 py-2.5 transition-colors hover:bg-midnight-ink/10"
                    >
                      <Avatar initials={owner?.initials ?? "?"} hue={owner?.avatarHue} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-midnight-ink">{deal.name}</p>
                        <p className="truncate text-[12px] text-ash-helper">{company?.name ?? "Sem empresa"}</p>
                      </div>
                      <Badge tone={STAGE_TONE[deal.stage]} className="hidden sm:inline-flex">
                        {STAGES.find((s) => s.id === deal.stage)?.label}
                      </Badge>
                      <div className="text-right">
                        <p className="text-[13px] font-medium text-midnight-ink">{brl.format(deal.value)}</p>
                        <p className="text-[11px] text-ash-helper">{deal.probability}% prob.</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-ash-helper">
                Nenhuma oportunidade em aberto ainda.
              </p>
            )}
          </Card>
        </Reveal>
      </div>

      {/* Agenda + inbox */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-medium text-midnight-ink">Agenda do time</h2>
            <Link to="/app/calendar" className="text-[12px] font-medium text-royal-signal">
              Ver todas
            </Link>
          </div>
          <div className="space-y-1.5">
            {[
              ...calendarEvents.map((item) => ({ id: item.id, title: item.title, description: item.kind, done: false, ownerId: item.ownerId })),
              ...reminders.filter((r) => !r.done).map((item) => ({ id: item.id, title: item.title, description: "Lembrete", done: false, ownerId: item.ownerId })),
              ...activities.slice(0, 4).map((item) => ({ id: item.id, title: item.title, description: item.description, done: item.done, ownerId: item.ownerId })),
            ]
              .slice(0, 6)
              .map((item) => {
                const owner = findUser(item.ownerId);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-[18px] px-2 py-2 transition-colors hover:bg-midnight-ink/6"
                  >
                    <Avatar initials={owner?.initials ?? "?"} hue={owner?.avatarHue} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-midnight-ink">{item.title}</p>
                      <p className="truncate text-[12px] text-ash-helper">{item.description}</p>
                    </div>
                    <Badge tone={item.done ? "mint" : "neutral"}>
                      {item.done ? "feito" : "aberto"}
                    </Badge>
                  </div>
                );
              })}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-medium text-midnight-ink">Inbox interno</h2>
            <Link to="/app/inbox" className="text-[12px] font-medium text-royal-signal">
              Abrir
            </Link>
          </div>
          <div className="space-y-1.5">
            {messages
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 5)
              .map((item) => {
                const author = findUser(item.authorId);
                const thread = threads.find((t) => t.id === item.threadId);
                const unread = Boolean(meId && thread?.unreadBy.includes(meId));
                return (
                  <Link
                    key={item.id}
                    to="/app/inbox"
                    className="flex items-start gap-3 rounded-[18px] px-2 py-2 transition-colors hover:bg-midnight-ink/6"
                  >
                    <Avatar initials={author?.initials ?? "?"} hue={author?.avatarHue} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-midnight-ink">
                        {author?.name}
                        {unread ? <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-royal-signal" /> : null}
                      </p>
                      <p className="truncate text-[13px] text-slate-caption">
                        {item.body || item.attachments[0]?.name}
                      </p>
                      <p className="truncate text-[12px] text-ash-helper">
                        {thread?.kind === "channel" ? `# ${thread.name}` : "Mensagem direta"}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </Card>
      </div>
    </div>
  );
}
