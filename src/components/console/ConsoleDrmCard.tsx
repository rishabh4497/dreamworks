import { Card } from "@/components/ui/card";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { Lock, Wifi, ShieldCheck, Clock } from "lucide-react";
import type { DrmHealthReport } from "@/lib/types";

interface Props {
  report: DrmHealthReport;
}

export function ConsoleDrmCard({ report }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile
          icon={ShieldCheck}
          label="License check success"
          value={`${report.successPct.toFixed(2)}%`}
          tone={report.successPct >= 99 ? "positive" : report.successPct >= 95 ? "default" : "negative"}
        />
        <ConsoleKpiTile icon={Lock} label="Total checks" value={report.totalChecks.toLocaleString()} />
        <ConsoleKpiTile
          icon={Clock}
          label="p95 latency"
          value={`${Math.round(report.p95CheckLatencyMs)} ms`}
        />
        <ConsoleKpiTile
          icon={Wifi}
          label="Offline play success"
          value={`${report.offlinePlaySuccessPct.toFixed(1)}%`}
          hint={`${report.offlinePlayAttempts} attempts`}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">Failure reasons</p>
          <ConsoleHorizontalBar data={report.failureBreakdown} colorVar="--red" />
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">By game</p>
          <ul className="space-y-1.5 text-[12px]">
            {report.byGame.slice(0, 10).map((g) => (
              <li key={g.gameId} className="flex items-center justify-between">
                <span className="truncate text-foreground/85">{g.title}</span>
                <span className="tabular-nums text-muted/70">
                  {g.successPct.toFixed(1)}% · {g.checks} checks
                </span>
              </li>
            ))}
            {report.byGame.length === 0 && (
              <li className="py-4 text-center text-[11.5px] text-muted/45">No game-level data yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
