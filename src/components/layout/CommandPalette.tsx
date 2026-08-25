import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useCrm } from "@/store/useCrm";
import { useUi } from "@/store/useUi";
import { findCompany } from "@/lib/records";

const pages = [
  { to: "/", label: "Visão geral" },
  { to: "/pipeline", label: "Pipeline" },
  { to: "/contacts", label: "Contatos" },
  { to: "/companies", label: "Empresas" },
  { to: "/leads", label: "Leads" },
  { to: "/activities", label: "Atividades" },
  { to: "/calendar", label: "Agenda" },
  { to: "/notes", label: "Notas e lembretes" },
  { to: "/maps", label: "Fluxograma e mindmap" },
  { to: "/inbox", label: "Inbox interno" },
  { to: "/products", label: "Produtos" },
  { to: "/invoices", label: "Faturas" },
  { to: "/campaigns", label: "Campanhas" },
  { to: "/reports", label: "Relatórios" },
  { to: "/documents", label: "Arquivos" },
  { to: "/vault", label: "Cofre pessoal" },
  { to: "/team", label: "Equipe" },
  { to: "/settings", label: "Ajustes" },
];

export function CommandPalette() {
  const open = useUi((s) => s.commandOpen);
  const setOpen = useUi((s) => s.setCommandOpen);
  const { contacts, companies, deals } = useCrm();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pageHits = pages
      .filter((page) => page.label.toLowerCase().includes(q) || !q)
      .slice(0, 5)
      .map((page) => ({ type: "Página", label: page.label, to: page.to }));
    const people = contacts
      .filter((c) => c.name.toLowerCase().includes(q) || c.email.includes(q))
      .slice(0, 4)
      .map((c) => ({ type: "Contato", label: c.name, to: `/contacts/${c.id}` }));
    const firms = companies
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((c) => ({ type: "Empresa", label: c.name, to: `/companies/${c.id}` }));
    const opps = deals
      .filter((d) => {
        const company = findCompany(companies, d.companyId)?.name ?? "";
        return d.name.toLowerCase().includes(q) || company.toLowerCase().includes(q);
      })
      .slice(0, 4)
      .map((d) => ({ type: "Deal", label: d.name, to: `/pipeline/${d.id}` }));
    return [...pageHits, ...people, ...firms, ...opps].slice(0, 12);
  }, [query, contacts, companies, deals]);

  function go(to: string) {
    setOpen(false);
    setQuery("");
    navigate(to);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-midnight-ink/20 px-4 pt-[12vh] backdrop-blur-[6px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-xl overflow-hidden rounded-container bg-snow-canvas/90 shadow-lift backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4">
              <Search className="h-4 w-4 text-ash-helper" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ir para um registro ou página"
                className="h-12 flex-1 bg-transparent text-[15px] outline-none"
              />
            </div>
            <ul className="max-h-80 overflow-auto p-2">
              {results.map((item) => (
                <li key={item.to + item.label}>
                  <button
                    onClick={() => go(item.to)}
                    className="flex w-full items-center justify-between rounded-card px-3 py-2.5 text-left hover:bg-lavender-wash"
                  >
                    <span className="text-[14px] font-medium text-graphite-body">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-ash-helper">{item.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
