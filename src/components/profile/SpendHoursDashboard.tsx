import { useMemo } from "react";
import { motion } from "motion/react";
import { useGames } from "@/hooks/use-games";
import { useLibraryStore } from "@/stores/library-store";
import { cn, formatHours, formatPrice } from "@/lib/utils";
import type { Game, LibraryEntry } from "@/lib/types";

interface PricedEntry {
  game: Game;
  entry: LibraryEntry;
  /** What the user paid for this game, in paise. */
  pricePaise: number;
  /** Effective hours played, floored at 1 to avoid division blowups. */
  hours: number;
  /** Rupees per hour (lower = better value). */
  ratio: number;
}

export function SpendHoursDashboard() {
  const { data: games } = useGames();
  const entries = useLibraryStore((s) => s.entries);

  const { totalSpentPaise, totalMinutes, bestValue, worstValue, topFive } = useMemo(() => {
    const gamesById = new Map((games ?? []).map((g) => [g.id, g] as const));

    const ownedWithPrice: PricedEntry[] = [];
    for (const entry of entries) {
      const game = gamesById.get(entry.gameId);
      if (!game || game.price.isFree) continue;
      const pricePaise = game.price.final;
      const hours = Math.max(entry.playMinutes / 60, 1);
      const rupees = pricePaise / 100;
      ownedWithPrice.push({
        game,
        entry,
        pricePaise,
        hours,
        ratio: rupees / hours,
      });
    }

    const totalSpentPaise = ownedWithPrice.reduce((s, x) => s + x.pricePaise, 0);
    const totalMinutes = entries.reduce((s, e) => s + e.playMinutes, 0);

    const sorted = [...ownedWithPrice].sort((a, b) => a.ratio - b.ratio);
    return {
      totalSpentPaise,
      totalMinutes,
      bestValue: sorted[0],
      worstValue: sorted[sorted.length - 1],
      topFive: sorted.slice(0, 5),
    };
  }, [games, entries]);

  if (!games || entries.length === 0) return null;

  const bestBarWidth = topFive[0] ? 1 / topFive[0].ratio : 1;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-8"
    >
      <div className="rounded-xl border border-separator bg-card p-5">
        <div className="mb-4">
          <h2 className="text-[14px] font-semibold text-foreground">Your spend & hours</h2>
          <p className="mt-0.5 text-[11px] text-muted/60">
            Steam-style economy at a glance.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile
            label="Total spent"
            value={formatPrice(totalSpentPaise)}
            sub={`${entries.length} game${entries.length === 1 ? "" : "s"}`}
          />
          <Tile
            label="Time played"
            value={formatHours(totalMinutes)}
            sub="Across your library"
          />
          <Tile
            label="Best value game"
            value={
              bestValue
                ? `${formatPrice(Math.round(bestValue.ratio * 100))} / hr`
                : "—"
            }
            sub={bestValue?.game.name ?? "Play more to unlock"}
            tone="positive"
          />
          <Tile
            label="Worst value"
            value={
              worstValue
                ? `${formatPrice(Math.round(worstValue.ratio * 100))} / hr`
                : "—"
            }
            sub={worstValue?.game.name ?? "Play more to unlock"}
            tone="negative"
          />
        </div>

        {topFive.length > 0 && (
          <div className="mt-5 border-t border-separator pt-4">
            <p className="mb-3 text-[11px] uppercase tracking-widest text-muted/50">
              Top 5 best value
            </p>
            <div className="flex flex-col gap-2.5">
              {topFive.map((row) => {
                // Lower ratio = better value = longer bar.
                const inverse = 1 / row.ratio;
                const pct = Math.max(6, Math.round((inverse / bestBarWidth) * 100));
                return (
                  <div key={row.game.id} className="flex items-center gap-3">
                    <p className="w-32 shrink-0 truncate text-[12px] font-medium text-foreground/80">
                      {row.game.name}
                    </p>
                    <div className="relative flex-1">
                      <div className="h-2.5 rounded-full bg-input">
                        <div
                          className="h-2.5 rounded-full bg-gradient-to-r from-positive to-acid"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <p className="shrink-0 text-right text-[11px] tabular-nums text-muted/70">
                      {formatPrice(Math.round(row.ratio * 100))}/hr ·{" "}
                      {Math.round(row.hours)}h · {formatPrice(row.pricePaise)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

interface TileProps {
  label: string;
  value: string;
  sub?: string;
  tone?: "positive" | "negative" | "muted";
}

function Tile({ label, value, sub, tone = "muted" }: TileProps) {
  return (
    <div className="rounded-xl border border-separator bg-card-active/40 p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted/50">{label}</p>
      <p className="mt-1 text-[20px] font-semibold tabular-nums text-foreground">{value}</p>
      {sub && (
        <p
          className={cn(
            "mt-1 truncate text-[11px]",
            tone === "positive" && "text-positive",
            tone === "negative" && "text-red",
            tone === "muted" && "text-muted/60",
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
