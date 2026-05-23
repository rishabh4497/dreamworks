import { MODEL_FLASH_REASONING } from "../models.js";
import type { PromptModule } from "./types.js";

export interface BugTriagePayload {
  gameName: string;
  buildVersion: string;
  crashDumps: { signature: string; occurrences: number; sampleStack: string }[];
}

export interface BugTriageResult {
  clusters: {
    rank: number;
    title: string;
    affectedUsers: number;
    priority: "critical" | "high" | "medium" | "low";
    rootCauseHypothesis: string;
    suggestedFix: string;
  }[];
}

export const bugTriage: PromptModule<BugTriagePayload, BugTriageResult> = {
  featureKey: "bug-triage",
  promptVersion: "v1",
  model: MODEL_FLASH_REASONING,
  useThinking: true,
  temperature: 0,
  cacheable: true,
  systemInstruction:
    "You are a senior game engine engineer triaging automated crash reports. Cluster crashes by likely root cause, " +
    "rank by impact (occurrences × severity), propose a concrete root cause and a one-paragraph fix direction. JSON only.",
  responseSchema: {
    type: "object",
    properties: {
      clusters: {
        type: "array",
        minItems: 1,
        maxItems: 10,
        items: {
          type: "object",
          properties: {
            rank: { type: "integer", minimum: 1 },
            title: { type: "string", maxLength: 120 },
            affectedUsers: { type: "integer", minimum: 0 },
            priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
            rootCauseHypothesis: { type: "string", maxLength: 600 },
            suggestedFix: { type: "string", maxLength: 600 },
          },
          required: ["rank", "title", "affectedUsers", "priority", "rootCauseHypothesis", "suggestedFix"],
        },
      },
    },
    required: ["clusters"],
  },
  buildContents(p) {
    return [
      `Game: ${p.gameName}`,
      `Build: ${p.buildVersion}`,
      `${p.crashDumps.length} unique crash signatures:`,
      ...p.crashDumps.slice(0, 40).map(
        (d, i) =>
          `[${i + 1}] sig=${d.signature} hits=${d.occurrences}\nstack:\n${d.sampleStack}`,
      ),
    ].join("\n\n");
  },
  validate(parsed): BugTriageResult {
    return parsed as BugTriageResult;
  },
};
