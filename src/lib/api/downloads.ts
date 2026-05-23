import {
  installGameNative,
  moveInstallNative,
  openInstallFolderNative,
  pauseDownloadNative,
  resumeDownloadNative,
  uninstallGameNative,
  verifyInstallNative,
  type MoveInstallResult,
  type VerifyInstallResult,
} from "../native-launcher";
import { readTextFileSafe, writeTextFileSafe } from "../platform";
import type {
  CommandResult,
  DownloadTask,
  GameId,
  LauncherSource,
} from "../types";
import { wait } from "./_delay";

export interface BackupManifestPayload {
  id: string;
  createdAt: string;
  gameCount: number;
  sizeBytes: number;
  targetPath: string;
  entries?: Array<{ gameId: GameId; sizeBytes: number; installPath?: string }>;
}

export async function startInstall(input: {
  gameId: GameId;
  sourceLauncher?: LauncherSource;
  installPath: string;
  sizeBytes: number;
}): Promise<CommandResult<DownloadTask>> {
  const native = await installGameNative(input);
  if (native.ok) {
    return {
      ok: true,
      data: {
        taskId: native.data.taskId,
        gameId: native.data.gameId,
        status: native.data.status === "queued" ? "queued" : "downloading",
        progress: 0,
        totalBytes: input.sizeBytes,
        downloadedBytes: 0,
        sourceLauncher: input.sourceLauncher,
        installPath: native.data.installPath ?? input.installPath,
        queuedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canPause: true,
        canResume: false,
      },
    };
  }
  if (native.error.code !== "not_desktop") {
    return { ok: false, error: native.error };
  }
  await wait(100);
  return {
    ok: true,
    data: {
      taskId: `${input.gameId}-${Date.now()}`,
      gameId: input.gameId,
      status: "downloading",
      progress: 0,
      totalBytes: input.sizeBytes,
      downloadedBytes: 0,
      sourceLauncher: input.sourceLauncher,
      installPath: input.installPath,
      queuedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canPause: true,
      canResume: false,
    },
  };
}

export async function pauseDownload(taskId: string) {
  return pauseDownloadNative(taskId);
}

export async function resumeDownload(taskId: string) {
  return resumeDownloadNative(taskId);
}

export async function verifyInstall(input: {
  gameId: GameId;
  installPath: string;
}): Promise<CommandResult<VerifyInstallResult>> {
  return verifyInstallNative(input);
}

export async function moveInstall(input: {
  gameId: GameId;
  fromPath: string;
  toPath: string;
}): Promise<CommandResult<MoveInstallResult>> {
  return moveInstallNative(input);
}

export async function uninstallGame(input: { gameId: GameId; installPath: string }) {
  return uninstallGameNative(input);
}

export async function openInstallFolder(installPath: string) {
  return openInstallFolderNative({ installPath });
}

export async function writeBackupManifest(
  targetPath: string,
  manifest: BackupManifestPayload,
): Promise<boolean> {
  return writeTextFileSafe(targetPath, JSON.stringify(manifest, null, 2));
}

export async function readBackupManifest(
  targetPath: string,
): Promise<BackupManifestPayload | null> {
  const text = await readTextFileSafe(targetPath);
  if (!text) return null;
  try {
    return JSON.parse(text) as BackupManifestPayload;
  } catch {
    return null;
  }
}
