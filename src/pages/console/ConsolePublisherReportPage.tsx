import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Receipt,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleTimeChart } from "@/components/console/ConsoleTimeChart";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleGeoBar } from "@/components/console/ConsoleGeoBar";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { usePublisherReport } from "@/hooks/use-console";
import { ROUTES } from "@/lib/routes";
import { cn, formatPrice } from "@/lib/utils";

export function ConsolePublisherReportPage() {
  const { id = "" } = useParams();
  const { data: report, isLoading, error } = usePublisherReport(id);
  if (isLoading) return <LoadingSpinner label="Auditing the publisher…" />;
  if (error)
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load publisher report: {(error as Error).message}
      </Card>
    );
  if (!report) return <Card className="p-6 text-center text-muted">Publisher not found.</Card>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6"
    >
      <Link to={ROUTES.console} className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to console
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted/50">Publisher report</p>
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
            {report.name}
          </h1>
          <p className="text-[12.5px] text-muted/65">
            <span className="font-mono">{report.id}</span>
            <span className="mx-2 text-muted/40">·</span>
            owner <span className="font-mono">{report.ownerUid.slice(0, 10)}</span>
          </p>
          <p className="mt-2 text-[13px] text-foreground/80">{report.oneLineSummary}</p>
        </div>
        <span
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
            report.verificationStatus === "approved"
              ? "bg-green/15 text-green"
              : "bg-orange/15 text-orange",
          )}
        >
          <ShieldCheck className="-mt-0.5 mr-1 inline h-3 w-3" />
          {report.verificationStatus}
        </span>
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
            gradientId="dw-publisher-rev"
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
        <ConsoleSection title="Genre mix">
          <Card className="p-4">
            <ConsoleHorizontalBar data={report.catalog.byGenre} colorVar="--brand-plus" />
          </Card>
        </ConsoleSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ConsoleSection title="Tag mix">
          <Card className="p-4">
            <ConsoleHorizontalBar data={report.catalog.byTag} colorVar="--cyan" />
          </Card>
        </ConsoleSection>
        <ConsoleSection title="Price-band mix">
          <Card className="p-4">
            <ConsoleHorizontalBar data={report.catalog.byPriceBand} colorVar="--orange" />
          </Card>
        </ConsoleSection>
        <ConsoleSection title="Reputation themes">
          <Card className="p-4">
            <ConsoleHorizontalBar data={report.reputation.topThemes} colorVar="--acid" />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Catalog freshness">
        <Card className="p-4 grid gap-3 md:grid-cols-3 text-[12.5px]">
          <Row label="Median age" value={`${report.catalog.medianAgeDays} d`} />
          <Row label="Updated last 12 mo" value={`${report.catalog.updatedLast12moPct}%`} />
          <Row label="Reputation score" value={`${report.reputation.avgScore}%`} />
        </Card>
      </ConsoleSection>

      <ConsoleSection title="Suggestions">
        {report.suggestions.length === 0 ? (
          <Card className="p-4 text-[12px] text-muted/55">Healthy publisher, no flagged actions.</Card>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted/55">{label}</p>
      <p className="mt-0.5 font-medium tabular-nums text-foreground/85">{value}</p>
    </div>
  );
}
