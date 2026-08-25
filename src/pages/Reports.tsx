import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { useCrm } from "@/store/useCrm";
import { sourceSeries } from "@/data/seed";
import { getWorkspace } from "@/lib/workspace";
import { brl } from "@/lib/cn";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STAGES } from "@/lib/stages";
import { useUi } from "@/store/useUi";

export function ReportsPage() {
  const { deals, invoices, campaigns, leads } = useCrm();
  const accent = useUi((s) => s.accent);
  const origin =
    getWorkspace() === "official"
      ? Object.entries(
          deals.reduce<Record<string, number>>((acc, deal) => {
            const key = deal.source || "Sem origem";
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          }, {}),
        ).map(([name, value]) => ({ name, value }))
      : sourceSeries;
  const pieColors = [accent, "#ff9efa", "#6647f0", "#a5a2a5", "#f1f0ec"];
  const won = deals.filter((d) => d.stage === "won").reduce((s, d) => s + d.value, 0);
  const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost").reduce((s, d) => s + d.value, 0);
  const stageData = STAGES.map((stage) => ({
    name: stage.label,
    value: deals.filter((d) => d.stage === stage.id).reduce((s, d) => s + d.value, 0) / 1000,
  }));

  return (
    <div>
      <PageHeader
        kicker="Receita"
        title="Relatórios"
        description="Uma leitura honesta do funil, da origem e do caixa."
        actions={
          <ExportMenu
            title="relatorio-orbio"
            headers={["Deal", "Estágio", "Valor", "Probabilidade"]}
            rows={deals.map((d) => [d.name, d.stage, d.value, d.probability])}
          />
        }
      />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Card>
          <p className="text-[12px] text-ash-helper">Ganho</p>
          <p className="font-mono text-[22px]">{brl.format(won)}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-ash-helper">Aberto</p>
          <p className="font-mono text-[22px]">{brl.format(open)}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-ash-helper">Faturas</p>
          <p className="font-mono text-[22px]">{invoices.length}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-ash-helper">Leads no funil</p>
          <p className="font-mono text-[22px]">{leads.length}</p>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Valor por estágio</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={stageData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill={accent} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Origem das oportunidades</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={origin.length ? origin : [{ name: "Sem dados", value: 1 }]} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>
                  {(origin.length ? origin : [{ name: "Sem dados", value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-slate-caption">
            {(origin.length ? origin : [{ name: "Sem dados", value: 1 }]).map((item, i) => (
              <span key={item.name} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: pieColors[i] }} />
                {item.name}
              </span>
            ))}
          </div>
        </Card>
      </div>
      <p className="mt-4 text-[12px] text-ash-helper">
        {campaigns.filter((c) => c.status === "active").length} campanhas ativas neste ciclo.
      </p>
    </div>
  );
}
