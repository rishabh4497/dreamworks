export const SDK_MARKER = "__DREAMWORKS_SDK_MARKER_V1__";
export const MANIFEST_FILENAME = "dreamworks.manifest.json";
export const MIN_SDK_VERSION = "0.1.0";
export const ACHIEVEMENT_ID_PATTERN = /^ach_[a-z0-9_]{1,40}$/;

export type ValidationStatus = "pass" | "fail" | "warn" | "pending" | "skipped";

export interface BuildValidationCheck {
  status: ValidationStatus;
  message: string;
  details?: string[];
}

export interface BuildValidation {
  schemaVersion: 1;
  checkedAt: string;
  source: "client" | "tauri" | "cloud";
  manifest: BuildValidationCheck;
  binary: BuildValidationCheck;
  handshake: BuildValidationCheck;
  overall: ValidationStatus;
}

export interface DreamworksManifest {
  schemaVersion: 1;
  appId: string;
  sdkVersion: string;
  buildLabel: string;
  achievements: string[];
  platforms: string[];
  executable: string;
}

export function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function rollupStatus(statuses: ValidationStatus[]): ValidationStatus {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("pending")) return "pending";
  if (statuses.includes("warn")) return "warn";
  if (statuses.every((s) => s === "pass" || s === "skipped")) return "pass";
  return "warn";
}
