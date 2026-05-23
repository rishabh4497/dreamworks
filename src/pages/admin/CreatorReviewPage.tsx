import { useEffect, useState } from "react";
import { Briefcase, Building, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { SubmissionStatusBadge } from "@/components/admin/SubmissionStatusBadge";
import {
  useCreatorSubmissionQueue,
  useReviewPublisher,
  useReviewStudio,
} from "@/hooks/use-admin";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import type { CreatorProfileSubmission, CreatorSubmissionType } from "@/lib/types";

interface CreatorReviewPageProps {
  type: CreatorSubmissionType;
}

export function CreatorReviewPage({ type }: CreatorReviewPageProps) {
  const { data, isLoading, error } = useCreatorSubmissionQueue(type, "pending");
  const reviewPublisher = useReviewPublisher();
  const reviewStudio = useReviewStudio();
  const reviewMutation = type === "publisher" ? reviewPublisher : reviewStudio;
  const [selectedId, setSelectedId] = useState<string>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    setSelectedId(data?.[0]?.id ?? "");
  }, [data?.[0]?.id]);

  const selected = data?.find((d) => d.id === selectedId);
  const label = type === "publisher" ? "Publisher" : "Studio";
  const Icon = type === "publisher" ? Briefcase : Building;

  const decide = async (outcome: "approve" | "reject") => {
    if (!selected) return;
    try {
      await reviewMutation.mutateAsync({
        submissionId: selected.id,
        outcome,
        summaryNote: note || (outcome === "approve" ? "Approved." : "Rejected."),
      });
      toast.success(outcome === "approve" ? "Approved." : "Rejected.");
      setNote("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Decision failed.");
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-[16px] font-semibold text-foreground">{label} review</h2>
        <p className="text-[12px] text-muted/60">
          Approve or reject pending {label.toLowerCase()} profile claims.
        </p>
      </header>

      {isLoading ? (
        <Card className="p-6 text-[13px] text-muted/65">Loading queue…</Card>
      ) : error ? (
        <Card className="p-6 text-[13px] text-red">
          <p className="font-semibold">Failed to load queue.</p>
          <p className="mt-1 break-all text-[12px] text-red/85">
            {(error as Error).message}
          </p>
        </Card>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Icon}
          title="No pending claims"
          description={`No ${label.toLowerCase()} profile claims awaiting review.`}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          <div className="space-y-2">
            {data.map((entry) => (
              <CreatorRow
                key={entry.id}
                entry={entry}
                active={selectedId === entry.id}
                onSelect={() => setSelectedId(entry.id)}
              />
            ))}
          </div>
          {selected ? (
            <Card className="p-5">
              <div className="mb-4 flex items-start gap-3">
                {(selected.profileSnapshot as any).logoUrl ? (
                  <img
                    src={(selected.profileSnapshot as any).logoUrl}
                    alt=""
                    className="h-16 w-16 rounded-lg bg-card-active object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-card-active" />
                )}
                <div className="flex-1">
                  <SubmissionStatusBadge status={selected.status} />
                  <h3 className="mt-1 text-[16px] font-semibold text-foreground">
                    {(selected.profileSnapshot as any).name}
                  </h3>
                  <p className="text-[12px] text-muted/65">
                    {(selected.profileSnapshot as any).tagline}
                  </p>
                  <p className="mt-1 text-[11px] text-muted/55">
                    Submitted by{" "}
                    <span className="text-foreground/80">
                      {selected.submitterEmail || selected.submitterUserId}
                    </span>
                  </p>
                </div>
              </div>

              {(selected.profileSnapshot as any).about && (
                <section className="mb-4">
                  <h4 className="mb-1 text-[12px] font-semibold uppercase tracking-widest text-muted/55">
                    About
                  </h4>
                  <p className="whitespace-pre-wrap text-[13px] text-foreground/85">
                    {(selected.profileSnapshot as any).about}
                  </p>
                </section>
              )}

              <section className="mb-4">
                <h4 className="mb-1 text-[12px] font-semibold uppercase tracking-widest text-muted/55">
                  Decision note
                </h4>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional note shared with the submitter."
                  className="min-h-24 w-full rounded-xl border border-separator bg-input px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
                />
              </section>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="danger"
                  onClick={() => decide("reject")}
                  disabled={reviewMutation.isPending}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="success"
                  onClick={() => decide("approve")}
                  disabled={reviewMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-[13px] text-muted/65">
              Select a {label.toLowerCase()} to review.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function CreatorRow({
  entry,
  active,
  onSelect,
}: {
  entry: CreatorProfileSubmission;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-colors",
        active
          ? "border-acid/40 bg-acid/10"
          : "border-separator bg-card hover:bg-card-hover",
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <SubmissionStatusBadge status={entry.status} />
        <span className="text-[10px] text-muted/55">{entry.submittedAt?.slice(0, 10)}</span>
      </div>
      <p className="truncate text-[13px] font-semibold text-foreground">
        {(entry.profileSnapshot as any).name}
      </p>
      <p className="truncate text-[11px] text-muted/65">{entry.submitterEmail}</p>
    </button>
  );
}

export function PublisherReviewPage() {
  return <CreatorReviewPage type="publisher" />;
}

export function StudioReviewPage() {
  return <CreatorReviewPage type="developer" />;
}
