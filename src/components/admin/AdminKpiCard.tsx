import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: { label: string; tone: "positive" | "negative" | "neutral" };
  className?: string;
}

export function AdminKpiCard({ icon: Icon, label, value, delta, className }: AdminKpiCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted/55">{label}</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">{value}</p>
          {delta && (
            <p
              className={cn(
                "mt-1 text-[11px] font-medium",
                delta.tone === "positive"
                  ? "text-green"
                  : delta.tone === "negative"
                    ? "text-red"
                    : "text-muted/60",
              )}
            >
              {delta.label}
            </p>
          )}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-acid/10 text-acid">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}
