import { Quote } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/motion/Reveal";

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <Card className="mx-auto max-w-2xl border border-stone-divider p-10 text-center">
          <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-lavender-wash text-royal-signal">
            <Quote className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-[18px] font-medium text-midnight-ink">
            Em breve: o que nossos clientes dizem
          </h2>
          <p className="mt-2 text-[13px] text-ash-helper">
            Ainda estamos nos primeiros clientes do Orbio. Assim que tivermos depoimentos reais,
            eles aparecem aqui — nada de avaliação inventada.
          </p>
        </Card>
      </Reveal>
    </section>
  );
}
