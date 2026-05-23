import { Link } from "react-router-dom";
import {
  Boxes,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  Gamepad2,
  Inbox,
  Package,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users as UsersIcon,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AuditEntry } from "@/components/admin/AuditEntry";
import { EmptyState } from "@/components/common/EmptyState";
import { useAdminKpis } from "@/hooks/use-admin";
import { useRecentAuditLog } from "@/hooks/use-audit-log";
import { ROUTES } from "@/lib/routes";

export function AdminDashboardPage() {
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useAdminKpis();
  const { data: audit, isLoading: auditLoading } = useRecentAuditLog(20);

  const v = (n: number | undefined): string | number =>
    kpisLoading ? "—" : n ?? 0;

  return (
    <div className="space-y-8">
      {kpisError && (
        <Card className="p-4 text-[13px] text-red">
          <p className="font-semibold">Failed to load dashboard stats.</p>
          <p className="mt-1 break-all text-[12px] text-red/85">
            {(kpisError as Error).message}
          </p>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
          Action needed
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link to={ROUTES.adminSubmissions}>
            <AdminKpiCard
              icon={Inbox}
              label="Pending submissions"
              value={v(kpis?.pendingSubmissions)}
              delta={
                kpis && kpis.inReviewSubmissions > 0
                  ? { label: `${kpis.inReviewSubmissions} in review`, tone: "neutral" }
                  : undefined
              }
            />
          </Link>
          <Link to={ROUTES.adminPublishers}>
            <AdminKpiCard
              icon={Briefcase}
              label="Publishers to verify"
              value={v(kpis?.publishersAwaitingVerification)}
              delta={
                kpis
                  ? { label: `${kpis.approvedPublishers} approved`, tone: "neutral" }
                  : undefined
              }
            />
          </Link>
          <Link to={ROUTES.adminStudios}>
            <AdminKpiCard
              icon={Building}
              label="Studios to verify"
              value={v(kpis?.developersAwaitingVerification)}
              delta={
                kpis
                  ? { label: `${kpis.approvedDevelopers} approved`, tone: "neutral" }
                  : undefined
              }
            />
          </Link>
          <Link to={ROUTES.adminContentModeration}>
            <AdminKpiCard
              icon={ShieldAlert}
              label="Open moderation"
              value={v(kpis?.openModerationCount)}
              delta={{ label: "reports awaiting review", tone: "neutral" }}
            />
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
          Platform totals
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link to={ROUTES.adminApps}>
            <AdminKpiCard
              icon={Boxes}
              label="Apps in catalog"
              value={v(kpis?.totalApps)}
              delta={
                kpis
                  ? { label: `${kpis.draftApps} draft`, tone: "neutral" }
                  : undefined
              }
            />
          </Link>
          <AdminKpiCard
            icon={Gamepad2}
            label="Live games"
            value={v(kpis?.releasedGames)}
            delta={{ label: "released to store", tone: "neutral" }}
          />
          <Link to={ROUTES.adminPublishers}>
            <AdminKpiCard
              icon={Briefcase}
              label="Publishers"
              value={v(kpis?.totalPublishers)}
              delta={
                kpis
                  ? { label: `${kpis.approvedPublishers} approved`, tone: "positive" }
                  : undefined
              }
            />
          </Link>
          <Link to={ROUTES.adminStudios}>
            <AdminKpiCard
              icon={Building}
              label="Studios"
              value={v(kpis?.totalDevelopers)}
              delta={
                kpis
                  ? { label: `${kpis.approvedDevelopers} approved`, tone: "positive" }
                  : undefined
              }
            />
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
          Users & activity (last 7 days)
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Link to={ROUTES.adminUsers}>
            <AdminKpiCard
              icon={UsersIcon}
              label="Total users"
              value={v(kpis?.totalUsers)}
            />
          </Link>
          <AdminKpiCard
            icon={UserPlus}
            label="New users (7d)"
            value={v(kpis?.newUsers7d)}
            delta={
              kpis && kpis.newUsers7d > 0
                ? { label: "this week", tone: "positive" }
                : undefined
            }
          />
          <Link to={ROUTES.adminUsers}>
            <AdminKpiCard
              icon={UserCog}
              label="Admins"
              value={v(kpis?.adminCount)}
            />
          </Link>
          <AdminKpiCard
            icon={CheckCircle2}
            label="Approved (7d)"
            value={v(kpis?.approvedThisWeek)}
            delta={
              kpis && kpis.approvedThisWeek > 0
                ? { label: "submissions", tone: "positive" }
                : undefined
            }
          />
          <AdminKpiCard
            icon={XCircle}
            label="Rejected (7d)"
            value={v(kpis?.rejectedThisWeek)}
            delta={
              kpis && kpis.rejectedThisWeek > 0
                ? { label: "submissions", tone: "negative" }
                : undefined
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
            Recent admin activity
          </h2>
          <Link to={ROUTES.adminAuditLog} className="text-[12px] text-acid hover:underline">
            Open audit log →
          </Link>
        </header>
        {auditLoading ? (
          <Card className="p-6 text-[13px] text-muted/60">Loading audit log…</Card>
        ) : !audit || audit.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No admin activity yet"
            description="When admins act on submissions, verifications, or users, their actions appear here."
          />
        ) : (
          <div className="space-y-2">
            {audit.map((entry) => (
              <AuditEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Re-exported to keep prior named-import expectations clean (kept here in case
// other places imported these icons via the page module).
export { Package, ShieldCheck };
