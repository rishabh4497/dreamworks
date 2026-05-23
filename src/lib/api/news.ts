import type { NewsArticle } from "../types";
import { getDb } from "../firebase";
import { listGames } from "./games";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

const NEWS_COL = "dw_news";

export async function listNews(limit = 20): Promise<NewsArticle[]> {
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
  const games = await listGames();
  const ownedGameIds = games.filter((g) => g.developer === developer).map((g) => g.id);
  if (ownedGameIds.length === 0) return [];
  return queryNewsByRelatedGames(ownedGameIds, limit);
}

/** Same as `listNewsByDeveloper`, but matches on `publisher`. */
export async function listNewsByPublisher(
  publisher: string,
  limit = 5,
): Promise<NewsArticle[]> {
  if (!publisher) return [];
  const games = await listGames();
  const ownedGameIds = games.filter((g) => g.publisher === publisher).map((g) => g.id);
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
