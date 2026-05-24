import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleApdexTable } from "@/components/console/ConsoleApdexTable";
import { ConsoleCrashFreeCard } from "@/components/console/ConsoleCrashFreeCard";
import { ConsoleResourceTable } from "@/components/console/ConsoleResourceTable";
import { ConsoleMemoryLeakTable } from "@/components/console/ConsoleMemoryLeakTable";
import { ConsoleLongTaskTable } from "@/components/console/ConsoleLongTaskTable";
import { ConsoleDeployMarkers } from "@/components/console/ConsoleDeployMarkers";
import { useConsoleRange } from "@/hooks/use-console";
import {
  useApdex,
  useCrashFree,
  useLongTasks,
  useMemoryLeaks,
  useResources,
} from "@/hooks/use-console-advanced";

export function ConsoleApdexTab() {
  const [range] = useConsoleRange();
  const apdex = useApdex(range);
  const crash = useCrashFree(range);
  const resources = useResources(range);
  const memory = useMemoryLeaks(range);
  const longTasks = useLongTasks(range);
  if (apdex.isLoading || crash.isLoading) {
    return <LoadingSpinner label="Crunching performance…" />;
  }
  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        {crash.data && <ConsoleCrashFreeCard data={crash.data} />}
        <ConsoleDeployMarkers />
      </div>

      <ConsoleSection title="Apdex per route" description="T = 1.5s · F = 6s">
        <Card className="p-4">
          <ConsoleApdexTable rows={apdex.data ?? []} />
        </Card>
      </ConsoleSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="Slow / large resources" description="p95 timing + bytes per fetch">
          <Card className="p-4">
            <ConsoleResourceTable rows={resources.data ?? []} />
          </Card>
        </ConsoleSection>
        <ConsoleSection title="Long-task attribution" description="Which script blocks the main thread">
          <Card className="p-4">
            <ConsoleLongTaskTable rows={longTasks.data ?? []} />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="JS memory pressure" description="Suspected leaks — heap growth without idle drop">
        <Card className="p-4">
          <ConsoleMemoryLeakTable rows={memory.data ?? []} />
        </Card>
      </ConsoleSection>
    </div>
  );
}
