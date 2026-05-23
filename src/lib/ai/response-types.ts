/**
 * Strict response shapes for each AI feature. The Cloud Function validates
 * Gemini's output against the matching `responseSchema`, so by the time these
 * land on the client they're guaranteed to be well-formed.
 */
import type { AIOverview } from "@/lib/types";

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface ReviewTheme {
  label: string;
  count: number;
  sentiment: SentimentLabel;
}

export interface ReviewSummary {
  themes: ReviewTheme[];
  tldr: string;
}

export interface PatchNoteSection {
  heading: string;
  bullets: string[];
}

export interface PlainEnglishPatchNotes {
  summary: string;
  sections: PatchNoteSection[];
}

export interface SentimentAnalysisResult {
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  drivers: string[];
  mostPraised: { topic: string; mentions: number };
  mostCriticized: { topic: string; mentions: number };
  executiveSummary: string;
}

export interface ReviewExtractorResult {
  topComplaints: { text: string; sharePct: number }[];
  topPraises: { text: string; sharePct: number }[];
}

export interface LocalizationResult {
  translations: Record<string, string>;
}

export interface RegionalPricingSuggestion {
  countryCode: string;
  countryName: string;
  currency: string;
  suggestedCents: number;
  currentCents: number;
  reason: string;
  direction: "increase" | "decrease" | "hold";
}

export interface RegionalPricingResult {
  regions: RegionalPricingSuggestion[];
}

export interface BugTriageCluster {
  rank: number;
  title: string;
  affectedUsers: number;
  priority: "critical" | "high" | "medium" | "low";
  rootCauseHypothesis: string;
  suggestedFix: string;
}

export interface BugTriageResult {
  clusters: BugTriageCluster[];
}

export interface ModConflictResult {
  culprits: { modId: string; modName: string; confidencePct: number; reason: string }[];
  safeToReenable: string[];
}

export interface HardwareOptimizerResult {
  targetFps: number;
  estimatedAvgFps: number;
  iniTweaks: { setting: string; value: string; rationale: string }[];
}

export interface InfluencerCandidate {
  platform: "twitch" | "youtube";
  handle: string;
  audienceSize: number;
  averageViewers?: number;
  fitScore: number;
  reason: string;
}

export interface InfluencerDiscoveryResult {
  creators: InfluencerCandidate[];
}

export interface StuckAssistantResult {
  hint: string;
  spoilerLevel: "none" | "light" | "moderate";
}

export interface StoreCuratorResult {
  reply: string;
  suggestedGameIds: string[];
}

/** Mapping from feature key → response type. Drives `useAI*` hook typing. */
export type AIResponseMap = {
  "game-overview": AIOverview;
  "review-summarizer": ReviewSummary;
  "dynamic-patch-notes": PlainEnglishPatchNotes;
  "sentiment-analysis": SentimentAnalysisResult;
  "review-extractor": ReviewExtractorResult;
  localization: LocalizationResult;
  "regional-pricing": RegionalPricingResult;
  "bug-triage": BugTriageResult;
  "mod-conflict-resolver": ModConflictResult;
  "hardware-optimizer": HardwareOptimizerResult;
  "influencer-discovery": InfluencerDiscoveryResult;
  "stuck-assistant": StuckAssistantResult;
  "store-curator": StoreCuratorResult;
};
