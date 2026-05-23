import { useMutation, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { callGemini } from "@/lib/api/gemini";
import type { AIFeatureKey } from "@/lib/ai/feature-keys";
import type { AIResponseMap } from "@/lib/ai/response-types";

export const aiKeys = {
  all: ["ai"] as const,
  feature: <K extends AIFeatureKey>(key: K, payload: unknown) =>
    [...aiKeys.all, key, payload] as const,
};

/**
 * Generic query hook — fetch a cacheable AI result by feature + payload. Use
 * this for any deterministic feature (game overview, summarizer, etc).
 * 30-min staleTime; Firestore cache on the server makes refetches free.
 */
export function useAIFeature<K extends AIFeatureKey, TPayload>(
  featureKey: K,
  payload: TPayload | null | undefined,
  options?: Omit<
    UseQueryOptions<AIResponseMap[K], Error, AIResponseMap[K]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<AIResponseMap[K], Error>({
    queryKey: aiKeys.feature(featureKey, payload),
    queryFn: async () => {
      const { result } = await callGemini(featureKey, payload as TPayload);
      return result;
    },
    enabled: payload != null,
    staleTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Mutation hook for one-shot AI calls triggered by a user action
 * (button click, chat send). Use this for non-deterministic features
 * (store curator) and on-demand kickoffs (bug triage, localization).
 */
export function useAIAction<K extends AIFeatureKey, TPayload>(featureKey: K) {
  return useMutation<AIResponseMap[K], Error, TPayload>({
    mutationFn: async (payload: TPayload) => {
      const { result } = await callGemini(featureKey, payload);
      return result;
    },
  });
}

// ── Per-feature convenience hooks. Each wraps useAIFeature or useAIAction
// with the payload-shape baked in, so callers can't pass the wrong fields.

import type {
  GameOverviewPayload,
  ReviewSummarizerPayload,
  DynamicPatchNotesPayload,
  SentimentAnalysisPayload,
  ReviewExtractorPayload,
  LocalizationPayload,
  RegionalPricingPayload,
  BugTriagePayload,
  ModConflictPayload,
  HardwareOptimizerPayload,
  InfluencerDiscoveryPayload,
  StuckAssistantPayload,
  StoreCuratorPayload,
  StudioOverviewPayload,
} from "@/lib/ai/payload-types";

export function useAIGameOverview(payload: GameOverviewPayload | null | undefined) {
  return useAIFeature("game-overview", payload);
}

export function useAIReviewSummary(payload: ReviewSummarizerPayload | null | undefined) {
  return useAIFeature("review-summarizer", payload);
}

export function useAIPatchNotes(payload: DynamicPatchNotesPayload | null | undefined) {
  return useAIFeature("dynamic-patch-notes", payload);
}

export function useAISentiment(payload: SentimentAnalysisPayload | null | undefined) {
  return useAIFeature("sentiment-analysis", payload);
}

export function useAIReviewExtractor(payload: ReviewExtractorPayload | null | undefined) {
  return useAIFeature("review-extractor", payload);
}

export function useAILocalize() {
  return useAIAction<"localization", LocalizationPayload>("localization");
}

export function useAIRegionalPricing(payload: RegionalPricingPayload | null | undefined) {
  return useAIFeature("regional-pricing", payload);
}

export function useAIBugTriage(payload: BugTriagePayload | null | undefined) {
  return useAIFeature("bug-triage", payload);
}

export function useAIModConflict() {
  return useAIAction<"mod-conflict-resolver", ModConflictPayload>("mod-conflict-resolver");
}

export function useAIHardwareOptimizer() {
  return useAIAction<"hardware-optimizer", HardwareOptimizerPayload>("hardware-optimizer");
}

export function useAIInfluencerDiscovery(payload: InfluencerDiscoveryPayload | null | undefined) {
  return useAIFeature("influencer-discovery", payload);
}

export function useAIStuckAssistant() {
  return useAIAction<"stuck-assistant", StuckAssistantPayload>("stuck-assistant");
}

export function useAIStoreCurator() {
  return useAIAction<"store-curator", StoreCuratorPayload>("store-curator");
}

export function useAIDeveloperOverview(payload: StudioOverviewPayload | null | undefined) {
  return useAIFeature("developer-overview", payload);
}

export function useAIPublisherOverview(payload: StudioOverviewPayload | null | undefined) {
  return useAIFeature("publisher-overview", payload);
}
