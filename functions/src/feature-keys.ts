/**
 * Server-side copy of the client `src/lib/ai/feature-keys.ts` union.
 * Kept in sync manually — the list is small and changes rarely.
 */
export const AI_FEATURE_KEYS = [
  "game-overview",
  "review-summarizer",
  "dynamic-patch-notes",
  "sentiment-analysis",
  "review-extractor",
  "localization",
  "regional-pricing",
  "bug-triage",
  "mod-conflict-resolver",
  "hardware-optimizer",
  "influencer-discovery",
  "stuck-assistant",
  "store-curator",
  "publisher-overview",
  "developer-overview",
] as const;

export type AIFeatureKey = (typeof AI_FEATURE_KEYS)[number];
