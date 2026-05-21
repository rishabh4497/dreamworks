import type { Category, Tag } from "../types";
import { CATEGORIES, TAGS } from "../mock";
import { wait } from "./_delay";

export async function listCategories(): Promise<Category[]> {
  await wait();
  return CATEGORIES;
}

export async function listTags(): Promise<Tag[]> {
  await wait();
  return TAGS;
}
