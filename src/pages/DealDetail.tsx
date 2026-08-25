import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { useUi } from "@/store/useUi";
import { brl } from "@/lib/cn";
import { findCompany, findContact, findUser } from "@/lib/records";
import { STAGES, toneDot } from "@/lib/stages";
import type { PipelineStage } from "@/types";

export function DealDetailPage() {
  const { id = "" } = useParams();
  const { deals, companies, contacts, notes, activities, moveDeal, addNote } = useCrm();
  const user = useAuth((s) => s.user);
  const pushToast = useUi((s) => s.pushToast);
  const deal = deals.find((d) => d.id === id);
  const [body, setBody] = useState("");
  if (!deal) return <p>Deal não encontrado.</p>;
  const company = findCompany(companies, deal.companyId);
  const contact = findContact(contacts, deal.contactId);
  const owner = findUser(deal.ownerId);

  return (
    <div>
      <PageHeader
        kicker="Deal"
        title={deal.name}
        description={deal.nextStep}
        actions={
          <select
            className="h-10 rounded-pill border border-stone-divider bg-fog-surface px-3 text-[13px]"
            value={deal.stage}
            onChange={(event) => {
              moveDeal(deal.id, event.target.value as PipelineStage);
              pushToast("Estágio atualizado");
            }}
          >
            {STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        }
      />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Card>
          <p className="text-[12px] text-ash-helper">Valor</p>
          <p className="mt-1 font-mono text-[22px] text-royal-signal">{brl.format(deal.value)}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-ash-helper">Probabilidade</p>
          <p className="mt-1 text-[22px] font-semibold">{deal.probability}%</p>
        </Card>
        <Card>
          <p className="text-[12px] text-ash-helper">Close</p>
          <p className="mt-1 text-[22px] font-semibold">{deal.closeDate}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-ash-helper">Origem</p>
          <p className="mt-1 text-[16px] font-medium">{deal.source}</p>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            {STAGES.map((stage) => (
              <span key={stage.id} className="flex items-center gap-1 text-[12px] text-ash-helper">
                <span className={`h-1.5 w-1.5 rounded-full ${toneDot[stage.tone]} ${deal.stage === stage.id ? "scale-125" : "opacity-40"}`} />
                {stage.label}
              </span>
            ))}
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-[14px]">
            <div>
              <dt className="text-[12px] text-ash-helper">Empresa</dt>
              <dd>
                <Link className="text-royal-signal" to={`/companies/${company?.id}`}>
                  {company?.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-ash-helper">Contato</dt>
              <dd>
                <Link className="text-royal-signal" to={`/contacts/${contact?.id}`}>
                  {contact?.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-ash-helper">Dono</dt>
              <dd>{owner?.name}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ash-helper">Prioridade</dt>
              <dd>
                <Badge tone={deal.priority === "high" ? "coral" : deal.priority === "medium" ? "amber" : "neutral"}>
                  {deal.priority}
                </Badge>
              </dd>
            </div>
          </dl>
          <h3 className="mt-8 mb-2 font-semibold">Atividades ligadas</h3>
          {activities
            .filter((a) => a.relatedId === deal.id)
            .map((a) => (
              <p key={a.id} className="py-2 text-[13px]">
                {a.title} · <span className="text-ash-helper">{a.dueAt}</span>
              </p>
            ))}
        </Card>
        <Card className="p-6">
          <h3 className="mb-3 font-semibold">Notas do deal</h3>
          <form
            className="mb-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!body.trim()) return;
              addNote({
                relatedType: "deal",
                relatedId: deal.id,
                authorId: user?.id ?? "u1",
                body,
              });
              setBody("");
            }}
          >
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="O que mudou nesta conversa?" />
            <Button type="submit" variant="outline" size="sm">
              Registrar
            </Button>
          </form>
          {notes
            .filter((n) => n.relatedId === deal.id)
            .map((note) => (
              <div key={note.id} className="mb-2 rounded-card bg-fog-surface p-3 text-[13px]">
                {note.body}
              </div>
            ))}
        </Card>
      </div>
    </div>
  );
}
