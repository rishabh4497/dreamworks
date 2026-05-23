import JSZip from "jszip";
import type {
  Achievement,
  App,
  BuildValidationCheck,
  DreamworksManifest,
  ValidationStatus,
} from "@/lib/types";
import { MANIFEST_FILENAME, MIN_SDK_VERSION } from "./signature";

export interface ManifestParseResult {
  ok: boolean;
  manifest?: DreamworksManifest;
  executableEntryName?: string;
  executableBlob?: Blob;
  error?: string;
}

export async function parseManifestFromZip(file: Blob): Promise<ManifestParseResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not open zip." };
  }

  const manifestEntry = zip.file(MANIFEST_FILENAME);
  if (!manifestEntry) {
    return {
      ok: false,
      error: `Missing ${MANIFEST_FILENAME} at the root of the upload.`,
    };
  }

  let raw: string;
  try {
    raw = await manifestEntry.async("string");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not read manifest." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: `${MANIFEST_FILENAME} is not valid JSON.` };
  }

  const manifest = parsed as Partial<DreamworksManifest>;
  if (manifest.schemaVersion !== 1) {
    return { ok: false, error: "Unsupported manifest.schemaVersion (expected 1)." };
  }
  if (!manifest.appId || !manifest.sdkVersion || !manifest.executable) {
    return { ok: false, error: "Manifest missing appId, sdkVersion, or executable." };
  }

  const executableEntry = manifest.executable
    ? zip.file(manifest.executable) ?? findCaseInsensitive(zip, manifest.executable)
    : null;
  if (!executableEntry) {
    return {
      ok: false,
      manifest: manifest as DreamworksManifest,
      error: `Manifest references "${manifest.executable}" but it is not present in the zip.`,
    };
  }

  const executableBlob = await executableEntry.async("blob");
  return {
    ok: true,
    manifest: manifest as DreamworksManifest,
    executableEntryName: executableEntry.name,
    executableBlob,
  };
}

function findCaseInsensitive(zip: JSZip, name: string) {
  const lower = name.toLowerCase();
  let match: JSZip.JSZipObject | null = null;
  zip.forEach((path, obj) => {
    if (!match && path.toLowerCase() === lower) match = obj;
  });
  return match;
}

export interface ManifestCheckInputs {
  manifest: DreamworksManifest;
  app: Pick<App, "id">;
  achievements: Pick<Achievement, "id">[];
}

export function checkManifest(input: ManifestCheckInputs): BuildValidationCheck {
  const issues: string[] = [];
  let status: ValidationStatus = "pass";

  if (input.manifest.appId !== input.app.id) {
    issues.push(
      `appId in manifest is "${input.manifest.appId}" but this app is "${input.app.id}".`,
    );
    status = "fail";
  }

  if (compareSemver(input.manifest.sdkVersion, MIN_SDK_VERSION) < 0) {
    issues.push(
      `SDK ${input.manifest.sdkVersion} is older than minimum ${MIN_SDK_VERSION}.`,
    );
    status = "fail";
  }

  const knownAchievements = new Set(input.achievements.map((a) => a.id));
  const unknown = (input.manifest.achievements ?? []).filter(
    (id) => !knownAchievements.has(id),
  );
  if (unknown.length > 0) {
    issues.push(
      `Achievement IDs in manifest but not defined in the portal: ${unknown.join(", ")}.`,
    );
    if (status === "pass") status = "warn";
  }

  return {
    status,
    message:
      status === "pass"
        ? "Manifest is valid and references known achievements."
        : status === "warn"
          ? "Manifest is valid but references unknown achievement IDs."
          : "Manifest failed validation.",
    details: issues.length > 0 ? issues : undefined,
  };
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
