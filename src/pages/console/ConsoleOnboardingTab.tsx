import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleOnboardingFunnel } from "@/components/console/ConsoleOnboardingFunnel";
import { useConsoleRange } from "@/hooks/use-console";
import { useOnboarding } from "@/hooks/use-console-advanced";

export function ConsoleOnboardingTab() {
  const [range] = useConsoleRange();
  const { data, isLoading } = useOnboarding(range);
  if (isLoading) return <LoadingSpinner label="Building onboarding funnel…" />;
  if (!data) return null;
  return (
    <ConsoleSection
      title="Signup → first purchase"
      description="Drop-offs in every stage of the new-user journey"
    >
      <ConsoleOnboardingFunnel report={data} />
    </ConsoleSection>
  );
}
