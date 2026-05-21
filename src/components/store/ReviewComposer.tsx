import { useEffect, useMemo, useState } from "react";
import { ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useLibraryStore } from "@/stores/library-store";
import { useUserReviewsStore } from "@/stores/user-reviews-store";
import { toast } from "@/stores/toast-store";
import type { GameId, ReviewFacets } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ReviewComposerProps {
  open: boolean;
  onClose: () => void;
  gameId: GameId;
  gameName: string;
}

const FACET_LABELS: { key: keyof ReviewFacets; label: string }[] = [
  { key: "gameplay", label: "Gameplay" },
  { key: "story", label: "Story" },
  { key: "polish", label: "Polish" },
  { key: "value", label: "Value" },
  { key: "accessibility", label: "Accessibility" },
];

const DEFAULT_FACETS: ReviewFacets = {
  gameplay: 4,
  story: 4,
  polish: 4,
  value: 4,
  accessibility: 4,
};

const MIN_BODY = 10;
const MAX_BODY = 4000;

export function ReviewComposer({ open, onClose, gameId, gameName }: ReviewComposerProps) {
  const profile = useAuthStore((s) => s.profile);
  const entry = useLibraryStore((s) => s.entries.find((e) => e.gameId === gameId));
  const existing = useUserReviewsStore((s) => s.byGame[gameId]);
  const upsert = useUserReviewsStore((s) => s.upsert);
  const remove = useUserReviewsStore((s) => s.remove);

  const isEdit = !!existing;
  const [recommended, setRecommended] = useState(existing?.recommended ?? true);
  const [body, setBody] = useState(existing?.body ?? "");
  const [includeFacets, setIncludeFacets] = useState(!!existing?.facets);
  const [facets, setFacets] = useState<ReviewFacets>(existing?.facets ?? DEFAULT_FACETS);

  // Reset state whenever the modal reopens for a different game / state.
  useEffect(() => {
    if (open) {
      setRecommended(existing?.recommended ?? true);
      setBody(existing?.body ?? "");
      setIncludeFacets(!!existing?.facets);
      setFacets(existing?.facets ?? DEFAULT_FACETS);
    }
  }, [open, existing]);

  const error = useMemo(() => {
    if (body.trim().length < MIN_BODY) return `At least ${MIN_BODY} characters.`;
    if (body.length > MAX_BODY) return `Maximum ${MAX_BODY} characters.`;
    return null;
  }, [body]);

  if (!profile) return null;

  const submit = () => {
    if (error) return;
    const hours = entry ? Math.round((entry.playMinutes / 60) * 10) / 10 : 0;
    upsert(
      gameId,
      {
        uid: profile.uid,
        name: profile.displayName,
        avatarUrl: profile.avatarUrl,
        hoursPlayed: hours,
      },
      {
        recommended,
        body: body.trim(),
        facets: includeFacets ? facets : undefined,
      },
    );
    toast.success(isEdit ? "Review updated" : "Review posted");
    onClose();
  };

  const onDelete = () => {
    remove(gameId);
    toast.info("Review removed");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit your review" : `Review ${gameName}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Recommend toggle */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted/60">
            Do you recommend this game?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRecommended(true)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-semibold transition-colors",
                recommended
                  ? "border-positive bg-positive/15 text-positive"
                  : "border-separator bg-card text-muted/70 hover:bg-card-hover",
              )}
            >
              <ThumbsUp className="h-4 w-4" /> Yes
            </button>
            <button
              type="button"
              onClick={() => setRecommended(false)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-semibold transition-colors",
                !recommended
                  ? "border-red bg-red/15 text-red"
                  : "border-separator bg-card text-muted/70 hover:bg-card-hover",
              )}
            >
              <ThumbsDown className="h-4 w-4" /> No
            </button>
          </div>
        </div>

        {/* Body */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted/60">
              Your review
            </p>
            <p
              className={cn(
                "text-[10px] tabular-nums",
                body.length > MAX_BODY ? "text-red" : "text-muted/50",
              )}
            >
              {body.length} / {MAX_BODY}
            </p>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`What did you think of ${gameName}? Spoilers will be auto-hidden.`}
            rows={6}
            className="w-full resize-y rounded-xl border border-separator bg-input px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid focus:outline-none"
          />
          {error && body.length > 0 && (
            <p className="mt-1 text-[10.5px] text-red">{error}</p>
          )}
        </div>

        {/* Facets toggle */}
        <div>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-foreground/80">
            <input
              type="checkbox"
              checked={includeFacets}
              onChange={(e) => setIncludeFacets(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-separator bg-input text-acid focus:ring-acid"
            />
            Add facet ratings (gameplay / story / polish / value / accessibility)
          </label>

          {includeFacets && (
            <div className="mt-3 space-y-2 rounded-xl border border-separator bg-card-active/40 p-3">
              {FACET_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-28 shrink-0 text-[11.5px] font-medium text-foreground/75">
                    {label}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={facets[key]}
                    onChange={(e) =>
                      setFacets({ ...facets, [key]: parseInt(e.target.value, 10) })
                    }
                    className="flex-1 accent-acid"
                  />
                  <span className="w-6 shrink-0 text-right text-[11.5px] font-semibold tabular-nums text-acid">
                    {facets[key]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-separator pt-4">
          {isEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="!text-red hover:!bg-red/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={submit} disabled={!!error}>
              {isEdit ? "Update review" : "Post review"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
