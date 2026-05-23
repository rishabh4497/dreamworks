export type AchievementId = string;
export type OSPlatform = "windows" | "mac" | "linux";

export interface InitOptions {
  appId: string;
  buildLabel?: string;
  handshakeUrl?: string;
  machineId?: string;
}

export interface DreamworksManifest {
  schemaVersion: 1;
  appId: string;
  sdkVersion: string;
  buildLabel: string;
  achievements: AchievementId[];
  platforms: OSPlatform[];
  executable: string;
}

export interface HandshakePayload {
  appId: string;
  sdkVersion: string;
  buildLabel?: string;
  machineId?: string;
  timestamp: string;
}
