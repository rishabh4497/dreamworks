import {
  getOS,
  isDesktop,
  pathExistsSafe,
  readDirSafe,
  readTextFileSafe,
} from "@/lib/platform";
import type { DetectedGame } from "./types";

/**
 * Epic Games Launcher writes one `.item` JSON file per installed title under a
 * single well-known manifest directory.
 */
async function candidateManifestDirs(): Promise<string[]> {
  const os = getOS();
  if (os === "windows") {
    return ["C:/ProgramData/Epic/EpicGamesLauncher/Data/Manifests"];
  }
  if (os === "mac") {
    return ["/Users/Shared/Epic/EpicGamesLauncher/Data/Manifests"];
  }
  return [];
}

interface EpicItem {
  AppName?: string;
  DisplayName?: string;
  InstallLocation?: string;
  InstallSize?: number;
}

/**
 * Reads every `.item` JSON in Epic's manifest directories and returns detected
 * games. On web returns []. Never throws.
 */
export async function scanEpic(): Promise<DetectedGame[]> {
  if (!isDesktop()) return [];

  const detected: DetectedGame[] = [];
  const dirs = await candidateManifestDirs();

  for (const dir of dirs) {
    if (!(await pathExistsSafe(dir))) continue;
    const entries = await readDirSafe(dir);
    for (const entry of entries) {
      if (!entry.isFile) continue;
      if (!entry.name.toLowerCase().endsWith(".item")) continue;
      const text = await readTextFileSafe(`${dir}/${entry.name}`);
      if (!text) continue;
      let parsed: EpicItem;
      try {
        parsed = JSON.parse(text) as EpicItem;
      } catch {
        continue;
      }
      const externalId = parsed.AppName ?? parsed.DisplayName ?? entry.name;
      const name = parsed.DisplayName ?? parsed.AppName ?? "Unknown";
      if (!externalId) continue;
      detected.push({
        launcher: "epic",
        externalId,
        name,
        installPath: parsed.InstallLocation,
        sizeBytes:
          typeof parsed.InstallSize === "number" && Number.isFinite(parsed.InstallSize)
            ? parsed.InstallSize
            : undefined,
        matchConfidence: "unmatched",
      });
    }
  }

  const seen = new Set<string>();
  return detected.filter((g) => {
    if (seen.has(g.externalId)) return false;
    seen.add(g.externalId);
    return true;
  });
}
