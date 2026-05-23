import type { BuildValidationCheck } from "@/lib/types";
import { ACHIEVEMENT_ID_PATTERN, MAX_WEB_SCAN_BYTES, SDK_MARKER } from "./signature";

const CHUNK_SIZE = 4 * 1024 * 1024;

export interface BinaryScanResult {
  markerFound: boolean;
  foundAchievementIds: string[];
  scannedBytes: number;
  skipped?: "too-large" | "no-file";
}

export async function scanBinaryWeb(blob: Blob | undefined): Promise<BinaryScanResult> {
  if (!blob) {
    return { markerFound: false, foundAchievementIds: [], scannedBytes: 0, skipped: "no-file" };
  }
  if (blob.size > MAX_WEB_SCAN_BYTES) {
    return { markerFound: false, foundAchievementIds: [], scannedBytes: 0, skipped: "too-large" };
  }

  const markerBytes = new TextEncoder().encode(SDK_MARKER);
  const decoder = new TextDecoder("latin1");
  let markerFound = false;
  const found = new Set<string>();
  let scanned = 0;

  let carry = new Uint8Array(0);
  let offset = 0;
  while (offset < blob.size) {
    const end = Math.min(offset + CHUNK_SIZE, blob.size);
    const buf = new Uint8Array(await blob.slice(offset, end).arrayBuffer());
    scanned += buf.byteLength;

    const merged = new Uint8Array(carry.byteLength + buf.byteLength);
    merged.set(carry, 0);
    merged.set(buf, carry.byteLength);

    if (!markerFound && indexOfBytes(merged, markerBytes) !== -1) {
      markerFound = true;
    }

    const text = decoder.decode(merged);
    for (const m of text.matchAll(/ach_[a-z0-9_]{1,40}/g)) {
      if (ACHIEVEMENT_ID_PATTERN.test(m[0])) found.add(m[0]);
    }

    const tail = Math.min(markerBytes.byteLength - 1, merged.byteLength);
    carry = merged.slice(merged.byteLength - tail);
    offset = end;
  }

  return { markerFound, foundAchievementIds: [...found], scannedBytes: scanned };
}

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array): number {
  if (needle.byteLength === 0 || haystack.byteLength < needle.byteLength) return -1;
  outer: for (let i = 0; i <= haystack.byteLength - needle.byteLength; i++) {
    for (let j = 0; j < needle.byteLength; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

export function checkBinaryScan(scan: BinaryScanResult): BuildValidationCheck {
  if (scan.skipped === "too-large") {
    return {
      status: "pending",
      message: "Binary scan deferred to the cloud (file too large for browser scan).",
    };
  }
  if (scan.skipped === "no-file") {
    return {
      status: "skipped",
      message: "No executable was extracted from the upload to scan.",
    };
  }
  if (scan.markerFound) {
    return {
      status: "pass",
      message: "SDK marker detected in the executable.",
      details:
        scan.foundAchievementIds.length > 0
          ? [`Found ${scan.foundAchievementIds.length} achievement ID references.`]
          : undefined,
    };
  }
  return {
    status: "fail",
    message:
      "SDK marker not found in the executable. Confirm @dreamworks/sdk is linked and init() is called.",
  };
}
