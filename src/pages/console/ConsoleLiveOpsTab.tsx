import { Activity, AlertOctagon, Download, Mic, Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleLiveSessions } from "@/components/console/ConsoleLiveSessions";
import { ConsoleErrorRow } from "@/components/console/ConsoleErrorRow";
import { useConsoleLive } from "@/hooks/use-console";

export function ConsoleLiveOpsTab() {
  const { data, isLoading, error } = useConsoleLive();
  if (isLoading) return <LoadingSpinner label="Tuning in…" />;
  if (error) {
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load live snapshot: {(error as Error).message}
      </Card>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile
          icon={Activity}
          label="Sessions (5m)"
          value={data.liveSessions.length.toLocaleString()}
          tone="positive"
        />
        <ConsoleKpiTile
          icon={Download}
          label="Active downloads"
          value={data.activeDownloads.toLocaleString()}
        />
        <ConsoleKpiTile
          icon={Mic}
          label="Voice channels"
          value={data.activeVoiceChannels.toLocaleString()}
        />
        <ConsoleKpiTile
          icon={AlertOctagon}
          label="Recent errors"
          value={data.recentErrors.length.toLocaleString()}
          tone={data.recentErrors.length > 0 ? "negative" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ConsoleSection title="Active sessions" className="lg:col-span-1">
          <ConsoleLiveSessions />
        </ConsoleSection>

        <ConsoleSection title="Top routes right now" className="lg:col-span-2">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={data.topActiveRoutes}
              colorVar="--acid"
              emptyLabel="No traffic in the last 5 minutes."
            />
            <p className="mt-3 flex items-center gap-1 text-[10.5px] text-muted/45">
              <Radio className="h-3 w-3" /> Refreshes every 5 seconds
            </p>
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Recent error firehose" description="Last 50 — newest first">
        <div className="space-y-2">
          {data.recentErrors.length === 0 ? (
            <Card className="p-3 text-[12px] text-muted/55">
              No errors in the recent window.
            </Card>
          ) : (
            data.recentErrors.map((e) => <ConsoleErrorRow key={e.id} error={e} />)
          )}
        </div>
      </ConsoleSection>
    </div>
  );
}
