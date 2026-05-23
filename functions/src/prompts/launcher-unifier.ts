import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface LauncherUnifierPayload {
  query: string;
  libraryByLauncher: {
    launcher: string;
    games: { id: string; name: string; installed: boolean }[];
  }[];
}

export interface LauncherUnifierAlternative {
  gameId: string;
  launcher: string;
  name: string;
  note?: string;
}

export interface LauncherUnifierResult {
  intent: "launch" | "search" | "compare-price" | "install" | "unknown";
  matchedGameId?: string;
  matchedLauncher?: string;
  matchedGameName?: string;
  alternatives: LauncherUnifierAlternative[];
  reply: string;
}

export const launcherUnifier: PromptModule<LauncherUnifierPayload, LauncherUnifierResult> = {
  featureKey: "launcher-unifier",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0,
  cacheable: false,
  systemInstruction:
    "You are Dreamworks' cross-launcher router. The user owns games across Steam, Epic, GOG, EA, Ubisoft, Battle.net, Xbox, PSN. " +
    "Given a natural-language query like 'launch Hollow Knight' or 'where's Halo', identify their INTENT (launch/search/compare-price/install/unknown) and the BEST match (gameId + launcher). " +
    "Prefer the launcher where the game is already INSTALLED. If the same game exists on multiple launchers, list the others as alternatives. " +
    "If no match, set intent='unknown' and explain why in 'reply'. Reply is short, action-oriented (<140 chars). Return strict JSON.",
  responseSchema: {
    type: "object",
    properties: {
      intent: {
        type: "string",
        enum: ["launch", "search", "compare-price", "install", "unknown"],
      },
      matchedGameId: { type: "string" },
      matchedLauncher: { type: "string" },
      matchedGameName: { type: "string" },
      alternatives: {
        type: "array",
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            gameId: { type: "string" },
            launcher: { type: "string" },
            name: { type: "string" },
            note: { type: "string", maxLength: 80 },
          },
          required: ["gameId", "launcher", "name"],
          propertyOrdering: ["gameId", "launcher", "name", "note"],
        },
      },
      reply: { type: "string", maxLength: 200 },
    },
    required: ["intent", "alternatives", "reply"],
    propertyOrdering: [
      "intent",
      "matchedGameId",
      "matchedLauncher",
      "matchedGameName",
      "alternatives",
      "reply",
    ],
  },
  buildContents(p) {
    const blocks = p.libraryByLauncher.map((bucket) => {
      const lines = bucket.games
        .slice(0, 80)
        .map((g) => `  ${g.id} | ${g.name}${g.installed ? " [installed]" : ""}`)
        .join("\n");
      return `[${bucket.launcher}]\n${lines}`;
    });
    return [`User query: "${p.query}"`, "", "Owned games by launcher:", ...blocks].join("\n");
  },
  validate(parsed): LauncherUnifierResult {
    const obj = parsed as Partial<LauncherUnifierResult>;
    if (!obj.intent || !obj.reply) {
      throw new Error("launcher-unifier: missing intent or reply");
    }
    return {
      intent: obj.intent,
      matchedGameId: obj.matchedGameId ? String(obj.matchedGameId) : undefined,
      matchedLauncher: obj.matchedLauncher ? String(obj.matchedLauncher) : undefined,
      matchedGameName: obj.matchedGameName ? String(obj.matchedGameName) : undefined,
      alternatives: Array.isArray(obj.alternatives)
        ? obj.alternatives.map((a) => ({
            gameId: String(a.gameId ?? ""),
            launcher: String(a.launcher ?? ""),
            name: String(a.name ?? ""),
            note: a.note ? String(a.note) : undefined,
          }))
        : [],
      reply: String(obj.reply),
    };
  },
};
