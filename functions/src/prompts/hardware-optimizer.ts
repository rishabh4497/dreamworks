import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface HardwareOptimizerPayload {
  gameName: string;
  cpuModel: string;
  gpuModel: string;
  ramGB: number;
  targetFps: number;
  resolution: string; // e.g. "1920x1080"
  currentSettings?: string; // human-readable snapshot
}

export interface HardwareOptimizerResult {
  targetFps: number;
  estimatedAvgFps: number;
  iniTweaks: { setting: string; value: string; rationale: string }[];
}

export const hardwareOptimizer: PromptModule<HardwareOptimizerPayload, HardwareOptimizerResult> = {
  featureKey: "hardware-optimizer",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "Recommend graphics .ini tweaks for a player who wants stable target FPS at their resolution. " +
    "Each tweak is a setting name, a recommended value, and a short rationale. Never recommend changes outside the engine's documented config. JSON only.",
  responseSchema: {
    type: "object",
    properties: {
      targetFps: { type: "integer", minimum: 30, maximum: 360 },
      estimatedAvgFps: { type: "integer", minimum: 0 },
      iniTweaks: {
        type: "array",
        minItems: 1,
        maxItems: 20,
        items: {
          type: "object",
          properties: {
            setting: { type: "string", maxLength: 80 },
            value: { type: "string", maxLength: 60 },
            rationale: { type: "string", maxLength: 200 },
          },
          required: ["setting", "value", "rationale"],
        },
      },
    },
    required: ["targetFps", "estimatedAvgFps", "iniTweaks"],
  },
  buildContents(p) {
    return [
      `Game: ${p.gameName}`,
      `CPU: ${p.cpuModel}`,
      `GPU: ${p.gpuModel}`,
      `RAM: ${p.ramGB} GB`,
      `Resolution: ${p.resolution}`,
      `Target FPS: ${p.targetFps}`,
      p.currentSettings ? `Current settings:\n${p.currentSettings}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  },
  validate(parsed): HardwareOptimizerResult {
    return parsed as HardwareOptimizerResult;
  },
};
