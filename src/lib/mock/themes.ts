import type { ThemePreset } from "@/lib/types";

const BASE = "2026-04-01T00:00:00.000Z";

export const THEME_SEEDS: ThemePreset[] = [
  {
    id: "theme-cyberpunk-neon",
    name: "Cyberpunk Neon",
    author: "@NeonDreams",
    description: "A high-contrast neon theme",
    featured: true,
    createdAt: BASE,
  },
  {
    id: "theme-paper-white",
    name: "Paper White",
    author: "@DocStudio",
    description: "Bright, low-contrast reading theme",
    featured: false,
    createdAt: BASE,
  },
  {
    id: "theme-retro-crt",
    name: "Retro CRT",
    author: "@VHSGhost",
    description: "Scanlines, phosphor green, and a hint of static",
    featured: false,
    createdAt: BASE,
  },
];
