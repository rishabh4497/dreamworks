import type { CommandResult, GameId } from "@/lib/types";
import {
  deleteCachePathNative,
  listStorageDrivesNative,
  scanCleanupCandidatesNative,
  type CleanupCandidateNative,
  type CleanupScanEntry,
  type DeleteCachePathResult,
} from "@/lib/native-launcher";

export interface StorageDrive {
  id: string;
  name: string;
  rootPath: string;
  totalBytes: number;
  availableBytes: number;
  usedBytes: number;
  fileSystem?: string;
  isRemovable?: boolean;
}

export interface CleanupCandidate {
  id: string;
  driveId: string;
  label: string;
  source: string;
  path: string;
  sizeBytes: number;
  kind: string;
}

export async function fetchStorageDrives(): Promise<CommandResult<StorageDrive[]>> {
  const native = await listStorageDrivesNative();
  if (!native.ok) return { ok: false, error: native.error };
  const drives: StorageDrive[] = native.data.map((d) => ({
    id: d.id,
    name: d.name,
    rootPath: d.mountPoint,
    totalBytes: d.totalBytes,
    availableBytes: d.availableBytes,
    usedBytes: d.usedBytes,
    fileSystem: d.fileSystem,
    isRemovable: d.isRemovable,
  }));
  return { ok: true, data: drives };
}

export async function fetchCleanupCandidates(
  installPaths: CleanupScanEntry[],
  drives: StorageDrive[],
): Promise<CommandResult<CleanupCandidate[]>> {
  if (installPaths.length === 0) {
    return { ok: true, data: [] };
  }
  const native = await scanCleanupCandidatesNative(installPaths);
  if (!native.ok) return { ok: false, error: native.error };
  const candidates = native.data.map((c: CleanupCandidateNative) => ({
    id: c.id,
    driveId: resolveDriveForPath(c.path, drives).id,
    label: c.label,
    source: c.source,
    path: c.path,
    sizeBytes: c.sizeBytes,
    kind: c.kind,
  }));
  return { ok: true, data: candidates };
}

export async function deleteCacheCandidate(
  path: string,
): Promise<CommandResult<DeleteCachePathResult>> {
  return deleteCachePathNative(path);
}

export function installPathForGame(
  gameId: GameId,
  installPath: string | undefined,
  fallbackRoot: string,
) {
  return installPath ?? `${fallbackRoot}/${gameId}`;
}

export function resolveDriveForPath(
  path: string,
  drives: StorageDrive[],
): StorageDrive {
  const fallback: StorageDrive = {
    id: "unknown",
    name: "Unknown drive",
    rootPath: "",
    totalBytes: 0,
    availableBytes: 0,
    usedBytes: 0,
  };
  if (drives.length === 0) return fallback;
  // Pick the drive whose mount point is the longest prefix of the path.
  const match = drives
    .filter((drive) => drive.rootPath && path.startsWith(drive.rootPath))
    .sort((a, b) => b.rootPath.length - a.rootPath.length)[0];
  return match ?? drives[0];
}

export function buildMovedInstallPath(
  gameId: GameId,
  driveId: string,
  drives: StorageDrive[],
  installSubdir = "Dreamworks",
) {
  const drive = drives.find((d) => d.id === driveId) ?? drives[0];
  if (!drive) return `/${installSubdir}/${gameId}`;
  const base = drive.rootPath.replace(/\/+$/, "");
  return `${base}/${installSubdir}/${gameId}`;
}
