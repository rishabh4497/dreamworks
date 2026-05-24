import { motion } from "motion/react";
import { usePublisherReport } from "@/hooks/use-console";
import { useMyPublisher } from "@/hooks/use-publisher";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card } from "@/components/ui/card";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleTimeChart } from "@/components/console/ConsoleTimeChart";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleGeoBar } from "@/components/console/ConsoleGeoBar";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { Briefcase, DollarSign, Receipt, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export function PublisherInsightsPage() {
  const { data: pub, isLoading: loadingPub } = useMyPublisher();
  const { data: report, isLoading } = usePublisherReport(pub?.id);

  if (loadingPub || isLoading) return <LoadingSpinner label="Loading publisher insights…" />;
  if (!pub)
    return (
      <Card className="p-6 text-center text-muted">
        You don't have a publisher profile yet — create one to see insights.
      </Card>
    );
  if (!report) return <Card className="p-6 text-center text-muted">No insights available.</Card>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6"
    >
      <header>
        <p className="text-[11px] uppercase tracking-widest text-muted/50">Publisher insights</p>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">{report.name}</h1>
        <p className="mt-1 text-[13px] text-muted/65">{report.oneLineSummary}</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <ConsoleKpiTile icon={Briefcase} label="Apps" value={report.catalog.totalApps.toString()} />
        <ConsoleKpiTile icon={DollarSign} label="ARPU" value={formatPrice(report.money.arpuCents)} tone="positive" />
        <ConsoleKpiTile icon={Wallet} label="ARPPU" value={formatPrice(report.money.arppuCents)} />
        <ConsoleKpiTile icon={TrendingUp} label="LTV (est.)" value={formatPrice(report.money.ltvCents)} />
        <ConsoleKpiTile
          icon={Receipt}
          label="Refund rate"
          value={`${report.money.refundRatePct}%`}
          tone={report.money.refundRatePct > 5 ? "negative" : "default"}
        />
      </div>

      <ConsoleSection title="Revenue over time">
        <Card className="p-4">
          <ConsoleTimeChart
            data={report.money.revenueSeries}
            colorVar="--green"
            gradientId="dw-self-pub-rev"
            valueLabel="Revenue ¢"
          />
        </Card>
      </ConsoleSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="Revenue by region">
          <Card className="p-4">
            <ConsoleGeoBar data={report.money.revenueByRegion} />
          </Card>
        </ConsoleSection>
        <ConsoleSection title="Catalog mix">
          <Card className="p-4">
            <ConsoleHorizontalBar data={report.catalog.byGenre} colorVar="--brand-plus" />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Suggestions">
        {report.suggestions.length === 0 ? (
          <Card className="p-4 text-[12px] text-muted/55">No flagged actions.</Card>
        ) : (
          <div className="space-y-2">
            {report.suggestions.map((s, i) => (
              <Card key={i} className="flex items-start gap-2 p-3">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-acid" />
                <p className="text-[12.5px] text-foreground/85">{s}</p>
              </Card>
            ))}
          </div>
        )}
      </ConsoleSection>
    </motion.div>
  );
}
