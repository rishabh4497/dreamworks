import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, TrendingUp } from "lucide-react";
import type { Game } from "@/lib/types";
import { useGames, useTopSellers } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import { gameAccent } from "@/lib/game-accents";
import { formatPrice } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

/**
 * Three tall, vivid game spotlights pulled from the top sellers — each
 * tinted in its own brand color with a pulsing glow, so the page reads
 * as colorful storefront art instead of a grid of tiles.
 */
export function TodaysSpotlights() {
  const { data: games } = useGames();
  const { data: topSellers } = useTopSellers(8);

  const picks = useMemo<Game[]>(() => {
    const pool = topSellers && topSellers.length > 0 ? topSellers : (games ?? []);
    return pool.slice(0, 3);
  }, [topSellers, games]);

  if (picks.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-acid" />
          <h2 className="text-[16px] font-bold text-foreground">Today's spotlights</h2>
        </div>
        <Link to={ROUTES.storeSearch} className="text-[11px] font-semibold text-acid hover:underline">
          See all →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {picks.map((g, idx) => (
          <SpotlightCard key={g.id} game={g} index={idx} />
        ))}
      </div>
    </section>
  );
}

function SpotlightCard({ game, index }: { game: Game; index: number }) {
  const accent = gameAccent(game.id) ?? "var(--color-positive)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: 0.06 * index }}
      whileHover={{ y: -4 }}
    >
      <Link
        to={ROUTES.gameDetail(game.id)}
        className="group relative block h-[360px] overflow-hidden rounded-2xl border border-white/10"
        style={{ boxShadow: `0 0 0 1px ${accent}33` }}
      >
        <img
          src={game.headerUrl || game.coverUrl}
          alt={game.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${accent}99 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{ backgroundImage: `linear-gradient(160deg, ${accent}55 0%, transparent 55%)` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-background"
              style={{ background: accent }}
            >
              <Sparkles className="h-2 w-2" />
              Top pick
            </span>
            {game.genres[0] && (
              <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-widest text-foreground/85 backdrop-blur-md">
                {game.genres[0]}
              </span>
            )}
          </div>

          <h3
            className="text-[26px] font-extrabold leading-tight text-foreground drop-shadow-lg"
            style={{ textShadow: `0 4px 18px ${accent}66, 0 2px 6px rgba(0,0,0,0.5)` }}
          >
            {game.name}
          </h3>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {game.price.discountPct > 0 && (
                <span className="rounded-md bg-discount-bg px-1.5 py-0.5 text-[11px] font-bold text-discount-fg">
                  -{game.price.discountPct}%
                </span>
              )}
              <span className="text-[15px] font-bold text-foreground">
                {game.price.isFree
                  ? "Free"
                  : formatPrice(game.price.final, game.price.currency)}
              </span>
            </div>
            <span
              className="text-[12px] font-semibold transition-all group-hover:translate-x-1"
              style={{ color: accent }}
            >
              View →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
