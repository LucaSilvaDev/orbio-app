import { motion } from "framer-motion";
import { History, RotateCcw, UserMinus, UsersRound } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

const POINTS = [
  { icon: UserMinus, title: "Quem sai, o histórico fica", text: "Encerre o acesso e passe a carteira para outra pessoa. Conversas, registros e nome continuam na empresa." },
  { icon: History, title: "Tudo que muda fica registrado", text: "Quem criou, alterou ou excluiu. Sem “foi a planilha”, sem culpado por adivinhação." },
  { icon: RotateCcw, title: "Excluiu sem querer? Restaura.", text: "Lixeira para empresas, contatos, oportunidades, faturas e itens do dia a dia." },
  { icon: UsersRound, title: "Cada um vê o que precisa", text: "Dono, administrador, financeiro, vendedor e somente leitura — com regras aplicadas no banco." },
];

const LOG = [
  { who: "Marina", what: "moveu Aurora para Negociação", when: "agora", tone: "bg-royal-signal" },
  { who: "Lucas", what: "criou a fatura #1043", when: "2 min", tone: "bg-[#22c07a]" },
  { who: "Sofia", what: "excluiu o contato Paulo R.", when: "8 min", tone: "bg-[#f04438]", restore: true },
  { who: "Ana", what: "transferiu a carteira de Rafael", when: "1 h", tone: "bg-[#a78bfa]" },
];

export function HistorySection() {
  return (
    <section className="mx-auto max-w-[1180px] px-4 py-16">
      <div className="glass overflow-hidden rounded-[40px] p-6 sm:p-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <Reveal repeat>
            <p className="app-eyebrow">Para a empresa, não para a pessoa</p>
            <h2 className="app-display mt-3 text-[clamp(32px,4.4vw,54px)] text-midnight-ink">
              O conhecimento do negócio <span className="text-ash-helper">não vai embora com o funcionário.</span>
            </h2>
            <ul className="mt-9 grid gap-5 sm:grid-cols-2">
              {POINTS.map((point) => (
                <li key={point.title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-royal-signal/10 text-royal-signal">
                    <point.icon className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-3 text-[15px] font-medium tracking-[-0.01em] text-midnight-ink">{point.title}</h3>
                  <p className="mt-1 text-[13px] leading-[1.5] text-slate-caption">{point.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal repeat delay={0.1}>
            <div className="rounded-[28px] bg-white/60 p-5 ring-1 ring-white/80">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[14px] font-medium text-midnight-ink">Histórico e lixeira</p>
                <span className="rounded-full bg-midnight-ink/[0.06] px-2.5 py-1 text-[10px] font-medium text-slate-caption">
                  exemplo
                </span>
              </div>
              <ul className="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-midnight-ink/10">
                {LOG.map((entry, i) => (
                  <motion.li
                    key={entry.what}
                    initial={{ opacity: 0, x: 18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ delay: 0.2 + i * 0.2, duration: 0.5 }}
                    className="relative flex items-center gap-3 pl-5"
                  >
                    <span className={`absolute top-1/2 left-0 h-[11px] w-[11px] -translate-y-1/2 rounded-full ring-4 ring-white ${entry.tone}`} />
                    <div className="min-w-0 flex-1 rounded-2xl bg-white/80 px-3.5 py-2.5 ring-1 ring-white">
                      <p className="text-[12px] text-midnight-ink">
                        <span className="font-medium">{entry.who}</span> {entry.what}
                      </p>
                      <p className="text-[10px] text-ash-helper">{entry.when}</p>
                    </div>
                    {entry.restore ? (
                      <motion.span
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="shrink-0 rounded-full bg-[var(--highlight)] px-2.5 py-1 text-[10px] font-medium text-[#1c1c1c]"
                      >
                        Restaurar
                      </motion.span>
                    ) : null}
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
