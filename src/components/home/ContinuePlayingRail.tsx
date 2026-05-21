import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import { relativeDate } from "@/lib/utils";
import type { Game, LibraryEntry } from "@/lib/types";

interface RecentTile {
  entry: LibraryEntry;
  game: Game;
}

const MAX_TILES = 6;

/**
 * Horizontal rail of the user's most recently played library entries. Renders
 * nothing when the library has no `lastPlayed` rows — a brand new user simply
 * doesn't see this section.
 */
export function ContinuePlayingRail() {
  const entries = useLibraryStore((s) => s.entries);
  const { data: games } = useGames();
  const navigate = useNavigate();

  const tiles = useMemo<RecentTile[]>(() => {
    if (!games) return [];
    const byId = new Map(games.map((g) => [g.id, g]));
    const out: RecentTile[] = [];
    const ordered = entries
      .filter((e) => !!e.lastPlayed)
      .sort(
        (a, b) =>
          new Date(b.lastPlayed as string).getTime() -
          new Date(a.lastPlayed as string).getTime(),
      );
    for (const entry of ordered) {
      const game = byId.get(entry.gameId);
      if (!game) continue;
      out.push({ entry, game });
      if (out.length >= MAX_TILES) break;
    }
    return out;
  }, [entries, games]);

  if (tiles.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[16px] font-semibold text-foreground">Continue playing</h2>
        <Link
          to={ROUTES.library}
          className="text-[12px] text-muted/60 transition-colors hover:text-foreground/80"
        >
          View all →
        </Link>
      </div>

      <div className="shelf-scroll flex gap-3 overflow-x-auto pb-2">
        {tiles.map(({ entry, game }) => (
          <motion.button
            key={entry.gameId}
            type="button"
            onClick={() => navigate(ROUTES.libraryGame(game.id))}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className="group relative w-[160px] shrink-0 overflow-hidden rounded-xl border border-separator bg-card text-left hover:bg-card-hover"
          >
            <div className="relative h-[150px] overflow-hidden bg-card-active">
              <img
                src={game.headerUrl}
                alt={game.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex items-center gap-1.5 rounded-full bg-acid px-3 py-1.5 text-[11px] font-semibold text-background shadow-lg">
                  <Play className="h-3 w-3 fill-current" />
                  Play
                </div>
              </div>
            </div>
            <div className="px-2.5 pb-2.5 pt-2">
              <h3 className="truncate text-[12.5px] font-semibold text-foreground">
                {game.name}
              </h3>
              <p className="mt-0.5 truncate text-[10.5px] text-muted/60">
                Last played {relativeDate(entry.lastPlayed as string).toLowerCase()}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
