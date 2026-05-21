import type { GameId, LibraryEntry } from "@/lib/types";

export interface StorageDrive {
  id: string;
  name: string;
  rootPath: string;
  totalBytes: number;
  reservedBytes: number;
}

export interface CleanupCandidate {
  id: string;
  driveId: string;
  label: string;
  source: string;
  sizeBytes: number;
  selected: boolean;
}

export const STORAGE_DRIVES: StorageDrive[] = [
  {
    id: "main",
    name: "Main SSD",
    rootPath: "/Games/Dreamworks",
    totalBytes: 1_000_000_000_000,
    reservedBytes: 420_000_000_000,
  },
  {
    id: "vault",
    name: "Vault SSD",
    rootPath: "/Volumes/Vault/Dreamworks",
    totalBytes: 2_000_000_000_000,
    reservedBytes: 850_000_000_000,
  },
  {
    id: "archive",
    name: "Archive HDD",
    rootPath: "/Volumes/Archive/Dreamworks",
    totalBytes: 4_000_000_000_000,
    reservedBytes: 2_150_000_000_000,
  },
];

export function installPathForGame(
  gameId: GameId,
  installPath: string | undefined,
  fallbackRoot: string,
) {
  return installPath ?? `${fallbackRoot}/${gameId}`;
}

export function resolveDriveForPath(path: string) {
  return (
    STORAGE_DRIVES.find((drive) => path.startsWith(drive.rootPath)) ??
    STORAGE_DRIVES[0]
  );
}

export function buildMovedInstallPath(gameId: GameId, driveId: string) {
  const drive = STORAGE_DRIVES.find((candidate) => candidate.id === driveId) ?? STORAGE_DRIVES[0];
  return `${drive.rootPath}/${gameId}`;
}

export function buildCleanupCandidates(
  installedEntries: LibraryEntry[],
  getInstallPath: (entry: LibraryEntry) => string,
): CleanupCandidate[] {
  const candidates: CleanupCandidate[] = [];

  installedEntries.forEach((entry, index) => {
    const drive = resolveDriveForPath(getInstallPath(entry));
    const patchBytes = Math.min(2_800_000_000, Math.round(entry.sizeBytes * 0.08));
    const shaderBytes = Math.min(1_400_000_000, Math.round(entry.sizeBytes * 0.035));

    if (patchBytes > 0) {
      candidates.push({
        id: `${entry.gameId}-patches`,
        driveId: drive.id,
        label: "Old patch chunks",
        source: entry.gameId,
        sizeBytes: patchBytes,
        selected: index % 2 === 0,
      });
    }

    if (shaderBytes > 0) {
      candidates.push({
        id: `${entry.gameId}-shader-cache`,
        driveId: drive.id,
        label: "Shader cache",
        source: entry.gameId,
        sizeBytes: shaderBytes,
        selected: index % 3 !== 0,
      });
    }
  });

  candidates.push({
    id: "launcher-crash-dumps",
    driveId: "main",
    label: "Crash dumps",
    source: "Launcher diagnostics",
    sizeBytes: 640_000_000,
    selected: true,
  });

  return candidates.sort((a, b) => b.sizeBytes - a.sizeBytes);
}
