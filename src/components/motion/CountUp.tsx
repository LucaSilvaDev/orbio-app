import { useEffect, useRef, useState } from "react";
import { brl } from "@/lib/cn";

export function CountUp({
  value,
  money = false,
  duration = 900,
}: {
  value: number;
  money?: boolean;
  duration?: number;
}) {
  const [shown, setShown] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    let frame = 0;
    const from = 0;
    const tick = (now: number) => {
      if (start.current == null) start.current = now;
      const progress = Math.min(1, (now - start.current) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{money ? brl.format(shown) : shown.toLocaleString("pt-BR")}</>;
}
