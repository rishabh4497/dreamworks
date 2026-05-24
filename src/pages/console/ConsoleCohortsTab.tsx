import { Card } from "@/components/ui/card";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleRetentionGrid } from "@/components/console/ConsoleRetentionGrid";
import { ConsoleCohortCompare } from "@/components/console/ConsoleCohortCompare";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useConsoleRange } from "@/hooks/use-console";
import { useRetention } from "@/hooks/use-console-advanced";

export function ConsoleCohortsTab() {
  const [range] = useConsoleRange();
  const { data: retention, isLoading } = useRetention(8);
  if (isLoading) return <LoadingSpinner label="Building cohort grid…" />;
  return (
    <div className="space-y-6">
      <ConsoleSection
        title="Weekly retention cohorts"
        description="% of each signup-week cohort still active each subsequent week"
      >
        <Card className="p-4">
          {retention && <ConsoleRetentionGrid data={retention} />}
        </Card>
      </ConsoleSection>
      <ConsoleSection title="Cohort comparison" description="Pick two cohorts to A/B their behavior">
        <ConsoleCohortCompare range={range} />
      </ConsoleSection>
    </div>
  );
}
