import { AlertOctagon, Gauge, Timer, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleMultiSeriesChart } from "@/components/console/ConsoleMultiSeriesChart";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleTable } from "@/components/console/ConsoleTable";
import { useConsolePerformance, useConsoleRange } from "@/hooks/use-console";

export function ConsolePerformanceTab() {
  const [range] = useConsoleRange();
  const { data, isLoading, error } = useConsolePerformance(range);

  if (isLoading) return <LoadingSpinner label="Measuring performance…" />;
  if (error) {
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load performance data: {(error as Error).message}
      </Card>
    );
  }
  if (!data) return null;

  const lcpTone = (n: number) =>
    n > 4000 ? "negative" : n > 2500 ? "warn" : "positive";

  return (
    <div className="space-y-8">
      <ConsoleSection title="Core web vitals" description="Computed from PerformanceObserver entries">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ConsoleKpiTile
            icon={Gauge}
            label="LCP p50 / p95"
            value={`${data.lcpMs.p50} / ${data.lcpMs.p95} ms`}
            hint={`p99: ${data.lcpMs.p99} ms`}
            tone={lcpTone(data.lcpMs.p95)}
          />
          <ConsoleKpiTile
            icon={Timer}
            label="FCP p50 / p95"
            value={`${data.fcpMs.p50} / ${data.fcpMs.p95} ms`}
            hint={`p99: ${data.fcpMs.p99} ms`}
          />
          <ConsoleKpiTile
            icon={Zap}
            label="CLS p95 ×1000"
            value={`${data.cls.p95}`}
            hint="lower is better"
          />
          <ConsoleKpiTile
            icon={AlertOctagon}
            label="Errors / session"
            value={data.errorsPerSession.toFixed(2)}
            tone={data.errorsPerSession > 0.5 ? "negative" : "default"}
          />
        </div>
      </ConsoleSection>

      <ConsoleSection title="LCP percentiles over time">
        <Card className="p-4">
          <ConsoleMultiSeriesChart
            data={data.lcpSeries}
            series={[
              { key: "p50", label: "p50", colorVar: "--green" },
              { key: "p95", label: "p95", colorVar: "--orange" },
            ]}
          />
        </Card>
      </ConsoleSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="Slowest routes" description="By p95 LCP">
          <Card className="p-4">
            <ConsoleTable
              columns={[
                { key: "route", label: "Route", render: (r) => r.route },
                {
                  key: "p95",
                  label: "p95 LCP",
                  align: "right",
                  render: (r) => (
                    <span className={r.p95Ms > 2500 ? "text-orange" : ""}>
                      {r.p95Ms} ms
                    </span>
                  ),
                },
                {
                  key: "samples",
                  label: "samples",
                  align: "right",
                  render: (r) => r.samples.toLocaleString(),
                },
              ]}
              rows={data.slowestRoutes}
              getRowKey={(r) => r.route}
            />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Long tasks by route">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={data.longTasksByRoute}
              colorVar="--orange"
              limit={10}
              emptyLabel="No long tasks detected — main thread is happy."
            />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="API latency by endpoint" description="Calls into src/lib/api/*">
        <Card className="p-4">
          <ConsoleTable
            columns={[
              { key: "endpoint", label: "Endpoint", render: (r) => r.endpoint },
              {
                key: "p50",
                label: "p50",
                align: "right",
                render: (r) => `${r.p50} ms`,
              },
              {
                key: "p95",
                label: "p95",
                align: "right",
                render: (r) => (
                  <span className={r.p95 > 1000 ? "text-red" : r.p95 > 500 ? "text-orange" : ""}>
                    {r.p95} ms
                  </span>
                ),
              },
              {
                key: "samples",
                label: "samples",
                align: "right",
                render: (r) => r.samples.toLocaleString(),
              },
            ]}
            rows={data.apiByEndpoint}
            getRowKey={(r) => r.endpoint}
            emptyLabel="No API perf samples yet — instrument trackPerf('api', ms) in src/lib/api/*."
          />
        </Card>
      </ConsoleSection>

      <ConsoleSection title="Worst APIs" description="By p95 latency">
        <Card className="p-4">
          <ConsoleHorizontalBar
            data={data.worstApis.map((a) => ({
              name: a.endpoint,
              count: a.p95Ms,
            }))}
            colorVar="--red"
            limit={10}
            formatValue={(n) => `${n} ms`}
          />
        </Card>
      </ConsoleSection>
    </div>
  );
}
