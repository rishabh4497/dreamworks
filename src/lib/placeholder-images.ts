/**
 * Deterministic placeholder image URLs.
 *
 * Used as fallbacks when an app hasn't uploaded its own art yet — the resulting
 * URLs are stable per game-id so an unset image renders the same picture every
 * time instead of flickering. Backed by picsum.photos which is content-addressed
 * by seed; no external auth or quota.
 *
 * Lives at `src/lib/` (not `src/lib/mock/`) so it survives the mock-directory
 * deletion. URL builders that depend on Steam-CDN data live in `mock/` and will
 * be removed alongside that data.
 */

const PICSUM = "https://picsum.photos/seed";

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
export function avatarUrl(name: string): string {
  return `${PICSUM}/${encodeURIComponent(name)}/96/96`;
}
export function achievementIconUrl(id: string): string {
  return `${PICSUM}/${id}-ach/64/64`;
}
export function newsHeroUrl(slug: string): string {
  return `${PICSUM}/${slug}-news/1200/520`;
}
