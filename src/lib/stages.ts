import type { PipelineStage } from "@/types";

export const STAGES: {
  id: PipelineStage;
  label: string;
  tone: "blue" | "amber" | "mint" | "coral";
}[] = [
  { id: "qualification", label: "Qualificação", tone: "blue" },
  { id: "proposal", label: "Proposta", tone: "blue" },
  { id: "negotiation", label: "Negociação", tone: "amber" },
  { id: "won", label: "Ganho", tone: "mint" },
  { id: "lost", label: "Perdido", tone: "coral" },
];

export const toneDot: Record<string, string> = {
  blue: "bg-cobalt-glow",
  amber: "bg-amber-pending",
  mint: "bg-mint-win",
  coral: "bg-coral-lost",
};

export const toneText: Record<string, string> = {
  blue: "text-royal-signal",
  amber: "text-amber-pending",
  mint: "text-mint-win",
  coral: "text-coral-lost",
};
