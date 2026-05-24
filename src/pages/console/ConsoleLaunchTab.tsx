import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleLaunchTable } from "@/components/console/ConsoleLaunchTable";
import { Rocket, ShieldCheck, Skull, Timer } from "lucide-react";
import { useConsoleRange } from "@/hooks/use-console";
import { useLaunchReport } from "@/hooks/use-console-advanced";

export function ConsoleLaunchTab() {
  const [range] = useConsoleRange();
  const { data, isLoading } = useLaunchReport(range);
  if (isLoading) return <LoadingSpinner label="Counting launches…" />;
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile icon={Rocket} label="Launch attempts" value={data.totalAttempts.toLocaleString()} />
        <ConsoleKpiTile
          icon={ShieldCheck}
          label="Success rate"
          value={`${data.successPct.toFixed(1)}%`}
          tone={data.successPct >= 95 ? "positive" : "default"}
        />
        <ConsoleKpiTile
          icon={Timer}
          label="Median time to playable"
          value={`${data.medianTimeToPlayableSec}s`}
        />
        <ConsoleKpiTile
          icon={Skull}
          label="Crash &lt; 5 min"
          value={`${data.crash5MinPct.toFixed(1)}%`}
          tone={data.crash5MinPct > 5 ? "negative" : "default"}
        />
      </div>
      <ConsoleSection title="By game" description="Per-title launch outcomes">
        <Card className="p-4">
          <ConsoleLaunchTable report={data} />
        </Card>
      </ConsoleSection>
    </div>
  );
}
