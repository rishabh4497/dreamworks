import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface WishlistSniperPayload {
  gameName: string;
  basePriceCents: number;
  currentPriceCents: number;
  historicalLowCents: number;
  historicalLowAt?: string;
  userRule: string;
  recentHistory: { date: string; cents: number }[];
}

export interface WishlistSniperResult {
  parsedRule: {
    thresholdCents?: number;
    percentOff?: number;
    atlOnly?: boolean;
    requireHistoricalLow?: boolean;
  };
  verdict: "buy-now" | "wait" | "watch" | "skip";
  verdictReason: string;
  predictedSaleWindowDays?: number;
  confidencePct: number;
  ruleSummary: string;
}

export const wishlistSniper: PromptModule<WishlistSniperPayload, WishlistSniperResult> = {
  featureKey: "wishlist-sniper",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "You are Dreamworks' wishlist price sniper. Parse the user's natural-language alert rule into a structured rule, " +
    "compare the current price + historical low + recent history, and return a buy/wait verdict. " +
    "Be concrete: cite specific dollar values and dates from the history. Verdict 'buy-now' is reserved for prices at or near the all-time low. " +
    "Confidence is your honest read of seasonal patterns. Return strict JSON matching the schema.",
  responseSchema: {
    type: "object",
    properties: {
      parsedRule: {
        type: "object",
        properties: {
          thresholdCents: { type: "integer" },
          percentOff: { type: "integer" },
          atlOnly: { type: "boolean" },
          requireHistoricalLow: { type: "boolean" },
        },
      },
      verdict: { type: "string", enum: ["buy-now", "wait", "watch", "skip"] },
      verdictReason: { type: "string", maxLength: 280 },
      predictedSaleWindowDays: { type: "integer" },
      confidencePct: { type: "integer", minimum: 0, maximum: 100 },
      ruleSummary: { type: "string", maxLength: 140 },
    },
    required: ["parsedRule", "verdict", "verdictReason", "confidencePct", "ruleSummary"],
    propertyOrdering: [
      "parsedRule",
      "verdict",
      "verdictReason",
      "predictedSaleWindowDays",
      "confidencePct",
      "ruleSummary",
    ],
  },
  buildContents(p) {
    const historyLines = p.recentHistory
      .slice(-12)
      .map((h) => `  ${h.date}: $${(h.cents / 100).toFixed(2)}`)
      .join("\n");
    return [
      `Game: ${p.gameName}`,
      `Base price: $${(p.basePriceCents / 100).toFixed(2)}`,
      `Current price: $${(p.currentPriceCents / 100).toFixed(2)}`,
      `Historical low: $${(p.historicalLowCents / 100).toFixed(2)}${p.historicalLowAt ? ` (${p.historicalLowAt})` : ""}`,
      `Recent history (oldest → newest):\n${historyLines}`,
      "",
      `User's alert rule: "${p.userRule}"`,
    ].join("\n");
  },
  validate(parsed): WishlistSniperResult {
    const obj = parsed as Partial<WishlistSniperResult>;
    if (!obj.verdict || !obj.verdictReason || typeof obj.confidencePct !== "number") {
      throw new Error("wishlist-sniper: missing required fields");
    }
    return {
      parsedRule: obj.parsedRule ?? {},
      verdict: obj.verdict,
      verdictReason: String(obj.verdictReason),
      predictedSaleWindowDays: obj.predictedSaleWindowDays,
      confidencePct: Math.max(0, Math.min(100, Math.round(obj.confidencePct))),
      ruleSummary: String(obj.ruleSummary ?? ""),
    };
  },
};
