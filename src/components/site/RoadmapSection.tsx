import { motion } from "framer-motion";
import { Landmark, MessageCircle, Wallet } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

const ITEMS = [
  {
    icon: Wallet,
    title: "Financeiro completo",
    text: "Contas a pagar e a receber, cobrança por Pix e boleto, fluxo de caixa e conciliação.",
    note: "Hoje: faturas com anexo, status e vencimento.",
  },
  {
    icon: Landmark,
    title: "Integração bancária",
    text: "Leitura de extrato para saber, sem planilha, de onde vem e para onde vai o dinheiro.",
    note: "Em planejamento.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp e e-mail no CRM",
    text: "Conversas com clientes gravadas na empresa, para o histórico não ficar no celular de ninguém.",
    note: "Em planejamento.",
  },
];

export function RoadmapSection() {
  return (
    <section className="mx-auto max-w-[1180px] px-4 py-16 sm:py-24">
      <Reveal className="text-center">
        <p className="app-eyebrow">O que vem a seguir</p>
        <h2 className="app-display mx-auto mt-3 max-w-2xl text-[clamp(32px,4.6vw,56px)] text-midnight-ink">
          Estamos construindo o resto, <span className="text-ash-helper">com quem usa.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] text-slate-caption">
          Transparência: o que está abaixo ainda não está disponível. As empresas piloto ajudam a decidir a ordem.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {ITEMS.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.08}>
            <div className="glass relative h-full overflow-hidden rounded-[28px] p-6">
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{ x: ["0%", "340%"] }}
                transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 2.5 + i, ease: "easeInOut" }}
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-midnight-ink/[0.06] text-midnight-ink">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="absolute top-6 right-6 rounded-full bg-[#f2ae40]/18 px-2.5 py-1 text-[10px] font-medium text-[#a15c07]">
                Em desenvolvimento
              </span>
              <h3 className="mt-5 text-[18px] font-medium tracking-[-0.02em] text-midnight-ink">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-slate-caption">{item.text}</p>
              <p className="mt-4 text-[12px] text-ash-helper">{item.note}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
