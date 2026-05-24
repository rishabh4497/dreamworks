import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleVoiceQosCard } from "@/components/console/ConsoleVoiceQosCard";
import { useConsoleRange } from "@/hooks/use-console";
import { useVoiceQos } from "@/hooks/use-console-advanced";

export function ConsoleVoiceTab() {
  const [range] = useConsoleRange();
  const { data, isLoading } = useVoiceQos(range);
  if (isLoading) return <LoadingSpinner label="Sampling voice QoS…" />;
  if (!data) return null;
  return (
    <ConsoleSection title="Voice QoS" description="Per-channel call quality (MOS, jitter, loss, RTT)">
      <ConsoleVoiceQosCard report={data} />
    </ConsoleSection>
  );
}
