import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { FraudReport } from "@/lib/types";

interface Props {
  report: FraudReport;
}

function sevBadge(s: string) {
  if (s === "critical") return "warn" as const;
  if (s === "warn") return "soon" as const;
  return "default" as const;
}

export function ConsoleFraudTable({ report }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/55">
            <ShieldAlert className="h-3 w-3" /> Signals (range)
          </p>
          <p className="text-[28px] font-semibold tabular-nums text-foreground">
            {report.totalSignals.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">By kind</p>
          <ConsoleHorizontalBar data={report.byKind} colorVar="--orange" limit={5} />
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">By severity</p>
          <ConsoleHorizontalBar data={report.bySeverity} colorVar="--red" limit={5} />
        </Card>
      </div>
      <Card className="p-4">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/55">
          <AlertTriangle className="h-3 w-3" /> Top risk users
        </p>
        {report.topRiskUsers.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-muted/55">No flagged users.</p>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
                <th className="text-left font-normal pb-1.5">UID</th>
                <th className="text-left font-normal pb-1.5">Top kind</th>
                <th className="text-right font-normal pb-1.5 pr-2">Signals</th>
                <th className="text-right font-normal pb-1.5">Severity score</th>
              </tr>
            </thead>
            <tbody>
              {report.topRiskUsers.map((u) => (
                <tr key={u.uid} className="border-t border-separator/50">
                  <td className="py-1.5 font-mono text-[11px] text-foreground/85">{u.displayName}</td>
                  <td className="py-1.5">
                    <Badge variant={sevBadge("warn")}>{u.topKind}</Badge>
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{u.signalCount}</td>
                  <td className="py-1.5 text-right tabular-nums text-red/85">{u.severityScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
