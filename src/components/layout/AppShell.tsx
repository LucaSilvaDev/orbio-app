import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckSquare,
  FileText,
  GitBranch,
  Inbox,
  LayoutDashboard,
  LockKeyhole,
  Megaphone,
  Package,
  Receipt,
  Search,
  Settings,
  StickyNote,
  Users,
  Workflow,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { envLabel, getWorkspace, isShotMode } from "@/lib/workspace";
import { useAuth } from "@/store/useAuth";
import { useCrm } from "@/store/useCrm";
import { useUi } from "@/store/useUi";
import { isReadOnly, usePermissions } from "@/store/usePermissions";
import { AnimatePresence, motion } from "framer-motion";
import { useDismiss } from "@/hooks/useDismiss";
import { useVaultSession } from "@/hooks/useVaultSession";
import { lockVaultNow } from "@/store/useVault";
import { useCoreSync } from "@/hooks/useCoreSync";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { AppearanceControl } from "@/components/layout/AppearanceControl";

const groups = [
  {
    label: "Favoritos",
    items: [{ to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Workspace",
    items: [
      { to: "/app/companies", label: "Empresas", icon: Building2 },
      { to: "/app/contacts", label: "Pessoas", icon: Users },
      { to: "/app/pipeline", label: "Oportunidades", icon: Workflow },
      { to: "/app/leads", label: "Leads", icon: Activity },
      { to: "/app/activities", label: "Tarefas", icon: CheckSquare },
      { to: "/app/notes", label: "Notas", icon: StickyNote },
      { to: "/app/inbox", label: "Inbox", icon: Inbox },
    ],
  },
  {
    label: "Mais",
    items: [
      { to: "/app/calendar", label: "Agenda", icon: CalendarDays },
      { to: "/app/maps", label: "Mapas", icon: GitBranch },
      { to: "/app/documents", label: "Arquivos", icon: FileText },
      { to: "/app/vault", label: "Cofre pessoal", icon: LockKeyhole },
      { to: "/app/products", label: "Produtos", icon: Package },
      { to: "/app/invoices", label: "Faturas", icon: Receipt },
      { to: "/app/campaigns", label: "Campanhas", icon: Megaphone },
      { to: "/app/reports", label: "Dashboards", icon: BarChart3 },
      { to: "/app/team", label: "Membros", icon: Users },
      { to: "/app/settings", label: "Ajustes", icon: Settings },
    ],
  },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const [hoverOpen, setHoverOpen] = useState(false);
  const hoverLeave = useRef<number>(0);
  const expanded = !collapsed || hoverOpen;
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const toast = useUi((s) => s.toast);
  const notifications = useCrm((s) => s.notifications);
  const markAll = useCrm((s) => s.markAllNotifications);
  const unreadInbox = useCrm(
    (s) =>
      (s.threads ?? []).filter((thread) => user && thread.unreadBy?.includes(user.id)).length,
  );
  const myNotes = (notifications ?? []).filter((n) => !n.userId || n.userId === user?.id);
  const unreadNotes = myNotes.filter((n) => !n.read).length;
  const readOnly = isReadOnly(usePermissions((s) => s.role));
  const [openNotes, setOpenNotes] = useState(false);
  const notesRef = useDismiss(() => setOpenNotes(false), openNotes);
  useVaultSession();
  useCoreSync();

  useEffect(() => {
    if (readOnly) document.documentElement.dataset.readonly = "1";
    else delete document.documentElement.dataset.readonly;
    return () => {
      delete document.documentElement.dataset.readonly;
    };
  }, [readOnly]);

  useEffect(() => {
    return () => window.clearTimeout(hoverLeave.current);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);

  return (
    <div className="app-root relative min-h-screen p-3 md:p-4">
      <div className="app-aurora" aria-hidden>
        <i />
      </div>
      <div className="grain" />
      <div className="relative z-10 flex min-h-[calc(100vh-24px)] gap-3">
      <aside
        onMouseEnter={() => {
          window.clearTimeout(hoverLeave.current);
          if (collapsed) setHoverOpen(true);
        }}
        onMouseLeave={() => {
          window.clearTimeout(hoverLeave.current);
          hoverLeave.current = window.setTimeout(() => setHoverOpen(false), 160);
        }}
        className={cn(
          "glass sticky top-3 z-20 flex h-[calc(100vh-24px)] flex-col rounded-[30px] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          expanded ? "w-[228px]" : "w-[72px]",
        )}
      >
        <div className="flex h-12 items-center justify-between px-3">
          <button onClick={() => navigate("/app")} className="flex min-w-0 items-center gap-2">
            <Logo wordmark={expanded} size={22} />
            {expanded && !isShotMode() ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  getWorkspace() === "official"
                    ? "bg-midnight-ink text-snow-canvas"
                    : "bg-lavender-wash text-royal-signal"
                }`}
              >
                {envLabel()}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => {
              setHoverOpen(false);
              toggleSidebar();
            }}
            className="text-ash-helper hover:text-midnight-ink"
            aria-label={collapsed ? "Fixar menu aberto" : "Recolher menu"}
            title={collapsed ? "Fixar aberto" : "Recolher"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>
        <button
          onClick={() => setCommandOpen(true)}
          className="mx-2 mb-3 flex h-10 items-center gap-2 rounded-pill bg-midnight-ink/5 px-3 text-left text-[12px] text-ash-helper transition-colors hover:bg-midnight-ink/10"
        >
          <Search className="h-3.5 w-3.5" />
          {expanded ? (
            <>
              <span className="flex-1">Buscar</span>
              <span className="mono text-[10px]">⌘K</span>
            </>
          ) : null}
        </button>
        <nav className="orbio-scroll flex-1 space-y-4 overflow-y-auto px-2 pb-3">
          {groups.map((group) => (
            <div key={group.label}>
              {expanded ? (
                <p className="app-eyebrow mb-1 px-3 !text-[10px]">{group.label}</p>
              ) : null}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={"end" in item ? item.end : false}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-pill px-3 py-2 text-[13px] transition-all duration-200",
                        isActive
                          ? "nav-pill-active font-medium"
                          : "text-graphite-body hover:bg-midnight-ink/6",
                      )
                    }
                    title={item.label}
                  >
                    <item.icon className="h-4 w-4 shrink-0 opacity-80" />
                    {expanded ? <span className="flex-1 truncate">{item.label}</span> : null}
                    {expanded && item.to === "/app/inbox" && unreadInbox > 0 ? (
                      <span className="mono text-[10px] text-ash-helper">{unreadInbox}</span>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        {user ? (
          <div className="p-2">
            <button
              onClick={() => {
                lockVaultNow();
                logout();
                navigate("/app/login");
              }}
              className="flex w-full items-center gap-2 rounded-pill px-1.5 py-1.5 text-left hover:bg-midnight-ink/6"
            >
              <Avatar initials={user.initials} hue={user.avatarHue} size="sm" />
              {expanded ? (
                <span>
                  <span className="block text-[12px] text-midnight-ink">{user.name}</span>
                  <span className="block text-[11px] text-ash-helper">Sair</span>
                </span>
              ) : null}
            </button>
          </div>
        ) : null}
      </aside>

      <div className="glass glass--soft flex min-w-0 flex-1 flex-col overflow-hidden rounded-[34px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 px-5">
          <p className="hidden text-[12px] font-medium capitalize text-ash-helper md:block">
            {location.pathname === "/app" ? "Dashboard" : location.pathname.replace("/app/", "").replace(/\//g, " / ")}
          </p>
          <div className="flex-1" />
          <AppearanceControl />
          <div className="relative" ref={notesRef}>
            <button
              onClick={() => setOpenNotes((v) => !v)}
              className="glass relative flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:-translate-y-px"
            >
              <Bell className="h-4 w-4" />
              {unreadNotes ? (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-royal-signal ring-2 ring-white/80" />
              ) : null}
            </button>
            {openNotes ? (
              <div className="glass absolute top-11 right-0 w-80 rounded-[24px] !bg-snow-canvas/90 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px]">Alertas</p>
                  <button onClick={() => markAll(user?.id)} className="text-[12px] text-royal-signal">
                    Marcar lidos
                  </button>
                </div>
                <div className="space-y-2">
                  {myNotes.map((item) => (
                    <div key={item.id} className="rounded-[18px] bg-midnight-ink/5 p-2.5">
                      <p className="text-[13px] text-midnight-ink">{item.title}</p>
                      <p className="text-[12px] text-ash-helper">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {readOnly ? (
          <p className="mx-5 mb-1 rounded-pill bg-[#f2ae40]/18 px-4 py-2 text-center text-[12px] text-[#a15c07]">
            Você tem acesso somente leitura. Peça a um administrador para liberar edição.
          </p>
        ) : null}
        <main className="orbio-scroll min-h-0 flex-1 overflow-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      </div>

      <CommandPalette />
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-midnight-ink px-4 py-2.5 text-[12px] text-snow-canvas shadow-lift"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
