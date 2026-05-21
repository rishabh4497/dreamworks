import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useGames } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import type { Game } from "@/lib/types";

const HANDCRAFTED_QUOTES: Record<string, string> = {
  "elden-ring":
    "FromSoftware's most ambitious world yet — and it lets you set your own pace.",
  "witcher-3":
    "Ten years on, still the open-world RPG everyone else is chasing.",
  "baldurs-gate-3":
    "Cinematic, dense, and the best D&D experience that's ever shipped to a screen.",
  "cyberpunk-2077":
    "Night City has finally grown into the place its trailers always promised.",
  "black-myth-wukong":
    "A pulpy, gorgeous brawler that wears its love for the source material on its sleeve.",
  "hades":
    "A roguelike that rewards every run with story — and somehow never gets old.",
  "stardew-valley":
    "The quiet farming game that quietly became one of the best games ever made.",
  "hollow-knight":
    "A hand-drawn world so dense you'll keep finding rooms a year in.",
};

/**
 * Returns the ISO week number (1-53). Used as a deterministic seed so the
 * spotlight pick changes each Monday — no flicker between sessions in the
 * same week.
 */
function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function quoteFor(game: Game): string {
  const custom = HANDCRAFTED_QUOTES[game.id];
  if (custom) return custom;
  const firstGenre = game.genres[0] ?? game.tags[0] ?? "the genre";
  return `A masterclass in ${firstGenre.toLowerCase()}.`;
}

/**
 * Curator's pick of the week — picked deterministically from the top-rated
 * games using the ISO week number as the seed. Same pick across all visits
 * within a week, fresh pick next Monday.
 */
export function EditorialSpotlight() {
  const { data: games } = useGames();

  const pick = useMemo<Game | undefined>(() => {
    if (!games || games.length === 0) return undefined;
    // Top quarter by review score forms the candidate pool, then index by week.
    const sorted = games
      .slice()
      .sort((a, b) => b.reviewSummary.scorePct - a.reviewSummary.scorePct);
    const poolSize = Math.max(1, Math.floor(sorted.length / 4));
    const pool = sorted.slice(0, poolSize);
    const week = isoWeekNumber(new Date());
    return pool[week % pool.length];
  }, [games]);

  if (!pick) return null;

  const quote = quoteFor(pick);

  return (
    <section className="mb-10">
      <article className="grid grid-cols-1 overflow-hidden rounded-2xl border border-separator bg-card md:grid-cols-2">
        <div className="relative aspect-[460/215] overflow-hidden bg-card-active md:aspect-auto md:h-full">
          <img
            src={pick.headerUrl}
            alt={pick.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card md:to-card" />
        </div>

        <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
          <div className="flex items-center gap-1.5 text-acid">
            <Sparkles className="h-3 w-3" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">
              Curator's pick this week
            </span>
          </div>
          <h2 className="text-[24px] font-bold leading-tight text-foreground">
            {pick.name}
          </h2>
          <p className="text-[14px] leading-relaxed text-muted/80">"{quote}"</p>
          <div>
            <Link
              to={ROUTES.gameDetail(pick.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-acid px-4 py-2 text-[12px] font-semibold text-background transition-all hover:brightness-110"
            >
              Play now →
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}
