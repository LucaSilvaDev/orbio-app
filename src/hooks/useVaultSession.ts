import { useEffect } from "react";
import { useAuth } from "@/store/useAuth";
import { lockVaultNow, useVault } from "@/store/useVault";

type IdleCtor = {
  new (): IdleDetector;
  requestPermission?: () => Promise<PermissionState>;
};

type IdleDetector = EventTarget & {
  userState: "active" | "idle" | null;
  screenState: "locked" | "unlocked" | null;
  start: (options?: { threshold?: number; signal?: AbortSignal }) => Promise<void>;
};

function idleConstructor(): IdleCtor | null {
  return (window as Window & { IdleDetector?: IdleCtor }).IdleDetector ?? null;
}

export async function requestVaultLockPermission() {
  const Ctor = idleConstructor();
  if (!Ctor?.requestPermission) return false;
  try {
    return (await Ctor.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

async function watchScreenLock(signal: AbortSignal, onLock: () => void) {
  const Ctor = idleConstructor();
  if (!Ctor) return;
  try {
    const detector = new Ctor();
    detector.addEventListener("change", () => {
      if (detector.screenState === "locked") onLock();
    });
    await detector.start({ threshold: 60_000, signal });
  } catch {
    /* Sem permissão, freeze/sleep ainda fecha o cofre. */
  }
}

export function useVaultSession() {
  const user = useAuth((s) => s.user);
  const boot = useVault((s) => s.boot);

  useEffect(() => {
    if (!user) {
      lockVaultNow();
      return;
    }
    void boot(user.id);
  }, [user, boot]);

  useEffect(() => {
    return useAuth.subscribe((state, prev) => {
      if (prev.user && !state.user) lockVaultNow();
    });
  }, []);

  useEffect(() => {
    const lock = () => {
      if (useVault.getState().status !== "unlocked") return;
      lockVaultNow();
    };

    let lastPulse = Date.now();
    const pulse = window.setInterval(() => {
      lastPulse = Date.now();
    }, 1000);

    const onFreeze = () => lock();
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastPulse > 20_000) lock();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) lock();
    };

    document.addEventListener("freeze", onFreeze);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);

    const abort = new AbortController();
    void watchScreenLock(abort.signal, lock);

    return () => {
      window.clearInterval(pulse);
      abort.abort();
      document.removeEventListener("freeze", onFreeze);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
}
