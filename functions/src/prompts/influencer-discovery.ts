import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface InfluencerDiscoveryPayload {
  gameName: string;
  genres: string[];
  tags: string[];
  excludeHandles?: string[];
}

export interface InfluencerDiscoveryResult {
  creators: {
    platform: "twitch" | "youtube";
    handle: string;
    audienceSize: number;
    averageViewers?: number;
    fitScore: number;
    reason: string;
  }[];
}

export const influencerDiscovery: PromptModule<
  InfluencerDiscoveryPayload,
  InfluencerDiscoveryResult
> = {
  featureKey: "influencer-discovery",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "Suggest Twitch and YouTube creators who are a plausible fit for a game given its genres and tags. " +
    "fitScore is a 0-100 integer. Only suggest creators who plausibly exist and have published content in the listed genres. " +
    "Don't fabricate audience numbers; give a conservative estimate range as a single integer when uncertain. JSON only.",
  responseSchema: {
    type: "object",
    properties: {
      creators: {
        type: "array",
        minItems: 1,
        maxItems: 12,
        items: {
          type: "object",
          properties: {
            platform: { type: "string", enum: ["twitch", "youtube"] },
            handle: { type: "string", maxLength: 60 },
            audienceSize: { type: "integer", minimum: 0 },
            averageViewers: { type: "integer", minimum: 0 },
            fitScore: { type: "integer", minimum: 0, maximum: 100 },
            reason: { type: "string", maxLength: 240 },
          },
          required: ["platform", "handle", "audienceSize", "fitScore", "reason"],
        },
      },
    },
    required: ["creators"],
  },
  buildContents(p) {
    return [
      `Game: ${p.gameName}`,
      `Genres: ${p.genres.join(", ")}`,
      `Tags: ${p.tags.join(", ")}`,
      p.excludeHandles?.length ? `Exclude: ${p.excludeHandles.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  },
  validate(parsed): InfluencerDiscoveryResult {
    return parsed as InfluencerDiscoveryResult;
  },
};
