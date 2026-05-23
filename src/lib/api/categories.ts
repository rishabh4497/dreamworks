import type { Category, Tag } from "../types";
import { CATEGORIES, TAGS } from "../mock";
import { getDb } from "../firebase";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";

const CATEGORIES_COL = "dw_categories";
const TAGS_COL = "dw_tags";

let categorySeedPromise: Promise<void> | null = null;
let tagSeedPromise: Promise<void> | null = null;

async function ensureCategoriesSeeded(): Promise<void> {
  if (categorySeedPromise) return categorySeedPromise;
  categorySeedPromise = (async () => {
    const snap = await getDocs(collection(getDb(), CATEGORIES_COL));
    if (!snap.empty) return;
    const batch = writeBatch(getDb());
    for (const c of CATEGORIES) {
      batch.set(doc(getDb(), CATEGORIES_COL, c.slug), c);
    }
    await batch.commit();
  })();
  return categorySeedPromise;
}

async function ensureTagsSeeded(): Promise<void> {
  if (tagSeedPromise) return tagSeedPromise;
  tagSeedPromise = (async () => {
    const snap = await getDocs(collection(getDb(), TAGS_COL));
    if (!snap.empty) return;
    const batch = writeBatch(getDb());
    for (const t of TAGS) {
      batch.set(doc(getDb(), TAGS_COL, t.slug), t);
    }
    await batch.commit();
  })();
  return tagSeedPromise;
}

export async function listCategories(): Promise<Category[]> {
  await ensureCategoriesSeeded();
  const snap = await getDocs(collection(getDb(), CATEGORIES_COL));
  const out: Category[] = [];
  snap.forEach((d) => out.push(d.data() as Category));
  return out;
}

export async function listTags(): Promise<Tag[]> {
  await ensureTagsSeeded();
  const snap = await getDocs(collection(getDb(), TAGS_COL));
  const out: Tag[] = [];
  snap.forEach((d) => out.push(d.data() as Tag));
  return out.sort((a, b) => b.voteCount - a.voteCount);
}
