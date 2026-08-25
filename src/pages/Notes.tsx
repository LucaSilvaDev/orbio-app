import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { useUi } from "@/store/useUi";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { Reveal } from "@/components/motion/Reveal";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotesPage() {
  const { notes, reminders, addNote, togglePinNote, removeNote, addReminder, toggleReminder, removeReminder } = useCrm();
  const user = useAuth((s) => s.user);
  const pushToast = useUi((s) => s.pushToast);
  const [tab, setTab] = useState<"notes" | "reminders">("notes");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState("");

  return (
    <div>
      <PageHeader
        kicker="Operação"
        title="Notas e lembretes"
        description="Memória da empresa — o que não pode cair no esquecimento."
        actions={
          <>
            <div className="inline-flex rounded-pill bg-fog-surface p-0.5">
              <button
                className={`h-7 rounded-[4px] px-3 text-[12px] ${tab === "notes" ? "bg-fog-surface" : "text-ash-helper"}`}
                onClick={() => setTab("notes")}
              >
                Notas
              </button>
              <button
                className={`h-7 rounded-[4px] px-3 text-[12px] ${tab === "reminders" ? "bg-fog-surface" : "text-ash-helper"}`}
                onClick={() => setTab("reminders")}
              >
                Lembretes
              </button>
            </div>
            <ExportMenu
              title={tab === "notes" ? "notas-orbio" : "lembretes-orbio"}
              headers={tab === "notes" ? ["Título", "Nota", "Data"] : ["Título", "Quando", "Status"]}
              rows={
                tab === "notes"
                  ? notes.map((n) => [n.title ?? "—", n.body, n.createdAt])
                  : reminders.map((r) => [r.title, r.dueAt, r.done ? "feito" : "aberto"])
              }
            />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Reveal>
          <Card className="p-4">
            <h2 className="mb-3 text-[15px]">{tab === "notes" ? "Nova nota" : "Novo lembrete"}</h2>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (tab === "notes") {
                  addNote({
                    relatedType: "workspace",
                    relatedId: "ws",
                    authorId: user?.id ?? "u1",
                    title,
                    body,
                    pinned: false,
                  });
                  pushToast("Nota salva");
                } else {
                  addReminder({
                    title,
                    body,
                    dueAt: dueAt ? new Date(dueAt).toISOString() : new Date().toISOString(),
                    done: false,
                    ownerId: user?.id ?? "u1",
                    relatedType: "workspace",
                    relatedId: "ws",
                  });
                  pushToast("Lembrete criado");
                }
                setTitle("");
                setBody("");
                setDueAt("");
              }}
            >
              <Field label="Título">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </Field>
              <Field label="Conteúdo">
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} required />
              </Field>
              {tab === "reminders" ? (
                <Field label="Quando">
                  <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
                </Field>
              ) : null}
              <Button type="submit" variant="dark" className="w-full">
                Salvar
              </Button>
            </form>
          </Card>
        </Reveal>

        <div className="space-y-2">
          {tab === "notes"
            ? [...notes]
                .sort((a, b) => Number(b.pinned) - Number(a.pinned))
                .map((note, i) => (
                <Reveal key={note.id} delay={i * 0.04}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[14px]">
                          {note.pinned ? "★ " : ""}
                          {note.title ?? "Nota"}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-caption">{note.body}</p>
                        <p className="mono mt-2 text-[11px] text-ash-helper">{note.createdAt}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => togglePinNote(note.id)}>
                          {note.pinned ? "Desafixar" : "Fixar"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => removeNote(note.id)}>
                          Apagar
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              ))
            : reminders.map((item, i) => (
                <Reveal key={item.id} delay={i * 0.04}>
                  <Card className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <p className={item.done ? "text-ash-helper line-through" : ""}>{item.title}</p>
                      <p className="text-[13px] text-slate-caption">{item.body}</p>
                      <p className="mono mt-1 text-[11px] text-ash-helper">
                        {format(parseISO(item.dueAt), "EEE d MMM · HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Badge tone={item.done ? "mint" : "amber"}>{item.done ? "feito" : "aberto"}</Badge>
                      <Button size="sm" variant="outline" onClick={() => toggleReminder(item.id)}>
                        {item.done ? "Reabrir" : "Concluir"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeReminder(item.id)}>
                        Apagar
                      </Button>
                    </div>
                  </Card>
                </Reveal>
              ))}
        </div>
      </div>
    </div>
  );
}
