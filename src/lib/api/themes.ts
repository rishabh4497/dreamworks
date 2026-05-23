import { collection, getDocs } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type { ThemePreset } from "../types";

export async function listThemes(): Promise<ThemePreset[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.themes));
  const themes: ThemePreset[] = [];
  snap.forEach((d) => themes.push(d.data() as ThemePreset));
  // Featured first, then alphabetical.
  return themes.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.name.localeCompare(b.name);
  });
}
