import { AlertOctagon, Hourglass, Inbox, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import type { ModerationQueueReport } from "@/lib/types";

interface Props {
  report: ModerationQueueReport;
}

export function ConsoleModerationCard({ report }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile
          icon={Inbox}
          label="Open queue"
          value={report.totalOpen.toLocaleString()}
          tone={report.totalOpen > 25 ? "negative" : "default"}
        />
        <ConsoleKpiTile
          icon={Timer}
          label="Decided / 24h"
          value={report.totalActioned24h.toLocaleString()}
          tone="positive"
        />
        <ConsoleKpiTile
          icon={Hourglass}
          label="Median decision"
          value={report.medianTimeToDecisionMin ? `${report.medianTimeToDecisionMin}m` : "—"}
        />
        <ConsoleKpiTile
          icon={AlertOctagon}
          label="Oldest open"
          value={`${report.oldestOpenAgeHours}h`}
          tone={report.oldestOpenAgeHours > 48 ? "negative" : "default"}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">By reason</p>
          <ConsoleHorizontalBar data={report.byReason} colorVar="--acid" />
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">By action</p>
          <ConsoleHorizontalBar data={report.byAction} colorVar="--cyan" />
        </Card>
      </div>
      <Card className="p-4">
        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">Reviewer throughput</p>
        {report.reviewerThroughput.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-muted/55">No reviewer activity.</p>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
                <th className="text-left font-normal pb-1.5">Moderator</th>
                <th className="text-right font-normal pb-1.5 pr-2">Decided 24h</th>
                <th className="text-right font-normal pb-1.5">Avg decision</th>
              </tr>
            </thead>
            <tbody>
              {report.reviewerThroughput.map((r) => (
                <tr key={r.uid} className="border-t border-separator/50">
                  <td className="py-1.5 font-mono text-[11px] text-foreground/85">{r.displayName}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-foreground/85">{r.decided24h}</td>
                  <td className="py-1.5 text-right tabular-nums text-muted/70">{r.avgDecisionMin}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
