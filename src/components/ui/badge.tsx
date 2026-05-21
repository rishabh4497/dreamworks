import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "discount" | "new" | "free" | "soon" | "warn";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const styles =
    variant === "discount"
      ? "bg-discount-bg text-discount-fg"
      : variant === "new"
      ? "bg-positive/15 text-positive"
      : variant === "free"
      ? "bg-green/15 text-green"
      : variant === "soon"
      ? "bg-orange/15 text-orange"
      : variant === "warn"
      ? "bg-red/15 text-red"
      : "bg-card-active text-foreground/70";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-[2px] text-[10px] font-semibold tracking-wide",
        styles,
        className,
      )}
    >
      {children}
    </span>
  );
}
