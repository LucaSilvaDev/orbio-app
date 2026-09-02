import { useSeo } from "@/hooks/useSeo";
import { Hero } from "@/components/site/Hero";
import { ProductPreview } from "@/components/site/ProductPreview";
import { CasesSection } from "@/components/site/CasesSection";
import { TestimonialsSection } from "@/components/site/TestimonialsSection";
import { FAQSection } from "@/components/site/FAQSection";
import { ContactSection } from "@/components/site/ContactSection";
import { StickyMobileCTA } from "@/components/site/StickyMobileCTA";

export function LandingPage() {
  useSeo({
    title: "CRM multi-segmento para times comerciais",
    description:
      "Orbio é o CRM que reúne pipeline, contatos, empresas e faturas num único workspace rápido. Comece agora ou fale com vendas.",
  });

  return (
    <>
      <Hero />
      <ProductPreview />
      <CasesSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <StickyMobileCTA />
      <div className="h-20 sm:hidden" aria-hidden />
    </>
  );
}
