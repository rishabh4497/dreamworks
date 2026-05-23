import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldQuestion } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { AuditEntry } from "@/components/admin/AuditEntry";
import { useAdminUser } from "@/hooks/use-admin";
import { useUserAuditTrail } from "@/hooks/use-audit-log";
import { ROUTES } from "@/lib/routes";

export function UserDetailPage() {
  const { uid = "" } = useParams();
  const navigate = useNavigate();
  const { data: user, isLoading } = useAdminUser(uid);
  const { data: trail } = useUserAuditTrail(uid);

  if (isLoading) {
    return <Card className="p-6 text-[13px] text-muted/65">Loading user…</Card>;
  }
  if (!user) {
    return (
      <EmptyState
        icon={ShieldQuestion}
        title="User not found"
        description={`No user with uid ${uid}.`}
      />
    );
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate(ROUTES.adminUsers)}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted/65 hover:text-foreground/80"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to users
      </button>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="h-16 w-16 rounded-full bg-card-active object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-card-active" />
          )}
          <div className="flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-semibold text-foreground">{user.displayName}</h2>
              <Badge variant={user.role === "admin" ? "free" : "default"}>{user.role}</Badge>
              {user.suspended && <Badge variant="warn">suspended</Badge>}
            </div>
            <p className="text-[12px] text-muted/65">{user.email}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted/55">{user.uid}</p>
            {user.createdAt && (
              <p className="mt-1 text-[11px] text-muted/55">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Link
            to={ROUTES.profileOther(user.uid)}
            className="text-[12px] text-acid hover:underline"
          >
            View public profile →
          </Link>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-2 text-[14px] font-semibold text-foreground">Permissions</h3>
        {user.permissions.length === 0 ? (
          <p className="text-[12px] text-muted/60">No explicit permissions assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {user.permissions.map((perm) => (
              <span
                key={perm}
                className="rounded-md bg-card-active px-2 py-[2px] text-[11px] font-medium text-foreground/85"
              >
                {perm}
              </span>
            ))}
          </div>
        )}
      </Card>

      <section className="space-y-3">
        <h3 className="text-[14px] font-semibold text-foreground">Audit trail (actions taken)</h3>
        {!trail || trail.length === 0 ? (
          <Card className="p-6 text-center text-[12px] text-muted/60">
            This user has not taken any admin actions.
          </Card>
        ) : (
          <div className="space-y-2">
            {trail.map((entry) => (
              <AuditEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
