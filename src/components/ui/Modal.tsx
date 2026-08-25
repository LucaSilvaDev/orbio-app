import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Modal({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80]">
          <motion.button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-midnight-ink/40 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="orbio-modal-title"
              initial={{ opacity: 0, y: 16, scale: 0.98, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto w-full rounded-container bg-snow-canvas p-6 shadow-lift ${wide ? "max-w-3xl" : "max-w-md"}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 id="orbio-modal-title" className="text-[18px] font-semibold tracking-[-0.02em]">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ash-helper hover:bg-fog-surface hover:text-midnight-ink"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
