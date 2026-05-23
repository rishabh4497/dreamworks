import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { GameShelf } from "@/components/store/GameShelf";
import { GreetingStrip } from "@/components/home/GreetingStrip";
import { FeaturedHeroBanner } from "@/components/home/FeaturedHeroBanner";
import { ContinuePlayingRail } from "@/components/home/ContinuePlayingRail";
import { FriendsActivityRail } from "@/components/home/FriendsActivityRail";
import { BentoGrid } from "@/components/home/BentoGrid";
import { TrendingLive } from "@/components/home/TrendingLive";
import { MoodExplorer } from "@/components/home/MoodExplorer";
import { BookClubs } from "@/components/community/BookClubs";
import { SpeedrunLeaderboards } from "@/components/community/SpeedrunLeaderboards";
import { LFGBoard } from "@/components/community/LFGBoard";
import { MiniTournaments } from "@/components/community/MiniTournaments";
import { GiftCardCreator } from "@/components/store/GiftCardCreator";
import { CuratorShelves } from "@/components/store/CuratorShelves";
import {
  useGames,
  useHomeShelves,
  useTopSellers,
} from "@/hooks/use-games";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { ROUTES } from "@/lib/routes";
import { AiStoreCurator, AiReviewSummarizer } from "@/components/features/AiFeatures";
import { HardwareAwareWarnings } from "@/components/features/UserFeatures";

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

  // Build a "for you" tag pool from recently viewed games (falling back to top sellers).
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
      {/* 1. Welcome — personalized greeting + live stats */}
      <GreetingStrip />

      {/* 2. Cinematic hero — rotating featured games at 480px tall */}
      <FeaturedHeroBanner />

      {/* 3. Continue playing — hidden when library is empty */}
      <ContinuePlayingRail />

      {/* 4. Apple Music-style bento (Spotlight / Free this week / Wrapped / Sale / Gem / Trending tag) */}
      <BentoGrid />

      {/* 5. Discord-style "live right now" with animated counts */}
      <TrendingLive />

      {/* 6. Friends activity rail */}
      <FriendsActivityRail />

      {/* 7. Mood explorer — colorful tag-jump tiles */}
      <MoodExplorer />

      {/* 8. The existing six shelves, with friendlier titles */}
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

      {/* 9. AI features cluster — moved below the discovery zones so they don't crowd the hero */}
      <section className="pt-4">
        <div className="mb-3">
          <h2 className="text-[16px] font-semibold text-foreground">Dreamworks AI</h2>
          <p className="mt-0.5 text-[12px] text-muted/70">Cuts through reviews, specs, and noise — so you don't have to.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AiStoreCurator />
          <div className="flex flex-col gap-4">
            <AiReviewSummarizer />
            <HardwareAwareWarnings />
          </div>
        </div>
      </section>

      {/* 10. Community Hub */}
      <section className="pt-6">
        <div className="mb-3">
          <h2 className="text-[16px] font-semibold text-foreground">Community Hub</h2>
          <p className="mt-0.5 text-[12px] text-muted/70">Tournaments, clubs, leaderboards, and groups to roll with.</p>
        </div>
        <div className="grid gap-6">
          <MiniTournaments />
          <BookClubs />
          <SpeedrunLeaderboards />
          <LFGBoard />
        </div>
      </section>

      <GiftCardCreator />
      <CuratorShelves />
    </motion.div>
  );
}
