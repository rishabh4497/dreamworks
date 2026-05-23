import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useRejectionReasons, resolveLabel } from "@/hooks/use-config";
import { cn } from "@/lib/utils";
import type {
  SubmissionAssetComment,
  SubmissionAssetField,
  SubmissionRejectionReason,
} from "@/lib/types";

export type RejectionOutcome = "reject" | "request_changes";

export interface RejectionPayload {
  outcome: RejectionOutcome;
  summaryNote: string;
  reasons: SubmissionRejectionReason[];
  assetComments: SubmissionAssetComment[];
}

interface RejectionModalProps {
  open: boolean;
  onClose: () => void;
  outcome: RejectionOutcome;
  onSubmit: (payload: RejectionPayload) => Promise<void> | void;
  busy?: boolean;
}

export function RejectionModal({ open, onClose, outcome, onSubmit, busy }: RejectionModalProps) {
  const [reasons, setReasons] = useState<Set<SubmissionRejectionReason>>(new Set());
  const [summary, setSummary] = useState("");
  const [comments, setComments] = useState<SubmissionAssetComment[]>([]);
  const [draftField, setDraftField] = useState<SubmissionAssetField>("screenshots");
  const [draftIndex, setDraftIndex] = useState<string>("");
  const [draftComment, setDraftComment] = useState("");

  const { data: rejectionConfig } = useRejectionReasons();
  const categoryGroups = rejectionConfig?.categoryGroups ?? [];
  const assetFields = rejectionConfig?.assetFields ?? [];

  const title = outcome === "reject" ? "Reject submission" : "Request changes";
  const submitLabel =
    outcome === "reject" ? "Reject submission" : "Send change requests";
  const canSubmit = useMemo(
    () => summary.trim().length > 0 && (reasons.size > 0 || comments.length > 0),
    [summary, reasons, comments],
  );

  const toggle = (reason: SubmissionRejectionReason) => {
    setReasons((curr) => {
      const next = new Set(curr);
      if (next.has(reason)) next.delete(reason);
      else next.add(reason);
      return next;
    });
  };

  const addComment = () => {
    const trimmed = draftComment.trim();
    if (!trimmed) return;
    const next: SubmissionAssetComment = {
      field: draftField,
      comment: trimmed,
      index: draftIndex !== "" ? Number(draftIndex) : undefined,
    };
    setComments((curr) => [...curr, next]);
    setDraftComment("");
    setDraftIndex("");
  };

  const reset = () => {
    setReasons(new Set());
    setSummary("");
    setComments([]);
    setDraftComment("");
    setDraftIndex("");
    setDraftField("screenshots");
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;
    await onSubmit({
      outcome,
      summaryNote: summary.trim(),
      reasons: Array.from(reasons),
      assetComments: comments,
    });
    reset();
  };

  return (
    <Modal open={open} onClose={handleClose} title={title} maxWidth="max-w-3xl">
      <div className="space-y-5">
        <section className="space-y-2">
          <h3 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
            Failure categories
          </h3>
          <div className="space-y-3">
            {categoryGroups.map((group) => (
              <div key={group.id}>
                <p className="mb-1.5 text-[11px] font-semibold text-foreground/80">
                  {resolveLabel(group.label)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.reasons.map((item) => {
                    const value = item.id as SubmissionRejectionReason;
                    const active = reasons.has(value);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggle(value)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all",
                          active
                            ? "border-red/40 bg-red/15 text-red"
                            : "border-separator bg-card text-muted hover:bg-card-hover hover:text-foreground/80",
                        )}
                      >
                        {resolveLabel(item.label)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
            Per-asset comments
          </h3>
          <div className="space-y-2">
            {comments.map((c, idx) => (
              <div
                key={`${c.field}-${c.index ?? "x"}-${idx}`}
                className="flex items-start gap-2 rounded-xl bg-card-active/45 px-3 py-2 text-[12px]"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground/90">
                    {(() => {
                      const f = assetFields.find((af) => af.id === c.field);
                      return f ? resolveLabel(f.label) : c.field;
                    })()}
                    {c.index !== undefined && (
                      <span className="text-muted/55"> · #{c.index}</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-foreground/75">{c.comment}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setComments((curr) => curr.filter((_, i) => i !== idx))}
                  className="rounded-md p-1 text-muted/50 hover:bg-input hover:text-red"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-[140px_70px_minmax(0,1fr)_auto]">
              <select
                value={draftField}
                onChange={(event) => setDraftField(event.target.value as SubmissionAssetField)}
                className="h-8 rounded-lg border border-separator bg-input px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-acid/15"
              >
                {assetFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {resolveLabel(f.label)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Idx"
                value={draftIndex}
                onChange={(event) => setDraftIndex(event.target.value)}
                className="h-8 rounded-lg border border-separator bg-input px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-acid/15"
              />
              <input
                type="text"
                placeholder="Comment on this asset"
                value={draftComment}
                onChange={(event) => setDraftComment(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addComment();
                  }
                }}
                className="h-8 rounded-lg border border-separator bg-input px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-acid/15"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addComment}
                disabled={!draftComment.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
            Summary note (shared with the developer)
          </h3>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="min-h-28 w-full rounded-xl border border-separator bg-input px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
            placeholder="Explain the decision and what the developer should change before resubmitting."
          />
        </section>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={outcome === "reject" ? "danger" : "secondary"}
            onClick={handleSubmit}
            disabled={!canSubmit || busy}
          >
            {busy ? "Working…" : submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
