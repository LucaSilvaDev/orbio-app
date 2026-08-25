import { useEffect, useRef } from "react";

export function useDismiss(onClose: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled) return;

    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onCloseRef.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [enabled]);

  return ref;
}
