import { Loader2, Sparkles } from "lucide-react";
import { useAIAction } from "@/hooks/use-ai";
import type { ReviewExtractorPayload } from "@/lib/ai/payload-types";

interface Props {
  gameName?: string;
  reviewExcerpts?: string[];
}

const DEMO_REVIEWS = [
  "Frame drops in level 4 ruin the boss fight.",
  "Multiplayer disconnects every other match.",
  "The soundtrack is incredible — buying the OST.",
  "Combat is fluid and satisfying.",
  "Levels 4 framerate is choppy.",
  "Music keeps me playing.",
  "Hit-feedback is god-tier.",
];

export function ReviewExtractor({
  gameName = "Sample Title",
  reviewExcerpts = DEMO_REVIEWS,
}: Props) {
  const mutation = useAIAction<"review-extractor", ReviewExtractorPayload>("review-extractor");
  const r = mutation.data;
  const complaints =
    r?.topComplaints ?? [
      { text: "Frame drops in level 4", sharePct: 12 },
      { text: "Multiplayer disconnects", sharePct: 8 },
    ];
  const praises =
    r?.topPraises ?? [
      { text: "Amazing soundtrack", sharePct: 34 },
      { text: "Fluid combat mechanics", sharePct: 28 },
    ];

  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow" /> AI Review Extractor
        </h3>
        <button
          onClick={() => mutation.mutate({ gameName, reviewExcerpts })}
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-separator bg-card-active px-3 py-1.5 text-[11px] font-medium hover:bg-card-hover disabled:opacity-50"
        >
          {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {mutation.isPending ? "Extracting…" : r ? "Refresh" : "Run AI"}
        </button>
      </div>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">
        Analyzes {reviewExcerpts.length.toLocaleString()}+ text reviews and outputs top complaints
        and praises.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red/5 border border-red/20 rounded-lg p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red mb-2">
            Top Complaints
          </p>
          {complaints.map((c, i) => (
            <p key={i} className="text-[12px] text-foreground">
              • {c.text} ({c.sharePct}% of negative)
            </p>
          ))}
        </div>
        <div className="bg-positive/5 border border-positive/20 rounded-lg p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-positive mb-2">
            Top Praises
          </p>
          {praises.map((p, i) => (
            <p key={i} className="text-[12px] text-foreground">
              • {p.text} ({p.sharePct}% of positive)
            </p>
          ))}
        </div>
      </div>
      {mutation.error && (
        <p className="mt-2 text-[11px] text-red">{mutation.error.message}</p>
      )}
    </div>
  );
}
