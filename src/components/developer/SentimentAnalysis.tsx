import { useState } from "react";
import { BrainCircuit, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAIAction } from "@/hooks/use-ai";
import type { SentimentAnalysisPayload } from "@/lib/ai/payload-types";

interface Props {
  gameName?: string;
  reviewExcerpts?: string[];
  totalReviewCount?: number;
}

const DEMO_EXCERPTS = [
  "Plasma rifle is the new meta — feels great.",
  "Desert biome boss is unfair for solo players, AoE is insane.",
  "Gunplay is the best in the genre right now.",
  "Sound design carries the whole campaign.",
  "Crashes when transitioning to Level 5 on 8GB systems.",
  "Patch 1.2 actually fixed the framerate, was about to refund.",
];

export function SentimentAnalysis({
  gameName = "Sample Title",
  reviewExcerpts = DEMO_EXCERPTS,
  totalReviewCount = 1420,
}: Props) {
  const mutation = useAIAction<"sentiment-analysis", SentimentAnalysisPayload>(
    "sentiment-analysis",
  );
  const result = mutation.data;
  const [hasRun, setHasRun] = useState(false);

  const onRun = () => {
    setHasRun(true);
    mutation.mutate({ gameName, reviewExcerpts, totalReviewCount });
  };

  const positivePct = result?.positivePct ?? 84;
  const negativePct = result?.negativePct ?? 12;
  const drivers = result?.drivers ?? [];
  const summary =
    result?.executiveSummary ??
    "Players are thoroughly enjoying the core loop introduced in Patch 1.2. The new Plasma Rifle has completely shifted the meta and received overwhelming praise. However, there is a growing frustration regarding the Desert Biome boss fight, which many players feel is unbalanced for solo play. It is recommended to investigate the boss's AoE damage numbers.";
  const mostPraised = result?.mostPraised ?? { topic: "Gunplay & Sound Design", mentions: 412 };
  const mostCriticized =
    result?.mostCriticized ?? { topic: "Level 4 Difficulty Spike", mentions: 184 };

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-purple-400" /> AI Sentiment Analysis
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">
            AI summary of your last {totalReviewCount.toLocaleString()} user reviews.
          </p>
        </div>
        <button
          onClick={onRun}
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-separator bg-card-active px-3 py-1.5 text-[12px] font-medium hover:bg-card-hover disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {mutation.isPending ? "Analyzing…" : hasRun ? "Refresh" : "Run AI"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-card-active border border-separator p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted/60">Overall Sentiment</p>
          <p className="text-[24px] font-bold text-green mt-1">
            {positivePct >= 60 ? "Positive" : positivePct >= 40 ? "Mixed" : "Negative"}
          </p>
          <p className="text-[12px] text-muted/70 mt-1">{positivePct}% of reviews are favorable.</p>
        </div>
        <div className="rounded-xl bg-card-active border border-separator p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted/60">Most Praised</p>
          <p className="text-[16px] font-bold text-foreground mt-1">{mostPraised.topic}</p>
          <p className="text-[12px] text-muted/70 mt-1">
            Mentioned in {mostPraised.mentions} reviews.
          </p>
        </div>
        <div className="rounded-xl bg-card-active border border-separator p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted/60">Most Criticized</p>
          <p className="text-[16px] font-bold text-red mt-1">{mostCriticized.topic}</p>
          <p className="text-[12px] text-muted/70 mt-1">
            Mentioned in {mostCriticized.mentions} reviews.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-foreground mb-3">AI Executive Summary</h3>
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 text-[13px] leading-relaxed text-foreground/80">
          <p>{summary}</p>
          {drivers.length > 0 && (
            <ul className="mt-3 list-disc pl-5 space-y-1 text-[12px] text-foreground/70">
              {drivers.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
        {mutation.error && (
          <p className="mt-2 text-[11px] text-red">{mutation.error.message}</p>
        )}
        <p className="mt-2 text-[10px] text-muted/50">
          Positive {positivePct}% · Negative {negativePct}%
        </p>
      </div>
    </Card>
  );
}
