import type { ForumReply, ForumThread, GameId } from "../types";
import { SEED_REPLIES, SEED_THREADS } from "../mock/forums";
import { GAMES } from "../mock/games";
import { useForumsStore } from "@/stores/forums-store";
import { wait } from "./_delay";

/** Merge seed + persisted user content (read-only view). */
function getAllThreads(): ForumThread[] {
  return [...SEED_THREADS, ...useForumsStore.getState().userThreads];
}

function getAllReplies(): ForumReply[] {
  return [...SEED_REPLIES, ...useForumsStore.getState().userReplies];
}

function compareLastActivityDesc(a: ForumThread, b: ForumThread): number {
  return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
}

export async function listThreads(gameId: GameId): Promise<ForumThread[]> {
  await wait();
  const threads = getAllThreads().filter((t) => t.gameId === gameId);
  // Sticky first, then lastActivityAt desc.
  return threads.slice().sort((a, b) => {
    if (a.sticky && !b.sticky) return -1;
    if (!a.sticky && b.sticky) return 1;
    return compareLastActivityDesc(a, b);
  });
}

export async function getThread(threadId: string): Promise<ForumThread | undefined> {
  await wait();
  return getAllThreads().find((t) => t.id === threadId);
}

export async function listReplies(threadId: string): Promise<ForumReply[]> {
  await wait();
  return getAllReplies()
    .filter((r) => r.threadId === threadId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function listRecentThreadsCrossGame(limit = 20): Promise<ForumThread[]> {
  await wait();
  const liveGameIds = new Set(GAMES.filter((g) => !g.comingSoon).map((g) => g.id));
  return getAllThreads()
    .filter((t) => liveGameIds.has(t.gameId))
    .sort(compareLastActivityDesc)
    .slice(0, limit);
}
