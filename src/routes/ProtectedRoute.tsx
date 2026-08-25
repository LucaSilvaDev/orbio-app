import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/store/useAuth";
import { Logo } from "@/components/brand/Logo";

export function ProtectedRoute() {
  const user = useAuth((s) => s.user);
  const [hydrated, setHydrated] = useState(useAuth.persist.hasHydrated());

  useEffect(() => {
    const unsub = useAuth.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuth.persist.hasHydrated());
    const timeout = window.setTimeout(() => setHydrated(true), 2500);
    return () => {
      unsub();
      window.clearTimeout(timeout);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-snow-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-[pulse-soft_1.4s_ease_infinite]">
            <Logo size={44} />
          </div>
          <p className="text-[13px] text-ash-helper">Abrindo o workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
