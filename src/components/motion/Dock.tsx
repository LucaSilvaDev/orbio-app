import { useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  Settings,
  Users,
  Workflow,
} from "lucide-react";

const items = [
  { to: "/app", icon: LayoutDashboard, label: "Visão" },
  { to: "/app/pipeline", icon: Workflow, label: "Pipeline" },
  { to: "/app/contacts", icon: Users, label: "Contatos" },
  { to: "/app/companies", icon: Building2, label: "Empresas" },
  { to: "/app/calendar", icon: CalendarDays, label: "Agenda" },
  { to: "/app/inbox", icon: Inbox, label: "Inbox" },
  { to: "/app/reports", icon: BarChart3, label: "Relatórios" },
  { to: "/app/settings", icon: Settings, label: "Ajustes" },
];

function DockIcon({
  mouseX,
  item,
  active,
  onClick,
}: {
  mouseX: MotionValue<number>;
  item: (typeof items)[number];
  active: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const distance = useTransform(mouseX, (value) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || value === Infinity) return 140;
    return value - (bounds.x + bounds.width / 2);
  });
  const widthSync = useTransform(distance, [-140, 0, 140], [48, 78, 48]);
  const width = useSpring(widthSync, { mass: 0.12, stiffness: 180, damping: 14 });

  return (
    <motion.button
      ref={ref}
      style={{ width }}
      onClick={onClick}
      title={item.label}
      className="relative aspect-square rounded-[18px] border border-stone-divider bg-fog-surface text-graphite-body shadow-card"
    >
      <item.icon className="mx-auto h-[42%] w-[42%]" />
      {active ? (
        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-royal-signal" />
      ) : null}
    </motion.button>
  );
}

export function AppDock() {
  const mouseX = useMotionValue(Infinity);
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = useMemo(() => location.pathname, [location.pathname]);

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.22, delay: 0.15 }}
      onMouseMove={(event) => mouseX.set(event.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="pointer-events-auto fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-end gap-2 rounded-[28px] border border-stone-divider bg-snow-canvas/75 px-3 py-2 shadow-lift backdrop-blur-xl"
    >
      {items.map((item) => (
        <DockIcon
          key={item.to}
          item={item}
          mouseX={mouseX}
          active={item.to === "/app" ? activePath === "/app" : activePath.startsWith(item.to)}
          onClick={() => navigate(item.to)}
        />
      ))}
    </motion.nav>
  );
}
