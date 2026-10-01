import { Check } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

const BENEFITS = [
  "Acesso completo ao sistema para a sua equipe",
  "Condição especial, com preço fixo por 12 meses",
  "Atendimento direto com quem constrói o produto",
  "Voz na ordem do que será construído a seguir",
];

export function PilotSection() {
  return (
    <section id="piloto" className="mx-auto max-w-[1180px] px-4 py-16">
      <Reveal repeat>
        <div className="glass glass--ink relative overflow-hidden rounded-[40px] p-8 sm:p-14">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[var(--highlight)]/25 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-block rounded-full bg-[var(--highlight)] px-3 py-1 text-[11px] font-medium text-[#1c1c1c]">
                Programa de empresas piloto
              </p>
              <h2 className="app-display mt-5 text-[clamp(32px,4.6vw,58px)]">
                As primeiras empresas entram <span className="text-white/55">com condição de fundador.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-[1.6] text-white/70">
                Estamos abrindo poucas vagas para pequenas e médias empresas de qualquer segmento. Os planos públicos
                ainda serão definidos — quem entra agora trava a condição.
              </p>
              <a
                href="#contato"
                className="mt-8 inline-flex h-12 items-center rounded-full bg-[var(--highlight)] px-7 text-[14px] font-medium text-[#1c1c1c] shadow-[0_18px_36px_-18px_rgb(190,210,40)] transition-transform hover:-translate-y-0.5"
              >
                Quero ser piloto
              </a>
            </div>
            <ul className="space-y-3">
              {BENEFITS.map((text) => (
                <li key={text} className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-3.5 ring-1 ring-white/10">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--highlight)] text-[#1c1c1c]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[14px] text-white/90">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
