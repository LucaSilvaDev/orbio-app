import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { PageHeader, SearchField } from "@/components/layout/PageHeader";
import { ViewSwitcher } from "@/components/layout/ViewSwitcher";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { useUi } from "@/store/useUi";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { brl } from "@/lib/cn";
import { findCompany, findContact, findUser } from "@/lib/records";
import { STAGES, toneDot, toneText } from "@/lib/stages";
import type { Deal, PipelineStage } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function DealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });
  const companies = useCrm((s) => s.companies);
  const contacts = useCrm((s) => s.contacts);
  const company = findCompany(companies, deal.companyId);
  const contact = findContact(contacts, deal.contactId);
  const owner = findUser(deal.ownerId);

  return (
    <article
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`rounded-card bg-snow-canvas p-3 shadow-card ${isDragging ? "z-20 opacity-80" : ""}`}
    >
      <Link to={`/app/pipeline/${deal.id}`} className="block" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[14px] font-semibold text-graphite-body">
              {company?.name ?? deal.name}
            </p>
            <p className="text-[12px] text-ash-helper">{contact?.name}</p>
          </div>
          <Avatar initials={owner?.initials ?? "?"} hue={owner?.avatarHue} size="sm" />
        </div>
        <p className="mt-2 text-[14px] font-medium">{brl.format(deal.value)}</p>
        <p className="mt-1 text-[12px] text-ash-helper">{deal.nextStep}</p>
        <p className="mt-2 text-[11px] text-ash-helper">
          {formatDistanceToNow(new Date(deal.updatedAt), { addSuffix: true, locale: ptBR })}
        </p>
      </Link>
    </article>
  );
}

function Column({
  stage,
  deals,
}: {
  stage: (typeof STAGES)[number];
  deals: Deal[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[70vh] min-w-[260px] flex-1 flex-col rounded-[24px] bg-snow-canvas/80 p-3 shadow-card backdrop-blur ${
        isOver ? "ring-2 ring-azure-focus" : ""
      }`}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${toneDot[stage.tone]}`} />
          <h2 className="text-[13px] font-medium">{stage.label}</h2>
          <span className="text-[12px] text-ash-helper">{deals.length}</span>
        </div>
        <p className={`font-mono text-[12px] font-medium ${toneText[stage.tone]}`}>
          {brl.format(total)}
        </p>
      </header>
      <div className="space-y-2">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </section>
  );
}

export function PipelinePage() {
  const deals = useCrm((s) => s.deals);
  const companies = useCrm((s) => s.companies);
  const contacts = useCrm((s) => s.contacts);
  const addDeal = useCrm((s) => s.addDeal);
  const moveDeal = useCrm((s) => s.moveDeal);
  const user = useAuth((s) => s.user);
  const pushToast = useUi((s) => s.pushToast);
  const viewMode = useUi((s) => s.viewMode);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("120000");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return deals.filter((deal) => deal.name.toLowerCase().includes(q) || q === "");
  }, [deals, query]);

  function onDragEnd(event: DragEndEvent) {
    const stage = event.over?.id as PipelineStage | undefined;
    const id = String(event.active.id);
    if (!stage || !STAGES.some((item) => item.id === stage)) return;
    moveDeal(id, stage);
    pushToast("Deal movido no pipeline");
  }

  return (
    <div>
      <PageHeader
        kicker="Comercial"
        title="Pipeline"
        description="Filtro, ordenação e kanban — no mesmo objeto."
        actions={
          <>
            <ViewSwitcher />
            <SearchField value={query} onChange={setQuery} placeholder="Filtrar deals" />
            <ExportMenu
              title="pipeline-orbio"
              headers={["Deal", "Empresa", "Estágio", "Valor", "Close", "Próximo passo"]}
              rows={filtered.map((d) => [
                d.name,
                findCompany(companies, d.companyId)?.name ?? "",
                STAGES.find((s) => s.id === d.stage)?.label ?? d.stage,
                d.value,
                d.closeDate,
                d.nextStep,
              ])}
            />
            <Button variant="dark" onClick={() => setOpen(true)}>
              Novo deal
            </Button>
          </>
        }
      />
      {viewMode === "board" ? (
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <Column
              key={stage.id}
              stage={stage}
              deals={filtered.filter((deal) => deal.stage === stage.id)}
            />
          ))}
        </div>
      </DndContext>
      ) : null}

      {viewMode === "list" ? (
        <div className="space-y-2">
          {filtered.map((deal) => {
            const company = findCompany(companies, deal.companyId);
            return (
              <Link
                key={deal.id}
                to={`/app/pipeline/${deal.id}`}
                className="flex items-center justify-between rounded-[22px] bg-snow-canvas/80 px-4 py-3 shadow-card hover:shadow-lift"
              >
                <span className="font-medium">{company?.name} · {deal.name}</span>
                <span className="font-mono text-royal-signal">{brl.format(deal.value)}</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-[24px] bg-snow-canvas/80 shadow-card">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-fog-surface text-ash-helper">
              <tr>
                {["Deal", "Estágio", "Valor", "Close", "Próximo passo"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((deal) => (
                <tr key={deal.id} className="border-t border-stone-divider">
                  <td className="px-4 py-3">
                    <Link to={`/app/pipeline/${deal.id}`} className="font-medium hover:text-royal-signal">
                      {deal.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{STAGES.find((s) => s.id === deal.stage)?.label}</td>
                  <td className="px-4 py-3 text-royal-signal">{brl.format(deal.value)}</td>
                  <td className="px-4 py-3">{deal.closeDate}</td>
                  <td className="px-4 py-3 text-ash-helper">{deal.nextStep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {viewMode === "calendar" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered
            .slice()
            .sort((a, b) => a.closeDate.localeCompare(b.closeDate))
            .map((deal) => (
              <Link key={deal.id} to={`/app/pipeline/${deal.id}`} className="rounded-[22px] bg-snow-canvas/80 p-4 shadow-card hover:shadow-lift">
                <p className="text-[12px] text-ash-helper">{deal.closeDate}</p>
                <p className="mt-1 font-semibold">{deal.name}</p>
                <p className="mt-2 font-mono text-royal-signal">{brl.format(deal.value)}</p>
              </Link>
            ))}
        </div>
      ) : null}

      <Modal open={open} title="Novo deal" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const contact = contacts.find((c) => c.companyId === companyId) ?? contacts[0];
            addDeal({
              name,
              companyId,
              contactId: contact?.id ?? "c1",
              ownerId: user?.id ?? "u1",
              stage: "qualification",
              value: Number(value) || 0,
              probability: 20,
              closeDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString().slice(0, 10),
              priority: "medium",
              source: "Manual",
              nextStep: "Discovery inicial",
            });
            pushToast("Deal criado no pipeline");
            setOpen(false);
            setName("");
          }}
        >
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Empresa">
            <select
              className="h-11 w-full rounded-input border border-stone-divider bg-fog-surface px-3 text-[14px]"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Valor (BRL)">
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <Button type="submit" variant="dark" className="w-full">
            Criar deal
          </Button>
        </form>
      </Modal>
    </div>
  );
}
