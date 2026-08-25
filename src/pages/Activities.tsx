import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { Reveal } from "@/components/motion/Reveal";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { useUi } from "@/store/useUi";
import { findUser } from "@/lib/records";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ActivityType } from "@/types";

const typeLabel: Record<ActivityType, string> = {
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
  task: "Tarefa",
  note: "Nota",
};

export function ActivitiesPage() {
  const { activities, toggleActivity, addActivity, removeActivity } = useCrm();
  const user = useAuth((s) => s.user);
  const pushToast = useUi((s) => s.pushToast);
  const open = activities.filter((a) => !a.done);
  const done = activities.filter((a) => a.done);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [type, setType] = useState<ActivityType>("task");

  return (
    <div>
      <PageHeader
        kicker="Operação"
        title="Atividades"
        description="O ritmo diário do time comercial — o que ainda precisa acontecer."
        actions={
          <>
            <ExportMenu
              title="atividades-orbio"
              headers={["Título", "Tipo", "Quando", "Status", "Dono"]}
              rows={activities.map((a) => [
                a.title,
                typeLabel[a.type],
                a.dueAt,
                a.done ? "feito" : "aberto",
                findUser(a.ownerId)?.name ?? "",
              ])}
            />
            <Button variant="dark" onClick={() => setModal(true)}>
              Nova tarefa
            </Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="p-5">
            <h2 className="mb-3 text-[16px] font-semibold">Abertas</h2>
            <div className="space-y-2">
              {open.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-card bg-fog-surface p-3">
                  <div>
                    <p className="text-[14px] font-medium">{item.title}</p>
                    <p className="text-[12px] text-ash-helper">{item.description}</p>
                    <p className="mt-1 text-[12px] text-slate-caption">
                      {typeLabel[item.type]} · {format(parseISO(item.dueAt), "EEE d MMM · HH:mm", { locale: ptBR })} ·{" "}
                      {findUser(item.ownerId)?.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button size="sm" variant="outline" onClick={() => toggleActivity(item.id)}>
                      Concluir
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeActivity(item.id)}>
                      Apagar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="p-5">
            <h2 className="mb-3 text-[16px] font-semibold">Concluídas</h2>
            {done.map((item) => (
              <div key={item.id} className="mb-2 flex items-center justify-between rounded-card px-3 py-2">
                <button
                  onClick={() => toggleActivity(item.id)}
                  className="text-left text-[13px] text-ash-helper line-through"
                >
                  {item.title}
                </button>
                <Button size="sm" variant="ghost" onClick={() => removeActivity(item.id)}>
                  Apagar
                </Button>
              </div>
            ))}
          </Card>
        </Reveal>
      </div>

      <Modal open={modal} title="Nova atividade" onClose={() => setModal(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            addActivity({
              type,
              title,
              description,
              relatedType: "company",
              relatedId: "co1",
              ownerId: user?.id ?? "u1",
              dueAt: dueAt ? new Date(dueAt).toISOString() : new Date().toISOString(),
              done: false,
            });
            pushToast("Atividade criada");
            setModal(false);
            setTitle("");
            setDescription("");
            setDueAt("");
          }}
        >
          <Field label="Título">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Descrição">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Tipo">
            <select
              className="h-8 w-full rounded-input border border-stone-divider px-2 text-[13px]"
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
            >
              {Object.entries(typeLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quando">
            <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
          <Button type="submit" variant="dark" className="w-full">
            Salvar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
