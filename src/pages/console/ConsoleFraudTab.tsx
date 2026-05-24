import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleFraudTable } from "@/components/console/ConsoleFraudTable";
import { useConsoleRange } from "@/hooks/use-console";
import { useFraud } from "@/hooks/use-console-advanced";

export function ConsoleFraudTab() {
  const [range] = useConsoleRange();
  const { data, isLoading } = useFraud(range);
  if (isLoading) return <LoadingSpinner label="Scanning fraud signals…" />;
  if (!data) return null;
  return (
    <ConsoleSection
      title="Fraud signals"
      description="Anomalous behavior flagged in-house — geo velocity, multi-account, refund abuse"
    >
      <ConsoleFraudTable report={data} />
    </ConsoleSection>
  );
}
