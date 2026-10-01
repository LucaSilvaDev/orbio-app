import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { HeroDashboard } from "@/components/site/HeroDashboard";

const rise = {
  hidden: { opacity: 0, y: 24, filter: "blur(12px)" },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function Hero() {
  return (
    <section className="relative px-4 pt-32 pb-10 sm:pt-40">
      <div className="mx-auto max-w-[1080px] text-center">
        <motion.p
          variants={rise}
          initial="hidden"
          animate="show"
          custom={0}
          className="mx-auto inline-flex items-center gap-2 rounded-full bg-[var(--highlight)] px-3.5 py-1.5 text-[12px] font-medium text-[#1c1c1c] shadow-[0_10px_24px_-14px_rgb(120,140,0)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1c1c1c]/40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1c1c1c]" />
          </span>
          Vagas abertas para empresas piloto
        </motion.p>

        <h1 className="app-display mt-7 text-[clamp(44px,8.2vw,104px)] text-midnight-ink">
          <motion.span variants={rise} initial="hidden" animate="show" custom={1} className="block">
            A empresa inteira,
          </motion.span>
          <motion.span variants={rise} initial="hidden" animate="show" custom={2} className="block">
            <span className="bg-[linear-gradient(100deg,var(--ink)_10%,var(--accent)_90%)] bg-clip-text text-transparent">
              num só lugar.
            </span>
          </motion.span>
        </h1>

        <motion.p
          variants={rise}
          initial="hidden"
          animate="show"
          custom={3}
          className="mx-auto mt-7 max-w-2xl text-[17px] leading-[1.5] text-slate-caption sm:text-[19px]"
        >
          Vendas, equipe, documentos, conversas e relatórios no mesmo sistema — rápido, bonito e feito para
          pequenas e médias empresas que não querem depender de dez ferramentas soltas.
        </motion.p>

        <motion.div
          variants={rise}
          initial="hidden"
          animate="show"
          custom={4}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/app/login?qa=1"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-midnight-ink px-6 text-[14px] font-medium text-snow-canvas shadow-[0_18px_36px_-18px_var(--ink)] transition-transform hover:-translate-y-0.5"
          >
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
            Explorar a demonstração
          </Link>
          <a
            href="#contato"
            className="glass inline-flex h-12 items-center gap-2 rounded-full px-6 text-[14px] font-medium text-midnight-ink transition-transform hover:-translate-y-0.5"
          >
            Falar com a gente
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </motion.div>
        <motion.p variants={rise} initial="hidden" animate="show" custom={5} className="mt-4 text-[12px] text-ash-helper">
          A demonstração usa dados fictícios e não pede cadastro.
        </motion.p>
      </div>

      <HeroDashboard />
    </section>
  );
}
