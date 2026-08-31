import { Link, Outlet } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { CookieConsentBanner } from "@/components/site/CookieConsentBanner";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-snow-canvas">
      <header className="sticky top-0 z-40 border-b border-stone-divider bg-snow-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" aria-label="Ir para a página inicial do Orbio">
            <Logo wordmark size={22} />
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] text-graphite-body sm:flex">
            <a href="/#recursos" className="hover:text-midnight-ink">
              Recursos
            </a>
            <a href="/#faq" className="hover:text-midnight-ink">
              Perguntas frequentes
            </a>
            <a href="/#contato" className="hover:text-midnight-ink">
              Falar com vendas
            </a>
          </nav>
          <Link to="/app/login">
            <Button variant="accent" size="sm">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-stone-divider px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo wordmark size={20} />
            <p className="mt-2 max-w-sm text-[12px] text-ash-helper">
              CRM multi-segmento para times comerciais que precisam de um workspace só, com
              pipeline, contatos e faturas num lugar.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-ash-helper">
            <Link to="/privacidade" className="hover:text-graphite-body hover:underline">
              Política de privacidade
            </Link>
            <a href="/#contato" className="hover:text-graphite-body hover:underline">
              Fale conosco
            </a>
            <Link to="/app/login" className="hover:text-graphite-body hover:underline">
              Entrar no workspace
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-6xl text-[11px] text-ash-helper/80">
          Orbio · orbio.app.br
        </p>
      </footer>

      <CookieConsentBanner />
    </div>
  );
}
