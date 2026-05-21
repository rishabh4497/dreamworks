import type { ISODate, RefundWindow } from "./types";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const MIN_ELIGIBLE_MINUTES = 120;

/**
 * Compute a fresh refund window for a purchase. Generous & playtime-aware: the
 * play-time budget scales with the game's main-story length so 3-hour
 * narrative games aren't refundable after a full playthrough, while long /
 * live-service games keep at least the Steam-equivalent 2 hours.
 *
 *   eligibleMinutes = max(120, round(0.5 * mainHours * 60))
 *   eligibleUntil   = purchasedAt + 14 days
 *   revoked         = nowAfter(eligibleUntil) || playMinutes > eligibleMinutes
 */
export function computeRefundWindow(
  purchasedAt: ISODate,
  mainHours: number,
  playMinutes: number,
): RefundWindow {
  const mainMinutes = Math.max(0, mainHours) * 60;
  const eligibleMinutes = Math.max(MIN_ELIGIBLE_MINUTES, Math.round(0.5 * mainMinutes));
  const purchasedAtMs = new Date(purchasedAt).getTime();
  const eligibleUntilMs = purchasedAtMs + FOURTEEN_DAYS_MS;
  const eligibleUntil = new Date(eligibleUntilMs).toISOString();
  const revoked = Date.now() > eligibleUntilMs || playMinutes > eligibleMinutes;
  return { eligibleUntil, eligibleMinutes, revoked };
}

/**
 * Re-evaluate refund eligibility at call time (the persisted `revoked` flag
 * is just a snapshot from purchase time).
 */
export function isRefundEligible(
  window: RefundWindow | null | undefined,
  playMinutes: number,
): boolean {
  if (!window) return false;
  if (window.revoked) return false;
  if (Date.now() > new Date(window.eligibleUntil).getTime()) return false;
  if (playMinutes > window.eligibleMinutes) return false;
  return true;
}

function formatHM(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

function formatRemainingTime(ms: number): string {
  if (ms <= 0) return "0h";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  if (days >= 1) return `${days}d ${hours}h`;
  const minutes = totalMinutes - hours * 60;
  if (hours >= 1) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Human-friendly summary of the remaining refund window.
 * Eligible:  "Refundable for 1d 14h - 2h 0m of 30h play"
 * Closed:    "Refund window closed"
 */
export function remainingRefundCopy(
  window: RefundWindow,
  playMinutes: number,
): string {
  if (!isRefundEligible(window, playMinutes)) return "Refund window closed";
  const remainingMs = new Date(window.eligibleUntil).getTime() - Date.now();
  const playedCopy = formatHM(playMinutes);
  const budgetHours = Math.round(window.eligibleMinutes / 60);
  return `Refundable for ${formatRemainingTime(remainingMs)} - ${playedCopy} of ${budgetHours}h play`;
}
