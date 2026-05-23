import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface RegionalPricingPayload {
  gameName: string;
  baseCurrency: string; // e.g. "USD"
  basePriceCents: number;
  currentRegional: { countryCode: string; currency: string; cents: number }[];
  macroNote?: string; // e.g. "Argentina hyperinflation accelerating Q1 2026"
}

export interface RegionalPricingResult {
  regions: {
    countryCode: string;
    countryName: string;
    currency: string;
    suggestedCents: number;
    currentCents: number;
    reason: string;
    direction: "increase" | "decrease" | "hold";
  }[];
}

export const regionalPricing: PromptModule<RegionalPricingPayload, RegionalPricingResult> = {
  featureKey: "regional-pricing",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "You suggest regional video-game pricing adjustments based on purchasing-power parity and currency volatility. " +
    "For each region provided, suggest a new price (in local minor units / cents) and tag direction. Use short, factual reasons. " +
    "Don't invent macroeconomic claims. JSON only.",
  responseSchema: {
    type: "object",
    properties: {
      regions: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            countryCode: { type: "string", maxLength: 4 },
            countryName: { type: "string", maxLength: 60 },
            currency: { type: "string", maxLength: 6 },
            suggestedCents: { type: "integer", minimum: 0 },
            currentCents: { type: "integer", minimum: 0 },
            reason: { type: "string", maxLength: 160 },
            direction: { type: "string", enum: ["increase", "decrease", "hold"] },
          },
          required: [
            "countryCode",
            "countryName",
            "currency",
            "suggestedCents",
            "currentCents",
            "reason",
            "direction",
          ],
        },
      },
    },
    required: ["regions"],
  },
  buildContents(p) {
    return [
      `Game: ${p.gameName}`,
      `Base: ${p.basePriceCents} ${p.baseCurrency} cents`,
      p.macroNote ? `Macro note: ${p.macroNote}` : null,
      "Current regional prices:",
      ...p.currentRegional.map(
        (r) => `- ${r.countryCode} (${r.currency}): ${r.cents} cents`,
      ),
    ]
      .filter(Boolean)
      .join("\n");
  },
  validate(parsed): RegionalPricingResult {
    return parsed as RegionalPricingResult;
  },
};
