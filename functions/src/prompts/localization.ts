import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface LocalizationPayload {
  sourceLanguage: string;
  sourceText: string;
  targetLanguages: string[]; // ISO codes, e.g. ["fr", "de", "ja", "ko", "pt-BR", "es", "zh-CN", "ru"]
  context?: string; // e.g. "Store page short description", "UI tooltip"
}

export interface LocalizationResult {
  translations: Record<string, string>;
}

export const localization: PromptModule<LocalizationPayload, LocalizationResult> = {
  featureKey: "localization",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "You are a video-game store localization specialist. Translate the source text into each target language naturally — " +
    "match the marketing tone of major storefronts. Preserve product names. Return a JSON object where keys are ISO language codes.",
  responseSchema: {
    type: "object",
    properties: {
      translations: {
        type: "object",
        additionalProperties: { type: "string", maxLength: 4000 },
      },
    },
    required: ["translations"],
  },
  buildContents(p) {
    return [
      `Source language: ${p.sourceLanguage}`,
      p.context ? `Context: ${p.context}` : null,
      `Target languages: ${p.targetLanguages.join(", ")}`,
      "Source text:",
      p.sourceText,
    ]
      .filter(Boolean)
      .join("\n");
  },
  validate(parsed): LocalizationResult {
    return parsed as LocalizationResult;
  },
};
