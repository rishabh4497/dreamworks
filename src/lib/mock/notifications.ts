import type { AppNotification } from "@/lib/types";
import { ROUTES } from "@/lib/routes";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

/**
 * Five starter notifications shown the very first time the user opens the app.
 * Two unread (wishlist-alert + sale-ending) make the bell chip read "2" on a
 * fresh install, which is what makes the feature obvious in the demo without
 * waiting for real events.
 */
export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "seed_wishlist_cyberpunk",
    kind: "wishlist-alert",
    title: "Cyberpunk 2077 is now $14.99",
    body: "Down from $59.99 — your wishlist threshold was met.",
    gameId: "cyberpunk-2077",
    href: ROUTES.gameDetail("cyberpunk-2077"),
    createdAt: isoAgo(3 * HOUR),
    read: false,
  },
  {
    id: "seed_sale_witcher",
    kind: "sale-ending",
    title: "The Witcher 3 sale ends in 1 day",
    body: "Currently 80% off. Don't miss the autumn sale window.",
    gameId: "witcher-3",
    href: ROUTES.gameDetail("witcher-3"),
    createdAt: isoAgo(1 * DAY),
    read: false,
  },
  {
    id: "seed_friend_elden",
    kind: "friend-activity",
    title: "kira_w started playing Elden Ring",
    body: "Your friend is online and in-game right now.",
    gameId: "elden-ring",
    href: ROUTES.friends,
    createdAt: isoAgo(1 * DAY + 4 * HOUR),
    read: true,
  },
  {
    id: "seed_achievement_first_light",
    kind: "achievement-unlock",
    title: "Achievement: First Light",
    body: "You completed the tutorial in your latest game.",
    createdAt: isoAgo(2 * DAY),
    read: true,
  },
  {
    id: "seed_system_welcome",
    kind: "system",
    title: "Welcome to Dreamworks 0.1",
    body: "Browse the store, build a library, and tune notifications in Settings.",
    href: ROUTES.settings,
    createdAt: isoAgo(3 * DAY),
    read: true,
  },
];
