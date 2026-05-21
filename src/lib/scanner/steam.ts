import {
  getOS,
  homeDirSafe,
  isDesktop,
  pathExistsSafe,
  readDirSafe,
  readTextFileSafe,
} from "@/lib/platform";
import type { DetectedGame } from "./types";
import { findString, parseVdf, type VdfNode } from "./vdf";

/**
 * Returns the prioritized list of likely Steam install roots for the current
 * OS. Web returns []. Each path is checked at scan time; the first one that
 * exists wins, but we try all to be tolerant of users with custom installs.
 */
async function candidateSteamRoots(): Promise<string[]> {
  const os = getOS();
  if (os === "mac") {
    const home = await homeDirSafe();
    return [`${home}/Library/Application Support/Steam`];
  }
  if (os === "linux") {
    const home = await homeDirSafe();
    return [`${home}/.steam/steam`, `${home}/.local/share/Steam`];
  }
  if (os === "windows") {
    return [
      "C:/Program Files (x86)/Steam",
      "C:/Program Files/Steam",
    ];
  }
  return [];
}

/**
 * Parses libraryfolders.vdf and returns the absolute paths of every Steam
 * library root the user has configured. The format nests roots under numeric
 * keys, each with a `path` leaf.
 */
function extractLibraryRoots(vdf: { [k: string]: VdfNode }): string[] {
  const roots: string[] = [];
  const folders =
    (vdf["libraryfolders"] as { [k: string]: VdfNode } | undefined) ?? vdf;
  if (typeof folders !== "object") return roots;
  for (const key of Object.keys(folders)) {
    const node = folders[key];
    if (typeof node === "object") {
      const path = findString(node, "path");
      if (path) roots.push(path.replace(/\\\\/g, "/"));
    }
  }
  return roots;
}

interface SteamManifest {
  appid: string;
  name: string;
  installdir?: string;
  sizeBytes?: number;
}

function parseManifest(text: string): SteamManifest | null {
  const parsed = parseVdf(text);
  const appState =
    (parsed["AppState"] as { [k: string]: VdfNode } | undefined) ??
    (parsed["appstate"] as { [k: string]: VdfNode } | undefined) ??
    parsed;
  const appid = findString(appState, "appid");
  const name = findString(appState, "name");
  if (!appid || !name) return null;
  const installdir = findString(appState, "installdir");
  const sizeOnDisk = findString(appState, "SizeOnDisk");
  const sizeBytes = sizeOnDisk ? Number(sizeOnDisk) : undefined;
  return {
    appid,
    name,
    installdir,
    sizeBytes:
      typeof sizeBytes === "number" && Number.isFinite(sizeBytes)
        ? sizeBytes
        : undefined,
  };
}

/**
 * Scans every Steam library root for `appmanifest_*.acf` files and returns the
 * detected games. On web (or with no Steam install) returns []. Never throws —
 * surfacing errors is the orchestrator's job.
 */
export async function scanSteam(): Promise<DetectedGame[]> {
  if (!isDesktop()) return [];

  const detected: DetectedGame[] = [];
  const roots = await candidateSteamRoots();

  for (const root of roots) {
    if (!(await pathExistsSafe(root))) continue;

    const libraryFoldersPath = `${root}/config/libraryfolders.vdf`;
    const vdfText = await readTextFileSafe(libraryFoldersPath);

    // If libraryfolders.vdf is missing, fall back to the install root itself.
    const libraryRoots: string[] = [];
    if (vdfText) {
      try {
        const parsed = parseVdf(vdfText);
        libraryRoots.push(...extractLibraryRoots(parsed));
      } catch {
        // ignore parse errors, keep the fallback
      }
    }
    if (libraryRoots.length === 0) libraryRoots.push(root);

    for (const libRoot of libraryRoots) {
      const steamappsDir = `${libRoot.replace(/\/+$/, "")}/steamapps`;
      if (!(await pathExistsSafe(steamappsDir))) continue;
      const entries = await readDirSafe(steamappsDir);
      for (const entry of entries) {
        if (!entry.isFile) continue;
        if (!/^appmanifest_\d+\.acf$/i.test(entry.name)) continue;
        const manifestPath = `${steamappsDir}/${entry.name}`;
        const text = await readTextFileSafe(manifestPath);
        if (!text) continue;
        const manifest = parseManifest(text);
        if (!manifest) continue;
        const installPath = manifest.installdir
          ? `${steamappsDir}/common/${manifest.installdir}`
          : undefined;
        detected.push({
          launcher: "steam",
          externalId: manifest.appid,
          name: manifest.name,
          installPath,
          sizeBytes: manifest.sizeBytes,
          matchConfidence: "unmatched",
        });
      }
    }
  }

  // De-dupe by appid in case two library roots reference the same game.
  const seen = new Set<string>();
  return detected.filter((g) => {
    if (seen.has(g.externalId)) return false;
    seen.add(g.externalId);
    return true;
  });
}
