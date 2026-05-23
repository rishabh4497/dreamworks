import Fuse from "fuse.js";
import type { Game } from "./types";

interface GameSearchDoc {
  game: Game;
  name: string;
  developer: string;
  publisher: string;
  tags: string;
  genres: string;
  abbreviations: string;
}

export interface GameSearchIndex {
  fuse: Fuse<GameSearchDoc>;
  size: number;
}

const ROMAN_TO_ARABIC: Record<string, string> = {
  i: "1", ii: "2", iii: "3", iv: "4", v: "5",
  vi: "6", vii: "7", viii: "8", ix: "9", x: "10",
  xi: "11", xii: "12", xiii: "13",
};

// Generates short-form variants for a game name so queries like "cp77",
// "gta5", "cs2", "twwh3" hit the right title.
function computeAbbreviations(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9 ]+/g, " ").trim().toLowerCase();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "";

  const isNumeric = (t: string) => /^\d+$/.test(t);
  const alphaInitials = tokens.filter((t) => !isNumeric(t)).map((t) => t[0]).join("");

  const variants = new Set<string>();
  // Pure alpha initials: "Counter Strike" → "cs"
  if (alphaInitials.length >= 2) variants.add(alphaInitials);

  for (const t of tokens) {
    if (isNumeric(t)) {
      // Full number: "Cyberpunk 2077" → "c2077"; "Counter Strike 2" → "cs2"
      variants.add(alphaInitials + t);
      // Two-digit year suffix: "Cyberpunk 2077" → "cp77" (when title has ≥2 alpha tokens)
      if (t.length === 4 && alphaInitials.length >= 1) {
        const fullAlpha = tokens.filter((x) => !isNumeric(x)).map((x) => x.slice(0, 1)).join("");
        const shortInitials = tokens
          .filter((x) => !isNumeric(x))
          .map((x) => x.slice(0, x.length > 4 ? 2 : 1))
          .join("");
        variants.add(fullAlpha + t.slice(2));
        variants.add(shortInitials + t.slice(2));
      }
    } else if (ROMAN_TO_ARABIC[t]) {
      // Roman numerals: "Grand Theft Auto V" → "gta5", "gtav"
      variants.add(alphaInitials);
      variants.add(alphaInitials.slice(0, alphaInitials.length - 1) + ROMAN_TO_ARABIC[t]);
    }
  }

  return [...variants].join(" ");
}

export function buildGameIndex(games: readonly Game[]): GameSearchIndex {
  const docs: GameSearchDoc[] = games.map((game) => ({
    game,
    name: game.name,
    developer: game.developer,
    publisher: game.publisher,
    tags: game.tags.join(" "),
    genres: game.genres.join(" "),
    abbreviations: computeAbbreviations(game.name),
  }));

  const fuse = new Fuse(docs, {
    // Name dominates; abbreviations are a strong signal too. Tags/genres
    // help discovery ("souls-like", "rpg"); developer/publisher catch
    // queries like "rockstar" or "fromsoft".
    keys: [
      { name: "name", weight: 1.0 },
      { name: "abbreviations", weight: 0.85 },
      { name: "developer", weight: 0.55 },
      { name: "publisher", weight: 0.45 },
      { name: "tags", weight: 0.35 },
      { name: "genres", weight: 0.3 },
    ],
    // 0 = exact, 1 = anything. ~0.4 tolerates a handful of typos in mid-length queries.
    threshold: 0.4,
    // Don't penalize matches deep in the string — "wild hunt" should still find
    // "The Witcher 3: Wild Hunt".
    ignoreLocation: true,
    // Avoid false matches on single-letter queries; require at least 2 chars.
    minMatchCharLength: 2,
    includeScore: true,
    // Re-rank by combined score across keys instead of the best single field.
    shouldSort: true,
  });

  return { fuse, size: games.length };
}

export function searchGames(index: GameSearchIndex, query: string, limit = 8): Game[] {
  const q = query.trim();
  if (!q) return [];
  const results = index.fuse.search(q, { limit });
  return results.map((r) => r.item.game);
}
