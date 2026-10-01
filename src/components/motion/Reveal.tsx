import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
  repeat = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Replay the animation every time it re-enters the viewport (scrolling up or down). */
  repeat?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={repeat ? { once: false, amount: 0.15, margin: "-40px" } : { once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export const rise = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] },
  }),
};
