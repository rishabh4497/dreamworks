import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "warn";
  /** Optional spark series of normalized 0–1 values rendered as a tiny bar row. */
  sparkline?: number[];
  className?: string;
}

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-acid bg-acid/10",
  positive: "text-green bg-green/10",
  negative: "text-red bg-red/10",
  warn: "text-orange bg-orange/10",
};

export function ConsoleKpiTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
  sparkline,
  className,
}: Props) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted/55">
            {label}
          </p>
          <p className="mt-1 truncate text-[22px] font-semibold tabular-nums text-foreground">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-[11px] text-muted/60">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            TONE[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {sparkline && sparkline.length > 0 && (
        <div className="mt-3 flex items-end gap-[2px] h-7">
          {sparkline.map((v, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-sm",
                tone === "negative" ? "bg-red/30" : tone === "warn" ? "bg-orange/30" : "bg-acid/30",
              )}
              style={{ height: `${Math.max(6, Math.round(v * 100))}%` }}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
