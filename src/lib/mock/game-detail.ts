import type { GameDetail, GameId, Screenshot, SystemRequirementsBlock, Trailer } from "../types";
import { buildAchievements } from "./achievements";
import { buildDepots } from "./depots";
import { buildPatchNotes } from "./patch-notes";
import { buildPlayerCountHistory } from "./player-counts";
import { buildPriceHistory } from "./price-history";
import { buildRegionalPrices } from "./regional-prices";
import { GAMES, getSeedById } from "./games";
import { steamScreenshots, steamTrailers } from "./images";
import { TAGS } from "./tags";
import { AI_OVERVIEWS } from "./ai-overviews";

function withAIOverview(detail: GameDetail): GameDetail {
  const o = AI_OVERVIEWS[detail.id];
  return o ? { ...detail, aiOverview: o } : detail;
}

const LANGUAGES_BASE = ["English", "French", "Spanish", "German", "Japanese", "Korean", "Brazilian Portuguese"];

const SYSREQ_WINDOWS_MIN: SystemRequirementsBlock = {
  os: "Windows 10 64-bit",
  cpu: "Intel Core i5-8400 / AMD Ryzen 5 2600",
  memory: "8 GB RAM",
  gpu: "NVIDIA GTX 1060 6GB / AMD RX 580 8GB",
  storage: "20 GB available space",
  notes: "SSD strongly recommended.",
};
const SYSREQ_MAC_MIN: SystemRequirementsBlock = {
  os: "macOS 12 (Apple Silicon recommended)",
  cpu: "Apple M1 or Intel Core i5 8th gen",
  memory: "8 GB RAM",
  gpu: "Integrated Apple GPU / Radeon Pro 5500M",
  storage: "20 GB available space",
};
const SYSREQ_LINUX_MIN: SystemRequirementsBlock = {
  os: "Ubuntu 22.04 LTS",
  cpu: "Intel Core i5-8400 / AMD Ryzen 5 2600",
  memory: "8 GB RAM",
  gpu: "NVIDIA GTX 1060 6GB / AMD RX 580 8GB",
  storage: "20 GB available space",
};

function buildScreenshots(gameId: GameId): Screenshot[] {
  const seed = getSeedById(gameId);
  if (!seed) return [];
  // Curated screenshots from STEAM_MEDIA (src/lib/mock/steam-media.ts).
  // If the appid isn't curated yet, this returns []; the gallery will be empty
  // rather than broken.
  return steamScreenshots(seed.steamAppId);
}

function buildTrailers(gameId: GameId): Trailer[] {
  const seed = getSeedById(gameId);
  if (!seed) return [];
  // Curated trailers from STEAM_MEDIA.
  return steamTrailers(seed.steamAppId);
}

function buildLongDescription(name: string, shortDescription: string): string {
  return (
    shortDescription +
    "\n\n" +
    `${name} is built around a single feeling — the kind you can't sum up in a tagline. It rewards patience, attention, and the small acts of caring about a world that doesn't ask to be cared about.\n\n` +
    "Highlights:\n" +
    "  • A handcrafted world that opens up the longer you stay\n" +
    "  • A soundtrack that responds to where you are and what you've done\n" +
    "  • Accessibility options across difficulty, motion, and reading speed\n" +
    "  • Quiet endings that don't insist on being the right one"
  );
}

export function buildGameDetail(gameId: GameId): GameDetail | undefined {
  const game = GAMES.find((g) => g.id === gameId);
  const seed = getSeedById(gameId);
  if (!game || !seed) return undefined;

  const sysreq: GameDetail["systemRequirements"] = {};
  if (game.platforms.includes("windows")) sysreq.windows = SYSREQ_WINDOWS_MIN;
  if (game.platforms.includes("mac")) sysreq.mac = SYSREQ_MAC_MIN;
  if (game.platforms.includes("linux")) sysreq.linux = SYSREQ_LINUX_MIN;

  const storeTags = TAGS.filter((t) => seed.tags.includes(t.slug));
  const relatedGameIds = GAMES.filter(
    (g) => g.id !== gameId && g.genres.some((x) => game.genres.includes(x)),
  )
    .slice(0, 6)
    .map((g) => g.id);

  return withAIOverview({
    ...game,
    shortDescription: seed.shortDescription,
    longDescription: buildLongDescription(game.name, seed.shortDescription),
    screenshots: buildScreenshots(gameId),
    trailers: buildTrailers(gameId),
    systemRequirements: sysreq,
    languages: seed.languages ?? LANGUAGES_BASE,
    features: seed.features,
    ageRating: { board: "ESRB", rating: seed.tags.includes("horror") ? "M (Mature 17+)" : "T (Teen)" },
    drm: seed.drm ?? ["Dreamworks Account"],
    metaScore: seed.metaScore,
    estimatedSizeBytes: seed.estimatedSizeBytes,
    pricesByRegion: buildRegionalPrices(gameId),
    achievementCount: seed.achievementCount,
    achievements: buildAchievements(gameId),
    depots: buildDepots(gameId),
    patchNotes: buildPatchNotes(gameId),
    relatedGameIds,
    storeTags,
    priceHistory: buildPriceHistory(gameId),
    playerCountHistory: buildPlayerCountHistory(gameId),
    currentPlayers: seed.currentPlayers,
    peakPlayers24h: seed.peakPlayers24h,
    peakPlayersAllTime: seed.peakPlayers24h * 2,
    playtime: seed.playtime,
  });
}
