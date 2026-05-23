import type { Cosmetic } from "../types";
import { collection, getDocs } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";

const RARITY_ORDER: Record<Cosmetic["rarity"], number> = {
  mythic: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  common: 4,
};

export async function listCosmetics(): Promise<Cosmetic[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.cosmetics));
  const out: Cosmetic[] = [];
  snap.forEach((d) => out.push(d.data() as Cosmetic));
  // Sort by rarity desc, then name — keeps the legendary/mythic items pinned
  // at the top of the wardrobe grid.
  return out.sort((a, b) => {
    const r = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    return r !== 0 ? r : a.name.localeCompare(b.name);
  });
}
