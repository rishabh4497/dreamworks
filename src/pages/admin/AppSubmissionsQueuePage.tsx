import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { SubmissionStatusBadge } from "@/components/admin/SubmissionStatusBadge";
import { useSubmissionQueue } from "@/hooks/use-submissions";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { AppSubmission, SubmissionStatus } from "@/lib/types";

type StatusFilter = "active" | "all" | SubmissionStatus;
type AgeFilter = "any" | "24h" | "7d" | "older";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "Active (pending + in review)" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In review" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const AGE_OPTIONS: { value: AgeFilter; label: string }[] = [
  { value: "any", label: "Any age" },
  { value: "24h", label: "< 24h" },
  { value: "7d", label: "< 7d" },
  { value: "older", label: "> 7d" },
];

function ageInDays(iso: string): number {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000);
}

function formatAge(iso: string): string {
  const days = ageInDays(iso);
  if (!Number.isFinite(days)) return "—";
  if (days < 1) return `${Math.round(days * 24)}h ago`;
  return `${Math.round(days)}d ago`;
}

export function AppSubmissionsQueuePage() {
  const [status, setStatus] = useState<StatusFilter>("active");
  const [age, setAge] = useState<AgeFilter>("any");

  const queueStatus: SubmissionStatus | undefined =
    status === "all" || status === "active" ? undefined : status;
  const { data, isLoading, error } = useSubmissionQueue(queueStatus);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((s) => {
      if (status === "active" && !(s.status === "pending" || s.status === "in_review")) {
        return false;
      }
      const days = ageInDays(s.submittedAt);
      if (age === "24h" && days >= 1) return false;
      if (age === "7d" && days >= 7) return false;
      if (age === "older" && days < 7) return false;
      return true;
    });
  }, [data, status, age]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">App submission queue</h2>
          <p className="text-[12px] text-muted/60">
            Review pending submissions. Decisions write to dw_app_submissions and dw_admin_audit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SelectField
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
            options={STATUS_OPTIONS}
          />
          <SelectField
            value={age}
            onChange={(v) => setAge(v as AgeFilter)}
            options={AGE_OPTIONS}
          />
        </div>
      </header>

      {isLoading ? (
        <Card className="p-6 text-[13px] text-muted/65">Loading submissions…</Card>
      ) : error ? (
        <Card className="p-6 text-[13px] text-red">
          Failed to load submissions: {(error as Error).message}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Inbox zero"
          description="No submissions match this filter."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
}

function SelectField<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="h-9 rounded-xl border border-separator bg-input px-3 text-[13px] text-foreground focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SubmissionCard({ submission }: { submission: AppSubmission }) {
  const snapshot = submission.appSnapshot;
  return (
    <Link to={ROUTES.adminSubmissionDetail(submission.id)} className="block">
      <Card className={cn("p-4 transition-colors hover:bg-card-hover")}>
        <div className="flex gap-3">
          {snapshot.headerUrl || snapshot.coverUrl ? (
            <img
              src={snapshot.headerUrl ?? snapshot.coverUrl}
              alt=""
              className="h-16 w-28 shrink-0 rounded-lg border border-separator bg-card-active object-cover"
            />
          ) : (
            <div className="h-16 w-28 shrink-0 rounded-lg bg-card-active" />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <SubmissionStatusBadge status={submission.status} />
              {submission.priorSubmissionId && (
                <span className="rounded-md bg-card-active px-1.5 py-[2px] text-[10px] font-semibold text-foreground/70">
                  resubmission
                </span>
              )}
            </div>
            <h3 className="truncate text-[14px] font-semibold text-foreground">
              {snapshot.gameTitle}
            </h3>
            <p className="mt-0.5 truncate text-[12px] text-muted/65">
              {submission.submitterEmail || submission.submitterUserId}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted/55">
              <span>{formatAge(submission.submittedAt)}</span>
              <span className="text-acid">Open review →</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
