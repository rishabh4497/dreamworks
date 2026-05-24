import { motion } from "motion/react";
import { useStudioReport } from "@/hooks/use-console";
import { useMyDeveloper } from "@/hooks/use-developer";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card } from "@/components/ui/card";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleTimeChart } from "@/components/console/ConsoleTimeChart";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleFunnel } from "@/components/console/ConsoleFunnel";
import { Boxes, Building, Clock, FlagTriangleRight, Hammer, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";

/** Studio's self-service slice of the admin report. Read-only summary. */
export function StudioInsightsPage() {
  const { data: dev, isLoading: loadingDev } = useMyDeveloper();
  const { data: report, isLoading } = useStudioReport(dev?.id);

  if (loadingDev || isLoading) return <LoadingSpinner label="Loading studio insights…" />;
  if (!dev)
    return (
      <Card className="p-6 text-center text-muted">
        You don't have a studio profile yet — create one to see insights.
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
        <p className="text-[11px] uppercase tracking-widest text-muted/50">Studio insights</p>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          {report.name}
        </h1>
        <p className="mt-1 text-[13px] text-muted/65">{report.oneLineSummary}</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile icon={Boxes} label="Apps" value={report.apps.length.toString()} />
        <ConsoleKpiTile icon={Building} label="Pending review" value={report.submissions.pending.toString()} />
        <ConsoleKpiTile icon={Clock} label="Median TTP" value={report.submissions.medianTtpDays === null ? "—" : `${report.submissions.medianTtpDays} d`} />
        <ConsoleKpiTile icon={Hammer} label="Days since build" value={report.daysSinceLastBuild === null ? "—" : `${report.daysSinceLastBuild} d`} />
      </div>

      <ConsoleSection title="Per-app revenue (last 90 d)">
        <Card className="p-4">
          <ConsoleHorizontalBar
            data={report.apps.map((a) => ({ name: a.title, count: a.revenueCents }))}
            colorVar="--green"
            formatValue={(n) => formatPrice(n)}
          />
        </Card>
      </ConsoleSection>

      <ConsoleSection title="Funnel per app">
        <div className="grid gap-3 md:grid-cols-2">
          {report.funnelByApp.slice(0, 4).map((f) => (
            <Card key={f.appId} className="p-4">
              <p className="mb-2 truncate text-[12.5px] font-semibold text-foreground/85">{f.title}</p>
              <ConsoleFunnel
                stages={[
                  { stage: "Page view", count: f.pageView, pct: 100 },
                  { stage: "Wishlist", count: f.wishlist, pct: f.pageView === 0 ? 0 : Math.round((f.wishlist / f.pageView) * 100) },
                  { stage: "Purchase", count: f.purchase, pct: f.pageView === 0 ? 0 : Math.round((f.purchase / f.pageView) * 100) },
                  { stage: "Install", count: f.install, pct: f.pageView === 0 ? 0 : Math.round((f.install / f.pageView) * 100) },
                  { stage: "Launch", count: f.launch, pct: f.pageView === 0 ? 0 : Math.round((f.launch / f.pageView) * 100) },
                ]}
              />
            </Card>
          ))}
        </div>
      </ConsoleSection>

      <ConsoleSection title="Builds per month">
        <Card className="p-4">
          <ConsoleTimeChart
            data={report.buildsPerMonth}
            colorVar="--cyan"
            gradientId="dw-self-studio-builds"
            valueLabel="Builds"
          />
        </Card>
      </ConsoleSection>

      <ConsoleSection title="What to fix">
        {report.whatToFix.length === 0 ? (
          <Card className="p-4 text-[12px] text-muted/55">
            Nothing standing out — keep shipping.
          </Card>
        ) : (
          <div className="space-y-2">
            {report.whatToFix.map((s, i) => (
              <Card key={i} className="flex items-start gap-2 p-3">
                <FlagTriangleRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange" />
                <p className="text-[12.5px] text-foreground/85">{s}</p>
              </Card>
            ))}
          </div>
        )}
      </ConsoleSection>

      <Card className="flex items-start gap-2 border-acid/20 bg-acid/5 p-3">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-acid" />
        <p className="text-[12px] text-muted/75">
          Aggregated from in-house telemetry. No third-party SDK. Privacy controls live in Settings.
        </p>
      </Card>
    </motion.div>
  );
}
