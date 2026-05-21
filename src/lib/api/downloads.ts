import {
  installGameNative,
  moveInstallNative,
  pauseDownloadNative,
  resumeDownloadNative,
  uninstallGameNative,
  verifyInstallNative,
  type MoveInstallResult,
  type VerifyInstallResult,
} from "../native-launcher";
import type {
  CommandResult,
  DownloadTask,
  GameId,
  LauncherSource,
} from "../types";
import { wait } from "./_delay";

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
