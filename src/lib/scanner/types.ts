import type { GameId, LauncherSource } from "@/lib/types";

/**
 * A single game detected by a launcher scanner. `matchedGameId` is set when
 * we can resolve the detected title to an entry in our catalog.
 */
export interface DetectedGame {
  launcher: LauncherSource;
  /** appid for Steam, AppName for Epic, etc. */
  externalId: string;
  /** Name as reported by the launcher. */
  name: string;
  installPath?: string;
  sizeBytes?: number;
  /** Resolved to our catalog when possible. */
  matchedGameId?: GameId;
  /** How confident we are about the catalog mapping. */
  matchConfidence: "exact" | "fuzzy" | "unmatched";
}

export interface ScanError {
  launcher: LauncherSource;
  message: string;
}

export interface ScanResult {
  detected: DetectedGame[];
  errors: ScanError[];
  durationMs: number;
  /** Native scanner audit trail: exact manifest/config paths read during scan. */
  pathsRead?: string[];
}
