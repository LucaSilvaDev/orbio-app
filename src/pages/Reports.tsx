import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Check, Pencil, Plus, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { Button } from "@/components/ui/Button";
import { WidgetCard } from "@/components/reports/WidgetCard";
import { WidgetEditor } from "@/components/reports/WidgetEditor";
import { useCrm } from "@/store/useCrm";
import { useReports } from "@/store/useReports";
import { useUi } from "@/store/useUi";
import { runWidget, type Widget } from "@/lib/reportEngine";

export function ReportsPage() {
  const { widgets, addWidget, updateWidget, removeWidget, moveWidget, resetWidgets } = useReports();
  const { deals, campaigns } = useCrm();
  const pushToast = useUi((s) => s.pushToast);
  const [editing, setEditing] = useState(false);
  const [editor, setEditor] = useState<{ open: boolean; widget: Widget | null }>({ open: false, widget: null });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) moveWidget(String(active.id), String(over.id));
  };

  const crm = useCrm.getState();
  const exportRows = () =>
    widgets.flatMap((w) => {
      const r = runWidget(w, crm);
      return r.series.length
        ? r.series.map((p) => [w.title, p.name, Math.round(p.value * 100) / 100])
        : [[w.title, r.measureLabel, Math.round(r.total * 100) / 100]];
    });

  return (
    <div>
      <PageHeader
        kicker="Receita"
        title="Relatórios"
        description="Monte o seu painel: arraste, redimensione e escolha os gráficos — sem escrever SQL."
        actions={
          <>
            <ExportMenu title="relatorio-orbio" headers={["Gráfico", "Categoria", "Valor"]} rows={exportRows()} />
            {editing ? (
              <Button
                size="md"
                variant="outline"
                onClick={() => {
                  if (window.confirm("Restaurar o painel padrão? Seus gráficos personalizados serão removidos.")) {
                    resetWidgets();
                    pushToast("Painel restaurado");
                  }
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restaurar
              </Button>
            ) : null}
            <button
              type="button"
              data-write
              onClick={() => {
                setEditor({ open: true, widget: null });
                setEditing(true);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--highlight)] px-4 text-[13px] font-medium text-[#1c1c1c] shadow-[0_12px_26px_-14px_rgb(120,140,0)] transition-transform hover:-translate-y-px"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar gráfico
            </button>
            <Button data-write variant={editing ? "dark" : "outline"} onClick={() => setEditing((v) => !v)}>
              {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              {editing ? "Concluir" : "Editar painel"}
            </Button>
          </>
        }
      />

      {editing ? (
        <p className="mb-4 rounded-[18px] bg-royal-signal/8 px-4 py-2.5 text-[12px] text-slate-caption">
          Modo de edição: arraste pela alça <span className="font-medium">⋮⋮</span> para reordenar, use o ícone de colunas para mudar a largura e o lápis para configurar. As alterações são salvas automaticamente.
        </p>
      ) : null}

      {widgets.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {widgets.map((widget) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  editing={editing}
                  onEdit={() => setEditor({ open: true, widget })}
                  onRemove={() => {
                    if (window.confirm(`Remover "${widget.title}" do painel?`)) removeWidget(widget.id);
                  }}
                  onResize={() => updateWidget(widget.id, { span: (widget.span % 4 + 1) as Widget["span"] })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="glass flex flex-col items-center gap-3 rounded-[26px] px-6 py-16 text-center">
          <p className="app-display text-[26px] text-midnight-ink">Painel em branco</p>
          <p className="max-w-sm text-[13px] text-slate-caption">
            Adicione o primeiro gráfico escolhendo a fonte, a métrica e o tipo de visualização.
          </p>
          <Button variant="dark" onClick={() => setEditor({ open: true, widget: null })}>
            <Plus className="h-3.5 w-3.5" /> Adicionar gráfico
          </Button>
        </div>
      )}

      <p className="mt-5 text-[12px] text-ash-helper">
        {campaigns.filter((c) => c.status === "active").length} campanhas ativas neste ciclo · {deals.length} oportunidades analisadas.
      </p>

      <WidgetEditor
        open={editor.open}
        initial={editor.widget}
        onClose={() => setEditor({ open: false, widget: null })}
        onSave={(draft) => {
          if (editor.widget) updateWidget(editor.widget.id, draft);
          else addWidget(draft);
          setEditor({ open: false, widget: null });
          pushToast(editor.widget ? "Gráfico atualizado" : "Gráfico adicionado");
        }}
      />
    </div>
  );
}
