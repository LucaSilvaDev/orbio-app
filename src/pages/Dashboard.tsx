import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { CountUp } from "@/components/motion/CountUp";
import { fadeItem, Stagger } from "@/components/motion/PageFade";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { Reveal } from "@/components/motion/Reveal";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { brl } from "@/lib/cn";
import { findUser } from "@/lib/records";
import { STAGES, toneDot } from "@/lib/stages";
import { revenueSeries } from "@/data/seed";
import { getWorkspace } from "@/lib/workspace";
import { useUi } from "@/store/useUi";

export function DashboardPage() {
  const accent = useUi((s) => s.accent);
  const { deals, activities, companies, contacts, reminders, calendarEvents, messages, threads } = useCrm();
  const meId = useAuth((s) => s.user?.id);
  const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const won = deals.filter((d) => d.stage === "won");
  const pipelineValue = open.reduce((sum, deal) => sum + deal.value, 0);
  const wonValue = won.reduce((sum, deal) => sum + deal.value, 0);
  const weighted = open.reduce(
    (sum, deal) => sum + (deal.value * deal.probability) / 100,
    0,
  );
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

  const kpis = [
    { label: "Pipeline aberto", value: pipelineValue, money: true, hint: `${open.length} deals` },
    { label: "Ganho no mês", value: wonValue, money: true, hint: `${won.length} fechamentos` },
    { label: "Forecast ponderado", value: weighted, money: true, hint: "probabilidade × valor" },
    { label: "Contatos ativos", value: contacts.length, money: false, hint: `${companies.length} contas` },
  ];

  return (
    <div>
      <PageHeader
        kicker="Workspace"
        title="Sales Dashboard"
        description="Empresas, pessoas, agenda e o que a operação precisa lembrar."
        actions={
          <div className="flex items-center gap-2">
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
              className="inline-flex h-10 items-center gap-1 rounded-pill bg-fog-surface px-3 text-[13px] hover:bg-lavender-wash"
            >
              Ver oportunidades <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />

      <Stagger className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={fadeItem}>
            <Card className="overflow-hidden">
              <p className="text-[12px] font-medium text-ash-helper">{kpi.label}</p>
              <p className="mt-2 font-mono text-[26px] font-medium tracking-[-0.045em] text-midnight-ink">
                <CountUp value={Math.round(kpi.value)} money={kpi.money} />
              </p>
              <p className="mt-1 text-[12px] text-slate-caption">{kpi.hint}</p>
            </Card>
          </motion.div>
        ))}
      </Stagger>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Reveal>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-midnight-ink">
                Receita ganha vs pipeline
              </h2>
              <p className="text-[13px] text-ash-helper">Últimos 6 meses · valores em milhares</p>
            </div>
            <Badge tone="blue">Ao vivo</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="won" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="pipeline" stroke="#3b82f6" strokeWidth={1.5} fill="none" />
                <Area type="monotone" dataKey="won" stroke={accent} strokeWidth={2} fill="url(#won)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        </Reveal>

        <Reveal delay={0.08}>
        <Card className="p-5">
          <h2 className="mb-4 text-[18px] font-semibold tracking-[-0.02em] text-midnight-ink">
            Pipeline por estágio
          </h2>
          <div className="space-y-3">
            {STAGES.filter((s) => s.id !== "lost").map((stage) => {
              const items = deals.filter((d) => d.stage === stage.id);
              const total = items.reduce((sum, d) => sum + d.value, 0);
              const max = Math.max(
                ...STAGES.map((s) =>
                  deals.filter((d) => d.stage === s.id).reduce((sum, d) => sum + d.value, 0),
                ),
                1,
              );
              return (
                <div key={stage.id}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 font-medium">
                      <span className={`h-1.5 w-1.5 rounded-full ${toneDot[stage.tone]}`} />
                      {stage.label}
                    </span>
                    <span className="font-mono text-royal-signal">{brl.format(total)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-pill bg-fog-surface">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(total / max) * 100}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-pill bg-royal-signal"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        </Reveal>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold tracking-[-0.02em]">Agenda do time</h2>
            <Link to="/app/calendar" className="text-[13px] text-royal-signal">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {[
              ...calendarEvents.map((item) => ({ id: item.id, title: item.title, description: item.kind, done: false })),
              ...reminders.filter((r) => !r.done).map((item) => ({ id: item.id, title: item.title, description: "Lembrete", done: false })),
              ...activities.slice(0, 4).map((item) => ({ id: item.id, title: item.title, description: item.description, done: item.done })),
            ]
              .slice(0, 6)
              .map((item) => {
              const owner = findUser("u1");
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-card px-2 py-2 hover:bg-fog-surface"
                >
                  <Avatar initials={owner?.initials ?? "?"} hue={owner?.avatarHue} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{item.title}</p>
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

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold tracking-[-0.02em]">Inbox interno</h2>
            <Link to="/app/inbox" className="text-[13px] text-royal-signal">
              Abrir
            </Link>
          </div>
          <div className="space-y-2">
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
                    className="flex items-start gap-3 rounded-2xl px-2 py-2 hover:bg-fog-surface"
                  >
                    <Avatar initials={author?.initials ?? "?"} hue={author?.avatarHue} size="sm" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium">
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
