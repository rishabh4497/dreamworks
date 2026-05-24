import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { compactNumber } from "@/lib/utils";
import type { ConsoleNamedCount } from "@/lib/types";

interface Props {
  data: ConsoleNamedCount[];
  limit?: number;
  emptyLabel?: string;
}

/** Country flag emoji from an ISO-3166 alpha-2 code (best-effort).
 *  Falls back to a globe glyph for non-codes. */
function flag(name: string): string {
  if (name.length !== 2) return "";
  const A = 127397;
  const codePoints = [...name.toUpperCase()].map((c) => c.charCodeAt(0) + A);
  return String.fromCodePoint(...codePoints);
}

export function ConsoleGeoBar({ data, limit = 12, emptyLabel = "No geo data yet" }: Props) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-[12px] text-muted/55">{emptyLabel}</p>
    );
  }
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-2">
      {data.slice(0, limit).map((row) => {
        const pct = Math.max(2, Math.round((row.count / max) * 100));
        const f = flag(row.name);
        return (
          <div key={row.name} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="flex items-center gap-1.5">
                {f ? <span className="text-[13px]">{f}</span> : <Globe className="h-3 w-3 text-muted/45" />}
                <span className="text-foreground/85">{row.name}</span>
              </span>
              <span className="tabular-nums text-muted/70">
                {compactNumber(row.count)}
              </span>
            </div>
            <div className={cn("h-2 rounded-full bg-card-active")}>
              <div
                className="h-full rounded-full bg-cyan/80"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
