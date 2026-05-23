import type { ControllerLayout } from "@/lib/types";

const BASE = "2026-04-01T00:00:00.000Z";

export const CONTROLLER_LAYOUT_SEEDS: ControllerLayout[] = [
  // Global community layouts (no gameId)
  {
    id: "layout-fps-tryhard",
    name: "FPS Tryhard (No Deadzone)",
    creator: "xX_Sniper_Xx",
    downloads: 12400,
    createdAt: BASE,
  },
  {
    id: "layout-relaxed-rpg",
    name: "Relaxed RPG Layout",
    creator: "CozyGamer",
    downloads: 5100,
    createdAt: BASE,
  },
  {
    id: "layout-souls-dodge-r1",
    name: "Souls-like Dodge on R1",
    creator: "PraiseTheSun",
    downloads: 8900,
    createdAt: BASE,
  },
  {
    id: "layout-default-gyro",
    name: "Default + Gyro Aim",
    creator: "Dreamworks",
    downloads: 142000,
    createdAt: BASE,
  },

  // Per-game community profiles (gameId attached)
  {
    id: "profile-cyber-strike-comp",
    name: "Competitive FPS Layout (Scuf/Elite)",
    creator: "ProSnipe",
    downloads: 45200,
    rating: 4.9,
    gameId: "cyber-strike",
    createdAt: BASE,
  },
  {
    id: "profile-cyber-strike-chill",
    name: "Chill Story Mode",
    creator: "CasualGamer",
    downloads: 12100,
    rating: 4.5,
    gameId: "cyber-strike",
    createdAt: BASE,
  },
  {
    id: "profile-cyber-strike-bumper",
    name: "Bumper Jumper Tactical",
    creator: "HaloVet",
    downloads: 8400,
    rating: 4.8,
    gameId: "cyber-strike",
    createdAt: BASE,
  },
];
