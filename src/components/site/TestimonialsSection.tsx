import { Link } from "react-router-dom";
import { Reveal } from "@/components/motion/Reveal";

export function TestimonialsSection() {
  return (
    <section className="bg-midnight-ink text-snow-canvas">
      <div className="site-wrap grid gap-12 py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <Reveal>
          <p className="site-kicker text-white/45">Sem depoimento de estoque</p>
          <h2 className="mt-5 font-serif text-[clamp(36px,5.5vw,84px)] leading-[0.92] tracking-[-0.04em]">
            Ainda estamos nos primeiros clientes. Quando falarem, entra aqui — nada inventado.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-[18px] leading-[1.35] tracking-[-0.02em] text-white/75">
            Enquanto isso, o caminho é direto: abre o workspace ou fala com quem constrói o
            produto.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/app/login" className="site-cta">
              Abrir o workspace
            </Link>
            <a href="#contato" className="site-cta site-cta--ghost">
              Falar com vendas
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
