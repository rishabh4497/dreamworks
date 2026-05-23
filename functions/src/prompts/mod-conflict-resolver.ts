import { MODEL_FLASH_REASONING } from "../models.js";
import type { PromptModule } from "./types.js";

export interface ModConflictPayload {
  gameName: string;
  installedMods: { id: string; name: string; version: string; loadOrder: number }[];
  crashLogTail: string; // last ~200 lines
}

export interface ModConflictResult {
  culprits: { modId: string; modName: string; confidencePct: number; reason: string }[];
  safeToReenable: string[];
}

export const modConflictResolver: PromptModule<ModConflictPayload, ModConflictResult> = {
  featureKey: "mod-conflict-resolver",
  promptVersion: "v1",
  model: MODEL_FLASH_REASONING,
  useThinking: true,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "You diagnose crashes in modded games. Given a crash log tail and installed mods, identify the most likely culprit mod(s) and " +
    "list any mods that look safe to re-enable after disabling the culprit. Confidence is a 0-100 integer. JSON only.",
  responseSchema: {
    type: "object",
    properties: {
      culprits: {
        type: "array",
        minItems: 0,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            modId: { type: "string", maxLength: 120 },
            modName: { type: "string", maxLength: 120 },
            confidencePct: { type: "integer", minimum: 0, maximum: 100 },
            reason: { type: "string", maxLength: 300 },
          },
          required: ["modId", "modName", "confidencePct", "reason"],
        },
      },
      safeToReenable: { type: "array", items: { type: "string", maxLength: 120 } },
    },
    required: ["culprits", "safeToReenable"],
  },
  buildContents(p) {
    return [
      `Game: ${p.gameName}`,
      "Installed mods (id | name | version | load order):",
      ...p.installedMods.map((m) => `${m.id} | ${m.name} | ${m.version} | ${m.loadOrder}`),
      "",
      "Crash log tail:",
      p.crashLogTail,
    ].join("\n");
  },
  validate(parsed): ModConflictResult {
    return parsed as ModConflictResult;
  },
};
