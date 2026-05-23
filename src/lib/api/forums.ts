import type { ForumReply, ForumThread, GameId } from "../types";
import { getDb, COLLECTIONS } from "../firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  limit,
  orderBy,
} from "firebase/firestore";
import { listGames } from "./games";

export async function listThreads(gameId: GameId): Promise<ForumThread[]> {
  const q = query(
    collection(getDb(), COLLECTIONS.forumThreads),
    where("gameId", "==", gameId)
  );
  const snap = await getDocs(q);
  const threads: ForumThread[] = [];
  snap.forEach((d) => {
    threads.push(d.data() as ForumThread);
  });

  // Sort: sticky first, then lastActivityAt desc.
  return threads.sort((a, b) => {
    if (a.sticky && !b.sticky) return -1;
    if (!a.sticky && b.sticky) return 1;
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
  });
}

export async function getThread(threadId: string): Promise<ForumThread | undefined> {
  const docRef = doc(getDb(), COLLECTIONS.forumThreads, threadId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return undefined;
  return snap.data() as ForumThread;
}

export async function listReplies(threadId: string): Promise<ForumReply[]> {
  const q = query(
    collection(getDb(), COLLECTIONS.forumReplies),
    where("threadId", "==", threadId)
  );
  const snap = await getDocs(q);
  const replies: ForumReply[] = [];
  snap.forEach((d) => {
    replies.push(d.data() as ForumReply);
  });

  return replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function listRecentThreadsCrossGame(limitNum = 20): Promise<ForumThread[]> {
  const games = await listGames();
  const liveGameIds = new Set(games.filter((g) => !g.comingSoon).map((g) => g.id));

  const q = query(
    collection(getDb(), COLLECTIONS.forumThreads),
    orderBy("lastActivityAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);
  const threads: ForumThread[] = [];
  snap.forEach((d) => {
    threads.push(d.data() as ForumThread);
  });

  return threads
    .filter((t) => liveGameIds.has(t.gameId))
    .slice(0, limitNum);
}
