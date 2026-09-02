import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { CookieConsentBanner } from "@/components/site/CookieConsentBanner";

const links = [
  { href: "/#recursos", label: "Produto" },
  { href: "/#faq", label: "Perguntas" },
  { href: "/#contato", label: "Vendas" },
];

export function PublicLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.site = "public";
    return () => {
      delete document.documentElement.dataset.site;
    };
  }, []);

  return (
    <div className="site-editorial min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-divider bg-snow-canvas/92 backdrop-blur-md">
        <div className="site-wrap flex h-[72px] items-center justify-between">
          <Link to="/" aria-label="Ir para a página inicial do Orbio" className="shrink-0">
            <Logo wordmark size={22} />
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            {links.map((item) => (
              <a key={item.href} href={item.href} className="site-kicker text-ash-helper hover:text-midnight-ink">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="site-kicker text-midnight-ink sm:hidden"
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
            >
              {menu ? "Fechar" : "Menu"}
            </button>
            <div className="hidden sm:block">
              <Link to="/app/login" className="site-cta site-cta--sm">
                Entrar
              </Link>
            </div>
          </div>
        </div>
        {menu ? (
          <div className="border-t border-stone-divider px-5 py-4 sm:hidden">
            <div className="flex flex-col gap-4">
              {links.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="site-kicker text-midnight-ink"
                  onClick={() => setMenu(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link to="/app/login" className="site-cta site-cta--sm w-fit" onClick={() => setMenu(false)}>
                Entrar
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>

      {isHome ? (
        <div className="site-accent-band overflow-hidden">
          <div className="site-marquee flex whitespace-nowrap py-16 font-serif text-[clamp(64px,12vw,160px)] leading-none tracking-[-0.05em] text-white">
            <span className="px-8">Orbio · pipeline · pessoas · empresas · faturas · </span>
            <span className="px-8" aria-hidden>
              Orbio · pipeline · pessoas · empresas · faturas ·
            </span>
          </div>
        </div>
      ) : null}

      <footer className="bg-midnight-ink px-5 py-14 text-snow-canvas">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo wordmark size={22} inverted />
            <p className="mt-4 max-w-sm text-[16px] leading-[1.35] tracking-[-0.02em] text-white/60">
              CRM multi-segmento para times comerciais. Pipeline, contatos e faturas num lugar.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/privacidade" className="site-kicker text-white/70 hover:text-white">
              Política de privacidade
            </Link>
            <a href="/#contato" className="site-kicker text-white/70 hover:text-white">
              Fale conosco
            </a>
            <Link to="/app/login" className="site-kicker text-white/70 hover:text-white">
              Entrar no workspace
            </Link>
          </div>
        </div>
        <p className="site-kicker mx-auto mt-12 max-w-[1400px] text-white/40">Orbio · orbio.app.br</p>
      </footer>

      <CookieConsentBanner />
    </div>
  );
}
