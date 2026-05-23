import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface SentimentAnalysisPayload {
  gameName: string;
  reviewExcerpts: string[];
  totalReviewCount: number;
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

export const sentimentAnalysis: PromptModule<
  SentimentAnalysisPayload,
  SentimentAnalysisResult
> = {
  featureKey: "sentiment-analysis",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "Analyze sentiment across the provided game reviews. Output integer percentages summing to 100, " +
    "the top 3-5 sentiment drivers, the single most praised topic + estimated mentions, the single most criticized topic + mentions, " +
    "and a 2-3 sentence executive summary that flags any action item for the development team. JSON only.",
  responseSchema: {
    type: "object",
    properties: {
      positivePct: { type: "integer", minimum: 0, maximum: 100 },
      neutralPct: { type: "integer", minimum: 0, maximum: 100 },
      negativePct: { type: "integer", minimum: 0, maximum: 100 },
      drivers: { type: "array", items: { type: "string", maxLength: 100 }, minItems: 1, maxItems: 6 },
      mostPraised: {
        type: "object",
        properties: {
          topic: { type: "string", maxLength: 80 },
          mentions: { type: "integer", minimum: 0 },
        },
        required: ["topic", "mentions"],
      },
      mostCriticized: {
        type: "object",
        properties: {
          topic: { type: "string", maxLength: 80 },
          mentions: { type: "integer", minimum: 0 },
        },
        required: ["topic", "mentions"],
      },
      executiveSummary: { type: "string", maxLength: 600 },
    },
    required: [
      "positivePct",
      "neutralPct",
      "negativePct",
      "drivers",
      "mostPraised",
      "mostCriticized",
      "executiveSummary",
    ],
  },
  buildContents(p) {
    return [
      `Game: ${p.gameName}`,
      `Total reviews: ${p.totalReviewCount}`,
      `Sample (${p.reviewExcerpts.length}):`,
      ...p.reviewExcerpts.slice(0, 80).map((r, i) => `[${i + 1}] ${r}`),
    ].join("\n");
  },
  validate(parsed): SentimentAnalysisResult {
    const o = parsed as SentimentAnalysisResult;
    const sum = o.positivePct + o.neutralPct + o.negativePct;
    if (Math.abs(sum - 100) > 2) {
      // Allow ±2 rounding; rebalance otherwise.
      const scale = 100 / sum;
      o.positivePct = Math.round(o.positivePct * scale);
      o.neutralPct = Math.round(o.neutralPct * scale);
      o.negativePct = 100 - o.positivePct - o.neutralPct;
    }
    return o;
  },
};
