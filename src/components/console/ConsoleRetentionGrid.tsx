import { cn } from "@/lib/utils";
import type { RetentionCohortGrid } from "@/lib/types";

interface Props {
  data: RetentionCohortGrid;
}

function cellTint(pct: number): string {
  if (pct >= 50) return "bg-acid/70 text-background";
  if (pct >= 30) return "bg-acid/45 text-background";
  if (pct >= 15) return "bg-acid/25 text-foreground/85";
  if (pct >= 5) return "bg-acid/12 text-foreground/75";
  if (pct > 0) return "bg-acid/5 text-muted/75";
  return "bg-input text-muted/40";
}

export function ConsoleRetentionGrid({ data }: Props) {
  if (data.rows.length === 0) {
    return <p className="py-6 text-center text-[12px] text-muted/55">No cohort data yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-[11px]">
        <thead>
          <tr>
            <th className="text-left text-muted/55 font-normal">Cohort</th>
            <th className="text-right text-muted/55 font-normal pr-2">Size</th>
            {data.weeks.map((w) => (
              <th key={w} className="text-center text-muted/55 font-normal">
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.cohortWeek}>
              <td className="text-left text-muted/65 font-medium tabular-nums">
                {r.cohortWeek.slice(0, 10)}
              </td>
              <td className="text-right text-muted/65 tabular-nums pr-2">{r.cohortSize}</td>
              {r.weekly.map((pct, i) => (
                <td key={i} className="p-0">
                  <div
                    className={cn(
                      "min-w-[40px] rounded-sm py-1 text-center font-semibold tabular-nums",
                      cellTint(pct),
                    )}
                  >
                    {Math.round(pct)}%
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
