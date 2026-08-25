import { cn } from "@/lib/cn";

type AvatarProps = {
  initials: string;
  hue?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-11 w-11 text-[13px]",
};

export function Avatar({ initials, hue = 222, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-white",
        sizes[size],
        className,
      )}
      style={{ background: `hsl(${hue} 42% 42%)` }}
    >
      {initials}
    </span>
  );
}
