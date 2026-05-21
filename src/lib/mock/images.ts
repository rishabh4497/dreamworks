// Image helpers. Steam CDN URLs are used as a stand-in for v1 — they're
// publicly hotlinkable; swap to first-party assets later.
import { seedFromString } from "./_seed";
import { STEAM_MEDIA, buildScreenshots, buildTrailers } from "./steam-media";

const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps";
const PICSUM = "https://picsum.photos/seed";

export function steamHeader(appid: number | string): string {
  const id = typeof appid === "string" ? parseInt(appid, 10) : appid;
  return STEAM_MEDIA[id]?.headerUrlOverride ?? `${STEAM_CDN}/${appid}/header.jpg`;
}
export function steamCapsule(appid: number | string): string {
  const id = typeof appid === "string" ? parseInt(appid, 10) : appid;
  return STEAM_MEDIA[id]?.capsuleUrlOverride ?? `${STEAM_CDN}/${appid}/capsule_616x353.jpg`;
}
export function steamCover(appid: number | string): string {
  const id = typeof appid === "string" ? parseInt(appid, 10) : appid;
  return STEAM_MEDIA[id]?.coverUrlOverride ?? `${STEAM_CDN}/${appid}/library_600x900_2x.jpg`;
}
export function steamHero(appid: number | string): string {
  const id = typeof appid === "string" ? parseInt(appid, 10) : appid;
  return STEAM_MEDIA[id]?.heroUrlOverride ?? `${STEAM_CDN}/${appid}/library_hero.jpg`;
}
export function steamPageBg(appid: number | string): string {
  return `${STEAM_CDN}/${appid}/page_bg_generated_v6b.jpg`;
}

/** Real gameplay screenshots from steam-media.ts. Empty array if not curated yet. */
export function steamScreenshots(appid: number | string) {
  const id = typeof appid === "string" ? parseInt(appid, 10) : appid;
  return buildScreenshots(id);
}

/** Real trailers from steam-media.ts. Empty array if not curated yet. */
export function steamTrailers(appid: number | string) {
  const id = typeof appid === "string" ? parseInt(appid, 10) : appid;
  return buildTrailers(id);
}

/** Returns 6 image URLs per game suitable for the screenshot gallery. */
export function steamScreenshotSet(appid: number | string): string[] {
  return [
    steamHero(appid),
    steamPageBg(appid),
    steamCapsule(appid),
    steamHeader(appid),
    steamHero(appid),
    steamPageBg(appid),
  ];
}

// Generic placeholders for things without Steam pages (avatars, news heroes,
// achievement icons). These intentionally stay on picsum since they don't have
// a canonical real image.
export function avatarUrl(name: string): string {
  return `${PICSUM}/${seedFromString(name)}/96/96`;
}
export function achievementIconUrl(id: string): string {
  return `${PICSUM}/${id}-ach/64/64`;
}
export function newsHeroUrl(slug: string): string {
  return `${PICSUM}/${slug}-news/1200/520`;
}

// Backwards-compat helpers kept for existing call sites.
export function gameCoverUrl(id: string): string {
  return `${PICSUM}/${id}-cover/600/900`;
}
export function gameHeaderUrl(id: string): string {
  return `${PICSUM}/${id}-header/920/430`;
}
export function gameCapsuleUrl(id: string): string {
  return `${PICSUM}/${id}-capsule/460/215`;
}
export function gameHeroUrl(id: string): string {
  return `${PICSUM}/${id}-hero/1600/640`;
}
export function gameScreenshotUrl(id: string, idx: number): string {
  return `${PICSUM}/${id}-shot-${idx}/1280/720`;
}
export function gameScreenshotThumbUrl(id: string, idx: number): string {
  return `${PICSUM}/${id}-shot-${idx}/320/180`;
}
