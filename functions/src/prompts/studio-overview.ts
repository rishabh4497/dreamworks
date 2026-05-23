import { MODEL_FLASH_LITE } from "../models.js";
import type { AIFeatureKey } from "../feature-keys.js";
import type { PromptModule } from "./types.js";

export interface StudioOverviewPayload {
  kind: "developer" | "publisher";
  name: string;
  tagline?: string;
  catalog: {
    id: string;
    name: string;
    genres: string[];
    tags: string[];
    releaseDate?: string;
    scorePct: number;
    totalReviews: number;
    comingSoon: boolean;
  }[];
  reviewSamples?: { gameId: string; excerpts: string[] };
}

export interface StudioOverviewResult {
  history: string;
  currentPeak: string;
  futureOutlook: string;
  mustPlayGameIds: string[];
  signatureThemes: string[];
}

const SHARED_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    history: { type: "string", maxLength: 700 },
    currentPeak: { type: "string", maxLength: 700 },
    futureOutlook: { type: "string", maxLength: 700 },
    mustPlayGameIds: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string", maxLength: 120 },
    },
    signatureThemes: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string", maxLength: 60 },
    },
  },
  required: ["history", "currentPeak", "futureOutlook", "mustPlayGameIds", "signatureThemes"],
};

function buildSystemInstruction(kindWord: "developer" | "publisher"): string {
  const role =
    kindWord === "developer"
      ? "the studio that makes the games"
      : "the company that ships the games";
  return [
    `You are Dreamworks' studio editor. The target entity is the ${kindWord} — ${role}.`,
    "Given the entity's catalog and a small sample of player reviews from the top title, write a tight three-section profile:",
    "1. HISTORY — one paragraph grounded only in catalog facts (release years, genre evolution, total titles). Don't invent founding dates or staff history that aren't in the data.",
    "2. CURRENT PEAK — one paragraph naming the strongest title by review score and what players praise about it. Pull from the supplied review excerpts.",
    "3. FUTURE OUTLOOK — one paragraph based ONLY on titles in the catalog with `comingSoon: true`. If there are none, say so plainly. Do not invent announced games.",
    "Also return 3-5 MUST-PLAY game ids (ids must exist in the supplied catalog) and 3-5 short SIGNATURE THEMES (2-4 words each, derived from recurring tags/genres).",
    "If a marketing-style tagline is supplied, ignore its tone — write neutrally. JSON only.",
  ].join("\n");
}

function buildContents(p: StudioOverviewPayload): string {
  const sorted = [...p.catalog].sort((a, b) => b.scorePct - a.scorePct);
  const catalogLines = sorted.map(
    (g) =>
      `- id=${g.id} | "${g.name}" | ${g.releaseDate?.slice(0, 4) ?? "TBA"} | ${g.scorePct}% (${g.totalReviews} reviews) | genres: ${g.genres.join("/")} | tags: ${g.tags.join(", ")}${g.comingSoon ? " | COMING_SOON" : ""}`,
  );
  const sampleBlock = p.reviewSamples
    ? [
        "",
        `Review excerpts for the top title (${p.reviewSamples.gameId}):`,
        ...p.reviewSamples.excerpts.slice(0, 8).map((r, i) => `[${i + 1}] ${r}`),
      ]
    : [];
  return [
    `${p.kind === "developer" ? "Developer" : "Publisher"}: ${p.name}`,
    p.tagline ? `Self-described tagline: ${p.tagline}` : null,
    `Catalog (${p.catalog.length} titles, sorted by score):`,
    ...catalogLines,
    ...sampleBlock,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function makeStudioPrompt(
  featureKey: AIFeatureKey,
  kindWord: "developer" | "publisher",
): PromptModule<StudioOverviewPayload, StudioOverviewResult> {
  return {
    featureKey,
    promptVersion: "v1",
    model: MODEL_FLASH_LITE,
    useThinking: false,
    temperature: 0,
    cacheable: true,
    systemInstruction: buildSystemInstruction(kindWord),
    responseSchema: SHARED_SCHEMA,
    buildContents,
    validate(parsed): StudioOverviewResult {
      const o = parsed as StudioOverviewResult;
      // Cap text fields defensively in case the model exceeds maxLength.
      const cap = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);
      return {
        history: cap(o.history ?? "", 1200),
        currentPeak: cap(o.currentPeak ?? "", 1200),
        futureOutlook: cap(o.futureOutlook ?? "", 1200),
        mustPlayGameIds: Array.isArray(o.mustPlayGameIds) ? o.mustPlayGameIds.slice(0, 6) : [],
        signatureThemes: Array.isArray(o.signatureThemes) ? o.signatureThemes.slice(0, 6) : [],
      };
    },
  };
}

export const developerOverview = makeStudioPrompt("developer-overview", "developer");
export const publisherOverview = makeStudioPrompt("publisher-overview", "publisher");
