import type { ReviewSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RatingBarProps {
  summary: ReviewSummary;
  showCount?: boolean;
  className?: string;
}

function colorForScore(pct: number): string {
  if (pct >= 90) return "text-positive";
  if (pct >= 80) return "text-positive";
  if (pct >= 70) return "text-positive/80";
  if (pct >= 40) return "text-orange";
  return "text-red";
}

export function RatingBar({ summary, showCount = true, className }: RatingBarProps) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("text-[12px] font-semibold", colorForScore(summary.scorePct))}>
        {summary.label}
      </span>
      {showCount && (
        <span className="text-[11px] text-muted/60">
          ({summary.totalReviews.toLocaleString()})
        </span>
      )}
    </div>
  );
}
