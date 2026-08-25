import { useEffect, useState } from "react";
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
import { envLabel, getWorkspace } from "@/lib/workspace";
import { useAuth } from "@/store/useAuth";
import { useCrm } from "@/store/useCrm";
import { useUi } from "@/store/useUi";
import { AnimatePresence, motion } from "framer-motion";
import { useDismiss } from "@/hooks/useDismiss";
import { useVaultSession } from "@/hooks/useVaultSession";
import { lockVaultNow } from "@/store/useVault";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { AppearanceControl } from "@/components/layout/AppearanceControl";

const groups = [
  {
    label: "Favoritos",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Workspace",
    items: [
      { to: "/companies", label: "Empresas", icon: Building2 },
      { to: "/contacts", label: "Pessoas", icon: Users },
      { to: "/pipeline", label: "Oportunidades", icon: Workflow },
      { to: "/leads", label: "Leads", icon: Activity },
      { to: "/activities", label: "Tarefas", icon: CheckSquare },
      { to: "/notes", label: "Notas", icon: StickyNote },
      { to: "/inbox", label: "Inbox", icon: Inbox },
    ],
  },
  {
    label: "Mais",
    items: [
      { to: "/calendar", label: "Agenda", icon: CalendarDays },
      { to: "/maps", label: "Mapas", icon: GitBranch },
      { to: "/documents", label: "Arquivos", icon: FileText },
      { to: "/vault", label: "Cofre pessoal", icon: LockKeyhole },
      { to: "/products", label: "Produtos", icon: Package },
      { to: "/invoices", label: "Faturas", icon: Receipt },
      { to: "/campaigns", label: "Campanhas", icon: Megaphone },
      { to: "/reports", label: "Dashboards", icon: BarChart3 },
      { to: "/team", label: "Membros", icon: Users },
      { to: "/settings", label: "Ajustes", icon: Settings },
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
  const [openNotes, setOpenNotes] = useState(false);
  const notesRef = useDismiss(() => setOpenNotes(false), openNotes);
  useVaultSession();

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
    <div className="relative min-h-screen p-3 md:p-4">
      <div className="grain" />
      <div className="flex min-h-[calc(100vh-24px)] gap-3">
      <aside
        className={cn(
          "sticky top-3 flex h-[calc(100vh-24px)] flex-col rounded-[28px] bg-snow-canvas/75 shadow-lift backdrop-blur-xl transition-[width] duration-300",
          collapsed ? "w-[72px]" : "w-[228px]",
        )}
      >
        <div className="flex h-12 items-center justify-between px-3">
          <button onClick={() => navigate("/")} className="flex min-w-0 items-center gap-2">
            <Logo wordmark={!collapsed} size={22} />
            {!collapsed ? (
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
            onClick={toggleSidebar}
            className="text-ash-helper hover:text-midnight-ink"
            aria-label="Recolher menu"
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>
        <button
          onClick={() => setCommandOpen(true)}
          className="mx-2 mb-3 flex h-10 items-center gap-2 rounded-pill bg-fog-surface px-3 text-left text-[12px] text-ash-helper hover:bg-lavender-wash"
        >
          <Search className="h-3.5 w-3.5" />
          {!collapsed ? (
            <>
              <span className="flex-1">Buscar</span>
              <span className="mono text-[10px]">⌘K</span>
            </>
          ) : null}
        </button>
        <nav className="orbio-scroll flex-1 space-y-4 overflow-y-auto px-2 pb-3">
          {groups.map((group) => (
            <div key={group.label}>
              {!collapsed ? (
                <p className="mono mb-1 px-2 text-[10px] text-ash-helper">{group.label}</p>
              ) : null}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={"end" in item ? item.end : false}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-2xl px-2.5 py-2 text-[13px] text-graphite-body transition-colors",
                        isActive ? "bg-lavender-wash text-midnight-ink" : "hover:bg-fog-surface",
                      )
                    }
                    title={item.label}
                  >
                    <item.icon className="h-4 w-4 shrink-0 opacity-70" />
                    {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                    {!collapsed && item.to === "/inbox" && unreadInbox > 0 ? (
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
                navigate("/login");
              }}
              className="flex w-full items-center gap-2 rounded-input px-1 py-1 text-left hover:bg-fog-surface"
            >
              <Avatar initials={user.initials} hue={user.avatarHue} size="sm" />
              {!collapsed ? (
                <span>
                  <span className="block text-[12px] text-midnight-ink">{user.name}</span>
                  <span className="block text-[11px] text-ash-helper">Sair</span>
                </span>
              ) : null}
            </button>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-snow-canvas/55 shadow-card backdrop-blur-xl">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 px-5">
          <p className="mono hidden text-[11px] text-ash-helper md:block">
            {location.pathname === "/" ? "Dashboard" : location.pathname.replace("/", "")}
          </p>
          <div className="flex-1" />
          <AppearanceControl />
          <div className="relative" ref={notesRef}>
            <button
              onClick={() => setOpenNotes((v) => !v)}
              className="relative flex h-8 w-8 items-center justify-center rounded-input hover:bg-fog-surface"
            >
              <Bell className="h-4 w-4" />
              {unreadNotes ? (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-royal-signal" />
              ) : null}
            </button>
            {openNotes ? (
              <div className="absolute top-10 right-0 w-80 rounded-[24px] bg-snow-canvas/95 p-3 shadow-lift backdrop-blur-xl">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px]">Alertas</p>
                  <button onClick={() => markAll(user?.id)} className="text-[12px] text-royal-signal">
                    Marcar lidos
                  </button>
                </div>
                <div className="space-y-2">
                  {myNotes.map((item) => (
                    <div key={item.id} className="rounded-card bg-fog-surface p-2.5">
                      <p className="text-[13px] text-midnight-ink">{item.title}</p>
                      <p className="text-[12px] text-ash-helper">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </header>

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
