import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { CookieConsentBanner } from "@/components/site/CookieConsentBanner";

const links = [
  { href: "/#recursos", label: "Sistema" },
  { href: "/#piloto", label: "Programa piloto" },
  { href: "/#faq", label: "Perguntas" },
  { href: "/#contato", label: "Contato" },
];

export function PublicLayout() {
  const [menu, setMenu] = useState(false);
  const isHome = useLocation().pathname === "/";

  useEffect(() => {
    document.documentElement.dataset.site = "public";
    return () => {
      delete document.documentElement.dataset.site;
    };
  }, []);

  return (
    <div className="app-root relative min-h-screen text-midnight-ink">
      <div className="app-aurora" aria-hidden>
        <i />
      </div>

      <header className="fixed inset-x-0 top-3 z-40 px-3">
        <div className="glass mx-auto flex max-w-[1080px] items-center justify-between rounded-full py-2 pr-2 pl-5">
          <Link to="/" aria-label="Ir para a página inicial do Orbio" className="shrink-0">
            <Logo wordmark size={24} />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-slate-caption transition-colors hover:bg-midnight-ink/[0.06] hover:text-midnight-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/app/login"
              className="hidden rounded-full bg-midnight-ink px-5 py-2.5 text-[13px] font-medium text-snow-canvas sm:inline-flex"
            >
              Entrar
            </Link>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-midnight-ink/[0.06] md:hidden"
              aria-label={menu ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
            >
              {menu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menu ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass mx-auto mt-2 max-w-[1080px] rounded-[28px] p-3 md:hidden"
            >
              {links.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenu(false)}
                  className="block rounded-2xl px-4 py-3 text-[14px] font-medium text-midnight-ink hover:bg-midnight-ink/[0.05]"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/app/login"
                onClick={() => setMenu(false)}
                className="mt-1 block rounded-2xl bg-midnight-ink px-4 py-3 text-center text-[14px] font-medium text-snow-canvas"
              >
                Entrar
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <main className={isHome ? "relative z-10" : "relative z-10 pt-24"}>
        <Outlet />
      </main>

      <footer className="relative z-10 px-4 pt-6 pb-28 sm:pb-10">
        <div className="glass mx-auto flex max-w-[1180px] flex-col gap-8 rounded-[32px] p-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo wordmark size={24} />
            <p className="mt-4 max-w-sm text-[13px] leading-[1.6] text-slate-caption">
              Vendas, equipe, documentos, conversas e relatórios num só lugar, para pequenas e médias empresas.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 text-[13px]">
            <Link to="/privacidade" className="text-slate-caption hover:text-midnight-ink">
              Política de privacidade
            </Link>
            <a href="/#contato" className="text-slate-caption hover:text-midnight-ink">
              Fale conosco
            </a>
            <Link to="/app/login?qa=1" className="text-slate-caption hover:text-midnight-ink">
              Demonstração (dados fictícios)
            </Link>
            <Link to="/app/login" className="text-slate-caption hover:text-midnight-ink">
              Entrar no workspace
            </Link>
          </div>
        </div>
        <p className="mt-5 text-center text-[12px] text-ash-helper">© {new Date().getFullYear()} Orbio · orbio.app.br</p>
      </footer>

      <CookieConsentBanner />
    </div>
  );
}
