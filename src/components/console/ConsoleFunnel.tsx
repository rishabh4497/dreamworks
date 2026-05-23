import { compactNumber } from "@/lib/utils";

interface Stage {
  stage: string;
  count: number;
  pct: number;
}

interface Props {
  stages: Stage[];
}

export function ConsoleFunnel({ stages }: Props) {
  if (stages.length === 0) {
    return (
      <p className="py-6 text-center text-[12px] text-muted/55">No funnel data yet</p>
    );
  }
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const width = Math.max(8, Math.round((s.count / max) * 100));
        const drop =
          i === 0
            ? null
            : stages[i - 1].count === 0
              ? 0
              : Math.round(
                  ((stages[i - 1].count - s.count) / stages[i - 1].count) * 100,
                );
        return (
          <div key={s.stage} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-[12px]">
              <span className="truncate text-foreground/85">{s.stage}</span>
              <span className="shrink-0 tabular-nums text-muted/70">
                {compactNumber(s.count)}
                <span className="ml-2 text-muted/50">{s.pct}%</span>
                {drop !== null && drop > 0 && (
                  <span className="ml-2 text-red/80">−{drop}%</span>
                )}
              </span>
            </div>
            <div className="h-3 rounded-full bg-card-active overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-acid/80 to-cyan/80"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
