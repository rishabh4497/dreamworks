import type { AIFeatureKey } from "../feature-keys.js";

/**
 * Contract every prompt module exports. The proxy iterates over a registry
 * built from these modules and never reaches inside `@google/genai` types
 * directly — this keeps the wire format swap-able if we ever change SDKs.
 *
 * `responseSchema` is the Gemini OpenAPI-style schema (sent as-is to the API).
 * `validate` runs after `JSON.parse` to enforce semantic constraints the
 * schema alone can't (e.g. percentages summing to 100).
 */
export interface PromptModule<TPayload, TResult> {
  featureKey: AIFeatureKey;
  promptVersion: string;
  model: string;
  /** Cheap-and-fast Flash-Lite vs reasoning Flash. */
  useThinking: boolean;
  /** Deterministic features (cached) set temperature 0; chat features use 0.7. */
  temperature: number;
  cacheable: boolean;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  buildContents(payload: TPayload): string;
  validate(parsed: unknown): TResult;
}
