import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { compactNumber } from "@/lib/utils";
import type { ReviewLabelBreakdown } from "@/lib/types";

const COLOR: Record<string, string> = {
  "Very Positive": "bg-green",
  Positive: "bg-cyan",
  Mixed: "bg-orange",
  Negative: "bg-red/80",
  "Very Negative": "bg-red",
  Overwhelmingly Positive: "bg-green",
  Overwhelmingly Negative: "bg-red",
};

export function ReviewBreakdownCard({ rows }: { rows: ReviewLabelBreakdown[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <Card className="p-5">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <MessageSquare className="h-4 w-4 text-cyan" /> Review sentiment
          </h3>
          <p className="text-[12px] text-muted/60">
            Reviews bucketed by label. Mix shifts as new reviews land.
          </p>
        </div>
        <span className="text-[18px] font-semibold tabular-nums text-foreground">
          {compactNumber(total)}
        </span>
      </header>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-separator p-6 text-center text-[12px] text-muted/55">
          No reviews yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex items-center justify-between text-[11px] font-medium">
                <span className="text-foreground/85">{r.label}</span>
                <span className="text-muted/65">
                  {compactNumber(r.count)} · {r.pct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-input">
                <div
                  className={`h-full ${COLOR[r.label] ?? "bg-muted/40"}`}
                  style={{ width: `${r.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
