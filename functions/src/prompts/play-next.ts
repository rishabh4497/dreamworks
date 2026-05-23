import { MODEL_FLASH_LITE } from "../models.js";
import type { PromptModule } from "./types.js";

export interface PlayNextPayload {
  ownedGames: {
    id: string;
    name: string;
    genres: string[];
    tags: string[];
    playMinutes: number;
    completionPct?: number;
    lastPlayed?: string | null;
    metaScore?: number;
    mainHours?: number;
  }[];
  favoriteGenres?: string[];
  moodHint?: string;
  availableMinutes?: number;
}

export interface PlayNextPick {
  gameId: string;
  reason: string;
  sessionMinutes: number;
  vibe: string;
}

export interface PlayNextResult {
  topPickGameId: string;
  picks: PlayNextPick[];
  encouragement: string;
}

export const playNext: PromptModule<PlayNextPayload, PlayNextResult> = {
  featureKey: "play-next",
  promptVersion: "v1",
  model: MODEL_FLASH_LITE,
  useThinking: false,
  temperature: 0.3,
  cacheable: false,
  systemInstruction:
    "You are Dreamworks' backlog strategist. Given a player's owned library + recent play history + (optional) mood and available time, " +
    "recommend exactly 3 games to play next. Prefer games with <60min played but evidence the player would like (matches their top genres or play patterns). " +
    "For each pick give a short, personal reason that references their history (e.g. 'You 100%-d Hades — Dead Cells has the same loop'). " +
    "Each reason must be under 140 chars. Pick a topPickGameId from the 3 picks. Return strict JSON.",
  responseSchema: {
    type: "object",
    properties: {
      topPickGameId: { type: "string" },
      picks: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            gameId: { type: "string" },
            reason: { type: "string", maxLength: 200 },
            sessionMinutes: { type: "integer", minimum: 10, maximum: 600 },
            vibe: { type: "string", maxLength: 30 },
          },
          required: ["gameId", "reason", "sessionMinutes", "vibe"],
          propertyOrdering: ["gameId", "vibe", "sessionMinutes", "reason"],
        },
      },
      encouragement: { type: "string", maxLength: 180 },
    },
    required: ["topPickGameId", "picks", "encouragement"],
    propertyOrdering: ["topPickGameId", "picks", "encouragement"],
  },
  buildContents(p) {
    const recent = [...p.ownedGames]
      .filter((g) => g.playMinutes > 30)
      .sort((a, b) => (b.lastPlayed ?? "").localeCompare(a.lastPlayed ?? ""))
      .slice(0, 8);
    const unplayed = p.ownedGames
      .filter((g) => g.playMinutes < 60)
      .slice(0, 40);
    const fmt = (g: PlayNextPayload["ownedGames"][number]) => {
      const parts = [
        g.genres.slice(0, 2).join("/"),
        g.tags.slice(0, 3).join(", "),
        `${Math.round(g.playMinutes / 60)}h`,
        g.metaScore ? `meta ${g.metaScore}` : null,
        g.mainHours ? `~${g.mainHours}h main` : null,
        g.completionPct != null ? `${Math.round(g.completionPct)}% done` : null,
      ]
        .filter(Boolean)
        .join(" | ");
      return `${g.id} | ${g.name} | ${parts}`;
    };
    return [
      "RECENTLY PLAYED:",
      ...recent.map(fmt),
      "",
      "BACKLOG (unplayed or barely played, pick from here):",
      ...unplayed.map(fmt),
      "",
      p.favoriteGenres?.length ? `Favorite genres: ${p.favoriteGenres.join(", ")}` : "",
      p.moodHint ? `Mood: ${p.moodHint}` : "",
      p.availableMinutes ? `Time available: ${p.availableMinutes} min` : "",
    ]
      .filter(Boolean)
      .join("\n");
  },
  validate(parsed): PlayNextResult {
    const obj = parsed as Partial<PlayNextResult>;
    if (!Array.isArray(obj.picks) || obj.picks.length === 0) {
      throw new Error("play-next: picks must be a non-empty array");
    }
    return {
      topPickGameId: String(obj.topPickGameId ?? obj.picks[0]?.gameId ?? ""),
      picks: obj.picks.map((p) => ({
        gameId: String(p.gameId ?? ""),
        reason: String(p.reason ?? ""),
        sessionMinutes: Math.max(10, Math.round(Number(p.sessionMinutes) || 60)),
        vibe: String(p.vibe ?? ""),
      })),
      encouragement: String(obj.encouragement ?? ""),
    };
  },
};
