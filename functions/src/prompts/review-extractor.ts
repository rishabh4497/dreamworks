import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface ReviewExtractorPayload {
  gameName: string;
  reviewExcerpts: string[];
}

export interface ReviewExtractorResult {
  topComplaints: { text: string; sharePct: number }[];
  topPraises: { text: string; sharePct: number }[];
}

export const reviewExtractor: PromptModule<ReviewExtractorPayload, ReviewExtractorResult> = {
  featureKey: "review-extractor",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "Extract the top 3-5 complaints (from negative reviews) and top 3-5 praises (from positive reviews) of a game. " +
    "Each item is a concrete, ~10-word phrase plus an estimated share-of-mentions percentage within its bucket. JSON only.",
  responseSchema: {
    type: "object",
    properties: {
      topComplaints: {
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            text: { type: "string", maxLength: 140 },
            sharePct: { type: "integer", minimum: 0, maximum: 100 },
          },
          required: ["text", "sharePct"],
        },
      },
      topPraises: {
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            text: { type: "string", maxLength: 140 },
            sharePct: { type: "integer", minimum: 0, maximum: 100 },
          },
          required: ["text", "sharePct"],
        },
      },
    },
    required: ["topComplaints", "topPraises"],
  },
  buildContents(p) {
    return [
      `Game: ${p.gameName}`,
      `Reviews (${p.reviewExcerpts.length}):`,
      ...p.reviewExcerpts.slice(0, 100).map((r, i) => `[${i + 1}] ${r}`),
    ].join("\n");
  },
  validate(parsed): ReviewExtractorResult {
    return parsed as ReviewExtractorResult;
  },
};
