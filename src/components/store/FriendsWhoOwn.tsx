import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import type { GameId } from "@/lib/types";
import { useFriendsWhoOwn } from "@/hooks/use-friends";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface FriendsWhoOwnProps {
  gameId: GameId;
}

/**
 * Compact "Friends who own this" card for the GameDetailPage right rail.
 * Renders nothing when no friends overlap on this game; otherwise shows up
 * to four overlapping avatars (with an in-game dot for currently-playing
 * friends), a friendly one-line summary, and a "+N more" overflow chip.
 * Clicking the card navigates to /friends.
 */
export function FriendsWhoOwn({ gameId }: FriendsWhoOwnProps) {
  const navigate = useNavigate();
  const { data: friends } = useFriendsWhoOwn(gameId);

  if (!friends || friends.length === 0) return null;

  const visible = friends.slice(0, 4);
  const remainder = friends.length - visible.length;

  const summary = (() => {
    const names = friends.map((f) => f.displayName);
    if (names.length === 1) return `${names[0]} owns this game`;
    if (names.length === 2) return `${names[0]} and ${names[1]} own this game`;
    if (names.length === 3) {
      return `${names[0]}, ${names[1]}, and ${names[2]} own this game`;
    }
    return `${names[0]}, ${names[1]}, and ${names.length - 2} others own this game`;
  })();

  return (
    <button
      type="button"
      onClick={() => navigate(ROUTES.friends)}
      className="block w-full rounded-2xl border border-separator bg-card p-4 text-left transition-all hover:bg-card-active"
    >
      <header className="mb-3 flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-muted/60" />
        <h3 className="text-[13px] font-semibold text-foreground">
          Friends who own this
        </h3>
        <span className="ml-auto text-[11px] text-muted/60">{friends.length}</span>
      </header>

      <div className="mb-2 flex items-center">
        <div className="flex -space-x-2">
          {visible.map((f) => (
            <div key={f.uid} className="relative">
              <img
                src={f.avatarUrl}
                alt={f.displayName}
                className="h-8 w-8 rounded-full border-2 border-card object-cover"
              />
              {f.status === "in-game" && (
                <span
                  aria-label="In-game"
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                    "bg-green",
                  )}
                />
              )}
            </div>
          ))}
          {remainder > 0 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-card-active text-[10px] font-semibold text-muted/80">
              +{remainder}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted/70">{summary}</p>
    </button>
  );
}
