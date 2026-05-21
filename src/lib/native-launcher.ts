import { invokeDesktop } from "./platform";
import type {
  CloudSaveStatus,
  CommandResult,
  DrmType,
  GameId,
  InstallManifest,
  LauncherSource,
} from "./types";

export interface NativeDetectedGame {
  launcher: LauncherSource;
  externalId: string;
  name: string;
  installPath?: string;
  launchCommand?: string;
  sizeBytes?: number;
  manifestPath?: string;
}

export interface NativeLauncherScanResult {
  detected: NativeDetectedGame[];
  pathsRead: string[];
  durationMs: number;
}

export interface LaunchGameRequest {
  gameId: GameId;
  sourceLauncher?: LauncherSource;
  executablePath?: string;
  launchCommand?: string;
  workingDir?: string;
}

export interface LaunchGameResult {
  gameId: GameId;
  processId: number | null;
  launchedAt: string;
  sourceLauncher?: LauncherSource;
}

export interface InstallGameRequest {
  gameId: GameId;
  sourceLauncher?: LauncherSource;
  installPath: string;
  sizeBytes: number;
}

export interface DownloadCommandResult {
  taskId: string;
  gameId: GameId;
  status: "queued" | "downloading" | "paused" | "complete" | "cancelled" | "error";
  installPath?: string;
}

export interface VerifyInstallRequest {
  gameId: GameId;
  installPath: string;
}

export interface VerifyInstallResult {
  gameId: GameId;
  installPath: string;
  exists: boolean;
  verifiedAt: string;
}

export interface MoveInstallRequest {
  gameId: GameId;
  fromPath: string;
  toPath: string;
}

export interface MoveInstallResult {
  gameId: GameId;
  fromPath: string;
  toPath: string;
  movedAt: string;
}

export interface UninstallGameRequest {
  gameId: GameId;
  installPath: string;
}

export interface OpenInstallFolderRequest {
  installPath: string;
}

export interface SystemCapabilities {
  os: "windows" | "mac" | "linux" | "unknown";
  arch: string;
  homeDir: string | null;
  canOpenFolders: boolean;
  canSpawnProcesses: boolean;
  canScanLaunchers: boolean;
}

async function invokeCommand<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<CommandResult<T>> {
  const result = await invokeDesktop<CommandResult<T>>(command, args);
  if (result) return result;
  return {
    ok: false,
    error: {
      code: "not_desktop",
      message: "This command is only available in the desktop client.",
      recoverable: true,
    },
  };
}

export function scanLaunchersNative(consentGranted: boolean) {
  return invokeCommand<NativeLauncherScanResult>("scan_launchers", {
    request: { consentGranted },
  });
}

export function launchGameNative(request: LaunchGameRequest) {
  return invokeCommand<LaunchGameResult>("launch_game", { request });
}

export function installGameNative(request: InstallGameRequest) {
  return invokeCommand<DownloadCommandResult>("install_game", { request });
}

export function pauseDownloadNative(taskId: string) {
  return invokeCommand<DownloadCommandResult>("pause_download", { taskId });
}

export function resumeDownloadNative(taskId: string) {
  return invokeCommand<DownloadCommandResult>("resume_download", { taskId });
}

export function verifyInstallNative(request: VerifyInstallRequest) {
  return invokeCommand<VerifyInstallResult>("verify_install", { request });
}

export function moveInstallNative(request: MoveInstallRequest) {
  return invokeCommand<MoveInstallResult>("move_install", { request });
}

export function uninstallGameNative(request: UninstallGameRequest) {
  return invokeCommand<{ gameId: GameId; uninstalledAt: string }>("uninstall_game", {
    request,
  });
}

export function openInstallFolderNative(request: OpenInstallFolderRequest) {
  return invokeCommand<{ opened: boolean }>("open_install_folder", { request });
}

export function readSystemCapabilitiesNative() {
  return invokeCommand<SystemCapabilities>("read_system_capabilities");
}

export function manifestFromNativeDetection(
  gameId: GameId,
  detected: NativeDetectedGame,
): InstallManifest | null {
  if (!detected.installPath) return null;
  const drmType: DrmType =
    detected.launcher === "dreamworks" || detected.launcher === "manual"
      ? "dreamworks"
      : detected.launcher === "steam" || detected.launcher === "epic"
        ? detected.launcher
        : "third-party";
  return {
    gameId,
    sourceLauncher: detected.launcher,
    externalId: detected.externalId,
    installPath: detected.installPath,
    launchCommand: detected.launchCommand,
    sizeBytes: detected.sizeBytes ?? 0,
    installedAt: new Date().toISOString(),
    lastVerifiedAt: null,
    updatePolicy: "manual",
    canLaunchOffline: drmType === "dreamworks",
    drmType,
  };
}

export function defaultCloudSaveStatus(source: LauncherSource): CloudSaveStatus {
  if (source === "manual") return "unsupported";
  return source === "dreamworks" ? "synced" : "offline";
}
