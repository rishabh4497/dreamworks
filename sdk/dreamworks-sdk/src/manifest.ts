import { MANIFEST_SCHEMA_VERSION, SDK_VERSION } from "./signature";
import type { DreamworksManifest, OSPlatform } from "./types";

export function buildManifest(input: {
  appId: string;
  buildLabel: string;
  achievements: string[];
  platforms: OSPlatform[];
  executable: string;
}): DreamworksManifest {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    appId: input.appId,
    sdkVersion: SDK_VERSION,
    buildLabel: input.buildLabel,
    achievements: input.achievements,
    platforms: input.platforms,
    executable: input.executable,
  };
}

export function manifestToJson(manifest: DreamworksManifest): string {
  return JSON.stringify(manifest, null, 2);
}
