import type { NewsArticle } from "../types";
import { GAMES, NEWS, getNewsArticle as findNews } from "../mock";
import { wait } from "./_delay";

export async function listNews(limit = 20): Promise<NewsArticle[]> {
  await wait();
  return NEWS.slice(0, limit);
}

export async function getNewsArticle(slug: string): Promise<NewsArticle | undefined> {
  await wait();
  return findNews(slug);
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
  await wait();
  if (!developer) return [];
  const ownedGameIds = new Set(
    GAMES.filter((g) => g.developer === developer).map((g) => g.id),
  );
  return NEWS
    .filter((a) => a.relatedGameIds.some((id) => ownedGameIds.has(id)))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, limit);
}

/** Same as `listNewsByDeveloper`, but matches on `publisher`. */
export async function listNewsByPublisher(
  publisher: string,
  limit = 5,
): Promise<NewsArticle[]> {
  await wait();
  if (!publisher) return [];
  const ownedGameIds = new Set(
    GAMES.filter((g) => g.publisher === publisher).map((g) => g.id),
  );
  return NEWS
    .filter((a) => a.relatedGameIds.some((id) => ownedGameIds.has(id)))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, limit);
}
