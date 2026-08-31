import { Building2, Megaphone, Workflow } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/motion/Reveal";

const scenarios = [
  {
    icon: Workflow,
    title: "Times comerciais",
    description:
      "Organize o funil de vendas do lead ao fechamento, com pipeline visual e histórico de cada negociação num só lugar.",
  },
  {
    icon: Building2,
    title: "Empresas com carteira de clientes",
    description:
      "Centralize empresas, contatos e documentos por conta, sem depender de planilha paralela pra saber quem é quem.",
  },
  {
    icon: Megaphone,
    title: "Times de marketing e CRM",
    description:
      "Acompanhe campanhas e leads lado a lado com o restante do funil, sem exportar dados entre ferramentas.",
  },
];

export function CasesSection() {
  return (
    <section id="recursos" className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <h2 className="text-center font-serif text-[30px] text-midnight-ink">
          Como times usam o Orbio
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-[13px] text-ash-helper">
          Exemplos de uso do produto — ainda estamos coletando os primeiros casos reais de
          clientes.
        </p>
      </Reveal>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {scenarios.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.1}>
            <Card className="group h-full text-left transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lift">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-pipeline bg-lavender-wash text-royal-signal transition-transform duration-300 group-hover:scale-110">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-[15px] font-medium text-midnight-ink">{item.title}</h3>
              <p className="mt-1.5 text-[13px] text-graphite-body">{item.description}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
