import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { Reveal } from "@/components/motion/Reveal";
import { useCrm } from "@/store/useCrm";
import { useUi } from "@/store/useUi";
import { brl } from "@/lib/cn";
import type { CampaignStatus } from "@/types";

const tone: Record<CampaignStatus, "neutral" | "mint" | "amber" | "blue"> = {
  draft: "neutral",
  active: "mint",
  paused: "amber",
  ended: "blue",
};

export function CampaignsPage() {
  const { campaigns, addCampaign, updateCampaign, removeCampaign } = useCrm();
  const pushToast = useUi((s) => s.pushToast);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("Outbound");
  const [budget, setBudget] = useState("25000");

  return (
    <div>
      <PageHeader
        kicker="Receita"
        title="Campanhas"
        description="Aquisição com orçamento, resposta e conversão no mesmo olhar."
        actions={
          <>
            <ExportMenu
              title="campanhas-orbio"
              headers={["Nome", "Canal", "Status", "Orçamento", "Gasto", "Leads", "Respostas"]}
              rows={campaigns.map((c) => [c.name, c.channel, c.status, c.budget, c.spent, c.leads, c.replies])}
            />
            <Button variant="dark" onClick={() => setOpen(true)}>
              Nova campanha
            </Button>
          </>
        }
      />
      <div className="space-y-3">
        {campaigns.map((campaign, i) => {
          const spend = campaign.budget ? campaign.spent / campaign.budget : 0;
          return (
            <Reveal key={campaign.id} delay={i * 0.04}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] font-semibold">{campaign.name}</h2>
                    <p className="text-[13px] text-ash-helper">{campaign.channel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-7 rounded-input border border-stone-divider px-2 text-[12px]"
                      value={campaign.status}
                      onChange={(e) => {
                        updateCampaign(campaign.id, { status: e.target.value as CampaignStatus });
                        pushToast("Campanha atualizada");
                      }}
                    >
                      {["draft", "active", "paused", "ended"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <Badge tone={tone[campaign.status]}>{campaign.status}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => removeCampaign(campaign.id)}>
                      Apagar
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <p className="text-[13px]">
                    Orçamento
                    <span className="mt-1 block font-mono text-[16px]">{brl.format(campaign.budget)}</span>
                  </p>
                  <p className="text-[13px]">
                    Gasto
                    <span className="mt-1 block font-mono text-[16px]">{brl.format(campaign.spent)}</span>
                  </p>
                  <p className="text-[13px]">
                    Leads
                    <span className="mt-1 block font-mono text-[16px]">{campaign.leads}</span>
                  </p>
                  <p className="text-[13px]">
                    Respostas
                    <span className="mt-1 block font-mono text-[16px]">{campaign.replies}</span>
                  </p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-fog-surface">
                  <div
                    className="h-full rounded-pill bg-royal-signal"
                    style={{ width: `${Math.min(100, spend * 100)}%` }}
                  />
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>
      <Modal open={open} title="Nova campanha" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            addCampaign({
              name,
              channel,
              status: "draft",
              budget: Number(budget) || 0,
              spent: 0,
              leads: 0,
              replies: 0,
            });
            pushToast("Campanha criada");
            setOpen(false);
            setName("");
          }}
        >
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Canal">
            <Input value={channel} onChange={(e) => setChannel(e.target.value)} />
          </Field>
          <Field label="Orçamento (BRL)">
            <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </Field>
          <Button type="submit" variant="dark" className="w-full">
            Salvar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
