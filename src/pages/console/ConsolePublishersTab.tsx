import { Briefcase, DollarSign, Receipt, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleMultiSeriesChart } from "@/components/console/ConsoleMultiSeriesChart";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleTable } from "@/components/console/ConsoleTable";
import { useConsolePublishers, useConsoleRange } from "@/hooks/use-console";
import { formatPrice } from "@/lib/utils";

const SERIES_COLORS = ["--acid", "--cyan", "--green", "--orange", "--brand-plus"];

export function ConsolePublishersTab() {
  const [range] = useConsoleRange();
  const { data, isLoading, error } = useConsolePublishers(range);

  if (isLoading) return <LoadingSpinner label="Loading publisher analytics…" />;
  if (error) {
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load publisher data: {(error as Error).message}
      </Card>
    );
  }
  if (!data) return null;

  const topPubIds = data.revenueByPublisher.length > 0
    ? Object.keys(data.revenueByPublisher[0]).filter((k) => k !== "bucket")
    : [];

  const series = topPubIds.map((id, i) => {
    const pub = data.topPublishersByRevenue.find((p) => p.id === id);
    return {
      key: id,
      label: pub?.name ?? id,
      colorVar: SERIES_COLORS[i % SERIES_COLORS.length],
    };
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <ConsoleKpiTile
          icon={Briefcase}
          label="Total publishers"
          value={data.totalPublishers.toLocaleString()}
        />
        <ConsoleKpiTile
          icon={Briefcase}
          label="Active"
          value={data.activePublishersInRange.toLocaleString()}
          hint={`in ${range}`}
        />
        <ConsoleKpiTile
          icon={DollarSign}
          label="Revenue"
          value={formatPrice(data.revenueCentsInRange)}
          hint={`in ${range}`}
          tone="positive"
        />
        <ConsoleKpiTile
          icon={Receipt}
          label="Refunds"
          value={data.refundsInRange.toLocaleString()}
          tone={data.refundsInRange > 0 ? "warn" : "default"}
        />
        <ConsoleKpiTile
          icon={Wallet}
          label="Avg ticket"
          value={formatPrice(data.avgTicketCents)}
        />
      </div>

      <ConsoleSection title="Revenue by top publishers">
        <Card className="p-4">
          {series.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted/55">
              No revenue data in this range
            </p>
          ) : (
            <ConsoleMultiSeriesChart
              data={data.revenueByPublisher}
              series={series}
              stacked
            />
          )}
        </Card>
      </ConsoleSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="Apps per publisher">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={data.appsPerPublisher}
              colorVar="--brand-plus"
              limit={12}
            />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Top publishers by revenue">
          <Card className="p-4">
            <ConsoleTable
              columns={[
                { key: "name", label: "Publisher", render: (r) => r.name },
                {
                  key: "revenue",
                  label: "Revenue",
                  align: "right",
                  render: (r) => formatPrice(r.revenueCents),
                },
              ]}
              rows={data.topPublishersByRevenue}
              getRowKey={(r) => r.id}
            />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Top publishers by catalog size">
        <Card className="p-4">
          <ConsoleTable
            columns={[
              { key: "name", label: "Publisher", render: (r) => r.name },
              {
                key: "apps",
                label: "Apps",
                align: "right",
                render: (r) => r.appsCount.toLocaleString(),
              },
            ]}
            rows={data.topPublishersByCatalog}
            getRowKey={(r) => r.id}
          />
        </Card>
      </ConsoleSection>
    </div>
  );
}
