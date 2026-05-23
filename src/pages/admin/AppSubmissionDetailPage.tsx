import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  History,
  MessageSquareWarning,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { SubmissionStatusBadge } from "@/components/admin/SubmissionStatusBadge";
import {
  RejectionModal,
  type RejectionOutcome,
  type RejectionPayload,
} from "@/components/admin/RejectionModal";
import {
  useReviewAppSubmission,
  useSubmission,
  useSubmissionsForApp,
  usePublishApprovedApp,
} from "@/hooks/use-submissions";
import { useApp } from "@/hooks/use-apps";
import { ROUTES } from "@/lib/routes";
import { toast } from "@/stores/toast-store";
import { cn, formatPrice } from "@/lib/utils";
import { openExternal } from "@/lib/platform";
import type { AppSubmission, Trailer } from "@/lib/types";

function relativeTime(iso?: string): string {
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
  return `${days}d ago`;
}

export function AppSubmissionDetailPage() {
  const { submissionId = "" } = useParams();
  const navigate = useNavigate();
  const { data: submission, isLoading, error } = useSubmission(submissionId);
  const { data: app } = useApp(submission?.appId);
  const { data: history } = useSubmissionsForApp(submission?.appId);
  const reviewMutation = useReviewAppSubmission();
  const publishMutation = usePublishApprovedApp();

  const [rejectionOutcome, setRejectionOutcome] = useState<RejectionOutcome | null>(null);

  if (isLoading) {
    return <Card className="p-6 text-[13px] text-muted/65">Loading submission…</Card>;
  }
  if (error || !submission) {
    return (
      <EmptyState
        icon={XCircle}
        title="Submission not found"
        description={(error as Error | null)?.message ?? "This submission may have been removed."}
      />
    );
  }

  const snapshot = submission.appSnapshot;
  const decided = !!submission.decision;
  const canApprove = !decided && (submission.status === "pending" || submission.status === "in_review");
  const canPublish = submission.status === "approved" && app?.stage !== "released";

  const onApprove = async () => {
    if (!canApprove) return;
    try {
      await reviewMutation.mutateAsync({
        submissionId,
        outcome: "approve",
        summaryNote: "Approved.",
        reasons: [],
        assetComments: [],
      });
      toast.success("Submission approved.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Approval failed.");
    }
  };

  const onSubmitRejection = async (payload: RejectionPayload) => {
    try {
      await reviewMutation.mutateAsync({
        submissionId,
        outcome: payload.outcome,
        summaryNote: payload.summaryNote,
        reasons: payload.reasons,
        assetComments: payload.assetComments,
      });
      toast.success(payload.outcome === "reject" ? "Submission rejected." : "Changes requested.");
      setRejectionOutcome(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Decision failed.");
    }
  };

  const onPublish = async () => {
    if (!submission.appId) return;
    try {
      await publishMutation.mutateAsync(submission.appId);
      toast.success("Published to the store.");
      navigate(ROUTES.gameDetail(submission.appId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Publish failed.");
    }
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate(ROUTES.adminSubmissions)}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted/65 hover:text-foreground/80"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to queue
      </button>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {snapshot.headerUrl || snapshot.coverUrl ? (
            <img
              src={snapshot.headerUrl ?? snapshot.coverUrl}
              alt=""
              className="h-24 w-44 shrink-0 rounded-lg border border-separator bg-card-active object-cover"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <SubmissionStatusBadge status={submission.status} />
              {submission.priorSubmissionId && (
                <span className="rounded-md bg-card-active px-1.5 py-[2px] text-[10px] font-semibold text-foreground/70">
                  resubmission
                </span>
              )}
            </div>
            <h2 className="text-[18px] font-semibold text-foreground">{snapshot.gameTitle}</h2>
            <p className="mt-0.5 text-[12px] text-muted/65">
              Submitted by{" "}
              <span className="text-foreground/80">
                {submission.submitterEmail || submission.submitterUserId}
              </span>{" "}
              · {relativeTime(submission.submittedAt)}
            </p>
            {submission.appId && (
              <p className="mt-0.5 text-[11px] text-muted/55">
                App ID:{" "}
                <Link
                  to={ROUTES.devAppPublish(submission.appId)}
                  className="text-acid hover:underline"
                >
                  {submission.appId}
                </Link>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {canApprove && (
              <>
                <Button
                  variant="success"
                  onClick={onApprove}
                  disabled={reviewMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setRejectionOutcome("request_changes")}
                  disabled={reviewMutation.isPending}
                >
                  <MessageSquareWarning className="h-4 w-4" />
                  Request changes
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setRejectionOutcome("reject")}
                  disabled={reviewMutation.isPending}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
            {canPublish && (
              <Button onClick={onPublish} disabled={publishMutation.isPending}>
                {publishMutation.isPending ? "Publishing…" : "Publish to store"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {submission.decision && (
            <Card className="p-5">
              <h3 className="mb-2 text-[14px] font-semibold text-foreground">Decision</h3>
              <p className="text-[12px] text-muted/65">
                {submission.decision.outcome === "approve"
                  ? "Approved"
                  : submission.decision.outcome === "reject"
                    ? "Rejected"
                    : "Changes requested"}{" "}
                · {relativeTime(submission.decidedAt)}
              </p>
              {submission.decision.summaryNote && (
                <p className="mt-2 rounded-lg bg-card-active/45 p-3 text-[13px] text-foreground/85">
                  {submission.decision.summaryNote}
                </p>
              )}
              {submission.decision.reasons.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {submission.decision.reasons.map((r) => (
                    <span
                      key={r}
                      className="rounded-md bg-red/15 px-2 py-[2px] text-[11px] font-medium text-red"
                    >
                      {r.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
              {submission.decision.assetComments.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {submission.decision.assetComments.map((c, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg bg-card-active/45 px-3 py-2 text-[12px]"
                    >
                      <span className="font-semibold text-foreground/85">
                        {c.field}
                        {c.index !== undefined ? ` #${c.index}` : ""}
                      </span>
                      <span className="text-muted/70"> — </span>
                      <span className="text-foreground/80">{c.comment}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <SnapshotSection title="Store page">
            <p className="text-[12px] text-muted/60">
              Short description:{" "}
              <span className="text-foreground/85">{snapshot.shortDescription || "—"}</span>
            </p>
            <p className="mt-2 whitespace-pre-wrap text-[12px] text-foreground/75">
              {snapshot.longDescription}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {snapshot.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-md bg-card-active px-2 py-[2px] text-[11px] text-foreground/80"
                >
                  {g}
                </span>
              ))}
              {snapshot.tags.slice(0, 12).map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-input px-2 py-[2px] text-[11px] text-muted/75"
                >
                  #{t}
                </span>
              ))}
            </div>
          </SnapshotSection>

          <SnapshotSection title={`Screenshots (${snapshot.screenshots.length})`}>
            {snapshot.screenshots.length === 0 ? (
              <p className="text-[12px] text-muted/60">No screenshots attached.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {snapshot.screenshots.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => openExternal(url)}
                    className="group relative aspect-video overflow-hidden rounded-lg border border-separator bg-card-active"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-1 right-1 rounded-md bg-overlay/80 px-1.5 py-[2px] text-[10px] font-semibold text-foreground/90">
                      #{idx}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </SnapshotSection>

          <SnapshotSection title={`Trailers (${snapshot.trailers.length})`}>
            {snapshot.trailers.length === 0 ? (
              <p className="text-[12px] text-muted/60">No trailers attached.</p>
            ) : (
              <ul className="space-y-2">
                {snapshot.trailers.map((trailer: Trailer, idx) => (
                  <li
                    key={trailer.id ?? idx}
                    className="flex items-center justify-between gap-3 rounded-lg bg-card-active/45 px-3 py-2 text-[12px]"
                  >
                    <span className="truncate text-foreground/85">
                      {trailer.provider} · #{idx} · {trailer.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => openExternal(trailer.url)}
                      className="inline-flex items-center gap-1 text-acid hover:underline"
                    >
                      Open
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SnapshotSection>

          <SnapshotSection title="Build">
            <DefList
              entries={[
                { label: "Latest build", value: snapshot.latestBuildId ?? "—" },
                { label: "Platforms", value: snapshot.platforms.join(", ") || "—" },
                { label: "Age rating", value: snapshot.ageRating || "—" },
              ]}
            />
          </SnapshotSection>

          <SnapshotSection title="Pricing">
            <DefList
              entries={[
                { label: "Base price", value: formatPrice(snapshot.basePriceCents) },
                {
                  label: "Release date",
                  value: snapshot.releaseDate ?? `Window: ${snapshot.releaseWindow}`,
                },
              ]}
            />
          </SnapshotSection>
        </div>

        <aside className="space-y-3">
          <Card className="p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-muted/55">
              <History className="h-3.5 w-3.5" />
              Submission history
            </h3>
            <div className="space-y-2">
              {(history ?? []).map((entry) => (
                <HistoryRow
                  key={entry.id}
                  entry={entry}
                  active={entry.id === submission.id}
                />
              ))}
              {(history ?? []).length === 0 && (
                <p className="text-[12px] text-muted/60">No prior submissions for this app.</p>
              )}
            </div>
          </Card>
        </aside>
      </div>

      <RejectionModal
        open={rejectionOutcome !== null}
        outcome={rejectionOutcome ?? "reject"}
        onClose={() => setRejectionOutcome(null)}
        onSubmit={onSubmitRejection}
        busy={reviewMutation.isPending}
      />
    </div>
  );
}

function SnapshotSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <h3 className="mb-3 text-[14px] font-semibold text-foreground">{title}</h3>
      {children}
    </Card>
  );
}

function DefList({ entries }: { entries: { label: string; value: string }[] }) {
  return (
    <dl className="space-y-1.5">
      {entries.map((e) => (
        <div key={e.label} className="flex items-center justify-between gap-3 text-[12px]">
          <dt className="text-muted/65">{e.label}</dt>
          <dd className="truncate font-medium text-foreground/85">{e.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function HistoryRow({ entry, active }: { entry: AppSubmission; active: boolean }) {
  return (
    <Link
      to={ROUTES.adminSubmissionDetail(entry.id)}
      className={cn(
        "block rounded-lg border p-2.5",
        active
          ? "border-acid/40 bg-acid/10"
          : "border-separator bg-card hover:bg-card-hover",
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <SubmissionStatusBadge status={entry.status} />
        <span className="text-[10px] text-muted/55">{relativeTime(entry.submittedAt)}</span>
      </div>
      {entry.decision?.summaryNote && (
        <p className="line-clamp-2 text-[11px] text-foreground/75">
          {entry.decision.summaryNote}
        </p>
      )}
    </Link>
  );
}
