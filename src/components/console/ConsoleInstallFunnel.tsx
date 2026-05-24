import { Card } from "@/components/ui/card";
import { ConsoleFunnel } from "@/components/console/ConsoleFunnel";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import type { InstallPipelineReport } from "@/lib/types";

interface Props {
  report: InstallPipelineReport;
}

export function ConsoleInstallFunnel({ report }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="p-4">
        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">Install pipeline</p>
        <p className="mb-2 text-[12px] text-muted/65">
          <span className="text-foreground/85 font-semibold">{report.totalReady}</span> of{" "}
          {report.totalStarted} reach launch-ready ·{" "}
          <span className="text-foreground/80 font-semibold">{report.successPct.toFixed(1)}%</span>
        </p>
        <ConsoleFunnel
          stages={report.stages.map((s) => ({
            stage: s.stage.replace(/_/g, " "),
            count: s.count,
            pct: Math.round(s.pctOfStart),
          }))}
        />
      </Card>
      <Card className="p-4">
        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">Top failure reasons</p>
        <ConsoleHorizontalBar
          data={report.topFailures.map((f) => ({ name: f.reason, count: f.count }))}
          colorVar="--red"
        />
      </Card>
    </div>
  );
}
