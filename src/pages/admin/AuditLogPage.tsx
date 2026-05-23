import { useState } from "react";
import { ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { AuditEntry } from "@/components/admin/AuditEntry";
import { useAuditLog } from "@/hooks/use-audit-log";
import type { AuditAction, AuditTargetType } from "@/lib/types";

const ACTION_OPTIONS: { value: AuditAction | ""; label: string }[] = [
  { value: "", label: "All actions" },
  { value: "submission.submit", label: "submission.submit" },
  { value: "submission.review", label: "submission.review" },
  { value: "app.publish", label: "app.publish" },
  { value: "user.role_set", label: "user.role_set" },
  { value: "publisher.review", label: "publisher.review" },
  { value: "studio.review", label: "studio.review" },
  { value: "moderation.decide", label: "moderation.decide" },
];

const TARGET_OPTIONS: { value: AuditTargetType | ""; label: string }[] = [
  { value: "", label: "All targets" },
  { value: "submission", label: "Submissions" },
  { value: "app", label: "Apps" },
  { value: "user", label: "Users" },
  { value: "publisher", label: "Publishers" },
  { value: "developer", label: "Developers" },
  { value: "moderationRecord", label: "Moderation records" },
];

export function AuditLogPage() {
  const [action, setAction] = useState<AuditAction | "">("");
  const [targetType, setTargetType] = useState<AuditTargetType | "">("");

  const filters = {
    ...(action ? { action } : {}),
    ...(targetType ? { targetType } : {}),
  };
  const query = useAuditLog(filters);

  const entries = (query.data?.pages ?? []).flatMap((page) => page.entries);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">Audit log</h2>
          <p className="text-[12px] text-muted/60">
            Every admin action is written to dw_admin_audit. Append-only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={action}
            onChange={(event) => setAction(event.target.value as AuditAction | "")}
            className="h-9 rounded-xl border border-separator bg-input px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-acid/15"
          >
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={targetType}
            onChange={(event) => setTargetType(event.target.value as AuditTargetType | "")}
            className="h-9 rounded-xl border border-separator bg-input px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-acid/15"
          >
            {TARGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {query.isLoading ? (
        <Card className="p-6 text-[13px] text-muted/65">Loading audit log…</Card>
      ) : query.error ? (
        <Card className="p-6 text-[13px] text-red">
          Failed to load: {(query.error as Error).message}
        </Card>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No matching audit entries"
          description="Adjust the filters or take an action to populate this log."
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <AuditEntry key={entry.id} entry={entry} />
          ))}
          {query.hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                onClick={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
