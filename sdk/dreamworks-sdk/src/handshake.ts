import { SDK_VERSION } from "./signature";
import type { HandshakePayload } from "./types";

const DEFAULT_HANDSHAKE_URL =
  (typeof process !== "undefined" && process.env?.DREAMWORKS_HANDSHAKE_URL) ||
  "https://us-central1-dreamworks-store.cloudfunctions.net/sdkHandshake";

export async function sendHandshake(opts: {
  appId: string;
  buildLabel?: string;
  machineId?: string;
  url?: string;
}): Promise<void> {
  const payload: HandshakePayload = {
    appId: opts.appId,
    sdkVersion: SDK_VERSION,
    buildLabel: opts.buildLabel,
    machineId: opts.machineId,
    timestamp: new Date().toISOString(),
  };
  const url = opts.url || DEFAULT_HANDSHAKE_URL;
  try {
    if (typeof fetch === "function") {
      await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  } catch {
    // Handshake is best-effort; never throw into the game's runtime.
  }
}
