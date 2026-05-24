import { Activity, AlertOctagon, Gauge, LineChart, UserCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleTimeChart } from "@/components/console/ConsoleTimeChart";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleLiveSessions } from "@/components/console/ConsoleLiveSessions";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleAnomalyBadge } from "@/components/console/ConsoleAnomalyBadge";
import { ConsoleInsightsFeed } from "@/components/console/ConsoleInsightsFeed";
import { useConsoleCompare, useConsoleOverview, useConsoleRange } from "@/hooks/use-console";

export function ConsoleOverviewTab() {
  const [range] = useConsoleRange();
  const { data, isLoading, error } = useConsoleOverview(range);
  const { data: compare } = useConsoleCompare(range);

  if (isLoading) return <LoadingSpinner label="Crunching overview…" />;
  if (error) return <ErrorCard error={error as Error} />;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <ConsoleKpiTile icon={Users} label="DAU" value={data.dau.toLocaleString()} />
        <ConsoleKpiTile icon={Users} label="WAU" value={data.wau.toLocaleString()} />
        <ConsoleKpiTile icon={Users} label="MAU" value={data.mau.toLocaleString()} />
        <ConsoleKpiTile
          icon={UserCheck}
          label="Sessions"
          value={data.sessionsInRange.toLocaleString()}
          hint={`in ${range}`}
        />
        <ConsoleKpiTile
          icon={AlertOctagon}
          label="Errors"
          value={data.errorsInRange.toLocaleString()}
          tone={data.errorsInRange > 0 ? "negative" : "default"}
        />
        <ConsoleKpiTile
          icon={Gauge}
          label="p95 LCP"
          value={`${data.p95LcpMs} ms`}
          tone={data.p95LcpMs > 2500 ? "warn" : "positive"}
        />
      </div>

      {compare && (
        <Card className="flex flex-wrap items-center gap-3 p-3 text-[11.5px]">
          <span className="text-muted/55 uppercase tracking-widest text-[10px]">vs previous {range}</span>
          <span className="inline-flex items-center gap-1 text-muted/65">
            Events
            <ConsoleAnomalyBadge deltaPct={compare.events.deltaPct} worseDirection="down" />
          </span>
          <span className="inline-flex items-center gap-1 text-muted/65">
            Sessions
            <ConsoleAnomalyBadge deltaPct={compare.sessions.deltaPct} worseDirection="down" />
          </span>
          <span className="inline-flex items-center gap-1 text-muted/65">
            Errors
            <ConsoleAnomalyBadge deltaPct={compare.errors.deltaPct} worseDirection="up" />
          </span>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <ConsoleSection
          title="Events over time"
          description={`Total: ${data.eventsInRange.toLocaleString()} events tracked`}
          className="lg:col-span-2"
        >
          <Card className="p-4">
            <ConsoleTimeChart
              data={data.eventsSeries}
              colorVar="--acid"
              gradientId="dw-overview-events"
              valueLabel="Events"
            />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Live now" description="Active in last 5 minutes">
          <ConsoleLiveSessions />
        </ConsoleSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ConsoleSection title="Sessions over time" className="lg:col-span-2">
          <Card className="p-4">
            <ConsoleTimeChart
              data={data.activeSessionsSeries}
              colorVar="--cyan"
              gradientId="dw-overview-sessions"
              valueLabel="Sessions"
            />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Top routes right now">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={data.topRoutesNow}
              colorVar="--cyan"
              emptyLabel="No traffic in the last 5 minutes"
            />
            <p className="mt-3 flex items-center gap-1 text-[10.5px] text-muted/45">
              <LineChart className="h-3 w-3" />
              Updates every 30 s
            </p>
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Insights" description="Auto-flagged anomalies and opportunities">
        <ConsoleInsightsFeed />
      </ConsoleSection>

      <Card className="flex items-center gap-3 border-acid/20 bg-acid/5 p-3 text-[12px] text-muted/70">
        <Activity className="h-4 w-4 text-acid" />
        Telemetry is captured in-house — no third-party SDKs. Data lives in
        <code className="mx-1 rounded bg-card-active px-1.5 py-0.5 font-mono text-[11px]">
          dw_telemetry_*
        </code>
        Firestore collections; reads are admin-only.
      </Card>
    </div>
  );
}

function ErrorCard({ error }: { error: Error }) {
  return (
    <Card className="p-4 text-[13px] text-red">
      <p className="font-semibold">Failed to load overview.</p>
      <p className="mt-1 break-all text-[12px] text-red/85">{error.message}</p>
    </Card>
  );
}
