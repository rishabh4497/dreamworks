import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface StoreCuratorPayload {
  userMessage: string;
  history?: { role: "user" | "assistant"; content: string }[];
  candidateGames: { id: string; name: string; genres: string[]; tags: string[]; shortDesc: string }[];
}

export interface StoreCuratorResult {
  reply: string;
  suggestedGameIds: string[];
}

export const storeCurator: PromptModule<StoreCuratorPayload, StoreCuratorResult> = {
  featureKey: "store-curator",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0.7,
  cacheable: false, // chat is per-user, per-turn
  systemInstruction:
    "You are a friendly storefront game-recommendation chat assistant. Reply in 1-3 sentences, then return " +
    "the ids of 3-6 candidate games from the provided list that best match the user's request. Only pick from the candidates. JSON only.",
  responseSchema: {
    type: "object",
    properties: {
      reply: { type: "string", maxLength: 600 },
      suggestedGameIds: {
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: { type: "string", maxLength: 120 },
      },
    },
    required: ["reply", "suggestedGameIds"],
  },
  buildContents(p) {
    const historyBlock = (p.history ?? [])
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
    const candidateBlock = p.candidateGames
      .slice(0, 40)
      .map(
        (g) =>
          `- ${g.id} | ${g.name} | ${g.genres.join("/")} | tags: ${g.tags.join(", ")} | ${g.shortDesc}`,
      )
      .join("\n");
    return [
      historyBlock ? `Conversation so far:\n${historyBlock}` : null,
      `User: ${p.userMessage}`,
      "Candidate games:",
      candidateBlock,
    ]
      .filter(Boolean)
      .join("\n\n");
  },
  validate(parsed): StoreCuratorResult {
    const o = parsed as StoreCuratorResult;
    if (!Array.isArray(o.suggestedGameIds)) o.suggestedGameIds = [];
    return o;
  },
};
