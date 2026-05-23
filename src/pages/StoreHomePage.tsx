import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Brain, ChevronRight, Sparkles, Trophy, Users } from "lucide-react";
import { GameShelf } from "@/components/store/GameShelf";
import { GreetingStrip } from "@/components/home/GreetingStrip";
import { FeaturedHeroBanner } from "@/components/home/FeaturedHeroBanner";
import { LiveEventBanners } from "@/components/home/LiveEventBanners";
import { TodaysSpotlights } from "@/components/home/TodaysSpotlights";
import { ContinuePlayingRail } from "@/components/home/ContinuePlayingRail";
import { FriendsActivityRail } from "@/components/home/FriendsActivityRail";
import { BentoGrid } from "@/components/home/BentoGrid";
import { TrendingLive } from "@/components/home/TrendingLive";
import { MoodExplorer } from "@/components/home/MoodExplorer";
import { CuratorShelves } from "@/components/store/CuratorShelves";
import {
  useGames,
  useHomeShelves,
  useTopSellers,
} from "@/hooks/use-games";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { ROUTES } from "@/lib/routes";

/** Friendlier copy for the existing shelf IDs. */
const SHELF_TITLE_OVERRIDES: Record<string, string> = {
  specials: "On sale now",
  "new-trending": "Just released",
  "top-sellers": "What's hot today",
  "hidden-gems": "Indies worth your time",
  demos: "Try before you buy",
  recommended: "Made for you",
};

export function StoreHomePage() {
  const navigate = useNavigate();
  const topSellers = useTopSellers();
  const allGames = useGames();
  const recentIds = useRecentlyViewedStore((s) => s.ids);

  const recentGames = allGames.data?.filter((g) => recentIds.includes(g.id)) ?? [];
  const tagPool = Array.from(
    new Set([
      ...recentGames.flatMap((g) => g.tags),
      ...((topSellers.data ?? []).slice(0, 3).flatMap((g) => g.tags)),
    ]),
  );

  const home = useHomeShelves(tagPool);
  const shelves = home.data?.shelves;

  const actionFor = (id: string): { label: string; onClick: () => void } | undefined => {
    if (id === "specials") {
      return { label: "All sales", onClick: () => navigate(ROUTES.dbSales) };
    }
    if (id === "top-sellers") {
      return { label: "Top charts", onClick: () => navigate(ROUTES.dbChart("top-played")) };
    }
    return undefined;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      {/* 1. Slim welcome line — single row, hugging the hero. */}
      <GreetingStrip />

      {/* 2. Cinematic alive hero — full-bleed, colored glow, particles. */}
      <FeaturedHeroBanner />

      {/* 3. Festival event banners — four full-stretched colorful tiles. */}
      <LiveEventBanners />

      {/* 4. Continue playing — hidden when library is empty. */}
      <ContinuePlayingRail />

      {/* 5. Today's spotlights — three big vivid game cards. */}
      <TodaysSpotlights />

      {/* 6. Existing six shelves — kept full-strength (this is the storefront). */}
      {shelves
        ? shelves.map((shelf) => (
            <GameShelf
              key={shelf.id}
              title={SHELF_TITLE_OVERRIDES[shelf.id] ?? shelf.title}
              subtitle={shelf.subtitle}
              entries={shelf.entries}
              action={actionFor(shelf.id)}
            />
          ))
        : (
          <>
            <GameShelf title="On sale now" subtitle="Discounts ending soon" isLoading />
            <GameShelf title="Just released" subtitle="Released in the last 90 days" isLoading />
            <GameShelf title="What's hot today" subtitle="What's moving today" isLoading />
            <GameShelf title="Indies worth your time" subtitle="Promising indies before the crowd" isLoading />
            <GameShelf title="Try before you buy" subtitle="Free demos available" isLoading />
            <GameShelf
              title="Made for you"
              subtitle={recentIds.length > 0 ? "Based on what you've been looking at" : "A small sample of the catalog"}
              isLoading
            />
          </>
        )}

      {/* 7. Bento grid + Live + Mood — colorful discovery, still game-first. */}
      <BentoGrid />
      <TrendingLive />
      <MoodExplorer />

      {/* 8. Friends activity rail — compact social signal. */}
      <FriendsActivityRail />

      {/* 9. Minimal secondary entries — AI, community, gift cards rolled into
             a tight three-up so they sit at the floor of the page rather than
             competing with games for attention. */}
      <MinimalSecondaryRow />

      {/* 10. Curator shelves — slim editorial footer. */}
      <CuratorShelves />
    </motion.div>
  );
}

/**
 * Three compact entry tiles linking to the heavier secondary surfaces
 * (AI, community, gift cards). Replaces the full inline sections that
 * used to crowd the bottom of the home page.
 */
function MinimalSecondaryRow() {
  const items = [
    {
      to: ROUTES.storeSearch,
      icon: Brain,
      kicker: "AI",
      title: "Dreamworks AI",
      subtitle: "Curator, summaries, hardware warnings",
      accentClass: "text-cyan",
      dotClass: "bg-cyan",
      glow: "from-cyan/20 via-positive/10 to-transparent",
    },
    {
      to: ROUTES.forums,
      icon: Users,
      kicker: "Community",
      title: "Tournaments, clubs & LFG",
      subtitle: "Find a squad and roll out",
      accentClass: "text-orange",
      dotClass: "bg-orange",
      glow: "from-orange/20 via-red/10 to-transparent",
    },
    {
      to: ROUTES.cart,
      icon: Trophy,
      kicker: "Gifts",
      title: "Gift cards & bundles",
      subtitle: "Send a friend something nice",
      accentClass: "text-green",
      dotClass: "bg-green",
      glow: "from-green/20 via-positive/10 to-transparent",
    },
  ] as const;

  return (
    <section className="pt-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-acid" />
        <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-muted/70">
          Also on Dreamworks
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.title}
              to={it.to}
              className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-separator bg-card/60 px-3 py-3 backdrop-blur-sm transition-all hover:border-white/15 hover:bg-card-hover"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${it.glow} opacity-70`} />
              <div className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-card-active">
                <Icon className={`h-4 w-4 ${it.accentClass}`} />
              </div>
              <div className="relative min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`block h-1.5 w-1.5 rounded-full ${it.dotClass}`} />
                  <span className={`text-[9.5px] font-bold uppercase tracking-[0.2em] ${it.accentClass}`}>
                    {it.kicker}
                  </span>
                </div>
                <p className="truncate text-[13px] font-semibold text-foreground">{it.title}</p>
                <p className="truncate text-[10.5px] text-muted/70">{it.subtitle}</p>
              </div>
              <ChevronRight className="relative h-3.5 w-3.5 shrink-0 text-muted/60 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
