import { useMemo } from "react";
import { Trophy, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface AchievementRow {
  gameId: string;
  name: string;
  capsuleUrl: string;
  achievementsTotal: number;
  achievementsUnlocked: number;
  completionPct: number;
  remaining: number;
  almostDone: boolean;
}

/**
 * Profile widget: surfaces games where the user is closest to 100% achievement
 * completion. Pure derived view — no extra fetches; reads from existing library
 * + games stores.
 */
export function AchievementProgress() {
  const entries = useLibraryStore((s) => s.entries);
  const { data: games } = useGames();

  const rows = useMemo<AchievementRow[]>(() => {
    if (!games) return [];
    const byId = new Map(games.map((g) => [g.id, g]));
    const candidates: AchievementRow[] = [];
    for (const entry of entries) {
      const game = byId.get(entry.gameId);
      if (!game || !game.achievementCount) continue;
      const total = game.achievementCount;
      const unlocked = Math.min(entry.achievementsUnlocked ?? 0, total);
      if (unlocked === 0 || unlocked === total) continue; // skip not-started or already 100%
      const pct = (unlocked / total) * 100;
      const remaining = total - unlocked;
      candidates.push({
        gameId: entry.gameId,
        name: game.name,
        capsuleUrl: game.capsuleUrl,
        achievementsTotal: total,
        achievementsUnlocked: unlocked,
        completionPct: pct,
        remaining,
        almostDone: pct >= 80,
      });
    }
    return candidates.sort((a, b) => b.completionPct - a.completionPct).slice(0, 6);
  }, [entries, games]);

  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-separator bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-acid" />
        <h2 className="text-[14px] font-semibold text-foreground">Closest to 100%</h2>
        <span className="rounded-full bg-acid/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-acid">
          {rows.length}
        </span>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.gameId}>
            <Link
              to={ROUTES.libraryGame(r.gameId)}
              className="flex items-center gap-3 rounded-xl border border-separator bg-card-active/30 px-3 py-2 transition-colors hover:border-acid/30 hover:bg-card-active"
            >
              <img
                loading="lazy"
                decoding="async"
                src={r.capsuleUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="h-10 w-16 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[13px] font-semibold text-foreground">{r.name}</p>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] font-bold tabular-nums",
                      r.almostDone ? "text-acid" : "text-muted/80",
                    )}
                  >
                    {Math.round(r.completionPct)}%
                  </span>
                </div>
                <p className="text-[11px] text-muted/70">
                  {r.achievementsUnlocked} / {r.achievementsTotal} unlocked · {r.remaining}{" "}
                  to go
                </p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-background/50">
                  <div
                    className={cn(
                      "h-full transition-all",
                      r.almostDone ? "bg-acid" : "bg-foreground/30",
                    )}
                    style={{ width: `${r.completionPct}%` }}
                  />
                </div>
              </div>
              {r.almostDone && <Target className="h-4 w-4 shrink-0 text-acid" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
