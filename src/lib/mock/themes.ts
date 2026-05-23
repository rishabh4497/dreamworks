import type { ThemePreset } from "@/lib/types";

const BASE = "2026-04-01T00:00:00.000Z";

export const THEME_SEEDS: ThemePreset[] = [
  {
    id: "theme-cyberpunk-neon",
    name: "Cyberpunk Neon",
    author: "Dreamworks",
    description: "A high-contrast neon theme",
    featured: true,
    swatches: { bg: "#0a0a0a", surface: "#1c1c1e", accent: "#ff3df0" },
    createdAt: BASE,
  },
  {
    id: "theme-paper-white",
    name: "Paper White",
    author: "Dreamworks",
    description: "Bright, low-contrast reading theme",
    featured: false,
    swatches: { bg: "#f5f5f7", surface: "#ebebed", accent: "#2a6fa5" },
    createdAt: BASE,
  },
  {
    id: "theme-retro-crt",
    name: "Retro CRT",
    author: "@VHSGhost",
    description: "Scanlines, phosphor green, and a hint of static",
    featured: false,
    swatches: { bg: "#001a08", surface: "#003015", accent: "#00ff66" },
    createdAt: BASE,
  },
];
