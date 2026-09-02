import { Reveal } from "@/components/motion/Reveal";
import { ProductShot } from "@/components/site/ProductShot";
import { SHOTS } from "@/components/site/shots";

const modules = [
  { kicker: "Pipeline", title: "Kanban e tabela", shot: SHOTS.pipeline, position: "20% 18%" },
  { kicker: "Pessoas", title: "Contatos com dono", shot: SHOTS.contacts, position: "22% 28%" },
  { kicker: "Contas", title: "Saúde e ARR", shot: SHOTS.companies, position: "20% 32%" },
  { kicker: "Caixa", title: "Fatura e atraso", shot: SHOTS.invoices, position: "16% 40%" },
];

const stats = [
  { value: "1", label: "Workspace" },
  { value: "15", label: "Módulos no menu" },
  { value: "0", label: "Planilha paralela" },
];

export function CasesSection() {
  return (
    <section className="site-wrap py-20">
      <Reveal>
        <p className="site-kicker text-ash-helper">O mapa do produto</p>
        <h2 className="mt-4 max-w-3xl font-serif text-[clamp(36px,5.5vw,80px)] leading-[0.92] tracking-[-0.04em] text-midnight-ink">
          Quatro telas. O resto do CRM segue o mesmo ritmo.
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-8 sm:grid-cols-3">
        {stats.map((item, i) => (
          <Reveal key={item.label} delay={i * 0.08}>
            <p className="font-serif text-[clamp(56px,8vw,96px)] leading-none tracking-[-0.05em] text-ash-helper">
              {item.value}
            </p>
            <p className="site-kicker mt-3 text-midnight-ink">{item.label}</p>
          </Reveal>
        ))}
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((item, i) => (
          <Reveal key={item.kicker} delay={i * 0.07}>
            <p className="site-kicker text-ash-helper">{item.kicker}</p>
            <p className="mt-2 text-[18px] tracking-[-0.02em] text-midnight-ink">{item.title}</p>
            <ProductShot
              src={item.shot.src}
              alt={item.shot.alt}
              parallax={24}
              position={item.position}
              className="mt-4 aspect-[4/3] w-full"
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
