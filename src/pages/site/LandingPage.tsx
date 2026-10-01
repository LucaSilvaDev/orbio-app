import { LockKeyhole, ScrollText, ShieldCheck, UsersRound } from "lucide-react";
import { useSeo } from "@/hooks/useSeo";
import { Hero } from "@/components/site/Hero";
import { BentoSection } from "@/components/site/BentoSection";
import { HistorySection } from "@/components/site/HistorySection";
import { RoadmapSection } from "@/components/site/RoadmapSection";
import { PilotSection } from "@/components/site/PilotSection";
import { FAQSection } from "@/components/site/FAQSection";
import { ContactSection } from "@/components/site/ContactSection";
import { StickyMobileCTA } from "@/components/site/StickyMobileCTA";

const TRUST = [
  { icon: ShieldCheck, label: "Dados isolados por empresa" },
  { icon: ScrollText, label: "Histórico de tudo que muda" },
  { icon: UsersRound, label: "Papéis e permissões" },
  { icon: LockKeyhole, label: "Cofre criptografado" },
];

export function LandingPage() {
  useSeo({
    title: "O sistema que reúne a empresa inteira",
    description:
      "Orbio reúne vendas, equipe, documentos, chat interno e relatórios num só lugar, para pequenas e médias empresas. Veja a demonstração ou entre no programa piloto.",
  });

  return (
    <>
      <Hero />

      <section aria-label="Pilares do sistema" className="mx-auto max-w-[1180px] px-4 pt-6 pb-4">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TRUST.map((item) => (
            <li key={item.label} className="glass flex items-center gap-3 rounded-full px-4 py-3">
              <item.icon className="h-4 w-4 shrink-0 text-royal-signal" aria-hidden />
              <span className="text-[12px] font-medium text-midnight-ink">{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <BentoSection />
      <HistorySection />
      <RoadmapSection />
      <PilotSection />
      <FAQSection />
      <ContactSection />
      <StickyMobileCTA />
      <div className="h-20 sm:hidden" aria-hidden />
    </>
  );
}
