import { Link } from "react-router-dom";
import {
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  Inbox,
  ShieldAlert,
  UserPlus,
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
  const { data: kpis, isLoading: kpisLoading } = useAdminKpis();
  const { data: audit, isLoading: auditLoading } = useRecentAuditLog(20);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Link to={ROUTES.adminSubmissions}>
          <AdminKpiCard
            icon={Inbox}
            label="Pending submissions"
            value={kpisLoading ? "—" : kpis?.pendingSubmissions ?? 0}
            delta={
              kpis && kpis.inReviewSubmissions > 0
                ? { label: `${kpis.inReviewSubmissions} in review`, tone: "neutral" }
                : undefined
            }
          />
        </Link>
        <AdminKpiCard
          icon={CheckCircle2}
          label="Approved (7d)"
          value={kpisLoading ? "—" : kpis?.approvedThisWeek ?? 0}
          delta={{ label: "last 7 days", tone: "positive" }}
        />
        <AdminKpiCard
          icon={XCircle}
          label="Rejected (7d)"
          value={kpisLoading ? "—" : kpis?.rejectedThisWeek ?? 0}
          delta={{ label: "last 7 days", tone: "negative" }}
        />
        <AdminKpiCard
          icon={UserPlus}
          label="New users (7d)"
          value={kpisLoading ? "—" : kpis?.newUsers7d ?? 0}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Link to={ROUTES.adminPublishers}>
          <AdminKpiCard
            icon={Briefcase}
            label="Publisher claims pending"
            value={kpisLoading ? "—" : kpis?.pendingPublisherClaims ?? 0}
          />
        </Link>
        <Link to={ROUTES.adminStudios}>
          <AdminKpiCard
            icon={Building}
            label="Studio claims pending"
            value={kpisLoading ? "—" : kpis?.pendingStudioClaims ?? 0}
          />
        </Link>
        <Link to={ROUTES.adminContentModeration}>
          <AdminKpiCard
            icon={ShieldAlert}
            label="Content moderation"
            value="Open queue"
          />
        </Link>
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-foreground">Recent admin activity</h2>
          <Link
            to={ROUTES.adminAuditLog}
            className="text-[12px] text-acid hover:underline"
          >
            Open audit log →
          </Link>
        </header>
        {auditLoading ? (
          <Card className="p-6 text-[13px] text-muted/60">Loading audit log…</Card>
        ) : !audit || audit.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No admin activity yet"
            description="When admins act on submissions or users, their actions appear here."
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
