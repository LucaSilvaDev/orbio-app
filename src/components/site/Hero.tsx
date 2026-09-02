import { useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SHOTS } from "@/components/site/shots";

const rise = {
  hidden: { opacity: 0, y: 28, filter: "blur(12px)" },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, delay: 0.08 + i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function Hero() {
  const reduce = useReducedMotion();
  const area = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  function onMove(event: MouseEvent<HTMLElement>) {
    if (reduce || !area.current) return;
    const box = area.current.getBoundingClientRect();
    setMouse({
      x: (event.clientX - box.left) / box.width - 0.5,
      y: (event.clientY - box.top) / box.height - 0.5,
    });
  }

  const tile = (shift: number) =>
    reduce
      ? undefined
      : {
          x: mouse.x * shift,
          y: mouse.y * shift,
        };

  return (
    <section ref={area} onMouseMove={onMove} className="relative overflow-hidden">
      <div className="site-wrap pt-16 pb-24 sm:pt-24 sm:pb-16">
        <motion.p
          variants={rise}
          initial="hidden"
          animate="show"
          custom={0}
          className="site-kicker text-ash-helper"
        >
          CRM multi-segmento
        </motion.p>

        <h1 className="mt-6 font-serif text-[clamp(52px,11vw,132px)] leading-[0.88] tracking-[-0.045em] text-midnight-ink">
          <motion.span variants={rise} initial="hidden" animate="show" custom={1} className="block">
            O CRM
          </motion.span>
          <motion.span
            variants={rise}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-6"
          >
            que o time
            <motion.img
              src={SHOTS.kanban.src}
              alt=""
              width={280}
              height={168}
              loading="eager"
              fetchPriority="high"
              aria-hidden
              animate={tile(18)}
              transition={{ type: "spring", stiffness: 60, damping: 18 }}
              className="site-shot inline-block h-[0.78em] w-[1.55em] object-cover object-[12%_18%]"
            />
          </motion.span>
          <motion.span
            variants={rise}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-3 italic font-light sm:gap-x-6"
          >
            <motion.img
              src={SHOTS.dashboard.src}
              alt=""
              width={280}
              height={168}
              loading="eager"
              aria-hidden
              animate={tile(-14)}
              transition={{ type: "spring", stiffness: 60, damping: 18 }}
              className="site-shot inline-block h-[0.78em] w-[1.4em] object-cover object-[8%_12%]"
            />
            já esperava.
          </motion.span>
        </h1>

        <motion.p
          variants={rise}
          initial="hidden"
          animate="show"
          custom={4}
          className="mt-8 max-w-xl text-[18px] leading-[1.35] tracking-[-0.02em] text-graphite-body"
        >
          Pipeline, pessoas, empresas e faturas num workspace só — rápido o bastante pra
          substituir a planilha, sem o teatro de um CRM que ninguém abre.
        </motion.p>

        <motion.div
          variants={rise}
          initial="hidden"
          animate="show"
          custom={5}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link to="/app/login" className="site-cta">
            Começar agora
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <a href="#contato" className="site-cta site-cta--line">
            Falar com vendas
          </a>
        </motion.div>

        <motion.ul
          variants={rise}
          initial="hidden"
          animate="show"
          custom={6}
          className="mt-12 flex flex-wrap gap-x-8 gap-y-2"
        >
          {["Kanban real", "Pessoas e contas", "Caixa e atraso"].map((item) => (
            <li key={item} className="site-kicker text-ash-helper">
              {item}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
