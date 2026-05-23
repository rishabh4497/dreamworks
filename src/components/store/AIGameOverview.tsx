import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useGameReviews } from "@/hooks/use-reviews";
import { useAIGameOverview } from "@/hooks/use-ai";
import type { GameDetail, AIOverview } from "@/lib/types";
import { compactNumber, relativeDate } from "@/lib/utils";

interface AIGameOverviewProps {
  gameDetail: GameDetail;
}

export function AIGameOverview({ gameDetail }: AIGameOverviewProps) {
  const reviewsQuery = useGameReviews(gameDetail.id);

  const payload = useMemo(() => {
    if (!reviewsQuery.data || reviewsQuery.data.length === 0) return null;
    const excerpts = reviewsQuery.data
      .slice(0, 25)
      .map((r) => r.body)
      .filter((s): s is string => typeof s === "string" && s.length > 0);
    if (excerpts.length === 0) return null;
    return {
      gameName: gameDetail.name,
      studio: gameDetail.developer,
      genres: gameDetail.storeTags?.slice(0, 5).map((t) => t.name) ?? [],
      releaseYear: gameDetail.releaseDate
        ? new Date(gameDetail.releaseDate).getFullYear()
        : undefined,
      reviewExcerpts: excerpts,
      totalReviewCount: reviewsQuery.data.length,
    };
  }, [gameDetail, reviewsQuery.data]);

  const aiQuery = useAIGameOverview(payload);

  // Fallback to baked-in detail.aiOverview if Gemini fails (dev/offline).
  const overview: AIOverview | null = aiQuery.data
    ? {
        ...aiQuery.data,
        basedOnReviewCount: reviewsQuery.data?.length ?? aiQuery.data.basedOnReviewCount,
      }
    : aiQuery.error
      ? (gameDetail.aiOverview ?? null)
      : null;

  if (aiQuery.isLoading || reviewsQuery.isLoading) {
    return <Skeleton />;
  }

  if (!overview) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mt-10 rounded-2xl border border-acid/20 bg-card overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 border-b border-separator px-5 py-3 bg-gradient-to-r from-acid/10 via-transparent to-transparent">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-acid" />
          <h3 className="text-[14px] font-semibold text-foreground">Dreamworks AI overview</h3>
          <span className="rounded-full border border-acid/30 bg-acid/10 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-widest text-acid">
            Beta
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6 px-5 py-4">
        <div className="flex-1 space-y-3">
          <h4 className="text-[12px] font-semibold text-foreground">Customers say pros:</h4>
          <ul className="space-y-2">
            {overview.pros.map((p, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-[13px] leading-relaxed text-foreground/80"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#10b981]" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 space-y-3">
          <h4 className="text-[12px] font-semibold text-foreground">Customers say cons:</h4>
          <ul className="space-y-2">
            {overview.cons.map((c, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-[13px] leading-relaxed text-foreground/80"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-separator px-5 py-2.5">
        <p className="text-[10.5px] text-muted/55">
          Generated from {compactNumber(overview.basedOnReviewCount)} reviews · Updated{" "}
          {relativeDate(overview.updatedAt)}
          <span className="ml-2 opacity-60">
            · Not a replacement for {gameDetail.name}'s own description below.
          </span>
        </p>
      </div>
    </motion.section>
  );
}

function Skeleton() {
  return (
    <div className="mt-10 rounded-2xl border border-acid/20 bg-card overflow-hidden animate-pulse">
      <div className="border-b border-separator px-5 py-3 h-10" />
      <div className="px-5 py-4 space-y-3">
        <div className="h-3 w-24 bg-card-active rounded" />
        <div className="h-3 w-3/4 bg-card-active rounded" />
        <div className="h-3 w-1/2 bg-card-active rounded" />
      </div>
    </div>
  );
}
