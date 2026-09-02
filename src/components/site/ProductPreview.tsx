import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import { ProductShot } from "@/components/site/ProductShot";
import { SHOTS } from "@/components/site/shots";

const spreads = [
  {
    kicker: "Oportunidades",
    title: "O funil inteiro, no mesmo objeto.",
    body: "Tabela, lista, kanban e calendário sobre os mesmos deals. Valor, estágio e próximo passo visíveis — sem exportar pra planilha no fim do dia.",
    shot: SHOTS.kanban,
    position: "16% 20%",
  },
  {
    kicker: "Pessoas e contas",
    title: "Quem move a receita, com dono e último toque.",
    body: "Contatos com cargo e empresa. Contas com saúde, ARR e cobertura. O time para de perguntar no WhatsApp quem é quem.",
    shot: SHOTS.contacts,
    position: "18% 22%",
    reverse: true,
  },
  {
    kicker: "Receita",
    title: "Do rascunho ao caixa, com atraso visível.",
    body: "Faturas no mesmo workspace do pipeline. Emitido, pago e atrasado no mesmo olhar — sem outro sistema só pra financeiro.",
    shot: SHOTS.invoices,
    position: "14% 10%",
  },
];

export function ProductPreview() {
  const stage = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: stage,
    offset: ["start end", "start 20%"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.92, 1]);
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [80, 0]);
  const radius = useTransform(scrollYProgress, [0, 1], reduce ? [14, 14] : [28, 14]);

  return (
    <>
      <div ref={stage} className="site-wrap pb-8">
        <Reveal>
          <p className="site-kicker text-ash-helper">O produto, sem mock</p>
          <h2 className="mt-4 max-w-4xl font-serif text-[clamp(36px,6vw,84px)] leading-[0.92] tracking-[-0.04em] text-midnight-ink">
            Prints reais do workspace. Não é ilustração.
          </h2>
        </Reveal>
        <motion.div style={{ scale, y, borderRadius: radius }} className="site-shot mt-10 overflow-hidden">
          <img
            src={SHOTS.dashboard.src}
            alt={SHOTS.dashboard.alt}
            width={1800}
            height={1083}
            className="w-full object-cover object-[12%_8%]"
          />
        </motion.div>
      </div>

      <div id="recursos" className="site-wrap">
        {spreads.map((item, i) => (
          <article
            key={item.kicker}
            className="grid items-center gap-10 border-t border-stone-divider py-20 lg:grid-cols-2 lg:gap-16"
          >
            <Reveal className={item.reverse ? "lg:order-2" : undefined}>
              <p className="site-kicker text-ash-helper">{item.kicker}</p>
              <h3 className="mt-4 font-serif text-[clamp(32px,4.6vw,64px)] leading-[0.95] tracking-[-0.035em] text-midnight-ink">
                {item.title}
              </h3>
              <p className="mt-5 max-w-md text-[18px] leading-[1.35] tracking-[-0.02em] text-graphite-body">
                {item.body}
              </p>
            </Reveal>
            <Reveal delay={0.08} className={item.reverse ? "lg:order-1" : undefined}>
              <ProductShot
                src={item.shot.src}
                alt={item.shot.alt}
                parallax={36 + i * 8}
                position={item.position}
                className="aspect-[16/10] w-full"
              />
            </Reveal>
          </article>
        ))}
      </div>
    </>
  );
}
