import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/cn";

export function ProductShot({
  src,
  alt,
  className,
  imgClassName,
  parallax = 48,
  priority = false,
  position = "left top",
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  parallax?: number;
  priority?: boolean;
  position?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [parallax, -parallax]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], reduce ? [1, 1, 1] : [1.08, 1, 1.04]);

  return (
    <div ref={ref} className={cn("site-shot", className)}>
      <motion.img
        src={src}
        alt={alt}
        width={1800}
        height={1083}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        style={{ y: reduce ? 0 : y, scale, objectPosition: position }}
        className={cn("h-full w-full object-cover will-change-transform", imgClassName)}
      />
    </div>
  );
}
