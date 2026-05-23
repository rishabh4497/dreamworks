/**
 * Client-visible payload shapes that match the server prompt modules in
 * `functions/src/prompts/`. Keep these in sync with the matching
 * `<feature>Payload` interface on the server.
 */

export interface GameOverviewPayload {
  gameName: string;
  studio?: string;
  genres?: string[];
  releaseYear?: number;
  reviewExcerpts: string[];
  totalReviewCount: number;
}

export interface ReviewSummarizerPayload {
  gameName: string;
  reviewExcerpts: string[];
}

export interface DynamicPatchNotesPayload {
  gameName: string;
  patchVersion: string;
  rawNotes: string;
}

export interface SentimentAnalysisPayload {
  gameName: string;
  reviewExcerpts: string[];
  totalReviewCount: number;
}

export interface ReviewExtractorPayload {
  gameName: string;
  reviewExcerpts: string[];
}

export interface LocalizationPayload {
  sourceLanguage: string;
  sourceText: string;
  targetLanguages: string[];
  context?: string;
}

export interface RegionalPricingPayload {
  gameName: string;
  baseCurrency: string;
  basePriceCents: number;
  currentRegional: { countryCode: string; currency: string; cents: number }[];
  macroNote?: string;
}

export interface BugTriagePayload {
  gameName: string;
  buildVersion: string;
  crashDumps: { signature: string; occurrences: number; sampleStack: string }[];
}

export interface ModConflictPayload {
  gameName: string;
  installedMods: { id: string; name: string; version: string; loadOrder: number }[];
  crashLogTail: string;
}

export interface HardwareOptimizerPayload {
  gameName: string;
  cpuModel: string;
  gpuModel: string;
  ramGB: number;
  targetFps: number;
  resolution: string;
  currentSettings?: string;
}

export interface InfluencerDiscoveryPayload {
  gameName: string;
  genres: string[];
  tags: string[];
  excludeHandles?: string[];
}

export interface StuckAssistantPayload {
  gameName: string;
  currentObjective?: string;
  recentInputs?: string;
  playerQuestion?: string;
}

export interface StoreCuratorPayload {
  userMessage: string;
  history?: { role: "user" | "assistant"; content: string }[];
  candidateGames: {
    id: string;
    name: string;
    genres: string[];
    tags: string[];
    shortDesc: string;
  }[];
}
