import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

const rise = {
  hidden: { opacity: 0, y: 22, filter: "blur(10px)" },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const chips = [
  { icon: Zap, label: "Pipeline visual em segundos" },
  { icon: ShieldCheck, label: "Login e sessão via Supabase" },
  { icon: Sparkles, label: "Sem planilha, sem fricção" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 34%, transparent), transparent)",
          animation: "float-y 9s ease-in-out infinite",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-10 right-[8%] h-64 w-64 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #ffd8f3cc, transparent)", animation: "float-y 7s ease-in-out infinite 1.2s" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-10 text-center sm:pt-24">
        <motion.span
          variants={rise}
          initial="hidden"
          animate="show"
          custom={0}
          className="mono inline-block rounded-pill bg-lavender-wash px-3 py-1 text-[11px] text-royal-signal"
        >
          CRM multi-segmento
        </motion.span>

        <motion.h1
          variants={rise}
          initial="hidden"
          animate="show"
          custom={1}
          className="mx-auto mt-5 max-w-3xl font-serif text-[38px] leading-[1.1] text-midnight-ink sm:text-[56px]"
        >
          Um workspace só para pipeline, contatos e faturas do seu time comercial
        </motion.h1>

        <motion.p
          variants={rise}
          initial="hidden"
          animate="show"
          custom={2}
          className="mx-auto mt-5 max-w-xl text-[15px] text-graphite-body"
        >
          O Orbio reúne leads, negociações, contatos, campanhas e documentos numa interface rápida
          e sem fricção — pra você parar de alternar entre planilha, WhatsApp e cinco outras
          ferramentas.
        </motion.p>

        <motion.div
          variants={rise}
          initial="hidden"
          animate="show"
          custom={3}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/app/login">
            <Button variant="accent" className="gap-2 px-6">
              Começar agora
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#contato">
            <Button variant="outline" className="px-6">
              Falar com vendas
            </Button>
          </a>
        </motion.div>

        <motion.div
          variants={rise}
          initial="hidden"
          animate="show"
          custom={4}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1.5 rounded-pill bg-fog-surface px-3 py-1.5 text-[12px] text-graphite-body"
            >
              <chip.icon className="h-3.5 w-3.5 text-royal-signal" aria-hidden />
              {chip.label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
