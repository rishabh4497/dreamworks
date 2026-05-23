import type { AIFeatureKey } from "../feature-keys.js";
import type { PromptModule } from "./types.js";

import { gameOverview } from "./game-overview.js";
import { reviewSummarizer } from "./review-summarizer.js";
import { dynamicPatchNotes } from "./dynamic-patch-notes.js";
import { sentimentAnalysis } from "./sentiment-analysis.js";
import { reviewExtractor } from "./review-extractor.js";
import { localization } from "./localization.js";
import { regionalPricing } from "./regional-pricing.js";
import { bugTriage } from "./bug-triage.js";
import { modConflictResolver } from "./mod-conflict-resolver.js";
import { hardwareOptimizer } from "./hardware-optimizer.js";
import { influencerDiscovery } from "./influencer-discovery.js";
import { stuckAssistant } from "./stuck-assistant.js";
import { storeCurator } from "./store-curator.js";

export const PROMPT_REGISTRY: Record<AIFeatureKey, PromptModule<unknown, unknown>> = {
  "game-overview": gameOverview as PromptModule<unknown, unknown>,
  "review-summarizer": reviewSummarizer as PromptModule<unknown, unknown>,
  "dynamic-patch-notes": dynamicPatchNotes as PromptModule<unknown, unknown>,
  "sentiment-analysis": sentimentAnalysis as PromptModule<unknown, unknown>,
  "review-extractor": reviewExtractor as PromptModule<unknown, unknown>,
  localization: localization as PromptModule<unknown, unknown>,
  "regional-pricing": regionalPricing as PromptModule<unknown, unknown>,
  "bug-triage": bugTriage as PromptModule<unknown, unknown>,
  "mod-conflict-resolver": modConflictResolver as PromptModule<unknown, unknown>,
  "hardware-optimizer": hardwareOptimizer as PromptModule<unknown, unknown>,
  "influencer-discovery": influencerDiscovery as PromptModule<unknown, unknown>,
  "stuck-assistant": stuckAssistant as PromptModule<unknown, unknown>,
  "store-curator": storeCurator as PromptModule<unknown, unknown>,
};

export function getPromptModule(key: string): PromptModule<unknown, unknown> | null {
  return (PROMPT_REGISTRY as Record<string, PromptModule<unknown, unknown>>)[key] ?? null;
}
