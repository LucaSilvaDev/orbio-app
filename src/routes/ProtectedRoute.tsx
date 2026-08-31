import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/store/useAuth";
import { Logo } from "@/components/brand/Logo";

export function ProtectedRoute() {
  const user = useAuth((s) => s.user);
  const status = useAuth((s) => s.status);

  if (status === "loading") {
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

  if (!user) return <Navigate to="/app/login" replace />;
  return <Outlet />;
}
