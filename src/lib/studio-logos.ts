import { slugify } from "@/lib/utils";

export interface StudioBrand {
  /** URL to the studio's logo (SVG/PNG). White-on-dark tile renders it on a
   *  padded white background; falls back to initials on `<img onError>`. */
  logoUrl: string;
  /** Hex brand color used to drive the Spotify-style hero wash. */
  brandColor: string;
}

/**
 * Per-studio logo + brand color, keyed by `slugify(name)`.
 *
 * Logo sources (verified at sprint time):
 *   • Wikimedia Commons SVG — used where the file exists and is reachable.
 *   • Simple Icons CDN (`cdn.simpleicons.org/{slug}`) — used as a fallback
 *     when Wikimedia 404'd.
 *   • Google `s2/favicons?sz=256` — last-resort, used for the long tail
 *     where neither of the above has the brand. Clearbit was sunset (DNS
 *     no longer resolves), so it's never used.
 *
 * If you need to swap a URL: prefer Simple Icons → Wikimedia → Google
 * favicon (in that order of brand fidelity).
 */
const STUDIOS: Record<string, StudioBrand> = {
  // ── Rockstar ──────────────────────────────────────────────────────────
  // Wikimedia (Rockstar_Games_Logo.svg) returns 404; Simple Icons works.
  "rockstar-games": {
    logoUrl: "https://cdn.simpleicons.org/rockstargames/FCAF17",
    brandColor: "#FCAF17",
  },
  "rockstar-north": {
    logoUrl: "https://cdn.simpleicons.org/rockstargames/FCAF17",
    brandColor: "#FCAF17",
  },

  // ── Ubisoft ───────────────────────────────────────────────────────────
  // Wikimedia (Ubisoft_2017.svg) 404'd; Simple Icons serves the same mark.
  ubisoft: {
    logoUrl: "https://cdn.simpleicons.org/ubisoft",
    brandColor: "#0089CF",
  },
  "ubisoft-quebec": {
    logoUrl: "https://cdn.simpleicons.org/ubisoft",
    brandColor: "#0089CF",
  },

  // ── CD PROJEKT RED ────────────────────────────────────────────────────
  // Wikimedia (CD_PROJEKT_RED_logo.svg) 404'd; Simple Icons (`cdprojekt`)
  // is the parent brand mark — close enough.
  "cd-projekt-red": {
    logoUrl: "https://cdn.simpleicons.org/cdprojekt/E5151A",
    brandColor: "#E5151A",
  },

  // ── FromSoftware ──────────────────────────────────────────────────────
  // Wikimedia 404 + no Simple Icons entry. Use the Elden Ring site
  // favicon (their own .jp domain has no usable favicon either).
  fromsoftware: {
    logoUrl: "https://www.google.com/s2/favicons?sz=256&domain=eldenring.com",
    brandColor: "#9CA3AF",
  },

  // ── Bandai Namco ──────────────────────────────────────────────────────
  // Wikimedia 404; Google favicon for bandainamcoent.com.
  "bandai-namco-entertainment": {
    logoUrl:
      "https://www.google.com/s2/favicons?sz=256&domain=bandainamcoent.com",
    brandColor: "#E72528",
  },

  // ── Pearl Abyss ───────────────────────────────────────────────────────
  // Wikimedia 404; Google favicon.
  "pearl-abyss": {
    logoUrl: "https://www.google.com/s2/favicons?sz=256&domain=pearlabyss.com",
    brandColor: "#06B6D4",
  },

  // ── PlayStation ───────────────────────────────────────────────────────
  // Wikimedia file verified 200 — the only spec'd URL that survived.
  "playstation-publishing": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/00/PlayStation_logo.svg",
    brandColor: "#003791",
  },
  "santa-monica-studio": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/00/PlayStation_logo.svg",
    brandColor: "#003791",
  },

  // ── Game Science (Black Myth: Wukong) ─────────────────────────────────
  "game-science": {
    logoUrl:
      "https://www.google.com/s2/favicons?sz=256&domain=blackmythwukong.com",
    brandColor: "#D4AF37",
  },

  // ── Larian Studios ────────────────────────────────────────────────────
  // Wikimedia 404; no Simple Icons entry; Google favicon for larian.com.
  "larian-studios": {
    logoUrl: "https://www.google.com/s2/favicons?sz=256&domain=larian.com",
    brandColor: "#E81F2A",
  },

  // ── Avalanche Software (Hogwarts Legacy) ──────────────────────────────
  // Clearbit was sunset (DNS dead). Use Google favicon.
  "avalanche-software": {
    logoUrl:
      "https://www.google.com/s2/favicons?sz=256&domain=avalanchesoftware.com",
    brandColor: "#7B1FA2",
  },

  // ── Warner Bros. Games ────────────────────────────────────────────────
  // Wikimedia 404; wbgames.com favicon 404. Use the parent brand site.
  "warner-bros-games": {
    logoUrl: "https://www.google.com/s2/favicons?sz=256&domain=warnerbros.com",
    brandColor: "#FFC72C",
  },

  // ── Valve ─────────────────────────────────────────────────────────────
  valve: {
    logoUrl: "https://cdn.simpleicons.org/valve/FA7B17",
    brandColor: "#FA7B17",
  },

  // ── Arrowhead Game Studios (Helldivers 2) ─────────────────────────────
  "arrowhead-game-studios": {
    logoUrl:
      "https://www.google.com/s2/favicons?sz=256&domain=arrowheadgamestudios.com",
    brandColor: "#A4D007",
  },

  // ── Pocketpair (Palworld) ─────────────────────────────────────────────
  pocketpair: {
    logoUrl: "https://www.google.com/s2/favicons?sz=256&domain=pocketpair.jp",
    brandColor: "#43B92A",
  },

  // ── NetEase Games (Marvel Rivals) ─────────────────────────────────────
  // Wikimedia 404. Google favicon for the games subsidiary domain.
  "netease-games": {
    logoUrl:
      "https://www.google.com/s2/favicons?sz=256&domain=neteasegames.com",
    brandColor: "#E60012",
  },

  // ── ConcernedApe (Stardew Valley) ─────────────────────────────────────
  concernedape: {
    logoUrl:
      "https://www.google.com/s2/favicons?sz=256&domain=stardewvalley.net",
    brandColor: "#65A30D",
  },

  // ── Activision ────────────────────────────────────────────────────────
  activision: {
    logoUrl: "https://cdn.simpleicons.org/activision/F5A623",
    brandColor: "#F5A623",
  },

  // ── Capcom ────────────────────────────────────────────────────────────
  // Wikimedia 404. No Simple Icons entry. Google favicon for capcom.com.
  capcom: {
    logoUrl: "https://www.google.com/s2/favicons?sz=256&domain=capcom.com",
    brandColor: "#003088",
  },

  // ── Insomniac Games ───────────────────────────────────────────────────
  "insomniac-games": {
    logoUrl: "https://www.google.com/s2/favicons?sz=256&domain=insomniac.games",
    brandColor: "#FF4F00",
  },
};

export function studioBrand(name: string): StudioBrand | null {
  return STUDIOS[slugify(name)] ?? null;
}

/**
 * Back-compat alias. Existing callers (e.g. EntityStorefront's
 * `<StudioLogo>` subcomponent) historically only needed a URL — keep them
 * working without forcing every caller to migrate to `studioBrand()`.
 */
export function studioLogoUrl(name: string): string | null {
  return studioBrand(name)?.logoUrl ?? null;
}
