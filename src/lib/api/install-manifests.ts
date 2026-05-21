import type { DrmType, GameId, InstallManifest, LauncherSource } from "../types";
import { wait } from "./_delay";

const STORAGE_KEY = "dreamworks-install-manifests";

function readStored(): InstallManifest[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InstallManifest[]) : [];
  } catch {
    return [];
  }
}

function writeStored(manifests: InstallManifest[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(manifests));
}

function drmForSource(sourceLauncher: LauncherSource): DrmType {
  if (sourceLauncher === "manual") return "none";
  if (sourceLauncher === "dreamworks") return "dreamworks";
  if (sourceLauncher === "steam" || sourceLauncher === "epic") return sourceLauncher;
  return "third-party";
}

export async function listInstallManifests(): Promise<InstallManifest[]> {
  await wait();
  return readStored();
}

export async function getInstallManifest(gameId: GameId): Promise<InstallManifest | null> {
  await wait();
  return readStored().find((manifest) => manifest.gameId === gameId) ?? null;
}

export async function upsertInstallManifest(input: {
  gameId: GameId;
  sourceLauncher?: LauncherSource;
  externalId?: string;
  installPath: string;
  launchCommand?: string;
  executablePath?: string;
  version?: string;
  buildId?: string;
  sizeBytes: number;
  canLaunchOffline?: boolean;
  drmType?: DrmType;
  lastVerifiedAt?: string | null;
}): Promise<InstallManifest> {
  await wait();
  const existing = readStored();
  const previous = existing.find((manifest) => manifest.gameId === input.gameId);
  const sourceLauncher = input.sourceLauncher ?? previous?.sourceLauncher ?? "dreamworks";
  const drmType = input.drmType ?? previous?.drmType ?? drmForSource(sourceLauncher);
  const manifest: InstallManifest = {
    gameId: input.gameId,
    sourceLauncher,
    externalId: input.externalId ?? previous?.externalId,
    installPath: input.installPath,
    launchCommand: input.launchCommand ?? previous?.launchCommand,
    executablePath: input.executablePath ?? previous?.executablePath,
    version: input.version ?? previous?.version,
    buildId: input.buildId ?? previous?.buildId ?? `dw-${Date.now()}`,
    sizeBytes: input.sizeBytes,
    installedAt: previous?.installedAt ?? new Date().toISOString(),
    lastVerifiedAt: input.lastVerifiedAt ?? previous?.lastVerifiedAt ?? null,
    updatePolicy: previous?.updatePolicy ?? "auto",
    canLaunchOffline:
      input.canLaunchOffline ?? previous?.canLaunchOffline ?? (drmType === "dreamworks" || drmType === "none"),
    drmType,
  };
  writeStored([manifest, ...existing.filter((candidate) => candidate.gameId !== input.gameId)]);
  return manifest;
}

export async function markInstallVerified(gameId: GameId): Promise<InstallManifest | null> {
  await wait();
  const manifest = readStored().find((candidate) => candidate.gameId === gameId);
  if (!manifest) return null;
  const next = { ...manifest, lastVerifiedAt: new Date().toISOString() };
  await upsertInstallManifest(next);
  return next;
}

export async function removeInstallManifest(gameId: GameId): Promise<void> {
  await wait();
  writeStored(readStored().filter((manifest) => manifest.gameId !== gameId));
}
