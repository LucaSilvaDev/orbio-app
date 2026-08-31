import { Link } from "react-router-dom";
import { useSeo } from "@/hooks/useSeo";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";

export function NotFoundPage() {
  useSeo({
    title: "Página não encontrada",
    description: "A página que você procura não existe ou foi movida.",
    noindex: true,
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <Logo size={36} />
      <p className="mono text-[13px] text-ash-helper">Erro 404</p>
      <h1 className="font-serif text-[28px] text-midnight-ink">Não achamos essa página</h1>
      <p className="max-w-sm text-[14px] text-graphite-body">
        O link pode estar quebrado ou a página foi movida. Volta pra página inicial pra continuar
        navegando.
      </p>
      <Link to="/" className="mt-2">
        <Button variant="accent">Voltar para o início</Button>
      </Link>
    </div>
  );
}
