import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  AlertOctagon,
  ArrowLeft,
  Cpu,
  Gauge,
  Gift,
  HardDrive,
  Heart,
  Library,
  Sparkles,
  Trophy,
  Users as UsersIcon,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleHeatmap } from "@/components/console/ConsoleHeatmap";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleTable } from "@/components/console/ConsoleTable";
import { useUserReport } from "@/hooks/use-console";
import { ROUTES } from "@/lib/routes";
import { cn, compactNumber, formatHours, formatPrice } from "@/lib/utils";

const SEGMENT_COLOR = {
  Champion: "bg-green/15 text-green",
  Loyal: "bg-acid/15 text-acid",
  "At-risk": "bg-orange/15 text-orange",
  Hibernating: "bg-red/15 text-red",
  New: "bg-cyan/15 text-cyan",
};

export function ConsoleUserReportPage() {
  const { uid = "" } = useParams();
  const { data: report, isLoading, error } = useUserReport(uid);

  if (isLoading) return <LoadingSpinner label="Building the god-view…" />;
  if (error) {
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load user report: {(error as Error).message}
      </Card>
    );
  }
  if (!report) return <Card className="p-6 text-center text-muted">User not found.</Card>;

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
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-muted/50">User report</p>
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
            {report.displayName}
          </h1>
          <p className="text-[12.5px] text-muted/65">
            <span className="font-mono">{report.uid.slice(0, 14)}</span>
            {report.country && <span className="mx-2 text-muted/40">·</span>}
            {report.country}
            <span className="mx-2 text-muted/40">·</span>
            {report.role}
          </p>
          <p className="mt-2 text-[13px] text-foreground/80">{report.oneLineSummary}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
              SEGMENT_COLOR[report.segment],
            )}
          >
            {report.segment}
          </span>
          <span className="rounded-md bg-card-active px-2.5 py-1 text-[11px] font-medium text-foreground/80">
            {report.personality}
          </span>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <ConsoleKpiTile icon={UsersIcon} label="Sessions" value={report.sessions.toLocaleString()} />
        <ConsoleKpiTile icon={Trophy} label="Total played" value={formatHours(report.totalMinutes)} />
        <ConsoleKpiTile icon={Library} label="Owned" value={report.ownedCount.toLocaleString()} />
        <ConsoleKpiTile icon={Wallet} label="Lifetime spend" value={formatPrice(report.lifetimeSpendCents)} tone="positive" />
        <ConsoleKpiTile icon={AlertOctagon} label="Errors" value={report.errorsObserved.toLocaleString()} tone={report.errorsObserved > 0 ? "negative" : "default"} />
        <ConsoleKpiTile icon={Gauge} label="p95 LCP" value={`${report.p95LcpMsExperienced} ms`} tone={report.p95LcpMsExperienced > 2500 ? "warn" : "positive"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ConsoleSection title="Engagement heatmap" className="lg:col-span-2">
          <Card className="p-4">
            <ConsoleHeatmap cells={report.hourHeatmap} />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Day sparkline" description="Events per day, last 30 d">
          <Card className="p-4">
            <div className="flex items-end gap-[2px] h-32">
              {report.daySparkline.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-acid/40"
                  style={{ height: `${Math.max(4, Math.round((v / Math.max(...report.daySparkline, 1)) * 100))}%` }}
                />
              ))}
            </div>
          </Card>
        </ConsoleSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ConsoleSection title="Top games" className="lg:col-span-1">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={report.topGames.map((g) => ({ name: g.title, count: g.minutes }))}
              colorVar="--green"
              formatValue={(n) => `${Math.round(n / 60)}h`}
              emptyLabel="No play data yet"
            />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Library health" className="lg:col-span-1">
          <Card className="p-4 space-y-2">
            <Row label="Installed" value={`${report.installedCount} / ${report.ownedCount}`} />
            <Row label="Achievements" value={compactNumber(report.achievementsUnlocked)} />
            <Row label="Avg completion" value={`${report.averageCompletionPct}%`} />
            <Row label="Perfect games" value={report.perfectGames.toString()} />
            <Row label="Dust pile" value={report.dustPile.toString()} />
            <Row label="Backlog years" value={String(report.backlogYears)} />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Top events" className="lg:col-span-1">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={report.topEvents}
              colorVar="--cyan"
              limit={10}
            />
          </Card>
        </ConsoleSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ConsoleSection title="Wishlist health">
          <Card className="p-4 space-y-2">
            <Row label="Wishlist size" value={report.wishlistSize.toString()} />
            <Row label="Conversion" value={`${report.wishlistConversionPct}%`} />
            <Row label="Oldest entry" value={`${report.wishlistOldestAgeDays} d`} />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Social">
          <Card className="p-4 space-y-2">
            <Row label="Friends" value={report.friendsCount.toString()} />
            <Row label="Communities" value={report.communitiesCount.toString()} />
            <Row label="Voice minutes" value={report.voiceMinutes.toString()} />
            <Row label="Reviews" value={`${report.reviewsPosted} (${report.reviewHelpfulTotal} helpful)`} />
            <Row label="Forum posts" value={report.forumPosts.toString()} />
          </Card>
        </ConsoleSection>

        <ConsoleSection title="Money">
          <Card className="p-4 space-y-2">
            <Row label="Avg ticket" value={formatPrice(report.avgTicketCents)} />
            <Row label="Subscription" value={report.subscriptionStatus} />
            <Row label="Refunds" value={report.refundCount.toString()} />
            <Row label="Gifts given" value={formatPrice(report.giftsGivenCents)} icon={<Gift className="h-3 w-3 text-muted/55" />} />
            <Row label="Gifts received" value={formatPrice(report.giftsReceivedCents)} />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Rig snapshot">
        {!report.device ? (
          <Card className="p-4 text-[12px] text-muted/55">No device snapshot yet.</Card>
        ) : (
          <Card className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-4 text-[12.5px]">
            <RigCell icon={Cpu} label="CPU" value={report.device.cpuModel ?? `${report.device.cpuCores} cores`} />
            <RigCell icon={HardDrive} label="RAM" value={`${report.device.deviceMemoryGb} GB`} />
            <RigCell icon={Sparkles} label="GPU" value={report.device.gpu ?? "—"} />
            <RigCell
              icon={Heart}
              label="OS"
              value={`${report.device.os} ${report.device.isDesktop ? "(desktop)" : "(web)"}`}
            />
          </Card>
        )}
      </ConsoleSection>

      {report.topErrorMessages.length > 0 && (
        <ConsoleSection title="Errors observed">
          <Card className="p-4">
            <ConsoleTable
              columns={[{ key: "msg", label: "Message", render: (r) => r.msg }]}
              rows={report.topErrorMessages.map((m) => ({ msg: m }))}
              getRowKey={(r, i) => `${r.msg}-${i}`}
            />
          </Card>
        </ConsoleSection>
      )}

      <ConsoleSection title="Suggestions">
        {report.suggestions.length === 0 ? (
          <Card className="p-4 text-[12px] text-muted/55">No actionable suggestions — healthy user.</Card>
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

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="flex items-center gap-1.5 text-muted/65">
        {icon} {label}
      </span>
      <span className="font-medium tabular-nums text-foreground/85">{value}</span>
    </div>
  );
}

function RigCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-acid/10 text-acid">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest text-muted/55">{label}</p>
        <p className="mt-0.5 truncate text-foreground/85">{value}</p>
      </div>
    </div>
  );
}
