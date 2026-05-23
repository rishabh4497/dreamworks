import type {
  Achievement,
  App,
  BuildValidation,
  BuildValidationCheck,
  ValidationStatus,
} from "@/lib/types";
import { invokeDesktop, isDesktop } from "@/lib/platform";
import {
  parseManifestFromZip,
  checkManifest,
} from "@/lib/validation/manifest";
import {
  scanBinaryWeb,
  checkBinaryScan,
  type BinaryScanResult,
} from "@/lib/validation/binary-scan-web";

interface TauriScanReport {
  markerFound: boolean;
  sdkVersion: string | null;
  executableName: string | null;
  foundAchievementIds: string[];
  manifest: unknown | null;
  errors: string[];
}

export interface ClientValidationInput {
  file: Blob | File;
  app: Pick<App, "id">;
  achievements: Pick<Achievement, "id">[];
  localPath?: string;
}

export async function validateBuildClient(
  input: ClientValidationInput,
): Promise<BuildValidation> {
  const checkedAt = new Date().toISOString();

  if (isDesktop() && input.localPath) {
    const tauri = await invokeDesktop<TauriScanReport>("scan_build_archive", {
      path: input.localPath,
    });
    if (tauri) {
      return reportFromTauri(tauri, input, checkedAt);
    }
  }

  const parsed = await parseManifestFromZip(input.file);
  if (!parsed.ok || !parsed.manifest) {
    return finalize({
      manifest: {
        status: "fail",
        message: parsed.error ?? "Could not read manifest.",
      },
      binary: { status: "skipped", message: "Skipped — manifest missing." },
      handshake: handshakePending(),
      source: "client",
      checkedAt,
    });
  }

  const manifestCheck = checkManifest({
    manifest: parsed.manifest,
    app: input.app,
    achievements: input.achievements,
  });

  let scan: BinaryScanResult;
  try {
    scan = await scanBinaryWeb(parsed.executableBlob);
  } catch {
    scan = { markerFound: false, foundAchievementIds: [], scannedBytes: 0 };
  }
  const binaryCheck = checkBinaryScan(scan);

  return finalize({
    manifest: manifestCheck,
    binary: binaryCheck,
    handshake: handshakePending(),
    source: "client",
    checkedAt,
  });
}

function reportFromTauri(
  tauri: TauriScanReport,
  input: ClientValidationInput,
  checkedAt: string,
): BuildValidation {
  const manifest = (tauri.manifest as Record<string, unknown> | null) ?? null;
  let manifestCheck: BuildValidationCheck;
  if (!manifest || typeof manifest !== "object") {
    manifestCheck = {
      status: "fail",
      message: "Could not read manifest from build archive.",
      details: tauri.errors.length > 0 ? tauri.errors : undefined,
    };
  } else {
    manifestCheck = checkManifest({
      manifest: manifest as never,
      app: input.app,
      achievements: input.achievements,
    });
  }

  const binaryCheck: BuildValidationCheck = tauri.markerFound
    ? {
        status: "pass",
        message: tauri.executableName
          ? `SDK marker detected in ${tauri.executableName}.`
          : "SDK marker detected in the executable.",
        details:
          tauri.foundAchievementIds.length > 0
            ? [`Found ${tauri.foundAchievementIds.length} achievement ID references.`]
            : undefined,
      }
    : {
        status: "fail",
        message:
          "SDK marker not found. Link @dreamworks/sdk and ensure init() is called at startup.",
      };

  return finalize({
    manifest: manifestCheck,
    binary: binaryCheck,
    handshake: handshakePending(),
    source: "tauri",
    checkedAt,
  });
}

function handshakePending(): BuildValidationCheck {
  return {
    status: "pending",
    message: "Waiting for the first runtime handshake from a launched build.",
  };
}

function finalize(parts: {
  manifest: BuildValidationCheck;
  binary: BuildValidationCheck;
  handshake: BuildValidationCheck;
  source: BuildValidation["source"];
  checkedAt: string;
}): BuildValidation {
  return {
    schemaVersion: 1,
    checkedAt: parts.checkedAt,
    source: parts.source,
    manifest: parts.manifest,
    binary: parts.binary,
    handshake: parts.handshake,
    overall: rollup([parts.manifest.status, parts.binary.status, parts.handshake.status]),
  };
}

function rollup(statuses: ValidationStatus[]): ValidationStatus {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("pending")) return "pending";
  if (statuses.includes("warn")) return "warn";
  if (statuses.every((s) => s === "pass" || s === "skipped")) return "pass";
  return "warn";
}
