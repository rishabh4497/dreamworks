import type { ReviewFacets } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FacetBarsProps {
  facets: ReviewFacets;
}

const FACETS: Array<{ key: keyof ReviewFacets; label: string }> = [
  { key: "gameplay", label: "Gameplay" },
  { key: "story", label: "Story" },
  { key: "polish", label: "Polish" },
  { key: "value", label: "Value" },
  { key: "accessibility", label: "Access" },
];

function colorFor(score: number): string {
  if (score < 4) return "bg-red";
  if (score < 7) return "bg-orange";
  return "bg-positive";
}

export function FacetBars({ facets }: FacetBarsProps) {
  return (
    <div className="mt-3 grid grid-cols-5 gap-2">
      {FACETS.map((f) => {
        const score = facets[f.key];
        const pct = Math.max(0, Math.min(100, (score / 10) * 100));
        return (
          <div key={f.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] uppercase tracking-wider text-muted/60">{f.label}</span>
              <span className="text-[9px] font-semibold text-foreground/70">
                {score.toFixed(1)}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-card-active">
              <div
                className={cn("h-full rounded-full", colorFor(score))}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
