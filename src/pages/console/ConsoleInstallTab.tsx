import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleInstallFunnel } from "@/components/console/ConsoleInstallFunnel";
import { useConsoleRange } from "@/hooks/use-console";
import { useInstallPipeline } from "@/hooks/use-console-advanced";

export function ConsoleInstallTab() {
  const [range] = useConsoleRange();
  const { data, isLoading } = useInstallPipeline(range);
  if (isLoading) return <LoadingSpinner label="Reading install funnel…" />;
  if (!data) return null;
  return (
    <ConsoleSection
      title="Install pipeline"
      description="install_start → download → verify → extract → launch-ready"
    >
      <ConsoleInstallFunnel report={data} />
    </ConsoleSection>
  );
}
