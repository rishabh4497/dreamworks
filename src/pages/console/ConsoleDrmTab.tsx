import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleDrmCard } from "@/components/console/ConsoleDrmCard";
import { useConsoleRange } from "@/hooks/use-console";
import { useDrm } from "@/hooks/use-console-advanced";

export function ConsoleDrmTab() {
  const [range] = useConsoleRange();
  const { data, isLoading } = useDrm(range);
  if (isLoading) return <LoadingSpinner label="Loading DRM health…" />;
  if (!data) return null;
  return (
    <ConsoleSection title="DRM / license health" description="Per-game check success + offline play attempts">
      <ConsoleDrmCard report={data} />
    </ConsoleSection>
  );
}
