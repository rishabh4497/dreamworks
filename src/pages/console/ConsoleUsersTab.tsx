import { Link } from "react-router-dom";
import { ExternalLink, TrendingDown, UserCheck, UserPlus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ROUTES } from "@/lib/routes";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleTimeChart } from "@/components/console/ConsoleTimeChart";
import { ConsoleHeatmap } from "@/components/console/ConsoleHeatmap";
import { ConsoleFunnel } from "@/components/console/ConsoleFunnel";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleTable } from "@/components/console/ConsoleTable";
import { useConsoleRange, useConsoleUsers } from "@/hooks/use-console";
import { compactNumber } from "@/lib/utils";

export function ConsoleUsersTab() {
  const [range] = useConsoleRange();
  const { data, isLoading, error } = useConsoleUsers(range);
  if (isLoading) return <LoadingSpinner label="Crunching user behavior…" />;
  if (error) {
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load user analytics: {(error as Error).message}
      </Card>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <ConsoleKpiTile icon={Users} label="Total users" value={data.totalUsers.toLocaleString()} />
        <ConsoleKpiTile
          icon={UserPlus}
          label="New users"
          value={data.newUsersInRange.toLocaleString()}
          hint={`in ${range}`}
          tone="positive"
        />
        <ConsoleKpiTile
          icon={UserCheck}
          label="Returning"
          value={data.returningUsersInRange.toLocaleString()}
          hint={`in ${range}`}
        />
        <ConsoleKpiTile
          icon={Users}
          label="7d retention"
          value={`${data.retention7Pct}%`}
        />
        <ConsoleKpiTile
          icon={Users}
          label="30d retention"
          value={`${data.retention30Pct}%`}
        />
        <ConsoleKpiTile
          icon={TrendingDown}
          label="Churn risk"
          value={data.churnRiskCount.toLocaleString()}
          hint="inactive 14+ d"
          tone={data.churnRiskCount > 0 ? "warn" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="Signups over time">
          <Card className="p-4">
            <ConsoleTimeChart
              data={data.signupsSeries}
              colorVar="--green"
              gradientId="dw-users-signups"
              valueLabel="Signups"
            />
          </Card>
        </ConsoleSection>
        <ConsoleSection title="Daily active users">
          <Card className="p-4">
            <ConsoleTimeChart
              data={data.dauSeries}
              colorVar="--acid"
              gradientId="dw-users-dau"
              valueLabel="DAU"
            />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Activity heatmap" description="Events bucketed by day-of-week × UTC hour">
        <Card className="p-4">
          <ConsoleHeatmap cells={data.activityHeatmap} />
        </Card>
      </ConsoleSection>

      <div className="grid gap-6 lg:grid-cols-3">
        <ConsoleSection title="Signup → first purchase" className="lg:col-span-1">
          <Card className="p-4">
            <ConsoleFunnel stages={data.signupToFirstPurchaseFunnel} />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Top active users" className="lg:col-span-2">
          <Card className="p-4">
            <ConsoleTable
              columns={[
                {
                  key: "uid",
                  label: "User",
                  render: (r) => (
                    <Link
                      to={ROUTES.consoleUserReport(r.uid)}
                      className="inline-flex items-center gap-1 font-mono text-[12px] text-acid hover:underline"
                    >
                      {r.uid.slice(0, 12)}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </Link>
                  ),
                },
                {
                  key: "sessions",
                  label: "Sessions",
                  align: "right",
                  render: (r) => compactNumber(r.sessions),
                },
                {
                  key: "events",
                  label: "Events",
                  align: "right",
                  render: (r) => compactNumber(r.events),
                },
                {
                  key: "lastSeen",
                  label: "Last seen",
                  align: "right",
                  render: (r) => new Date(r.lastSeen).toLocaleString(),
                },
              ]}
              rows={data.topActiveUsers}
              getRowKey={(r) => r.uid}
              emptyLabel="No events captured yet"
            />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Churn watch list" description="No session in 14+ days">
        <Card className="p-4">
          <ConsoleTable
            columns={[
              {
                key: "uid",
                label: "User",
                render: (r) => (
                  <Link
                    to={ROUTES.consoleUserReport(r.uid)}
                    className="inline-flex items-center gap-1 font-mono text-[12px] text-acid hover:underline"
                  >
                    {r.uid.slice(0, 12)}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                ),
              },
              {
                key: "lastSeen",
                label: "Last seen",
                align: "right",
                render: (r) => new Date(r.lastSeen).toLocaleString(),
              },
              {
                key: "days",
                label: "Days inactive",
                align: "right",
                render: (r) => `${r.daysInactive}d`,
              },
            ]}
            rows={data.churnWatchList}
            getRowKey={(r) => r.uid}
            emptyLabel="No churn signals — every user has been seen recently."
          />
        </Card>
      </ConsoleSection>
    </div>
  );
}
