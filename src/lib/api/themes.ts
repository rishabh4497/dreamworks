import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  writeBatch,
} from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import { THEME_SEEDS } from "../mock/themes";
import type { ThemePreset } from "../types";

let seedingPromise: Promise<void> | null = null;

export async function ensureThemesSeeded(): Promise<void> {
  if (seedingPromise) return seedingPromise;
  seedingPromise = (async () => {
    const colRef = collection(getDb(), COLLECTIONS.themes);
    const snap = await getDocs(query(colRef, limit(1)));
    if (!snap.empty) return;

    const batch = writeBatch(getDb());
    for (const theme of THEME_SEEDS) {
      batch.set(doc(getDb(), COLLECTIONS.themes, theme.id), theme);
    }
    await batch.commit();
  })();
  return seedingPromise;
}

export async function listThemes(): Promise<ThemePreset[]> {
  await ensureThemesSeeded();
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
