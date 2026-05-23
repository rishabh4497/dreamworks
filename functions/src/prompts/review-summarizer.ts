import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface ReviewSummarizerPayload {
  gameName: string;
  reviewExcerpts: string[];
}

export interface ReviewSummarizerResult {
  themes: { label: string; count: number; sentiment: "positive" | "neutral" | "negative" }[];
  tldr: string;
}

export const reviewSummarizer: PromptModule<ReviewSummarizerPayload, ReviewSummarizerResult> = {
  featureKey: "review-summarizer",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "Identify the 4-6 dominant themes across the provided reviews. For each, give a 2-4 word label, " +
    "estimate how many of the supplied excerpts mention it, and classify sentiment. Finish with a one-sentence TLDR. JSON only.",
  responseSchema: {
    type: "object",
    properties: {
      themes: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            label: { type: "string", maxLength: 60 },
            count: { type: "integer", minimum: 0 },
            sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
          },
          required: ["label", "count", "sentiment"],
        },
      },
      tldr: { type: "string", maxLength: 320 },
    },
    required: ["themes", "tldr"],
  },
  buildContents(p) {
    return [
      `Game: ${p.gameName}`,
      `Reviews (${p.reviewExcerpts.length}):`,
      ...p.reviewExcerpts.slice(0, 50).map((r, i) => `[${i + 1}] ${r}`),
    ].join("\n");
  },
  validate(parsed): ReviewSummarizerResult {
    const obj = parsed as ReviewSummarizerResult;
    if (!obj.themes || !obj.tldr) throw new Error("review-summarizer: missing fields");
    return obj;
  },
};
