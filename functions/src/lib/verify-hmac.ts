import { createHmac, timingSafeEqual } from "node:crypto";

const REPLAY_WINDOW_SECONDS = 300;

export type HmacFailureReason =
  | "missing_signature"
  | "missing_timestamp"
  | "stale_timestamp"
  | "bad_signature";

export interface VerifyHmacResult {
  ok: boolean;
  reason?: HmacFailureReason;
}

export function buildCanonicalString(parts: Record<string, string | undefined>): string {
  return Object.keys(parts)
    .sort()
    .map((k) => `${k}=${parts[k] ?? ""}`)
    .join(".");
}

export function verifyHmac(opts: {
  signatureHeader: string | undefined;
  timestampHeader: string | undefined;
  secret: string;
  canonical: string;
  nowMs?: number;
}): VerifyHmacResult {
  if (!opts.signatureHeader) return { ok: false, reason: "missing_signature" };
  if (!opts.timestampHeader) return { ok: false, reason: "missing_timestamp" };

  const tsMs = Date.parse(opts.timestampHeader);
  if (!Number.isFinite(tsMs)) return { ok: false, reason: "stale_timestamp" };
  const nowMs = opts.nowMs ?? Date.now();
  if (Math.abs(nowMs - tsMs) > REPLAY_WINDOW_SECONDS * 1000) {
    return { ok: false, reason: "stale_timestamp" };
  }

  const signed = `${opts.timestampHeader}.${opts.canonical}`;
  const expectedHex = createHmac("sha256", opts.secret).update(signed).digest("hex");
  const expectedHeader = `sha256=${expectedHex}`;

  const a = Buffer.from(opts.signatureHeader);
  const b = Buffer.from(expectedHeader);
  if (a.length !== b.length) return { ok: false, reason: "bad_signature" };
  if (!timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };
  return { ok: true };
}
