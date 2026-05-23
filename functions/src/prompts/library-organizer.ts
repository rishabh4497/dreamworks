import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface LibraryOrganizerPayload {
  games: {
    id: string;
    name: string;
    genres: string[];
    tags: string[];
    playMinutes: number;
    completionPct?: number;
    lastPlayed?: string | null;
  }[];
  userPrompt?: string;
}

export interface OrganizerCollection {
  name: string;
  description: string;
  emoji: string;
  mood: string;
  gameIds: string[];
}

export interface LibraryOrganizerResult {
  collections: OrganizerCollection[];
  rationale: string;
}

export const libraryOrganizer: PromptModule<LibraryOrganizerPayload, LibraryOrganizerResult> = {
  featureKey: "library-organizer",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0.4,
  cacheable: true,
  systemInstruction:
    "You are Dreamworks' library curator. Group a user's owned games into 4–6 smart collections based on genre, tags, playtime, and recency. " +
    "Collection names should be vivid and human (e.g. 'Cozy night-in', 'Co-op chaos', 'Comfort replays', 'Backlog priority'). " +
    "Every collection needs a single emoji and a one-sentence description. Each game id from the input may appear in at most TWO collections. " +
    "If the user supplied a prompt, treat it as a filter or theme override. Return strict JSON.",
  responseSchema: {
    type: "object",
    properties: {
      collections: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            name: { type: "string", maxLength: 40 },
            description: { type: "string", maxLength: 160 },
            emoji: { type: "string", maxLength: 4 },
            mood: { type: "string", maxLength: 40 },
            gameIds: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
            },
          },
          required: ["name", "description", "emoji", "mood", "gameIds"],
          propertyOrdering: ["name", "emoji", "mood", "description", "gameIds"],
        },
      },
      rationale: { type: "string", maxLength: 240 },
    },
    required: ["collections", "rationale"],
    propertyOrdering: ["collections", "rationale"],
  },
  buildContents(p) {
    const gameLines = p.games
      .slice(0, 200)
      .map((g) => {
        const meta = [
          g.genres.slice(0, 3).join("/"),
          g.tags.slice(0, 4).join(", "),
          `${Math.round(g.playMinutes / 60)}h played`,
          g.completionPct != null ? `${Math.round(g.completionPct)}% complete` : null,
          g.lastPlayed ? `last: ${g.lastPlayed.slice(0, 10)}` : "never played",
        ]
          .filter(Boolean)
          .join(" | ");
        return `${g.id} | ${g.name} | ${meta}`;
      })
      .join("\n");
    return [
      `Library (${p.games.length} games):`,
      gameLines,
      p.userPrompt ? `\nUser intent: "${p.userPrompt}"` : "",
    ]
      .filter(Boolean)
      .join("\n");
  },
  validate(parsed): LibraryOrganizerResult {
    const obj = parsed as Partial<LibraryOrganizerResult>;
    if (!Array.isArray(obj.collections)) {
      throw new Error("library-organizer: collections must be an array");
    }
    return {
      collections: obj.collections.map((c) => ({
        name: String(c.name ?? ""),
        description: String(c.description ?? ""),
        emoji: String(c.emoji ?? "📁"),
        mood: String(c.mood ?? ""),
        gameIds: Array.isArray(c.gameIds) ? c.gameIds.map(String) : [],
      })),
      rationale: String(obj.rationale ?? ""),
    };
  },
};
