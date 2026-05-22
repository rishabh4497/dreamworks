import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { GameShelf } from "@/components/store/GameShelf";
import { GreetingStrip } from "@/components/home/GreetingStrip";
import { FeaturedHeroBanner } from "@/components/home/FeaturedHeroBanner";
import { ContinuePlayingRail } from "@/components/home/ContinuePlayingRail";
import { FriendsActivityRail } from "@/components/home/FriendsActivityRail";
import { EditorialSpotlight } from "@/components/home/EditorialSpotlight";
import { WeeklyFreeGame } from "@/components/home/WeeklyFreeGame";
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <GreetingStrip />
      <FeaturedHeroBanner />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
        <AiStoreCurator />
        <div className="flex flex-col gap-4">
          <AiReviewSummarizer />
          <HardwareAwareWarnings />
        </div>
      </div>
      <ContinuePlayingRail />
      <FriendsActivityRail />
      <EditorialSpotlight />
      <WeeklyFreeGame />
      <MoodExplorer />

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

      <section className="pt-8">
        <h2 className="mb-4 text-[14px] font-semibold text-foreground">Community Hub</h2>
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
