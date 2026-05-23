import type { Category, Tag } from "../types";
import { getDb } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const CATEGORIES_COL = "dw_categories";
const TAGS_COL = "dw_tags";

export async function listCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(getDb(), CATEGORIES_COL));
  const out: Category[] = [];
  snap.forEach((d) => out.push(d.data() as Category));
  return out;
}

export async function listTags(): Promise<Tag[]> {
  const snap = await getDocs(collection(getDb(), TAGS_COL));
  const out: Tag[] = [];
  snap.forEach((d) => out.push(d.data() as Tag));
  return out.sort((a, b) => b.voteCount - a.voteCount);
}
