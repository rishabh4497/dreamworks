import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface GameOverviewPayload {
  gameName: string;
  studio?: string;
  genres?: string[];
  releaseYear?: number;
  reviewExcerpts: string[];
  totalReviewCount: number;
}

export interface GameOverviewResult {
  pros: string[];
  cons: string[];
  basedOnReviewCount: number;
  updatedAt: string;
}

export const gameOverview: PromptModule<GameOverviewPayload, GameOverviewResult> = {
  featureKey: "game-overview",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "You are Dreamworks' review-aggregating editor. Read player reviews of a single video game and produce two terse, factual pros and one to two cons. " +
    "Each bullet must be under 130 characters, mention specific systems/characters/DLC where possible, and avoid generic praise. " +
    "Do not editorialize, do not invent details that aren't in the reviews. Return strict JSON matching the provided schema.",
  responseSchema: {
    type: "object",
    properties: {
      pros: {
        type: "array",
        items: { type: "string", maxLength: 200 },
        minItems: 1,
        maxItems: 3,
      },
      cons: {
        type: "array",
        items: { type: "string", maxLength: 200 },
        minItems: 1,
        maxItems: 2,
      },
    },
    required: ["pros", "cons"],
    propertyOrdering: ["pros", "cons"],
  },
  buildContents(p) {
    const meta = [
      p.studio ? `Studio: ${p.studio}` : null,
      p.genres?.length ? `Genres: ${p.genres.join(", ")}` : null,
      p.releaseYear ? `Released: ${p.releaseYear}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    return [
      `Game: ${p.gameName}`,
      meta,
      `Aggregating ${p.totalReviewCount.toLocaleString()} reviews. Representative excerpts:`,
      ...p.reviewExcerpts.slice(0, 25).map((r, i) => `[${i + 1}] ${r}`),
    ]
      .filter(Boolean)
      .join("\n");
  },
  validate(parsed): GameOverviewResult {
    const obj = parsed as { pros?: unknown; cons?: unknown };
    if (!Array.isArray(obj.pros) || !Array.isArray(obj.cons)) {
      throw new Error("game-overview: pros/cons must be string arrays");
    }
    return {
      pros: (obj.pros as unknown[]).map(String),
      cons: (obj.cons as unknown[]).map(String),
      basedOnReviewCount: 0, // filled in by proxy from payload.totalReviewCount
      updatedAt: new Date().toISOString(),
    };
  },
};
