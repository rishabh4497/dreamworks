import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleModerationCard } from "@/components/console/ConsoleModerationCard";
import { useModeration } from "@/hooks/use-console-advanced";

export function ConsoleModerationTab() {
  const { data, isLoading } = useModeration();
  if (isLoading) return <LoadingSpinner label="Loading moderation queue…" />;
  if (!data) return null;
  return (
    <ConsoleSection
      title="Moderation queue"
      description="Backlog depth, decision throughput, oldest open"
    >
      <ConsoleModerationCard report={data} />
    </ConsoleSection>
  );
}
