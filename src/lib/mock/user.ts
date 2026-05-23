import type { Collection, LibraryEntry, UserProfile, WishlistEntry } from "../types";
import { avatarUrl } from "./images";
import { DEFAULT_AVATAR_OPTIONS } from "../avatar";
import { GAMES } from "./games";

export const MOCK_USER: UserProfile = {
  uid: "rishav-001",
  email: "you@dreams.tech",
  displayName: "rishav",
  avatarUrl: avatarUrl("rishav-001"),
  avatarOptions: DEFAULT_AVATAR_OPTIONS,
  level: 24,
  bio: "Player of slow things, builder of short games.",
  country: "India",
  memberSince: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 4).toISOString(),
  showcaseGameIds: ["elden-ring", "witcher-3", "cyberpunk-2077"],
  role: "user",
  permissions: [],
};

const ownedSlugs = [
  "elden-ring",
  "witcher-3",
  "cyberpunk-2077",
  "gta-5",
  "red-dead-redemption-2",
  "black-myth-wukong",
];

// Two most-recent purchases (i=0,1) intentionally fall within the 14-day
// refund window so the refund UI has something to render. The rest are old.
const OWNED_DAYS_AGO = [2, 9, 60, 140, 260, 380, 510];

export const MOCK_LIBRARY: LibraryEntry[] = ownedSlugs.map((slug, i) => {
  const game = GAMES.find((g) => g.id === slug)!;
  const owned = new Date();
  owned.setDate(owned.getDate() - (OWNED_DAYS_AGO[i] ?? 200 + i * 31));
  const lastPlayed = new Date();
  lastPlayed.setDate(lastPlayed.getDate() - (3 + i * 11));
  // Low playMinutes for the freshly-purchased entries so refund eligibility
  // stays intact under any playtime-aware policy.
  const playMinutes = i < 2 ? Math.round(20 + Math.random() * 40) : Math.round(60 * (1 + i * 4 + Math.random() * 20));
  return {
    gameId: game.id,
    ownedSince: owned.toISOString(),
    installed: i < 4,
    sizeBytes: i < 4 ? Math.round(20_000_000_000 * (0.4 + Math.random())) : 0,
    playMinutes,
    lastPlayed: i < 5 ? lastPlayed.toISOString() : null,
    collectionIds: i % 2 === 0 ? ["favorites"] : [],
    achievementsUnlocked: Math.round(game.salesRank * 2 + Math.random() * 20),
    completionPct: Math.round(20 + Math.random() * 70),
  };
});

export const MOCK_WISHLIST: WishlistEntry[] = [
  "god-of-war-ragnarok",
  "ac-shadows",
  "crimson-desert",
  "gta-6",
].map((slug, i) => ({
  gameId: slug,
  addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i * 6 + 3)).toISOString(),
  priority: i + 1,
  notifyOnSale: true,
}));

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: "favorites",
    name: "Favorites",
    gameIds: ["elden-ring", "witcher-3", "black-myth-wukong"],
  },
  { id: "unplayed", name: "Unplayed", gameIds: ["red-dead-redemption-2"] },
  { id: "weekend", name: "Weekend", gameIds: ["cyberpunk-2077", "gta-5"] },
];
