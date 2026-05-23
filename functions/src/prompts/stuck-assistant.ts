import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface StuckAssistantPayload {
  gameName: string;
  currentObjective?: string;
  recentInputs?: string; // brief summary of last few minutes of player activity
  playerQuestion?: string;
}

export interface StuckAssistantResult {
  hint: string;
  spoilerLevel: "none" | "light" | "moderate";
}

export const stuckAssistant: PromptModule<StuckAssistantPayload, StuckAssistantResult> = {
  featureKey: "stuck-assistant",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0.4,
  cacheable: false, // per-player; do not cache
  systemInstruction:
    "You are an in-game hints assistant. Give the smallest hint that unblocks the player. " +
    "Never reveal puzzle solutions, story twists, or unlockable items unless the player explicitly asks. " +
    "Default spoiler level is 'none' — escalate only if the player asks. Two sentences max. JSON only.",
  responseSchema: {
    type: "object",
    properties: {
      hint: { type: "string", maxLength: 400 },
      spoilerLevel: { type: "string", enum: ["none", "light", "moderate"] },
    },
    required: ["hint", "spoilerLevel"],
  },
  buildContents(p) {
    return [
      `Game: ${p.gameName}`,
      p.currentObjective ? `Objective: ${p.currentObjective}` : null,
      p.recentInputs ? `Recent activity: ${p.recentInputs}` : null,
      p.playerQuestion ? `Player asks: ${p.playerQuestion}` : "Player appears stuck.",
    ]
      .filter(Boolean)
      .join("\n");
  },
  validate(parsed): StuckAssistantResult {
    return parsed as StuckAssistantResult;
  },
};
