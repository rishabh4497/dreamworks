import type { Category } from "../types";

export const CATEGORIES: Category[] = [
  { slug: "action", name: "Action", icon: "Swords", gameCount: 4821 },
  { slug: "adventure", name: "Adventure", icon: "Compass", gameCount: 3902 },
  { slug: "rpg", name: "RPG", icon: "Crown", gameCount: 2611 },
  { slug: "strategy", name: "Strategy", icon: "Brain", gameCount: 1842 },
  { slug: "simulation", name: "Simulation", icon: "Cog", gameCount: 1521 },
  { slug: "indie", name: "Indie", icon: "Sparkles", gameCount: 5712 },
  { slug: "casual", name: "Casual", icon: "Coffee", gameCount: 4108 },
  { slug: "racing", name: "Racing", icon: "Car", gameCount: 612 },
  { slug: "sports", name: "Sports", icon: "Trophy", gameCount: 482 },
  { slug: "horror", name: "Horror", icon: "Ghost", gameCount: 1011 },
  { slug: "shooter", name: "Shooter", icon: "Crosshair", gameCount: 2009 },
  { slug: "platformer", name: "Platformer", icon: "MoveUpRight", gameCount: 1340 },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
