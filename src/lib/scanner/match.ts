import { getScannerCatalog, type ScannerCatalogEntry } from "@/lib/api/games";
import type { DetectedGame } from "./types";

/**
 * Resolves each detected game against the Dreamworks catalog. Returns a new
 * array with `matchedGameId` + `matchConfidence` populated.
 *
 *  - Steam appid match → "exact"
 *  - Case-insensitive substring match on the name (either direction) → "fuzzy"
 *  - Otherwise → "unmatched"
 */
export async function matchToCatalog(detected: DetectedGame[]): Promise<DetectedGame[]> {
  const catalog = await getScannerCatalog();
  return detected.map((d) => matchOne(d, catalog));
}

function matchOne(
  d: DetectedGame,
  catalog: ScannerCatalogEntry[],
): DetectedGame {
  if (d.launcher === "steam") {
    const exact = catalog.find((c) => c.steamAppId === d.externalId);
    if (exact) {
      return { ...d, matchedGameId: exact.id, matchConfidence: "exact" };
    }
  }

  const needle = d.name.trim().toLowerCase();
  if (needle.length >= 3) {
    const fuzzy = catalog.find((c) => {
      const candidate = c.name.toLowerCase();
      return candidate.includes(needle) || needle.includes(candidate);
    });
    if (fuzzy) {
      return { ...d, matchedGameId: fuzzy.id, matchConfidence: "fuzzy" };
    }
  }

  return { ...d, matchConfidence: "unmatched" };
}
