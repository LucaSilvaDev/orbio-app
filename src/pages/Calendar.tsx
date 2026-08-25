import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { useUi } from "@/store/useUi";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { Reveal } from "@/components/motion/Reveal";

export function CalendarPage() {
  const { activities, reminders, calendarEvents, addEvent, addActivity, addReminder, removeEvent, removeActivity, removeReminder } = useCrm();
  const user = useAuth((s) => s.user);
  const pushToast = useUi((s) => s.pushToast);
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [kind, setKind] = useState<"meeting" | "call" | "reminder">("meeting");

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const itemsFor = (day: Date) => {
    const acts = activities.filter((a) => isSameDay(parseISO(a.dueAt), day)).map((a) => ({ id: a.id, title: a.title, time: a.dueAt, kind: "task", source: "activity" as const }));
    const rems = reminders.filter((r) => isSameDay(parseISO(r.dueAt), day)).map((r) => ({ id: r.id, title: r.title, time: r.dueAt, kind: "reminder", source: "reminder" as const }));
    const evs = calendarEvents.filter((e) => isSameDay(parseISO(e.when), day)).map((e) => ({ id: e.id, title: e.title, time: e.when, kind: e.kind, source: "event" as const }));
    return [...acts, ...rems, ...evs].sort((a, b) => a.time.localeCompare(b.time));
  };

  const selectedItems = itemsFor(selected);
  const allRows = [
    ...activities.map((a) => [a.title, a.dueAt, a.type]),
    ...reminders.map((r) => [r.title, r.dueAt, "lembrete"]),
    ...calendarEvents.map((e) => [e.title, e.when, e.kind]),
  ];

  return (
    <div>
      <PageHeader
        kicker="Agenda"
        title="Calendário"
        description="O ritmo da empresa: reuniões, tarefas e lembretes no mesmo mês."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setCursor(addMonths(cursor, -1))}>
              Anterior
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>
              Hoje
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCursor(addMonths(cursor, 1))}>
              Próximo
            </Button>
            <ExportMenu title="agenda-orbio" headers={["Título", "Quando", "Tipo"]} rows={allRows} />
            <Button variant="dark" onClick={() => setOpen(true)}>
              Novo compromisso
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.7fr]">
        <Reveal>
          <Card className="p-4">
            <p className="serif mb-3 text-[22px] capitalize">
              {format(cursor, "MMMM yyyy", { locale: ptBR })}
            </p>
            <div className="mb-2 grid grid-cols-7 text-center text-[11px] text-ash-helper">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const items = itemsFor(day);
                const current = isSameMonth(day, cursor);
                const today = isSameDay(day, new Date());
                const active = isSameDay(day, selected);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelected(day);
                      setWhen(`${format(day, "yyyy-MM-dd")}T09:00`);
                    }}
                    className={`min-h-24 rounded-card border p-1.5 text-left ${
                      active
                        ? "border-royal-signal bg-lavender-wash"
                        : today
                          ? "border-midnight-ink"
                          : "border-stone-divider"
                    } ${current ? "bg-snow-canvas" : "opacity-40"}`}
                  >
                    <p className="text-[11px]">{format(day, "d")}</p>
                    {items.slice(0, 3).map((item) => (
                      <p key={item.id} className="mt-0.5 truncate text-[10px] text-royal-signal">
                        {item.title}
                      </p>
                    ))}
                  </button>
                );
              })}
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="p-4">
            <h2 className="serif text-[22px]">{format(selected, "EEEE, d MMM", { locale: ptBR })}</h2>
            <div className="mt-3 space-y-2">
              {selectedItems.length === 0 ? (
                <p className="text-[13px] text-ash-helper">Nada neste dia. Crie um compromisso.</p>
              ) : (
                selectedItems.map((item) => (
                  <div key={`${item.source}-${item.id}`} className="flex items-start justify-between rounded-card bg-fog-surface px-3 py-2">
                    <div>
                      <p className="text-[13px]">{item.title}</p>
                      <p className="mono text-[11px] text-ash-helper">
                        {format(parseISO(item.time), "HH:mm")} · {item.kind}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (item.source === "activity") removeActivity(item.id);
                        if (item.source === "reminder") removeReminder(item.id);
                        if (item.source === "event") removeEvent(item.id);
                      }}
                    >
                      Apagar
                    </Button>
                  </div>
                ))
              )}
            </div>
            <Button className="mt-4 w-full" variant="outline" onClick={() => setOpen(true)}>
              Adicionar neste dia
            </Button>
          </Card>
        </Reveal>
      </div>

      <Modal open={open} title="Novo compromisso" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const iso = when ? new Date(when).toISOString() : selected.toISOString();
            if (kind === "reminder") {
              addReminder({
                title,
                body: "Lembrete da agenda",
                dueAt: iso,
                done: false,
                ownerId: user?.id ?? "u1",
                relatedType: "workspace",
                relatedId: "ws",
              });
            } else if (kind === "meeting" || kind === "call") {
              addEvent({
                title,
                when: iso,
                durationMin: 45,
                kind,
                ownerId: user?.id ?? "u1",
              });
              addActivity({
                type: kind === "call" ? "call" : "meeting",
                title,
                description: "Criado pela agenda",
                relatedType: "company",
                relatedId: "co1",
                ownerId: user?.id ?? "u1",
                dueAt: iso,
                done: false,
              });
            }
            pushToast("Compromisso na agenda");
            setOpen(false);
            setTitle("");
          }}
        >
          <Field label="Título">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Quando">
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </Field>
          <Field label="Tipo">
            <select
              className="h-8 w-full rounded-input border border-stone-divider px-2 text-[13px]"
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="meeting">Reunião</option>
              <option value="call">Ligação</option>
              <option value="reminder">Lembrete</option>
            </select>
          </Field>
          <Button type="submit" variant="dark" className="w-full">
            Salvar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
