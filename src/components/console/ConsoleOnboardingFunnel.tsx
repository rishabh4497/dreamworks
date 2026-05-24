import { Card } from "@/components/ui/card";
import { ConsoleFunnel } from "@/components/console/ConsoleFunnel";
import type { OnboardingFunnelReport } from "@/lib/types";

interface Props {
  report: OnboardingFunnelReport;
}

export function ConsoleOnboardingFunnel({ report }: Props) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-[11px] uppercase tracking-widest text-muted/55">Onboarding funnel</p>
        {report.biggestDropStep && (
          <p className="text-[11.5px] text-red/85">
            Biggest drop at <span className="font-semibold">{report.biggestDropStep}</span>
          </p>
        )}
      </div>
      <ConsoleFunnel
        stages={report.stages.map((s) => ({
          stage: s.label,
          count: s.count,
          pct: Math.round(s.pct),
        }))}
      />
    </Card>
  );
}
