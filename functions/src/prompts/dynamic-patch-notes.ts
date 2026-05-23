import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface DynamicPatchNotesPayload {
  gameName: string;
  patchVersion: string;
  rawNotes: string;
}

export interface DynamicPatchNotesResult {
  summary: string;
  sections: { heading: string; bullets: string[] }[];
}

export const dynamicPatchNotes: PromptModule<
  DynamicPatchNotesPayload,
  DynamicPatchNotesResult
> = {
  featureKey: "dynamic-patch-notes",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "Rewrite technical patch notes into plain English a casual player can understand. " +
    "Group changes into sections (e.g. 'Combat', 'Performance', 'Bug fixes'). " +
    "Lead with a one-sentence summary, then sectioned bullets. JSON only.",
  responseSchema: {
    type: "object",
    properties: {
      summary: { type: "string", maxLength: 280 },
      sections: {
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            heading: { type: "string", maxLength: 60 },
            bullets: {
              type: "array",
              minItems: 1,
              maxItems: 12,
              items: { type: "string", maxLength: 240 },
            },
          },
          required: ["heading", "bullets"],
        },
      },
    },
    required: ["summary", "sections"],
  },
  buildContents(p) {
    return [`Game: ${p.gameName}`, `Patch: ${p.patchVersion}`, "Raw notes:", p.rawNotes].join("\n");
  },
  validate(parsed): DynamicPatchNotesResult {
    return parsed as DynamicPatchNotesResult;
  },
};
