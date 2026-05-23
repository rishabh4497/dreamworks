import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isDesktop } from "@/lib/platform";
import { type, version, arch } from "@tauri-apps/plugin-os";
import { syncWithFirestore } from "@/lib/firestore-sync";

export interface SystemRig {
  os: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  display: string;
}

export interface FpsEstimate {
  gameId: string;
  gameName: string;
  fps: number;
  quality: string;
  gameIconUrl: string;
}

interface ProfileStore {
  activeThemeId: string;
  setActiveThemeId: (id: string) => void;
  systemRig: SystemRig;
  setSystemRig: (rig: Partial<SystemRig>) => void;
  customFps: Record<string, FpsEstimate>;
  setCustomFps: (gameId: string, estimate: FpsEstimate) => void;
}

interface RemoteProfile {
  activeThemeId: string;
  customFps: Record<string, FpsEstimate>;
}

export const detectSystemRig = (): SystemRig => {
  let os = "Unknown OS";
  let cpu = "Unknown Processor";
  let ram = "Unknown Memory";
  let gpu = "Unknown Graphics";
  let display = "Unknown Display";

  if (typeof window !== "undefined") {
    try {
      if (isDesktop()) {
        if (window.__TAURI_OS_PLUGIN_INTERNALS__) {
          const osType = type();
          const osVer = version();
          const osArch = arch() === "aarch64" ? "Apple Silicon" : arch();

          if (osType === "macos") os = `macOS ${osVer} (${osArch})`;
          else if (osType === "windows") os = `Windows ${osVer} (${osArch})`;
          else if (osType === "linux") os = `Linux ${osVer} (${osArch})`;
          else os = `${osType} ${osVer}`;
        } else {
          os = "Desktop (OS Plugin Pending)";
        }
      } else {
        if (navigator.userAgent.includes("Win")) os = "Windows (Web)";
        else if (navigator.userAgent.includes("Mac")) os = "macOS (Web)";
        else if (navigator.userAgent.includes("Linux")) os = "Linux (Web)";
      }

      const cpuCores = navigator.hardwareConcurrency || 8;
      cpu = `Processor (${cpuCores}-Core)`;

      const memory = navigator.deviceMemory || 16;
      ram = `${memory} GB RAM`;

      display = `${window.screen.width} x ${window.screen.height}`;

      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (renderer) {
             gpu = renderer.replace("ANGLE (", "").split(",")[1]?.trim() || renderer.replace("ANGLE (", "").replace(")", "");
          }
        }
      }
    } catch (e) {
      console.error("Failed to detect system rig:", e);
    }
  }

  return {
    os,
    cpu,
    gpu,
    ram,
    storage: "1TB NVMe SSD",
    display,
  };
};

let firestoreHandle: ReturnType<typeof syncWithFirestore<RemoteProfile>> | null = null;

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => {
      if (typeof window !== "undefined" && !firestoreHandle) {
        firestoreHandle = syncWithFirestore<RemoteProfile>({
          key: "profile",
          selectSlice: () => ({
            activeThemeId: get().activeThemeId,
            customFps: get().customFps,
          }),
          applyRemote: (remote) => {
            const patch: Partial<ProfileStore> = {};
            if (typeof remote.activeThemeId === "string") {
              patch.activeThemeId = remote.activeThemeId;
            }
            if (remote.customFps && typeof remote.customFps === "object") {
              patch.customFps = remote.customFps;
            }
            if (Object.keys(patch).length > 0) set(patch);
          },
        });
      }
      return {
        activeThemeId: "cyber",
        setActiveThemeId: (id) => {
          set({ activeThemeId: id });
          firestoreHandle?.push({
            activeThemeId: id,
            customFps: get().customFps,
          });
        },
        systemRig: detectSystemRig(),
        setSystemRig: (rig) =>
          set((state) => ({ systemRig: { ...state.systemRig, ...rig } })),
        customFps: {},
        setCustomFps: (gameId, estimate) => {
          const next = { ...get().customFps, [gameId]: estimate };
          set({ customFps: next });
          firestoreHandle?.push({
            activeThemeId: get().activeThemeId,
            customFps: next,
          });
        },
      };
    },
    {
      name: "dreamworks-profile-storage",
      partialize: (state) => ({
        activeThemeId: state.activeThemeId,
        customFps: state.customFps,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        // systemRig is hardware-specific to the current machine — never sync.
        systemRig: currentState.systemRig,
      }),
    }
  )
);
