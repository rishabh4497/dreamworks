import type { NewsArticle } from "../types";
import { GAMES, NEWS } from "../mock";
import { getDb } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

const NEWS_COL = "dw_news";

let seedingPromise: Promise<void> | null = null;

async function ensureNewsSeeded(): Promise<void> {
  if (seedingPromise) return seedingPromise;
  seedingPromise = (async () => {
    const snap = await getDocs(collection(getDb(), NEWS_COL));
    if (!snap.empty) return;
    const batch = writeBatch(getDb());
    for (const article of NEWS) {
      batch.set(doc(getDb(), NEWS_COL, article.slug), article);
    }
    await batch.commit();
  })();
  return seedingPromise;
}

export async function listNews(limit = 20): Promise<NewsArticle[]> {
  await ensureNewsSeeded();
  const q = query(
    collection(getDb(), NEWS_COL),
    orderBy("publishedAt", "desc"),
    fsLimit(limit),
  );
  const snap = await getDocs(q);
  const out: NewsArticle[] = [];
  snap.forEach((d) => out.push(d.data() as NewsArticle));
  return out;
}

export async function getNewsArticle(slug: string): Promise<NewsArticle | undefined> {
  await ensureNewsSeeded();
  const ref = doc(getDb(), NEWS_COL, slug);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as NewsArticle) : undefined;
}

/**
 * Articles where any `relatedGameIds` belong to a game the given developer
 * made. Sorted newest-first. Returns `[]` for an empty developer name so
 * React Query can short-circuit on disabled queries.
 */
export async function listNewsByDeveloper(
  developer: string,
  limit = 5,
): Promise<NewsArticle[]> {
  if (!developer) return [];
  await ensureNewsSeeded();
  const ownedGameIds = GAMES.filter((g) => g.developer === developer).map((g) => g.id);
  if (ownedGameIds.length === 0) return [];
  return queryNewsByRelatedGames(ownedGameIds, limit);
}

/** Same as `listNewsByDeveloper`, but matches on `publisher`. */
export async function listNewsByPublisher(
  publisher: string,
  limit = 5,
): Promise<NewsArticle[]> {
  if (!publisher) return [];
  await ensureNewsSeeded();
  const ownedGameIds = GAMES.filter((g) => g.publisher === publisher).map((g) => g.id);
  if (ownedGameIds.length === 0) return [];
  return queryNewsByRelatedGames(ownedGameIds, limit);
}

async function queryNewsByRelatedGames(
  gameIds: string[],
  limit: number,
): Promise<NewsArticle[]> {
  // Firestore array-contains-any caps at 30 values; for our small catalog
  // this is well under that, but slice to be defensive.
  const ids = gameIds.slice(0, 30);
  const q = query(
    collection(getDb(), NEWS_COL),
    where("relatedGameIds", "array-contains-any", ids),
    orderBy("publishedAt", "desc"),
    fsLimit(limit),
  );
  const snap = await getDocs(q);
  const out: NewsArticle[] = [];
  snap.forEach((d) => out.push(d.data() as NewsArticle));
  return out;
}
