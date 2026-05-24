import { Link } from "react-router-dom";
import { Building, Clock, ExternalLink, FileEdit, Hammer, Inbox, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ROUTES } from "@/lib/routes";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleTimeChart } from "@/components/console/ConsoleTimeChart";
import { ConsoleDonut } from "@/components/console/ConsoleDonut";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleTable } from "@/components/console/ConsoleTable";
import { useConsoleRange, useConsoleStudios } from "@/hooks/use-console";
import { compactNumber } from "@/lib/utils";

export function ConsoleStudiosTab() {
  const [range] = useConsoleRange();
  const { data, isLoading, error } = useConsoleStudios(range);

  if (isLoading) return <LoadingSpinner label="Loading studio activity…" />;
  if (error) {
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load studio data: {(error as Error).message}
      </Card>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <ConsoleKpiTile icon={Building} label="Total studios" value={data.totalStudios.toLocaleString()} />
        <ConsoleKpiTile
          icon={Building}
          label="Active"
          value={data.activeStudiosInRange.toLocaleString()}
          hint={`in ${range}`}
        />
        <ConsoleKpiTile icon={FileEdit} label="Apps in draft" value={data.appsInDraft.toLocaleString()} />
        <ConsoleKpiTile
          icon={Inbox}
          label="Submitted"
          value={data.appsSubmittedInRange.toLocaleString()}
          hint={`in ${range}`}
        />
        <ConsoleKpiTile
          icon={Package}
          label="Published"
          value={data.appsPublishedInRange.toLocaleString()}
          tone="positive"
          hint={`in ${range}`}
        />
        <ConsoleKpiTile
          icon={Clock}
          label="Median TTP"
          value={data.medianTimeToPublishDays === null ? "—" : `${data.medianTimeToPublishDays}d`}
          hint="submit → approve"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ConsoleSection title="Submissions over time" className="lg:col-span-2">
          <Card className="p-4">
            <ConsoleTimeChart
              data={data.submissionsSeries}
              colorVar="--brand-plus"
              gradientId="dw-studios-submissions"
              valueLabel="Submissions"
            />
          </Card>
        </ConsoleSection>
        <ConsoleSection title="Outcome distribution">
          <Card className="p-4">
            <ConsoleDonut data={data.publishOutcomeBreakdown} />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Builds uploaded">
        <Card className="p-4">
          <ConsoleTimeChart
            data={data.buildsSeries}
            colorVar="--cyan"
            gradientId="dw-studios-builds"
            valueLabel="Builds"
          />
        </Card>
      </ConsoleSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="Top studios by activity">
          <Card className="p-4">
            <ConsoleTable
              columns={[
                {
                  key: "name",
                  label: "Studio",
                  render: (r) => (
                    <Link
                      to={ROUTES.consoleStudioReport(r.id)}
                      className="inline-flex items-center gap-1 text-acid hover:underline"
                    >
                      {r.name}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </Link>
                  ),
                },
                {
                  key: "apps",
                  label: "Apps",
                  align: "right",
                  render: (r) => compactNumber(r.appsCount),
                },
                {
                  key: "builds",
                  label: "Builds",
                  align: "right",
                  render: (r) => compactNumber(r.buildsCount),
                },
                {
                  key: "events",
                  label: "Events",
                  align: "right",
                  render: (r) => compactNumber(r.eventsCount),
                },
              ]}
              rows={data.topStudios}
              getRowKey={(r) => r.id}
            />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Stuck in review" description="Pending for 7+ days">
          <Card className="p-4">
            <ConsoleTable
              columns={[
                { key: "app", label: "App", render: (r) => r.appTitle },
                {
                  key: "submitted",
                  label: "Submitted",
                  align: "right",
                  render: (r) => new Date(r.submittedAt).toLocaleDateString(),
                },
                {
                  key: "days",
                  label: "Days pending",
                  align: "right",
                  render: (r) => (
                    <span className={r.daysPending > 14 ? "text-red" : "text-orange"}>
                      {r.daysPending}d
                      <Hammer className="ml-1 inline h-3 w-3" />
                    </span>
                  ),
                },
              ]}
              rows={data.stuckInReview}
              getRowKey={(r) => r.submissionId}
              emptyLabel="Nothing stuck — queue is healthy."
            />
          </Card>
        </ConsoleSection>
      </div>
    </div>
  );
}
