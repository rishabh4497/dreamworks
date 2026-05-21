import type { GameId, PatchNote } from "../types";
import { randomFromSeed } from "./_seed";
import { getSeedById } from "./games";

const TITLES = [
  "Hotfix — small mercies",
  "Patch — quality of life",
  "Update — content drop",
  "Patch — balance pass",
  "Update — accessibility",
  "Hotfix — crash on launch",
  "Patch — controller fixes",
  "Update — seasonal",
  "Patch — localization",
  "Update — modding tools",
];

const BULLETS = [
  "Fixed a softlock when entering the second chapter on a cold save.",
  "Reduced ambient particle count on low-end GPUs.",
  "Cloud save sync no longer pauses when offline.",
  "Added 4 new controller bindings for left-handed players.",
  "Rebalanced economy in the late game.",
  "Improved subtitle contrast on bright scenes.",
  "Fixed audio occlusion when looking through doorways.",
  "Reduced install size by ~700 MB.",
  "Localization passes for FR, DE, ES-LA, JA, KO.",
  "Workshop: new tagging system for community content.",
  "Server tickrate raised to 60 in EU and NA regions.",
  "Reduced loading times after death by ~30%.",
  "Achievements: unlock retroactively for old saves.",
  "Photo mode added, accessible from pause menu.",
];

export function buildPatchNotes(gameId: GameId): PatchNote[] {
  const seed = getSeedById(gameId);
  if (!seed) return [];
  const rand = randomFromSeed(`patch-${gameId}`);
  const count = 6 + Math.floor(rand() * 6);
  const today = new Date();
  const result: PatchNote[] = [];
  let major = 1;
  let minor = 0;

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - Math.floor(i * (30 + rand() * 30)));

    minor += 1;
    if (i > 0 && i % 4 === 0) {
      major += 1;
      minor = 0;
    }
    const bulletCount = 3 + Math.floor(rand() * 3);
    const bullets: string[] = [];
    for (let b = 0; b < bulletCount; b++) {
      bullets.push(BULLETS[Math.floor(rand() * BULLETS.length)]);
    }
    result.push({
      version: `${major}.${minor}`,
      date: d.toISOString(),
      title: TITLES[Math.floor(rand() * TITLES.length)],
      bullets,
    });
  }
  return result;
}
