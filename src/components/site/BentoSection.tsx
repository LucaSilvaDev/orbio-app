import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Lock, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Avatar } from "@/components/ui/Avatar";

/* ----------------------------------------------------------------- visuals */

function KanbanVisual() {
  const cols = ["Qualificação", "Proposta", "Ganho"];
  return (
    <div className="relative grid h-full grid-cols-3 gap-2">
      {cols.map((title, c) => (
        <div key={title} className="rounded-2xl bg-midnight-ink/[0.04] p-2">
          <p className="mb-2 text-[9px] font-medium text-ash-helper">{title}</p>
          <div className="space-y-1.5">
            {Array.from({ length: c === 1 ? 1 : 2 }).map((_, i) => (
              <div key={i} className="h-7 rounded-xl bg-white/80 ring-1 ring-white" />
            ))}
          </div>
        </div>
      ))}
      <motion.div
        className="absolute top-[34px] h-7 w-[28%] rounded-xl bg-royal-signal shadow-[0_14px_24px_-10px_var(--accent)]"
        animate={{ left: ["3%", "36%", "69%", "69%", "3%"], y: [0, 10, 0, 0, 0] }}
        transition={{ duration: 8, repeat: Infinity, times: [0, 0.25, 0.5, 0.85, 1], ease: "easeInOut" }}
      >
        <span className="absolute inset-x-2 top-2 h-1 rounded-full bg-white/70" />
        <span className="absolute inset-x-2 top-4 h-1 w-1/2 rounded-full bg-white/40" />
      </motion.div>
    </div>
  );
}

function ChatVisual() {
  const lines = [
    { who: "MA", hue: 20, text: "Mandei a proposta da Aurora", mine: false },
    { who: "VC", hue: 230, text: "Perfeito, acompanho o retorno", mine: true },
    { who: "MA", hue: 20, text: "Tudo registrado aqui ✓", mine: false },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ delay: 0.3 + i * 0.5, duration: 0.5 }}
          className={`flex items-end gap-2 ${line.mine ? "flex-row-reverse" : ""}`}
        >
          <Avatar initials={line.who} hue={line.hue} size="sm" />
          <p
            className={`rounded-2xl px-3 py-1.5 text-[11px] ${
              line.mine ? "bg-royal-signal text-white" : "bg-white/80 text-midnight-ink ring-1 ring-white"
            }`}
          >
            {line.text}
          </p>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ delay: 2 }}
        className="ml-9 flex gap-1"
      >
        {[0, 1, 2].map((d) => (
          <motion.span
            key={d}
            className="h-1.5 w-1.5 rounded-full bg-ash-helper"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 }}
          />
        ))}
      </motion.div>
    </div>
  );
}

function DocsVisual() {
  const files = [
    { name: "Contrato-Aurora.pdf", size: "412 KB" },
    { name: "Proposta-Vértice.docx", size: "86 KB" },
    { name: "Fatura-1042.pdf", size: "120 KB" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {files.map((file, i) => (
        <motion.div
          key={file.name}
          initial={{ opacity: 0, x: -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ delay: 0.2 + i * 0.18 }}
          className="flex items-center gap-2.5 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-white"
        >
          <FileText className="h-4 w-4 shrink-0 text-royal-signal" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-midnight-ink">{file.name}</p>
            <p className="text-[9px] text-ash-helper">{file.size}</p>
          </div>
          <motion.span
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ delay: 0.9 + i * 0.25, type: "spring", stiffness: 300 }}
            className="flex items-center gap-1 rounded-full bg-[#2ee47a]/18 px-1.5 py-0.5 text-[9px] font-medium text-[#177245]"
          >
            <ShieldCheck className="h-2.5 w-2.5" /> íntegro
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}

function ReportsVisual() {
  const [round, setRound] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setRound((r) => r + 1), 3200);
    return () => window.clearInterval(id);
  }, []);
  const sets = [
    [40, 72, 55, 90, 64],
    [66, 48, 84, 58, 92],
    [52, 86, 40, 70, 78],
  ];
  const heights = sets[round % sets.length];
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex h-[96px] items-end gap-2">
        {heights.map((h, i) => (
          <motion.div
            key={i}
            animate={{ height: `${h}%` }}
            transition={{ type: "spring", stiffness: 70, damping: 14, delay: i * 0.05 }}
            className="hatch flex-1 rounded-[10px] bg-royal-signal"
            style={{ opacity: i === heights.indexOf(Math.max(...heights)) ? 1 : 0.55 }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["Barras", "Rosca", "Medidor", "Funil"].map((chip) => (
          <span key={chip} className="rounded-full bg-midnight-ink/[0.06] px-2 py-0.5 text-[9px] font-medium text-slate-caption">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function VaultVisual() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <motion.div
        animate={{ boxShadow: ["0 0 0 0 rgba(74,56,245,0.25)", "0 0 0 16px rgba(74,56,245,0)"] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-midnight-ink text-snow-canvas"
      >
        <Lock className="h-6 w-6" />
      </motion.div>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-midnight-ink"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
    </div>
  );
}

function PeopleVisual() {
  const rows = [
    { n: "Vértice Saúde", t: "Cliente · São Paulo", h: 190 },
    { n: "Aurora Energia", t: "Proposta · Curitiba", h: 260 },
    { n: "Nimbus Logística", t: "Qualificação · Recife", h: 320 },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {rows.map((row, i) => (
        <motion.div
          key={row.n}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ delay: 0.15 + i * 0.15 }}
          className="flex items-center gap-2.5 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-white"
        >
          <Avatar initials={row.n.slice(0, 2).toUpperCase()} hue={row.h} size="md" />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-midnight-ink">{row.n}</p>
            <p className="truncate text-[9px] text-ash-helper">{row.t}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ section */

const CARDS = [
  { title: "Vendas e oportunidades", text: "Kanban, tabela e agenda. Cada negócio com dono, valor, probabilidade e próximo passo.", visual: <KanbanVisual />, span: "lg:col-span-2" },
  { title: "Equipe e chat interno", text: "A conversa é da empresa, não do celular de quem saiu.", visual: <ChatVisual />, span: "" },
  { title: "Documentos e faturas", text: "Arquivos em armazenamento privado, com verificação de integridade.", visual: <DocsVisual />, span: "" },
  { title: "Relatórios que você monta", text: "Escolha a fonte, a métrica e o gráfico. Arraste, redimensione, sem escrever consulta.", visual: <ReportsVisual />, span: "" },
  { title: "Cofre de senhas", text: "Criptografado no seu navegador: só o texto cifrado chega ao servidor.", visual: <VaultVisual />, span: "" },
  { title: "Pessoas, empresas e leads", text: "Cadastro limpo, tarefas, notas e histórico de cada relacionamento.", visual: <PeopleVisual />, span: "lg:col-span-2" },
];

export function BentoSection() {
  return (
    <section id="recursos" className="mx-auto max-w-[1180px] px-4 py-16 sm:py-24">
      <Reveal repeat className="text-center">
        <p className="app-eyebrow">O sistema</p>
        <h2 className="app-display mx-auto mt-3 max-w-3xl text-[clamp(34px,5vw,60px)] text-midnight-ink">
          Tudo o que a empresa usa, <span className="text-ash-helper">no mesmo ritmo.</span>
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card, i) => (
          <Reveal repeat key={card.title} delay={(i % 4) * 0.07} className={card.span}>
            <motion.article
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="glass flex h-full flex-col rounded-[28px] p-5"
            >
              <div className="h-[168px] overflow-hidden">{card.visual}</div>
              <h3 className="mt-5 text-[17px] font-medium tracking-[-0.02em] text-midnight-ink">{card.title}</h3>
              <p className="mt-1.5 text-[13px] leading-[1.5] text-slate-caption">{card.text}</p>
            </motion.article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
