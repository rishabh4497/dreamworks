import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useFriendActivity, useFriends } from "@/hooks/use-friends";
import { useGames } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import { relativeDate } from "@/lib/utils";
import type { Friend, FriendActivity, FriendActivityKind, Game } from "@/lib/types";

interface ActivityTile {
  activity: FriendActivity;
  friend: Friend;
  game: Game;
}

const MAX_TILES = 8;

function captionFor(kind: FriendActivityKind, at: string): string {
  if (kind === "now-playing") return "Playing now";
  if (kind === "added-to-library") return `Added ${relativeDate(at).toLowerCase()}`;
  if (kind === "achievement-unlocked") return `Unlock ${relativeDate(at).toLowerCase()}`;
  if (kind === "review-posted") return `Reviewed ${relativeDate(at).toLowerCase()}`;
  return `Active ${relativeDate(at).toLowerCase()}`;
}

/**
 * Horizontal rail of friends' recent activity. Each tile shows the game cover
 * and a small avatar + caption strip. Renders nothing when nothing is happening.
 */
export function FriendsActivityRail() {
  const { data: activity } = useFriendActivity();
  const { data: friends } = useFriends();
  const { data: games } = useGames();
  const navigate = useNavigate();

  const tiles = useMemo<ActivityTile[]>(() => {
    if (!activity || !friends || !games) return [];
    const friendByUid = new Map(friends.map((f) => [f.uid, f]));
    const gameById = new Map(games.map((g) => [g.id, g]));
    return activity
      .slice()
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, MAX_TILES)
      .map((a) => ({
        activity: a,
        friend: friendByUid.get(a.uid),
        game: gameById.get(a.gameId),
      }))
      .filter((t): t is ActivityTile => !!t.friend && !!t.game);
  }, [activity, friends, games]);

  if (tiles.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[16px] font-semibold text-foreground">
          Your friends are playing
        </h2>
        <Link
          to={ROUTES.friends}
          className="text-[12px] text-muted/60 transition-colors hover:text-foreground/80"
        >
          All friends →
        </Link>
      </div>

      <div className="shelf-scroll flex gap-3 overflow-x-auto pb-2">
        {tiles.map(({ activity: a, friend, game }) => (
          <motion.button
            key={`${a.uid}-${a.gameId}-${a.at}`}
            type="button"
            onClick={() => navigate(ROUTES.gameDetail(game.id))}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className="group w-[180px] shrink-0 overflow-hidden rounded-xl border border-separator bg-card text-left hover:bg-card-hover"
          >
            <div className="relative h-[150px] overflow-hidden bg-card-active">
              <img
                src={game.headerUrl}
                alt={game.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
            </div>
            <div className="flex items-center gap-2 px-2.5 pb-2.5 pt-2">
              <div className="relative shrink-0">
                <img
                  src={friend.avatarUrl}
                  alt={friend.displayName}
                  className="h-6 w-6 rounded-full border border-separator object-cover"
                />
                {friend.status === "in-game" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-card bg-green" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11.5px] font-semibold text-foreground">
                  {friend.displayName}
                </p>
                <p className="truncate text-[10px] text-muted/60">
                  {captionFor(a.kind, a.at)}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
