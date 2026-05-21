import type { Tag } from "../types";

export const TAGS: Tag[] = [
  { slug: "open-world", name: "Open World", voteCount: 38241 },
  { slug: "atmospheric", name: "Atmospheric", voteCount: 28910 },
  { slug: "story-rich", name: "Story Rich", voteCount: 25102 },
  { slug: "souls-like", name: "Souls-like", voteCount: 18204 },
  { slug: "pixel-graphics", name: "Pixel Graphics", voteCount: 15003 },
  { slug: "co-op", name: "Co-op", voteCount: 22810 },
  { slug: "multiplayer", name: "Multiplayer", voteCount: 19872 },
  { slug: "singleplayer", name: "Singleplayer", voteCount: 41023 },
  { slug: "exploration", name: "Exploration", voteCount: 19204 },
  { slug: "rogue-like", name: "Roguelike", voteCount: 12309 },
  { slug: "metroidvania", name: "Metroidvania", voteCount: 9012 },
  { slug: "survival", name: "Survival", voteCount: 16320 },
  { slug: "crafting", name: "Crafting", voteCount: 14820 },
  { slug: "puzzle", name: "Puzzle", voteCount: 10923 },
  { slug: "fps", name: "FPS", voteCount: 21208 },
  { slug: "third-person", name: "Third Person", voteCount: 14021 },
  { slug: "fantasy", name: "Fantasy", voteCount: 25190 },
  { slug: "sci-fi", name: "Sci-fi", voteCount: 18120 },
  { slug: "horror", name: "Horror", voteCount: 14021 },
  { slug: "psychological-horror", name: "Psychological Horror", voteCount: 7920 },
  { slug: "stealth", name: "Stealth", voteCount: 8011 },
  { slug: "tactical", name: "Tactical", voteCount: 6520 },
  { slug: "turn-based", name: "Turn-Based", voteCount: 9012 },
  { slug: "real-time", name: "Real-Time", voteCount: 8011 },
  { slug: "city-builder", name: "City Builder", voteCount: 5012 },
  { slug: "farming-sim", name: "Farming Sim", voteCount: 4811 },
  { slug: "automation", name: "Automation", voteCount: 4123 },
  { slug: "rhythm", name: "Rhythm", voteCount: 2901 },
  { slug: "narrative", name: "Narrative", voteCount: 9012 },
  { slug: "competitive", name: "Competitive", voteCount: 11023 },
  { slug: "cozy", name: "Cozy", voteCount: 7012 },
  { slug: "great-soundtrack", name: "Great Soundtrack", voteCount: 13520 },
];

export function getTagBySlug(slug: string): Tag | undefined {
  return TAGS.find((t) => t.slug === slug);
}
