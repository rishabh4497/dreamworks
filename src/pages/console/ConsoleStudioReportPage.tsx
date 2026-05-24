import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Boxes,
  Building,
  Clock,
  FlagTriangleRight,
  Hammer,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleTimeChart } from "@/components/console/ConsoleTimeChart";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleTable } from "@/components/console/ConsoleTable";
import { ConsoleFunnel } from "@/components/console/ConsoleFunnel";
import { useStudioReport } from "@/hooks/use-console";
import { ROUTES } from "@/lib/routes";
import { cn, formatPrice } from "@/lib/utils";

const STAGE_TONE: Record<string, string> = {
  draft: "bg-card-active text-muted",
  "in-review": "bg-orange/15 text-orange",
  "coming-soon": "bg-acid/15 text-acid",
  released: "bg-green/15 text-green",
};

export function ConsoleStudioReportPage() {
  const { id = "" } = useParams();
  const { data: report, isLoading, error } = useStudioReport(id);
  if (isLoading) return <LoadingSpinner label="Auditing the studio…" />;
  if (error)
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load studio report: {(error as Error).message}
      </Card>
    );
  if (!report) return <Card className="p-6 text-center text-muted">Studio not found.</Card>;

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
          <p className="text-[11px] uppercase tracking-widest text-muted/50">Studio report</p>
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile icon={Boxes} label="Apps" value={report.apps.length.toString()} />
        <ConsoleKpiTile
          icon={Building}
          label="Pending review"
          value={report.submissions.pending.toString()}
          tone={report.submissions.pending > 0 ? "warn" : "default"}
        />
        <ConsoleKpiTile
          icon={Clock}
          label="Median TTP"
          value={report.submissions.medianTtpDays === null ? "—" : `${report.submissions.medianTtpDays} d`}
        />
        <ConsoleKpiTile
          icon={Hammer}
          label="Days since build"
          value={report.daysSinceLastBuild === null ? "—" : `${report.daysSinceLastBuild} d`}
          tone={
            report.daysSinceLastBuild !== null && report.daysSinceLastBuild > 60 ? "warn" : "default"
          }
        />
      </div>

      <ConsoleSection title="Apps">
        <Card className="p-4">
          <ConsoleTable
            columns={[
              { key: "title", label: "Title", render: (r) => r.title },
              {
                key: "stage",
                label: "Stage",
                render: (r) => (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10.5px] font-medium",
                      STAGE_TONE[r.stage] ?? STAGE_TONE.draft,
                    )}
                  >
                    {r.stage}
                  </span>
                ),
              },
              { key: "wishlists", label: "Wishlists", align: "right", render: (r) => r.wishlists },
              { key: "players", label: "Players", align: "right", render: (r) => r.currentPlayers },
              {
                key: "revenue",
                label: "Revenue",
                align: "right",
                render: (r) => formatPrice(r.revenueCents),
              },
              {
                key: "lcp",
                label: "p95 LCP",
                align: "right",
                render: (r) => (
                  <span className={r.p95LcpMs > 2500 ? "text-orange" : ""}>{r.p95LcpMs} ms</span>
                ),
              },
              {
                key: "err",
                label: "Errors / 1k",
                align: "right",
                render: (r) => (
                  <span className={r.errorsPer1k > 50 ? "text-red" : ""}>{r.errorsPer1k}</span>
                ),
              },
            ]}
            rows={report.apps}
            getRowKey={(r) => r.id}
          />
        </Card>
      </ConsoleSection>

      <ConsoleSection title="Funnel per app" description="Page view → wishlist → purchase → install → launch">
        <div className="grid gap-3 md:grid-cols-2">
          {report.funnelByApp.slice(0, 6).map((f) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="Builds per month">
          <Card className="p-4">
            <ConsoleTimeChart
              data={report.buildsPerMonth}
              colorVar="--cyan"
              gradientId="dw-studio-builds"
              valueLabel="Builds"
            />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Submissions">
          <Card className="p-4 space-y-2">
            <Row label="Total" value={report.submissions.total.toString()} />
            <Row label="Pending" value={report.submissions.pending.toString()} />
            <Row label="Approved" value={report.submissions.approved.toString()} />
            <Row label="Rejected" value={report.submissions.rejected.toString()} />
            <Row label="Median TTP" value={report.submissions.medianTtpDays === null ? "—" : `${report.submissions.medianTtpDays} d`} />
            <Row label="p95 TTP" value={report.submissions.p95TtpDays === null ? "—" : `${report.submissions.p95TtpDays} d`} />
          </Card>
        </ConsoleSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="Top rejection reasons">
          <Card className="p-4">
            <ConsoleHorizontalBar data={report.submissions.rejectionReasons} colorVar="--red" />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Negative review keywords">
          <Card className="p-4">
            <ConsoleHorizontalBar data={report.reviews.recentNegativeKeywords} colorVar="--orange" />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Top crash clusters">
        <Card className="p-4">
          {report.crashes.topClusters.length === 0 ? (
            <p className="py-3 text-center text-[12px] text-muted/55">No crashes captured.</p>
          ) : (
            <ConsoleTable
              columns={[
                { key: "message", label: "Message", render: (r) => r.message },
                { key: "count", label: "Count", align: "right", render: (r) => r.count },
              ]}
              rows={report.crashes.topClusters}
              getRowKey={(r) => r.fingerprint}
            />
          )}
        </Card>
      </ConsoleSection>

      <ConsoleSection title="What to fix">
        {report.whatToFix.length === 0 ? (
          <Card className="p-4 text-[12px] text-muted/55">
            Nothing standing out — the studio is in a healthy spot.
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
          A trimmed self-service version of this report appears in the developer portal at{" "}
          <span className="font-mono">/developer-portal/studio-report</span>.
        </p>
      </Card>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-muted/65">{label}</span>
      <span className="font-medium tabular-nums text-foreground/85">{value}</span>
    </div>
  );
}
