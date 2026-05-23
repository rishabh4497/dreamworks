/**
 * Every AI-touchpoint in the app is dispatched through the single `geminiProxy`
 * callable using one of these feature keys. Adding a new AI feature = add a
 * key here, create a prompt module in `functions/src/prompts/<key>.ts`, and
 * add a response type in `./response-types.ts`.
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
