import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Flame, Gem, Gift, Heart, Sparkles, TrendingUp } from "lucide-react";
import { useGames, useTopSellers } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Game } from "@/lib/types";
import { YearInReviewTeaser } from "./YearInReviewTeaser";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const HANDCRAFTED_QUOTES: Record<string, string> = {
  "elden-ring":
    "FromSoftware's most ambitious world yet — and it lets you set your own pace. A study in confidence.",
  "witcher-3":
    "Ten years on, still the open-world RPG everyone else is chasing. Geralt's last ride remains his best.",
  "baldurs-gate-3":
    "Cinematic, dense, and the best D&D experience that's ever shipped to a screen. Try anything; it works.",
  "cyberpunk-2077":
    "Night City has finally grown into the place its trailers always promised. A sprawling, melancholic future.",
  "black-myth-wukong":
    "A pulpy, gorgeous brawler that wears its love for the source material on its sleeve.",
  "red-dead-redemption-2":
    "A slow, devastating western that earns every one of its hours. Few games feel this lived-in.",
  "gta-5":
    "A satirical sandbox that still defines the modern open world. Endlessly replayable, endlessly itself.",
};

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
  const firstGenre = (game.genres[0] ?? game.tags[0] ?? "the genre").toLowerCase();
  return `A masterclass in ${firstGenre}. The kind of game that ruins others by comparison.`;
}

interface BentoCellSelections {
  spotlight?: Game;
  free?: Game;
  sale?: Game;
  gem?: Game;
  trendingTag?: { name: string; count: number };
}

function selectCells(games: Game[], topSellers: Game[]): BentoCellSelections {
  if (games.length === 0) return {};

  const week = isoWeekNumber(new Date());

  // Editorial Spotlight: deterministic-of-the-week from top sellers (or any games).
  const spotlightPool = topSellers.length > 0
    ? [...topSellers].sort((a, b) => a.salesRank - b.salesRank)
    : [...games].sort((a, b) => a.salesRank - b.salesRank);
  const spotlight = spotlightPool.length > 0
    ? spotlightPool[week % spotlightPool.length]
    : undefined;

  // Free This Week: a high-quality indie (firstReviewersScore > 80).
  const indies = games
    .filter((g) => (g.firstReviewersScore ?? 0) > 80)
    .sort((a, b) => (b.firstReviewersScore ?? 0) - (a.firstReviewersScore ?? 0));
  const free = indies[0];

  // Biggest Sale: highest discountPct.
  const sale = [...games]
    .filter((g) => g.price.discountPct > 0)
    .sort((a, b) => b.price.discountPct - a.price.discountPct)[0];

  // Hidden Gem: next-best indie (skip the one we used for Free This Week).
  const gem = indies.find((g) => g.id !== free?.id);

  // Trending tag: most-common tag across the top 5 sellers.
  let trendingTag: BentoCellSelections["trendingTag"];
  if (topSellers.length > 0) {
    const counts = new Map<string, number>();
    for (const g of topSellers.slice(0, 5)) {
      for (const t of g.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    let bestName: string | undefined;
    let bestCount = 0;
    for (const [name, count] of counts) {
      if (count > bestCount) {
        bestName = name;
        bestCount = count;
      }
    }
    if (bestName) {
      // Total games sharing this tag across the whole catalog.
      const totalForTag = games.filter((g) => g.tags.includes(bestName!)).length;
      trendingTag = { name: bestName, count: totalForTag };
    }
  }

  return { spotlight, free, sale, gem, trendingTag };
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/** Apple Music-style asymmetric grid below the hero. */
export function BentoGrid() {
  const { data: games } = useGames();
  const { data: topSellers } = useTopSellers();

  const cells = useMemo(
    () => selectCells(games ?? [], topSellers ?? []),
    [games, topSellers],
  );

  // Nothing useful to show yet — skip the section entirely.
  if (!cells.spotlight && !cells.free && !cells.sale && !cells.gem) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:grid-rows-4 lg:gap-4">
        {cells.spotlight && (
          <SpotlightCell game={cells.spotlight} index={0} />
        )}
        {cells.free && <FreeThisWeekCell game={cells.free} index={1} />}
        <YearInReviewCell index={2} />
        {cells.sale && <BiggestSaleCell game={cells.sale} index={3} />}
        {cells.gem && <HiddenGemCell game={cells.gem} index={4} />}
        {cells.trendingTag && (
          <TrendingTagCell tag={cells.trendingTag} index={5} />
        )}
      </div>
    </section>
  );
}

// ── Cells ───────────────────────────────────────────────────────────────────

interface CellProps {
  index: number;
}

interface GameCellProps extends CellProps {
  game: Game;
}

function cellEntrance(index: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE, delay: 0.05 * index },
  } as const;
}

function SpotlightCell({ game, index }: GameCellProps) {
  return (
    <motion.div
      {...cellEntrance(index)}
      whileHover={{ y: -2 }}
      className="lg:col-span-2 lg:row-span-3"
    >
      <Link
        to={ROUTES.gameDetail(game.id)}
        className="group relative flex h-full min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl border border-separator bg-card lg:min-h-[360px]"
      >
        <img
          src={game.headerUrl}
          alt={game.name}
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent" />

        <div className="relative space-y-3 p-6 md:p-8">
          <div className="flex items-center gap-1.5 text-acid">
            <Sparkles className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Editorial spotlight
            </span>
          </div>
          <h3 className="text-[24px] font-bold leading-tight text-foreground md:text-[28px]">
            {game.name}
          </h3>
          <p className="max-w-md font-serif text-[14px] italic leading-relaxed text-foreground/85">
            “{quoteFor(game)}”
          </p>
          <div className="flex items-end justify-between gap-3 pt-1">
            <p className="text-[11px] uppercase tracking-widest text-muted/70">
              Picked by Dreamworks
            </p>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-acid transition-all group-hover:gap-2">
              View game →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function FreeThisWeekCell({ game, index }: GameCellProps) {
  return (
    <motion.div
      {...cellEntrance(index)}
      className="lg:col-span-2 lg:row-span-2"
    >
      <Link
        to={ROUTES.gameDetail(game.id)}
        className="group relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl border border-separator bg-card transition-all hover:shadow-[0_0_0_2px_var(--color-acid)] hover:ring-1 hover:ring-acid/60"
      >
        <img
          src={game.headerUrl}
          alt={game.name}
          className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-acid/25 via-background/40 to-positive/20" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-background/40 to-transparent" />

        <div className="relative flex items-start justify-between p-5 md:p-6">
          <div className="flex items-center gap-1.5 text-acid">
            <Gift className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-widest">
              Free this week
            </span>
          </div>
          <span className="inline-flex items-center rounded-full bg-acid px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-background">
            Free
          </span>
        </div>

        <div className="relative space-y-2 p-5 md:p-6">
          <h3 className="text-[20px] font-bold leading-tight text-foreground md:text-[22px]">
            {game.name}
          </h3>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted/80">Claim through Sunday</p>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-acid transition-all group-hover:gap-2">
              Get game →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function YearInReviewCell({ index }: CellProps) {
  return (
    <motion.div {...cellEntrance(index)} className="lg:col-span-2 lg:row-span-1">
      <YearInReviewTeaser />
    </motion.div>
  );
}

function BiggestSaleCell({ game, index }: GameCellProps) {
  const days = daysUntil(game.price.discountEndsAt);
  return (
    <motion.div
      {...cellEntrance(index)}
      whileHover={{ y: -2 }}
      className="lg:col-span-2 lg:row-span-1"
    >
      <Link
        to={ROUTES.gameDetail(game.id)}
        className="group relative flex h-full min-h-[140px] items-center gap-4 overflow-hidden rounded-2xl border border-separator bg-card p-4 transition-all hover:bg-card-hover"
      >
        <div className="relative h-full min-h-[100px] w-24 shrink-0 overflow-hidden rounded-xl bg-card-active sm:w-32">
          <img
            src={game.capsuleUrl || game.coverUrl}
            alt={game.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-red">
            <Flame className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Biggest sale
            </span>
          </div>
          <h3 className="truncate text-[16px] font-bold leading-tight text-foreground">
            {game.name}
          </h3>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="inline-flex items-center rounded-md bg-discount-bg px-1.5 py-0.5 text-[11px] font-bold text-discount-fg">
              -{game.price.discountPct}%
            </span>
            <span className="text-[11px] text-muted/80">
              {days ? `ends in ${days}d` : "limited time"}
            </span>
          </div>
        </div>
        <span className="hidden shrink-0 text-[12px] font-semibold text-acid transition-all group-hover:translate-x-1 sm:inline">
          Jump in →
        </span>
      </Link>
    </motion.div>
  );
}

function HiddenGemCell({ game, index }: GameCellProps) {
  return (
    <motion.div
      {...cellEntrance(index)}
      whileHover={{ y: -2 }}
      className="lg:col-span-1 lg:row-span-1"
    >
      <Link
        to={ROUTES.gameDetail(game.id)}
        className="group relative flex h-full min-h-[140px] flex-col justify-between overflow-hidden rounded-2xl border border-separator bg-card p-4 transition-all hover:bg-card-hover"
      >
        <div className="relative h-16 w-full overflow-hidden rounded-lg bg-card-active">
          <img
            src={game.capsuleUrl || game.headerUrl}
            alt={game.name}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-positive">
              <Gem className="h-3 w-3" />
              <span className="text-[9.5px] font-bold uppercase tracking-widest">
                Hidden gem
              </span>
            </div>
            <Heart
              className={cn(
                "h-3.5 w-3.5 text-muted/70 transition-colors group-hover:text-red",
              )}
            />
          </div>
          <h3 className="truncate text-[13px] font-semibold text-foreground">
            {game.name}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}

interface TrendingTagCellProps extends CellProps {
  tag: { name: string; count: number };
}

function TrendingTagCell({ tag, index }: TrendingTagCellProps) {
  const params = new URLSearchParams({ tags: tag.name }).toString();
  const displayName = tag.name.replace(/-/g, " ");
  return (
    <motion.div
      {...cellEntrance(index)}
      whileHover={{ y: -2 }}
      className="lg:col-span-1 lg:row-span-1"
    >
      <Link
        to={`${ROUTES.storeSearch}?${params}`}
        className="group relative flex h-full min-h-[140px] flex-col justify-between overflow-hidden rounded-2xl border border-separator bg-card p-4 transition-all hover:bg-card-hover"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-acid/10 via-transparent to-positive/10" />
        <div className="relative flex items-center gap-1.5 text-acid">
          <TrendingUp className="h-3 w-3" />
          <span className="text-[9.5px] font-bold uppercase tracking-widest">
            Trending tag
          </span>
        </div>
        <div className="relative space-y-1">
          <h3 className="break-words text-[22px] font-bold capitalize leading-tight text-foreground">
            {displayName}
          </h3>
          <p className="text-[11px] text-muted/80">+{tag.count} games</p>
        </div>
      </Link>
    </motion.div>
  );
}
