import { Link } from "react-router-dom";
import { AlertTriangle, Clock, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ReplaySession } from "@/lib/types";

interface Props {
  rows: ReplaySession[];
  selectedId?: string;
}

export function ConsoleReplayList({ rows, selectedId }: Props) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-[12px] text-muted/55">
        No replays captured yet.
      </p>
    );
  }
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        const dur = Math.round(r.durationMs / 1000);
        const min = Math.floor(dur / 60);
        const sec = dur % 60;
        return (
          <Link
            key={r.id}
            to={`?tab=people&sub=replay&id=${r.id}`}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border border-separator bg-card p-2.5 transition-colors hover:bg-card-hover",
              selectedId === r.id && "border-acid/40 bg-card-active",
            )}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-acid/10 text-acid">
                <Film className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium text-foreground/85">
                  {r.uid ? r.uid.slice(0, 10) : "anonymous"}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted/55">
                  {r.entryRoute} → {r.lastRoute}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted/55">
              {r.hasFrustration && (
                <Badge variant="warn" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> frustration
                </Badge>
              )}
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="h-3 w-3" />
                {min}:{String(sec).padStart(2, "0")}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
