import { DollarSign, LineChart, Receipt, TrendingUp, Users, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleTimeChart } from "@/components/console/ConsoleTimeChart";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleGeoBar } from "@/components/console/ConsoleGeoBar";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleExportCsv } from "@/components/console/ConsoleExportCsv";
import { useConsoleMoney, useConsoleRange } from "@/hooks/use-console";
import { formatPrice } from "@/lib/utils";

export function ConsoleMoneyTab() {
  const [range] = useConsoleRange();
  const { data, isLoading, error } = useConsoleMoney(range);
  if (isLoading) return <LoadingSpinner label="Counting cents…" />;
  if (error) {
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load money tab: {(error as Error).message}
      </Card>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile icon={DollarSign} label="MRR" value={formatPrice(data.mrrCents)} tone="positive" />
        <ConsoleKpiTile icon={TrendingUp} label="ARR" value={formatPrice(data.arrCents)} tone="positive" />
        <ConsoleKpiTile icon={Wallet} label="ARPU" value={formatPrice(data.arpuCents)} />
        <ConsoleKpiTile icon={LineChart} label="LTV (est.)" value={formatPrice(data.ltvCents)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile icon={Users} label="Paying users" value={data.payingUsers.toLocaleString()} />
        <ConsoleKpiTile
          icon={Users}
          label="New paying"
          value={data.newPayingInRange.toLocaleString()}
          hint={`in ${range}`}
          tone="positive"
        />
        <ConsoleKpiTile
          icon={Receipt}
          label="Refund rate"
          value={`${data.refundRatePct}%`}
          tone={data.refundRatePct > 5 ? "negative" : "default"}
        />
        <ConsoleKpiTile
          icon={Wallet}
          label="Trial → paid"
          value={`${data.trialConversionPct}%`}
        />
      </div>

      <ConsoleSection title="Revenue over time" description="Sum of order totals">
        <Card className="p-4">
          <ConsoleTimeChart
            data={data.revenueSeries}
            colorVar="--green"
            gradientId="dw-money-rev"
            valueLabel="Revenue ¢"
          />
        </Card>
      </ConsoleSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="Revenue by region">
          <Card className="p-4">
            <ConsoleGeoBar data={data.revenueByRegion} />
            <div className="mt-3 flex justify-end">
              <ConsoleExportCsv rows={data.revenueByRegion} filename="dw-revenue-region" />
            </div>
          </Card>
        </ConsoleSection>
        <ConsoleSection title="Revenue by currency">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={data.revenueByCurrency}
              colorVar="--cyan"
              formatValue={(n) => formatPrice(n)}
            />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Price-band revenue mix">
        <Card className="p-4">
          <ConsoleHorizontalBar
            data={data.priceBandRevenue}
            colorVar="--brand-plus"
            formatValue={(n) => formatPrice(n)}
          />
        </Card>
      </ConsoleSection>
    </div>
  );
}
