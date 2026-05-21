import type { GameId } from "@/lib/types";

/**
 * Per-game accent color used by the app-wide Spotify-style wash.
 *
 * These are hand-picked to match each game's key art / brand identity —
 * Red Dead's blood red, Cyberpunk's hazard yellow, Elden Ring's gold, etc.
 * Falling back to the publisher's `studioBrand()` color would tint every
 * Rockstar game yellow (their logo), which is wrong; gamers think of
 * GTA as green, RDR2 as red.
 */
export const GAME_ACCENTS: Record<GameId, string> = {
  // Existing 10
  "black-myth-wukong": "#B8662F",            // amber robe + spear
  "red-dead-redemption-2": "#A02810",        // blood-red box art
  "gta-5": "#A2D44A",                        // money green
  "god-of-war-ragnarok": "#3F9CD4",          // Nordic ice
  "ac-shadows": "#CC1818",                   // assassin red
  "witcher-3": "#9C7C3D",                    // wolf medallion gold
  "cyberpunk-2077": "#FCEE0A",               // hazard yellow
  "crimson-desert": "#B91313",               // crimson
  "gta-6": "#FF6B9D",                        // Vice pink/magenta
  "elden-ring": "#C49852",                   // erdtree gold

  // Catalog v2
  "baldurs-gate-3": "#D4A045",               // illithid gold
  "hogwarts-legacy": "#9B5E2B",              // warm brown/gold
  "counter-strike-2": "#F7931E",             // orange
  "helldivers-2": "#FFD400",                 // helldivers yellow
  "palworld": "#5DC4FB",                     // sky blue
  "marvel-rivals": "#E62022",                // marvel red
  "stardew-valley": "#65A30D",               // farm green
  "sekiro": "#D7263D",                       // shinobi red
  "resident-evil-4-remake": "#7C1D1D",       // dried-blood red
  "spider-man-remastered": "#E51919",        // spidey red
};

export function gameAccent(gameId: GameId): string | null {
  return GAME_ACCENTS[gameId] ?? null;
}
