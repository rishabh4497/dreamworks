import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useTopSellers } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Game } from "@/lib/types";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
const ROW_COUNT = 5;
const TICKER_MS = 1500;

/**
 * Deterministic FNV-1a hash for a game id — used so each game gets a stable
 * "live player count" between renders without fetching `GameDetail` for every
 * row in the list.
 */
function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Synthetic "concurrent players" derived from the sales rank plus a stable
 * per-game jitter. We avoid fetching `useGameDetail()` for each of the five
 * rows — that would trigger five separate requests just to populate this
 * widget. If/when the API gains a bulk endpoint, swap this for the real
 * `currentPlayers` field.
 */
function fakeLiveCount(game: Game): number {
  const jitter = (hashId(game.id) % 8000);
  return Math.max(1500, 250_000 - game.salesRank * 4000 + jitter);
}

interface LiveRow {
  game: Game;
  target: number;
  start: number;
}

function buildRows(games: Game[]): LiveRow[] {
  const ranked = [...games].sort((a, b) => a.salesRank - b.salesRank).slice(0, ROW_COUNT);
  return ranked.map((g) => {
    const target = fakeLiveCount(g);
    // Start ~5% below the target so the count visibly climbs on mount.
    const start = Math.round(target * 0.95);
    return { game: g, target, start };
  });
}

interface AnimatedCountProps {
  from: number;
  to: number;
}

function AnimatedCount({ from, to }: AnimatedCountProps) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    let raf = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / TICKER_MS);
      // EaseOutCubic — fast at the start, settling at the target.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [from, to]);

  return <>{value.toLocaleString()}</>;
}

/**
 * "Live right now" panel — five trending titles with animated player counts
 * that climb on mount, giving the section a Discord-style live pulse.
 */
export function TrendingLive() {
  const { data: games, isLoading } = useTopSellers();
  const navigate = useNavigate();

  const rows = useMemo(() => buildRows(games ?? []), [games]);

  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="h-[420px] animate-pulse rounded-2xl border border-separator bg-card-active/30" />
      </section>
    );
  }

  if (rows.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="rounded-2xl border border-separator bg-card/40 p-4 backdrop-blur-sm md:p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <motion.span
              aria-hidden
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="block h-2 w-2 rounded-full bg-green shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-green)_25%,transparent)]"
            />
            <h2 className="text-[16px] font-semibold text-foreground">
              Live right now
            </h2>
          </div>
          <p className="text-[11px] text-muted/70">Concurrent players, last minute</p>
        </div>

        <div className="flex flex-col gap-1.5">
          {rows.map(({ game, target, start }, idx) => (
            <motion.button
              key={game.id}
              type="button"
              onClick={() => navigate(ROUTES.gameDetail(game.id))}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.05 * idx }}
              className={cn(
                "group flex items-center gap-4 rounded-xl border border-transparent px-3 py-2.5 text-left transition-all",
                "hover:border-separator hover:bg-card-active",
              )}
            >
              <span className="w-6 shrink-0 text-center text-[24px] font-bold tracking-tight text-acid">
                {idx + 1}
              </span>

              <div className="h-[90px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-card-active">
                <img
                  src={game.capsuleUrl || game.coverUrl}
                  alt={game.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-foreground">
                  {game.name}
                </p>
                <p className="truncate text-[11px] text-muted/70">
                  {game.developer}
                </p>
              </div>

              <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                <div className="flex items-center gap-1.5">
                  <motion.span
                    aria-hidden
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: idx * 0.15,
                    }}
                    className="block h-1.5 w-1.5 rounded-full bg-green"
                  />
                  <motion.span
                    className="font-mono text-[13px] font-semibold tabular-nums text-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <AnimatedCount from={start} to={target} />
                  </motion.span>
                  <span className="text-[11px] text-muted/70">playing</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
