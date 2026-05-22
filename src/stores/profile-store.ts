import { create } from "zustand";
import { persist } from "zustand/middleware";

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

const detectSystemRig = (): SystemRig => {
  let os = "Unknown OS";
  let cpu = "Unknown Processor";
  let ram = "Unknown Memory";
  let gpu = "Unknown Graphics";
  let display = "Unknown Display";

  if (typeof window !== "undefined") {
    const ua = navigator.userAgent;
    if (ua.includes("Win")) os = "Windows 11 64-bit";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";

    const cores = navigator.hardwareConcurrency;
    if (cores) cpu = `Processor (${cores}-Core)`;

    const memory = (navigator as any).deviceMemory;
    if (memory) ram = `${memory} GB RAM`;

    display = `${window.screen.width} x ${window.screen.height}`;

    try {
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
    } catch (e) {}
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

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      activeThemeId: "cyber",
      setActiveThemeId: (id) => set({ activeThemeId: id }),
      systemRig: detectSystemRig(),
      setSystemRig: (rig) =>
        set((state) => ({ systemRig: { ...state.systemRig, ...rig } })),
      customFps: {},
      setCustomFps: (gameId, estimate) => 
        set((state) => ({ customFps: { ...state.customFps, [gameId]: estimate } }))
    }),
    {
      name: "dreamworks-profile-storage",
    }
  )
);
