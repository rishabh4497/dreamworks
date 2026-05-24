import { Card } from "@/components/ui/card";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleTimeChart } from "@/components/console/ConsoleTimeChart";
import { Badge } from "@/components/ui/badge";
import type { AuthAnomalyReport } from "@/lib/types";

interface Props {
  report: AuthAnomalyReport;
}

function sevBadge(s: string) {
  if (s === "critical") return "warn" as const;
  if (s === "warn") return "soon" as const;
  return "default" as const;
}

export function ConsoleAuthAnomalyTable({ report }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">By kind</p>
          <ConsoleHorizontalBar data={report.byKind} colorVar="--red" />
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">Failed-login bursts</p>
          <ConsoleTimeChart
            data={report.failedLoginsSeries}
            colorVar="--red"
            gradientId="dw-auth-bursts"
            valueLabel="Bursts"
            height={150}
          />
        </Card>
      </div>
      <Card className="p-4">
        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">Recent anomalies</p>
        {report.recent.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-muted/55">No anomalies in range.</p>
        ) : (
          <ul className="space-y-1.5 text-[12px]">
            {report.recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border border-separator bg-card p-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-foreground/85">{r.detail}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted/55">
                    {new Date(r.ts).toLocaleString()} · uid {r.uid?.slice(0, 8) ?? "anon"}
                  </p>
                </div>
                <Badge variant={sevBadge(r.severity)}>{r.kind}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
