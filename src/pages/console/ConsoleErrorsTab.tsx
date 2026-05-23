import { AlertOctagon, AlertTriangle, FlagTriangleRight, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleTimeChart } from "@/components/console/ConsoleTimeChart";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleErrorRow } from "@/components/console/ConsoleErrorRow";
import { useConsoleErrors, useConsoleRange } from "@/hooks/use-console";

export function ConsoleErrorsTab() {
  const [range] = useConsoleRange();
  const { data, isLoading, error } = useConsoleErrors(range);

  if (isLoading) return <LoadingSpinner label="Scanning errors…" />;
  if (error) {
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load error feed: {(error as Error).message}
      </Card>
    );
  }
  if (!data) return null;

  const sessErrTone = data.pctSessionsErrored > 10 ? "negative" : "default";

  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile
          icon={AlertOctagon}
          label="Errors today"
          value={data.errorsToday.toLocaleString()}
          tone={data.errorsToday > 0 ? "negative" : "default"}
        />
        <ConsoleKpiTile
          icon={AlertTriangle}
          label="Unique today"
          value={data.uniqueErrorsToday.toLocaleString()}
          tone="warn"
        />
        <ConsoleKpiTile
          icon={Layers}
          label="Sessions impacted"
          value={data.sessionsImpacted.toLocaleString()}
        />
        <ConsoleKpiTile
          icon={FlagTriangleRight}
          label="% sessions errored"
          value={`${data.pctSessionsErrored}%`}
          tone={sessErrTone}
        />
      </div>

      <ConsoleSection title="Errors over time">
        <Card className="p-4">
          <ConsoleTimeChart
            data={data.errorsSeries}
            colorVar="--red"
            gradientId="dw-errors-series"
            valueLabel="Errors"
          />
        </Card>
      </ConsoleSection>

      <ConsoleSection title="Top error clusters" description="Grouped by stack-trace fingerprint">
        <Card className="p-4">
          <ConsoleHorizontalBar
            data={data.topErrorClusters.map((c) => ({
              name: c.message.slice(0, 80),
              count: c.count,
              uniqueUsers: c.sessions,
            }))}
            colorVar="--red"
            limit={10}
          />
        </Card>
      </ConsoleSection>

      <ConsoleSection title="Cluster details">
        <div className="space-y-2">
          {data.topErrorClusters.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted/55">
              No error clusters in this range — calm seas.
            </p>
          ) : (
            data.topErrorClusters.map((c) => (
              <Card key={c.fingerprint} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] text-red/90">{c.message}</p>
                    <p className="mt-1 text-[11px] text-muted/55">
                      first {new Date(c.firstSeen).toLocaleString()} • last{" "}
                      {new Date(c.lastSeen).toLocaleString()}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-muted/65">
                    <p>
                      <span className="font-semibold text-foreground">{c.count}</span> hits
                    </p>
                    <p>{c.sessions} sessions</p>
                  </div>
                </div>
                {c.sampleStack && (
                  <pre className="mt-2 max-h-[140px] overflow-auto rounded-md bg-bg/60 p-2 font-mono text-[11px] leading-snug text-muted/70">
                    {c.sampleStack}
                  </pre>
                )}
              </Card>
            ))
          )}
        </div>
      </ConsoleSection>

      <ConsoleSection title="Recent error feed">
        <div className="space-y-2">
          {data.recentErrors.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted/55">
              No errors captured. Telemetry is wired but nothing has broken in this range.
            </p>
          ) : (
            data.recentErrors.map((e) => <ConsoleErrorRow key={e.id} error={e} />)
          )}
        </div>
      </ConsoleSection>
    </div>
  );
}
