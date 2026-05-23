import { MousePointerClick, Search, TrendingUp, Type } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleMultiSeriesChart } from "@/components/console/ConsoleMultiSeriesChart";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleFunnel } from "@/components/console/ConsoleFunnel";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleTable } from "@/components/console/ConsoleTable";
import { useConsoleFeatures, useConsoleRange } from "@/hooks/use-console";

const SERIES_COLORS = ["--acid", "--cyan", "--green", "--orange", "--brand-plus"];

export function ConsoleFeaturesTab() {
  const [range] = useConsoleRange();
  const { data, isLoading, error } = useConsoleFeatures(range);

  if (isLoading) return <LoadingSpinner label="Counting features…" />;
  if (error) {
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load feature usage: {(error as Error).message}
      </Card>
    );
  }
  if (!data) return null;

  // Map top 5 event types to chart series.
  const top5 = data.topEvents.slice(0, 5);
  const series = top5.map((e, i) => ({
    key: e.name,
    label: e.name,
    colorVar: SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-3">
        <ConsoleKpiTile
          icon={MousePointerClick}
          label="Total events"
          value={data.totalEventsInRange.toLocaleString()}
          hint={`in ${range}`}
        />
        <ConsoleKpiTile
          icon={Type}
          label="Unique event types"
          value={data.uniqueEventTypes.toLocaleString()}
        />
        <ConsoleKpiTile
          icon={Search}
          label="Search queries"
          value={data.topSearchQueries
            .reduce((sum, q) => sum + q.count, 0)
            .toLocaleString()}
        />
      </div>

      <ConsoleSection title="Top 5 event types over time">
        <Card className="p-4">
          {series.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted/55">
              No events captured yet. Instrument call sites with track(...).
            </p>
          ) : (
            <ConsoleMultiSeriesChart
              data={data.eventsByRoute}
              series={series}
              stacked
            />
          )}
        </Card>
      </ConsoleSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="Top events">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={data.topEvents}
              colorVar="--acid"
              limit={20}
            />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Search queries">
          <Card className="p-4">
            <ConsoleTable
              columns={[
                { key: "term", label: "Query", render: (r) => `"${r.term}"` },
                {
                  key: "count",
                  label: "Searches",
                  align: "right",
                  render: (r) => r.count.toLocaleString(),
                },
                {
                  key: "zero",
                  label: "Zero results",
                  align: "right",
                  render: (r) => (
                    <span className={r.zeroResultsPct > 50 ? "text-red" : ""}>
                      {r.zeroResultsPct}%
                    </span>
                  ),
                },
              ]}
              rows={data.topSearchQueries}
              getRowKey={(r) => r.term}
              emptyLabel="No search queries logged yet."
            />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Conversion funnels">
        <p className="-mt-2 flex items-center gap-1 text-[11.5px] text-muted/45">
          <TrendingUp className="h-3 w-3" />
          Stage drop-off across the three core flows
        </p>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-4">
            <h3 className="mb-3 text-[12.5px] font-semibold text-foreground/85">
              Game discovery
            </h3>
            <ConsoleFunnel stages={data.browseToBuyFunnel} />
          </Card>
          <Card className="p-4">
            <h3 className="mb-3 text-[12.5px] font-semibold text-foreground/85">
              Signup → purchase
            </h3>
            <ConsoleFunnel stages={data.signupToPurchaseFunnel} />
          </Card>
          <Card className="p-4">
            <h3 className="mb-3 text-[12.5px] font-semibold text-foreground/85">
              Studio onboarding
            </h3>
            <ConsoleFunnel stages={data.studioOnboardingFunnel} />
          </Card>
        </div>
      </ConsoleSection>
    </div>
  );
}
