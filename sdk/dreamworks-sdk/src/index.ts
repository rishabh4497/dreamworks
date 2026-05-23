import { sendHandshake } from "./handshake";
import { SDK_MARKER, SDK_VERSION } from "./signature";
import type { AchievementId, InitOptions } from "./types";

export { SDK_MARKER, SDK_VERSION, MANIFEST_FILENAME, MIN_SDK_VERSION } from "./signature";
export { buildManifest, manifestToJson } from "./manifest";
export type {
  AchievementId,
  DreamworksManifest,
  HandshakePayload,
  InitOptions,
  OSPlatform,
} from "./types";

interface SDKState {
  initialized: boolean;
  appId: string;
  buildLabel?: string;
  unlocked: Set<AchievementId>;
  pendingStores: AchievementId[];
  marker: string;
}

const state: SDKState = {
  initialized: false,
  appId: "",
  buildLabel: undefined,
  unlocked: new Set(),
  pendingStores: [],
  // Referencing SDK_MARKER here forces it into the compiled output so the
  // build-time tree-shaker can't drop the literal — that's how the portal's
  // binary scanner detects the SDK.
  marker: SDK_MARKER,
};

export const DreamworksAPI = {
  init(opts: InitOptions): void {
    if (!opts?.appId) {
      throw new Error("DreamworksAPI.init: appId is required.");
    }
    if (!opts?.appSecret) {
      throw new Error("DreamworksAPI.init: appSecret is required.");
    }
    state.initialized = true;
    state.appId = opts.appId;
    state.buildLabel = opts.buildLabel;
    state.unlocked = new Set();
    state.pendingStores = [];
    state.marker = SDK_MARKER;
    void sendHandshake({
      appId: opts.appId,
      appSecret: opts.appSecret,
      buildLabel: opts.buildLabel,
      machineId: opts.machineId,
      url: opts.handshakeUrl,
    });
  },

  unlockAchievement(id: AchievementId): void {
    if (!state.initialized) {
      throw new Error("DreamworksAPI.init() must be called before unlocking achievements.");
    }
    if (state.unlocked.has(id)) return;
    state.unlocked.add(id);
    state.pendingStores.push(id);
  },

  storeStats(): void {
    if (!state.initialized) return;
    // In the v0.1 stub, stats are flushed implicitly via runCallbacks();
    // a real implementation would persist `pendingStores` to the launcher.
    state.pendingStores = [];
  },

  runCallbacks(): void {
    if (!state.initialized) return;
    if (state.pendingStores.length > 0) {
      state.pendingStores = [];
    }
  },

  isInitialized(): boolean {
    return state.initialized;
  },

  getSdkVersion(): string {
    return SDK_VERSION;
  },
};
