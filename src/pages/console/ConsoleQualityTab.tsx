import { AlertOctagon, AlertTriangle, MousePointer2, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleTable } from "@/components/console/ConsoleTable";
import { ConsoleExportCsv } from "@/components/console/ConsoleExportCsv";
import { useConsoleQuality, useConsoleRange } from "@/hooks/use-console";
import { cn } from "@/lib/utils";

const KIND_ICON = {
  error: AlertOctagon,
  perf: Zap,
  friction: MousePointer2,
  search: AlertTriangle,
} as const;
const KIND_TONE = {
  error: "text-red bg-red/10",
  perf: "text-orange bg-orange/10",
  friction: "text-acid bg-acid/10",
  search: "text-cyan bg-cyan/10",
} as const;

export function ConsoleQualityTab() {
  const [range] = useConsoleRange();
  const { data, isLoading, error } = useConsoleQuality(range);
  if (isLoading) return <LoadingSpinner label="Scoring quality…" />;
  if (error) {
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load quality report: {(error as Error).message}
      </Card>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <ConsoleSection title="Top issues to fix" description="Ranked by impact (errors × friction × sessions)">
        <div className="grid gap-2 lg:grid-cols-2">
          {data.topIssues.length === 0 ? (
            <Card className="p-4 text-[12px] text-muted/60">
              Nothing concerning right now — calm seas.
            </Card>
          ) : (
            data.topIssues.map((issue) => {
              const Icon = KIND_ICON[issue.kind];
              return (
                <Card key={issue.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        KIND_TONE[issue.kind],
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-foreground/90 truncate">
                        {issue.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-muted/65">{issue.details}</p>
                      {issue.suggestedFix && (
                        <p className="mt-1 text-[11px] text-acid/80">
                          → {issue.suggestedFix}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[10.5px] text-muted/55 shrink-0">
                      <p>impact</p>
                      <p className="text-foreground/80 tabular-nums">{issue.impact}</p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ConsoleSection>

      <ConsoleSection title="Frustration by route" description="Score = 3 × rage + dead + 2 × errors">
        <Card className="p-4">
          <ConsoleTable
            columns={[
              { key: "route", label: "Route", render: (r) => r.route },
              { key: "rage", label: "Rage", align: "right", render: (r) => r.rageClicks },
              { key: "dead", label: "Dead", align: "right", render: (r) => r.deadClicks },
              { key: "err", label: "Errors", align: "right", render: (r) => r.errors },
              {
                key: "score",
                label: "Score",
                align: "right",
                render: (r) => (
                  <span className={r.score > 30 ? "text-red" : r.score > 10 ? "text-orange" : ""}>
                    {r.score}
                  </span>
                ),
              },
            ]}
            rows={data.frustrationByRoute}
            getRowKey={(r) => r.route}
          />
          <div className="mt-3 flex justify-end">
            <ConsoleExportCsv rows={data.frustrationByRoute} filename="dw-frustration" />
          </div>
        </Card>
      </ConsoleSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="Browser × OS error rate" description="Errors per 1k sessions">
          <Card className="p-4">
            <ConsoleTable
              columns={[
                { key: "browser", label: "Browser", render: (r) => r.browser },
                { key: "os", label: "OS", render: (r) => r.os },
                { key: "sessions", label: "Sessions", align: "right", render: (r) => r.sessions },
                {
                  key: "rate",
                  label: "per 1k",
                  align: "right",
                  render: (r) => (
                    <span className={r.ratePer1k > 50 ? "text-red" : ""}>{r.ratePer1k}</span>
                  ),
                },
              ]}
              rows={data.browserOsErrorRate}
              getRowKey={(r) => `${r.browser}-${r.os}`}
            />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="API ↔ error correlations">
          <Card className="p-4">
            <ConsoleTable
              columns={[
                { key: "endpoint", label: "Endpoint", render: (r) => r.endpoint },
                { key: "ms", label: "p95 ms", align: "right", render: (r) => r.ms },
                {
                  key: "err",
                  label: "Errors",
                  align: "right",
                  render: (r) => <span className="text-red">{r.errors}</span>,
                },
              ]}
              rows={data.apiErrorCorrelations}
              getRowKey={(r) => r.endpoint}
              emptyLabel="No correlated API failures — clean."
            />
          </Card>
        </ConsoleSection>
      </div>
    </div>
  );
}
