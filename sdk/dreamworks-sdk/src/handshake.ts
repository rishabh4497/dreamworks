import { SDK_VERSION } from "./signature";
import type { HandshakePayload } from "./types";

const DEFAULT_HANDSHAKE_URL =
  (typeof process !== "undefined" && process.env?.DREAMWORKS_HANDSHAKE_URL) ||
  "https://us-central1-dreamworks-store.cloudfunctions.net/sdkHandshake";

export async function sendHandshake(opts: {
  appId: string;
  appSecret: string;
  buildLabel?: string;
  machineId?: string;
  url?: string;
}): Promise<void> {
  const timestamp = new Date().toISOString();
  const payload: HandshakePayload = {
    appId: opts.appId,
    sdkVersion: SDK_VERSION,
    buildLabel: opts.buildLabel,
    machineId: opts.machineId,
    timestamp,
  };
  const url = opts.url || DEFAULT_HANDSHAKE_URL;

  try {
    if (typeof fetch !== "function") return;
    const subtle = getSubtle();
    if (!subtle) return;

    const canonical = canonicalString({
      appId: opts.appId,
      sdkVersion: SDK_VERSION,
      buildLabel: opts.buildLabel ?? "",
    });
    const signature = await hmacSha256Hex(subtle, opts.appSecret, `${timestamp}.${canonical}`);

    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-dreamworks-signature": `sha256=${signature}`,
        "x-dreamworks-timestamp": timestamp,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Handshake is best-effort; never throw into the game's runtime.
  }
}

function canonicalString(parts: Record<string, string>): string {
  return Object.keys(parts)
    .sort()
    .map((k) => `${k}=${parts[k]}`)
    .join(".");
}

function getSubtle(): SubtleCrypto | undefined {
  const g = (globalThis as { crypto?: { subtle?: SubtleCrypto } }).crypto;
  return g?.subtle;
}

async function hmacSha256Hex(subtle: SubtleCrypto, key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await subtle.sign("HMAC", cryptoKey, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}
