import { cn } from "@/lib/utils";
import { compactNumber } from "@/lib/utils";
import type { ConsoleNamedCount } from "@/lib/types";

interface Props {
  data: ConsoleNamedCount[];
  /** CSS variable name (with leading --) for the bar fill. */
  colorVar?: string;
  /** Max rows to render. */
  limit?: number;
  /** Optional formatter for the right-hand value column. */
  formatValue?: (n: number) => string;
  emptyLabel?: string;
}

export function ConsoleHorizontalBar({
  data,
  colorVar = "--acid",
  limit = 10,
  formatValue,
  emptyLabel = "No data yet",
}: Props) {
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
        return (
          <div key={row.name} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="min-w-0 truncate text-foreground/85">
                {row.name}
              </span>
              <span className="shrink-0 tabular-nums text-muted/70">
                {formatValue ? formatValue(row.count) : compactNumber(row.count)}
                {row.uniqueUsers !== undefined && (
                  <span className="ml-2 text-muted/45">
                    {compactNumber(row.uniqueUsers)} users
                  </span>
                )}
              </span>
            </div>
            <div
              className={cn(
                "h-2 rounded-full bg-card-active",
              )}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: `var(${colorVar})` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
