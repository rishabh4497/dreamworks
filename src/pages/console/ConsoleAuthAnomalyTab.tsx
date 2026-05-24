import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleAuthAnomalyTable } from "@/components/console/ConsoleAuthAnomalyTable";
import { useConsoleRange } from "@/hooks/use-console";
import { useAuthAnomalies } from "@/hooks/use-console-advanced";

export function ConsoleAuthAnomalyTab() {
  const [range] = useConsoleRange();
  const { data, isLoading } = useAuthAnomalies(range);
  if (isLoading) return <LoadingSpinner label="Hunting auth anomalies…" />;
  if (!data) return null;
  return (
    <ConsoleSection
      title="Auth anomalies"
      description="Failed-login bursts, geo jumps, new-device-no-2FA, password spray"
    >
      <ConsoleAuthAnomalyTable report={data} />
    </ConsoleSection>
  );
}
