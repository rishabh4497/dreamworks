import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AchievementCompletionRow } from "@/lib/types";

export function AchievementCompletionCard({ rows }: { rows: AchievementCompletionRow[] }) {
  const anyMissingPct = rows.some((r) => r.unlockedPct == null);

  return (
    <Card className="p-5">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-orange" /> Achievement completion
          </h3>
          <p className="text-[12px] text-muted/60">
            Global unlock rate per achievement.
          </p>
        </div>
        <span className="text-[12px] text-muted/65">{rows.length} achievements</span>
      </header>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-separator p-6 text-center text-[12px] text-muted/55">
          No achievements defined for this app.
        </p>
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-separator/60 bg-input/40 p-2.5"
            >
              {r.iconUrl ? (
                <img
                  src={r.iconUrl}
                  alt=""
                  className="h-8 w-8 rounded-md object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-8 w-8 rounded-md bg-card-active" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-foreground/90">{r.name}</p>
                {r.hidden && (
                  <p className="text-[10px] uppercase tracking-widest text-muted/55">Hidden</p>
                )}
              </div>
              <div className="w-32">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-input">
                  <div
                    className="h-full bg-orange/80"
                    style={{ width: `${Math.max(0, Math.min(100, r.unlockedPct ?? 0))}%` }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-[11px] tabular-nums text-muted/70">
                {r.unlockedPct == null ? "—" : `${r.unlockedPct}%`}
              </span>
            </div>
          ))}
        </div>
      )}
      {anyMissingPct && (
        <p className="mt-3 text-[10px] uppercase tracking-widest text-muted/45">
          Per-player completion telemetry not yet wired — global unlock rate from catalog used as a proxy.
        </p>
      )}
    </Card>
  );
}
