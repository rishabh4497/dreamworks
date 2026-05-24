import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  deltaPct: number;
  /** Direction we consider "bad" — used to colour the chip. */
  worseDirection?: "up" | "down";
  /** Force a colour regardless of direction. */
  tone?: "positive" | "negative" | "warn" | "neutral";
  className?: string;
}

export function ConsoleAnomalyBadge({
  deltaPct,
  worseDirection = "down",
  tone,
  className,
}: Props) {
  const abs = Math.abs(deltaPct);
  if (abs < 1) {
    return (
      <span className={cn("text-[10.5px] font-medium text-muted/45", className)}>
        ±0%
      </span>
    );
  }
  const isWorse =
    tone === "negative" ||
    (worseDirection === "up" && deltaPct > 0) ||
    (worseDirection === "down" && deltaPct < 0);
  const isBetter = !isWorse && abs > 1;
  const Icon = deltaPct > 0 ? TrendingUp : TrendingDown;
  const color =
    tone === "warn"
      ? "text-orange bg-orange/10"
      : isWorse
        ? "text-red bg-red/10"
        : isBetter
          ? "text-green bg-green/10"
          : "text-muted bg-card-active";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums",
        color,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {deltaPct > 0 ? "+" : ""}
      {deltaPct}%
    </span>
  );
}
