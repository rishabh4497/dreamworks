import { Clock } from "lucide-react";
import type { Playtime } from "@/lib/types";

interface PlaytimeBadgeProps {
  playtime: Playtime;
}

export function PlaytimeBadge({ playtime }: PlaytimeBadgeProps) {
  const rows: Array<{ label: string; hours: number }> = [
    { label: "Main story", hours: playtime.mainHours },
    { label: "Main + sides", hours: playtime.mainPlusSidesHours },
    { label: "Completionist", hours: playtime.completionistHours },
  ];

  return (
    <div className="rounded-2xl border border-separator bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-muted/60" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted/70">
          How long to beat
        </p>
      </div>
      <dl className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-[12px]">
            <dt className="text-muted/70">{row.label}</dt>
            <dd className="font-semibold text-foreground/85">
              {row.hours} <span className="text-[10px] font-normal text-muted/60">hrs</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[10px] text-muted/50">Estimates via {playtime.source}</p>
    </div>
  );
}
