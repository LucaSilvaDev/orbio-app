import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useSeo } from "@/hooks/useSeo";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Button } from "@/components/ui/Button";

export function ThankYouPage() {
  useSeo({
    title: "Mensagem enviada",
    description: "Recebemos sua mensagem e vamos responder em até 1 dia útil.",
    noindex: true,
  });

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center">
      <Breadcrumbs items={[{ label: "Início", to: "/" }, { label: "Obrigado" }]} />
      <CheckCircle2 className="mx-auto h-12 w-12 text-royal-signal" aria-hidden />
      <h1 className="mt-4 font-serif text-[28px] text-midnight-ink">Mensagem enviada!</h1>
      <p className="mt-2 text-[14px] text-graphite-body">
        Recebemos seu contato e vamos responder em até 1 dia útil no e-mail informado.
      </p>
      <Link to="/" className="mt-8 inline-block">
        <Button variant="outline">Voltar para a página inicial</Button>
      </Link>
    </div>
  );
}
