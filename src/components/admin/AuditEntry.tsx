import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditEntry as AuditEntryType } from "@/lib/types";

const ACTION_LABEL: Record<string, string> = {
  "submission.submit": "submitted",
  "submission.review": "reviewed submission",
  "app.publish": "published app",
  "user.role_set": "set role",
  "user.permissions_set": "updated permissions",
  "publisher.review": "reviewed publisher",
  "studio.review": "reviewed studio",
  "moderation.decide": "decided moderation",
};

function relativeTime(iso: string): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function AuditEntry({ entry }: { entry: AuditEntryType }) {
  const [open, setOpen] = useState(false);
  const hasDiff =
    (entry.beforeState && Object.keys(entry.beforeState).length > 0) ||
    (entry.afterState && Object.keys(entry.afterState).length > 0) ||
    (entry.metadata && Object.keys(entry.metadata).length > 0);

  return (
    <div className="rounded-xl border border-separator bg-card">
      <button
        type="button"
        onClick={() => hasDiff && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-start justify-between gap-3 p-3 text-left",
          hasDiff && "hover:bg-card-hover",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] text-foreground/80">
            <span className="font-semibold">{entry.actorEmail || entry.actorUid}</span>
            <span className="text-muted/65"> · {ACTION_LABEL[entry.action] ?? entry.action} · </span>
            <span className="font-mono text-[11px] text-foreground/70">
              {entry.targetType}/{entry.targetId}
            </span>
          </p>
          {!open && entry.metadata && (entry.metadata as any).outcome && (
            <p className="mt-0.5 text-[11px] text-muted/65">
              outcome: <span className="text-foreground/80">{String((entry.metadata as any).outcome)}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[10px] text-muted/55">
          <span>{relativeTime(entry.ts)}</span>
          {hasDiff &&
            (open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            ))}
        </div>
      </button>
      {open && hasDiff && (
        <div className="space-y-2 border-t border-separator p-3">
          {entry.beforeState && Object.keys(entry.beforeState).length > 0 && (
            <DiffBlock label="Before" data={entry.beforeState} tone="red" />
          )}
          {entry.afterState && Object.keys(entry.afterState).length > 0 && (
            <DiffBlock label="After" data={entry.afterState} tone="green" />
          )}
          {entry.metadata && Object.keys(entry.metadata).length > 0 && (
            <DiffBlock label="Metadata" data={entry.metadata} tone="neutral" />
          )}
        </div>
      )}
    </div>
  );
}

function DiffBlock({
  label,
  data,
  tone,
}: {
  label: string;
  data: Record<string, unknown>;
  tone: "red" | "green" | "neutral";
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-2 text-[11px]",
        tone === "red"
          ? "bg-red/10 text-red"
          : tone === "green"
            ? "bg-green/10 text-green"
            : "bg-card-active/60 text-muted/80",
      )}
    >
      <p className="mb-1 font-semibold uppercase tracking-widest">{label}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-foreground/80">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
