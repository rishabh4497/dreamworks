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
  body?: string;
  brows?: string;
  eyes?: string;
  glasses?: string;
  hair?: string;
  lips?: string;
  nose?: string;
  gesture?: string;
}

// ── Variant catalogues ───────────────────────────────────────────────────
// Dicebear silently falls back if a variant id isn't part of the schema, so
// reasonable upper bounds here are safe.
function range(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${String(i + 1).padStart(2, "0")}`);
}

export const AVATAR_TRAIT_OPTIONS: Record<
  "body" | "brows" | "eyes" | "glasses" | "hair" | "lips" | "nose" | "gesture",
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
};

/** Palette of ~10 swatches for the background picker. */
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
];

// ── Defaults ─────────────────────────────────────────────────────────────
export const DEFAULT_AVATAR_OPTIONS: AvatarOptions = {
  seed: "rishav-001",
  backgroundColor: "b6e3f4",
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
    backgroundColor: [options.backgroundColor],
  };

  if (options.body) opts.body = [options.body];
  if (options.brows) opts.brows = [options.brows];
  if (options.eyes) opts.eyes = [options.eyes];
  if (options.glasses) {
    opts.glasses = [options.glasses];
    // If glasses is set we want a 100% probability of them showing up.
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

  return createAvatar(notionists, opts).toString();
}
