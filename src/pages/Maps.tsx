import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { useCrm } from "@/store/useCrm";
import { useUi } from "@/store/useUi";
import { ExportMenu } from "@/components/ui/ExportMenu";
import type { MapNode } from "@/types";

const kindLabel = {
  start: "Início",
  process: "Processo",
  decision: "Decisão",
  end: "Fim",
  idea: "Ideia",
};

function Canvas({
  scope,
  nodes,
  edges,
}: {
  scope: "flow" | "mind";
  nodes: MapNode[];
  edges: { id: string; from: string; to: string }[];
}) {
  const addMapNode = useCrm((s) => s.addMapNode);
  const moveMapNode = useCrm((s) => s.moveMapNode);
  const updateMapNode = useCrm((s) => s.updateMapNode);
  const removeMapNode = useCrm((s) => s.removeMapNode);
  const addFlowEdge = useCrm((s) => s.addFlowEdge);
  const pushToast = useUi((s) => s.pushToast);
  const [mode, setMode] = useState<"move" | "link">("move");
  const [selected, setSelected] = useState<string | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const board = useRef<HTMLDivElement>(null);

  function onPointerDown(event: ReactPointerEvent, node: MapNode) {
    if (mode !== "move") return;
    const rect = board.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = {
      id: node.id,
      dx: event.clientX - rect.left - node.x,
      dy: event.clientY - rect.top - node.y,
    };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent) {
    if (!drag.current || !board.current) return;
    const rect = board.current.getBoundingClientRect();
    moveMapNode(
      scope,
      drag.current.id,
      Math.max(8, event.clientX - rect.left - drag.current.dx),
      Math.max(8, event.clientY - rect.top - drag.current.dy),
    );
  }

  function onPointerUp() {
    drag.current = null;
  }

  function connect(id: string) {
    if (!linkFrom) {
      setLinkFrom(id);
      pushToast(scope === "mind" ? "Agora clique no filho" : "Agora clique no destino");
      return;
    }
    if (linkFrom !== id) {
      if (scope === "flow") addFlowEdge(linkFrom, id);
      else updateMapNode("mind", id, { parentId: linkFrom });
    }
    setLinkFrom(null);
  }

  const lines =
    scope === "flow"
      ? edges
      : nodes
          .filter((n) => n.parentId)
          .map((n) => ({ id: n.id, from: n.parentId as string, to: n.id }));

  return (
    <div
      ref={board}
      className="relative h-[70vh] overflow-auto rounded-[28px] bg-fog-surface/80 shadow-card"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <svg className="absolute inset-0 h-full w-[1600px]" style={{ minHeight: 800 }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>
        {lines.map((line) => {
          const a = nodes.find((n) => n.id === line.from);
          const b = nodes.find((n) => n.id === line.to);
          if (!a || !b) return null;
          return (
            <line
              key={line.id}
              x1={a.x + 70}
              y1={a.y + 18}
              x2={b.x + 70}
              y2={b.y + 18}
              stroke="currentColor"
              className="text-ash-helper"
              strokeWidth="1.2"
              markerEnd="url(#arrow)"
            />
          );
        })}
      </svg>
      {nodes.map((node) => (
        <button
          key={node.id}
          onPointerDown={(event) => onPointerDown(event, node)}
          onDoubleClick={() => {
            const label = window.prompt("Nome do bloco", node.label);
            if (label) updateMapNode(scope, node.id, { label });
          }}
          onClick={() => {
            setSelected(node.id);
            if (mode === "link") connect(node.id);
          }}
          className={`absolute min-w-[150px] rounded-card border bg-snow-canvas px-3 py-2 text-left text-[12px] shadow-card ${
            linkFrom === node.id || selected === node.id ? "border-royal-signal" : "border-stone-divider"
          }`}
          style={{ left: node.x, top: node.y }}
        >
          <span className="mono block text-[10px] text-ash-helper">{kindLabel[node.kind]}</span>
          {node.label}
        </button>
      ))}
      <div className="sticky top-3 left-3 z-10 flex flex-wrap gap-1 p-3">
        <Button size="sm" variant={mode === "move" ? "dark" : "outline"} onClick={() => setMode("move")}>
          Mover
        </Button>
        <Button size="sm" variant={mode === "link" ? "dark" : "outline"} onClick={() => setMode("link")}>
          Ligar
        </Button>
        <Button
          size="sm"
          variant="dark"
          onClick={() => {
            const parent = selected ?? nodes[0]?.id;
            addMapNode(scope, {
              label: scope === "mind" ? "Nova ideia" : "Novo passo",
              x: (nodes.find((n) => n.id === parent)?.x ?? 120) + 180,
              y: (nodes.find((n) => n.id === parent)?.y ?? 80) + (scope === "mind" ? 90 : 0),
              kind: scope === "mind" ? "idea" : "process",
              parentId: scope === "mind" ? parent : undefined,
            });
          }}
        >
          Adicionar bloco
        </Button>
        {scope === "flow" ? (
          <>
            {(["start", "process", "decision", "end"] as const).map((kind) => (
              <Button
                key={kind}
                size="sm"
                variant="outline"
                onClick={() =>
                  addMapNode("flow", {
                    label: kindLabel[kind],
                    x: 80 + Math.random() * 400,
                    y: 80 + Math.random() * 240,
                    kind,
                  })
                }
              >
                {kindLabel[kind]}
              </Button>
            ))}
          </>
        ) : null}
        {selected ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              removeMapNode(scope, selected);
              setSelected(null);
            }}
          >
            Apagar selecionado
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function MapsPage() {
  const { flowNodes, flowEdges, mindNodes } = useCrm();
  const [tab, setTab] = useState<"flow" | "mind">("flow");

  return (
    <div>
      <PageHeader
        kicker="Empresa"
        title="Fluxograma e mindmap"
        description="Mover arrasta. Ligar conecta dois blocos. Duplo clique edita o nome. No mindmap, o bloco selecionado vira pai do próximo."
        actions={
          <>
            <div className="inline-flex rounded-pill bg-fog-surface p-0.5">
              <button className={`h-7 rounded-[4px] px-3 text-[12px] ${tab === "flow" ? "bg-fog-surface" : "text-ash-helper"}`} onClick={() => setTab("flow")}>
                Fluxograma
              </button>
              <button className={`h-7 rounded-[4px] px-3 text-[12px] ${tab === "mind" ? "bg-fog-surface" : "text-ash-helper"}`} onClick={() => setTab("mind")}>
                Mindmap
              </button>
            </div>
            <ExportMenu
              title={tab === "flow" ? "fluxograma-orbio" : "mindmap-orbio"}
              headers={["Bloco", "Tipo", "Pai"]}
              rows={(tab === "flow" ? flowNodes : mindNodes).map((n) => [n.label, n.kind, n.parentId ?? "—"])}
            />
          </>
        }
      />
      {tab === "flow" ? (
        <Canvas scope="flow" nodes={flowNodes} edges={flowEdges} />
      ) : (
        <Canvas scope="mind" nodes={mindNodes} edges={[]} />
      )}
    </div>
  );
}
