import { createAvatar } from "@dicebear/core";
import { notionists } from "@dicebear/collection";

// ── Types ─────────────────────────────────────────────────────────────────
/**
 * Subset of dicebear's `notionists` options we expose in the customizer.
 * Every variant field is the bare variant id (e.g. "variant04"). We pass
 * `[variant]` as a one-element array to dicebear so the avatar is pinned
 * instead of randomly picked.
 */
export interface AvatarOptions {
  /** Stable seed — drives any trait we don't explicitly pin. */
  seed: string;
  /** Single hex without `#` (e.g. "b6e3f4") or a CSS color name. */
  backgroundColor: string;
  /** Background style — defaults to "solid" when undefined. */
  backgroundType?: "solid" | "gradientLinear";
  /** Second gradient stop. Only used when backgroundType === "gradientLinear". */
  backgroundColor2?: string;
  /** Gradient rotation in degrees (0–360). Only used for gradient backgrounds. */
  backgroundRotation?: number;
  body?: string;
  brows?: string;
  eyes?: string;
  glasses?: string;
  hair?: string;
  lips?: string;
  nose?: string;
  gesture?: string;
  /** Notionists beard variant (variant01..variant12). Undefined = no beard. */
  beard?: string;
  /** Floating body icon — one of "electric" | "saturn" | "galaxy". */
  bodyIcon?: string;
  /** Mirror the avatar horizontally. */
  flip?: boolean;
}

// ── Variant catalogues ───────────────────────────────────────────────────
// Dicebear silently falls back if a variant id isn't part of the schema, so
// reasonable upper bounds here are safe.
function range(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${String(i + 1).padStart(2, "0")}`);
}

export const AVATAR_TRAIT_OPTIONS: Record<
  "body" | "brows" | "eyes" | "glasses" | "hair" | "lips" | "nose" | "gesture" | "beard" | "bodyIcon",
  string[]
> = {
  // Variant counts taken from `@dicebear/notionists` lib/types.d.ts.
  body: range("variant", 25),
  brows: range("variant", 13),
  eyes: range("variant", 5),
  glasses: range("variant", 11),
  hair: [...range("variant", 63), "hat"],
  lips: range("variant", 30),
  nose: range("variant", 20),
  gesture: [
    "hand",
    "handPhone",
    "ok",
    "okLongArm",
    "point",
    "pointLongArm",
    "waveLongArm",
    "waveLongArms",
    "waveOkLongArms",
    "wavePointLongArms",
  ],
  beard: range("variant", 12),
  bodyIcon: ["electric", "saturn", "galaxy"],
};

/** Palette of swatches for the background picker. */
export const BACKGROUND_COLORS: string[] = [
  "b6e3f4",
  "c0aede",
  "d1d4f9",
  "ffd5dc",
  "ffdfbf",
  "a8e6cf",
  "ffafcc",
  "bde0fe",
  "cdb4db",
  "ffc8dd",
  // Extended palette for gradients.
  "1f2937",
  "0f172a",
  "fef3c7",
  "c7f9cc",
  "ffadad",
  "9bf6ff",
  "fdffb6",
  "bdb2ff",
];

// ── Defaults ─────────────────────────────────────────────────────────────
export const DEFAULT_AVATAR_OPTIONS: AvatarOptions = {
  seed: "rishav-001",
  backgroundColor: "b6e3f4",
  backgroundType: "solid",
  body: "variant05",
  brows: "variant03",
  eyes: "variant02",
  hair: "variant12",
  lips: "variant10",
  nose: "variant04",
};

// ── Renderer ─────────────────────────────────────────────────────────────
/**
 * Build a notionists avatar SVG string from a set of `AvatarOptions`.
 * Variant fields are wrapped in single-element arrays so dicebear pins
 * to that exact variant rather than treating the array as a candidate
 * pool. Unspecified traits stay seeded — they vary by `seed`.
 *
 * The notionists schema types each variant slot as a literal-string union;
 * we keep `AvatarOptions` open-ended (`string`) and cast at this boundary
 * so the customizer UI doesn't need to know each variant's specific union.
 */
export function renderAvatarSvg(options: AvatarOptions): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts: any = {
    seed: options.seed,
  };

  // Background — solid (default) or gradient.
  if (options.backgroundType === "gradientLinear") {
    opts.backgroundType = ["gradientLinear"];
    opts.backgroundColor = [
      options.backgroundColor,
      options.backgroundColor2 ?? options.backgroundColor,
    ];
    opts.backgroundRotation = [options.backgroundRotation ?? 0];
  } else {
    opts.backgroundType = ["solid"];
    opts.backgroundColor = [options.backgroundColor];
  }

  if (options.body) opts.body = [options.body];
  if (options.brows) opts.brows = [options.brows];
  if (options.eyes) opts.eyes = [options.eyes];
  if (options.glasses) {
    opts.glasses = [options.glasses];
    opts.glassesProbability = 100;
  } else {
    opts.glassesProbability = 0;
  }
  if (options.hair) opts.hair = [options.hair];
  if (options.lips) opts.lips = [options.lips];
  if (options.nose) opts.nose = [options.nose];
  if (options.gesture) {
    opts.gesture = [options.gesture];
    opts.gestureProbability = 100;
  } else {
    opts.gestureProbability = 0;
  }
  if (options.beard) {
    opts.beard = [options.beard];
    opts.beardProbability = 100;
  } else {
    opts.beardProbability = 0;
  }
  if (options.bodyIcon) {
    opts.bodyIcon = [options.bodyIcon];
    opts.bodyIconProbability = 100;
  } else {
    opts.bodyIconProbability = 0;
  }
  if (options.flip) opts.flip = true;

  return createAvatar(notionists, opts).toString();
}

// ── Presets ──────────────────────────────────────────────────────────────
/**
 * Hand-curated combos shown in the configurator's "Presets" tab. Each one
 * sets every visual field except `seed` (which is kept from the user's
 * current draft so the preset adapts to their identity).
 */
export interface AvatarPreset {
  id: string;
  name: string;
  description: string;
  /** All fields except `seed`. The customizer merges this over the draft. */
  options: Omit<AvatarOptions, "seed">;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "sunset-surfer",
    name: "Sunset Surfer",
    description: "Beachy, breezy, with a sunset gradient.",
    options: {
      backgroundColor: "ffafcc",
      backgroundType: "gradientLinear",
      backgroundColor2: "ffdfbf",
      backgroundRotation: 135,
      body: "variant08",
      brows: "variant04",
      eyes: "variant03",
      hair: "variant18",
      lips: "variant12",
      nose: "variant06",
      gesture: "waveLongArm",
    },
  },
  {
    id: "bookworm",
    name: "Bookworm",
    description: "Studious vibes. Glasses on, ready to read.",
    options: {
      backgroundColor: "c7f9cc",
      backgroundType: "solid",
      body: "variant03",
      brows: "variant07",
      eyes: "variant01",
      glasses: "variant05",
      hair: "variant22",
      lips: "variant06",
      nose: "variant02",
    },
  },
  {
    id: "cyber-punk",
    name: "Cyber Punk",
    description: "Neon nights and electric sparks.",
    options: {
      backgroundColor: "0f172a",
      backgroundType: "gradientLinear",
      backgroundColor2: "9bf6ff",
      backgroundRotation: 90,
      body: "variant14",
      brows: "variant09",
      eyes: "variant04",
      glasses: "variant09",
      hair: "variant41",
      lips: "variant18",
      nose: "variant11",
      bodyIcon: "electric",
    },
  },
  {
    id: "cosmic-drifter",
    name: "Cosmic Drifter",
    description: "Lost in space with a saturn glow.",
    options: {
      backgroundColor: "1f2937",
      backgroundType: "gradientLinear",
      backgroundColor2: "bdb2ff",
      backgroundRotation: 200,
      body: "variant19",
      brows: "variant02",
      eyes: "variant05",
      hair: "variant34",
      lips: "variant21",
      nose: "variant14",
      bodyIcon: "saturn",
    },
  },
  {
    id: "hat-squad",
    name: "Hat Squad",
    description: "Hat on, no questions asked.",
    options: {
      backgroundColor: "bde0fe",
      backgroundType: "solid",
      body: "variant11",
      brows: "variant05",
      eyes: "variant02",
      hair: "hat",
      lips: "variant09",
      nose: "variant08",
      gesture: "ok",
    },
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean, calm, neutral background.",
    options: {
      backgroundColor: "d1d4f9",
      backgroundType: "solid",
      body: "variant02",
      brows: "variant01",
      eyes: "variant01",
      hair: "variant05",
      lips: "variant03",
      nose: "variant01",
    },
  },
  {
    id: "disco-bandit",
    name: "Disco Bandit",
    description: "Funky hair, big personality.",
    options: {
      backgroundColor: "ffafcc",
      backgroundType: "gradientLinear",
      backgroundColor2: "fdffb6",
      backgroundRotation: 45,
      body: "variant21",
      brows: "variant11",
      eyes: "variant03",
      glasses: "variant03",
      hair: "variant55",
      lips: "variant24",
      nose: "variant09",
      gesture: "wavePointLongArms",
    },
  },
  {
    id: "cottage-witch",
    name: "Cottage Witch",
    description: "Mossy greens, a knowing smirk.",
    options: {
      backgroundColor: "a8e6cf",
      backgroundType: "gradientLinear",
      backgroundColor2: "c0aede",
      backgroundRotation: 160,
      body: "variant07",
      brows: "variant06",
      eyes: "variant02",
      hair: "variant48",
      lips: "variant27",
      nose: "variant05",
      beard: "variant02",
    },
  },
  {
    id: "galaxy-mage",
    name: "Galaxy Mage",
    description: "Bearded, gazing into the cosmos.",
    options: {
      backgroundColor: "0f172a",
      backgroundType: "gradientLinear",
      backgroundColor2: "cdb4db",
      backgroundRotation: 280,
      body: "variant23",
      brows: "variant08",
      eyes: "variant04",
      hair: "variant12",
      lips: "variant14",
      nose: "variant13",
      beard: "variant08",
      bodyIcon: "galaxy",
    },
  },
  {
    id: "morning-jog",
    name: "Morning Jog",
    description: "Bright, energetic, ready to move.",
    options: {
      backgroundColor: "fef3c7",
      backgroundType: "solid",
      body: "variant04",
      brows: "variant03",
      eyes: "variant02",
      hair: "variant27",
      lips: "variant11",
      nose: "variant07",
      gesture: "pointLongArm",
    },
  },
];
