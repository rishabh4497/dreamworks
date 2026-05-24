import type { ForumReply, ForumThread, GameId } from "../types";
import { randomFromSeed } from "./_seed";
import { avatarUrl } from "./images";
import { GAMES } from "./games";

/**
 * Synthetic author handles for seeded forum threads and replies. These are
 * intentionally NOT real users and NOT part of the friend graph — they only
 * exist to give static forum content plausible-looking attribution. The real
 * friend graph lives at users/{uid}/friends/{friendUid} (see
 * src/lib/api/friend-graph.ts).
 */
const FORUM_AUTHOR_HANDLES = [
  "kira_w",
  "low.tide",
  "bytecount",
  "ferris",
  "annika.io",
  "porter",
  "magna",
  "h.ward",
  "obsidian",
  "saoirse",
] as const;

const FORUM_AUTHORS = FORUM_AUTHOR_HANDLES.map((name, i) => ({
  uid: `forum-author-${i + 1}`,
  displayName: name,
  avatarUrl: avatarUrl(name),
}));
const FRIENDS = FORUM_AUTHORS;

/**
 * Seeded forum content. Deterministic per game so reloads are stable.
 *
 * Layout:
 * - Each game gets 3–5 threads. The first is always sticky ("Welcome to {game}").
 * - One thread across the catalog is locked (see LOCKED_THREAD_ID below).
 * - Threads get 2–6 replies each; `replyCount` and `lastActivityAt` are
 *   recomputed from the reply list before export.
 */

const TITLE_POOL = [
  "What's your build at NG+2?",
  "Performance on 4070?",
  "Is the DLC worth it?",
  "Post your screenshots",
  "Bug: stuck on chapter 4",
  "Tips for beginners",
  "Hidden side quest spoiler",
  "Best controller settings",
  "Co-op anyone?",
] as const;

const BODY_POOL = [
  "Has anyone managed to get past the second boss on hardcore? I'm running a dex build and feel under-leveled, but every guide I find says I should be fine. Any tips much appreciated.",
  "Frame pacing has been weird for me after the latest patch. I'm on a 4070 + 7800X3D, drivers fully up to date. Curious whether anyone else is seeing this or it's just me.",
  "I keep going back and forth on whether to grab the expansion. The base game took me about 60 hours and I loved every second — does the DLC keep that energy or is it more filler-y?",
  "Drop your favorite shots in this thread. Trying to get inspired before I start a photo-mode run. Bonus points for sunset shots and ridiculous outfit combinations.",
  "Wanted to share a few small things that would have saved me a lot of grief when I started. Spoiler-free below. Feel free to add your own at the bottom.",
  "Found something hilarious in the optional area at the end of chapter 3. Won't spoil here — anyone else stumble on it? Use spoiler tags please.",
  "If you've put serious time in, what's your input setup? I keep tweaking deadzones and sensitivity and never feel like I've landed on something that clicks.",
  "Looking for a chill co-op partner this weekend. Mic optional. Not super-experienced so be patient. Drop your IGN below.",
];

const SECONDARY_BODIES = [
  "Same here. I bumped graphics down a notch and it smoothed out for me.",
  "Try the bonfire just before the gate — there's a merchant most people miss.",
  "Easily worth it. The pacing in the back half is some of the best in the series.",
  "Hard disagree, the second act drags. Wait for a deeper sale imo.",
  "Posting one from the snowy region — sun was hitting just right.",
  "I bound dodge to a paddle and never looked back.",
  "Down. Add me — same name as here.",
  "Yeah this killed my last run. Submit a bug report through the launcher.",
  "Spoiler tags incoming — yeah that area is wild, I died laughing.",
  "Honestly the best advice is to take it slow. The game rewards exploring everything.",
];

/** Per-game heuristics: prefer certain titles for certain genres. */
function pickTitlesForGame(gameId: GameId, count: number, rand: () => number): string[] {
  const game = GAMES.find((g) => g.id === gameId);
  const tags = new Set(game?.tags ?? []);
  const genres = new Set(game?.genres ?? []);
  const isOpenWorld = tags.has("open-world");
  const isSouls = tags.has("souls-like");
  const hasMP = tags.has("multiplayer") || genres.has("multiplayer");

  const candidates = TITLE_POOL.filter((t) => {
    if (t.includes("NG+2")) return isSouls || isOpenWorld;
    if (t.includes("Co-op")) return hasMP || isOpenWorld;
    if (t.includes("DLC")) return isOpenWorld || tags.has("rpg") || genres.has("rpg");
    return true;
  });

  // Round-robin from the filtered candidates, shuffled deterministically.
  const shuffled = [...candidates].sort(() => rand() - 0.5);
  const picks: string[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(shuffled[i % shuffled.length]);
  }
  return picks;
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

interface BuildResult {
  threads: ForumThread[];
  replies: ForumReply[];
}

function buildForGame(gameId: GameId): BuildResult {
  const rand = randomFromSeed(`forums-${gameId}`);
  const game = GAMES.find((g) => g.id === gameId)!;

  // 3–5 threads per game (one sticky, rest regular).
  const extraThreadCount = Math.floor(rand() * 3) + 2; // 2..4 → 3..5 with the sticky
  const titles = pickTitlesForGame(gameId, extraThreadCount, rand);

  const threads: ForumThread[] = [];
  const replies: ForumReply[] = [];

  // Sticky welcome thread.
  const stickyAuthor = FRIENDS[Math.floor(rand() * FRIENDS.length)];
  const stickyCreatedMinutes = 60 * 24 * 30 + Math.floor(rand() * 60 * 24 * 30); // 30–60 days ago
  const stickyThread: ForumThread = {
    id: `seed-${gameId}-thread-0`,
    gameId,
    authorUid: stickyAuthor.uid,
    authorName: stickyAuthor.displayName,
    authorAvatarUrl: stickyAuthor.avatarUrl,
    title: `Welcome to ${game.name} — community guidelines`,
    body: `Welcome, everyone. A few housekeeping notes for this forum:\n\n• Spoilers go behind spoiler tags.\n• Bug reports should include your platform and a brief repro.\n• Be kind. We're all here because we love this game.\n\nHappy posting!`,
    createdAt: isoMinutesAgo(stickyCreatedMinutes),
    lastActivityAt: isoMinutesAgo(stickyCreatedMinutes),
    replyCount: 0,
    sticky: true,
    locked: false,
    helpfulCount: Math.floor(rand() * 20) + 5,
  };
  threads.push(stickyThread);

  // Regular threads.
  for (let i = 0; i < extraThreadCount; i++) {
    const author = FRIENDS[Math.floor(rand() * FRIENDS.length)];
    const createdMinutes = Math.floor(rand() * 60 * 24 * 14) + 60; // up to 14 days ago
    const threadId = `seed-${gameId}-thread-${i + 1}`;
    const title = titles[i] ?? TITLE_POOL[i % TITLE_POOL.length];
    const body = BODY_POOL[Math.floor(rand() * BODY_POOL.length)];
    threads.push({
      id: threadId,
      gameId,
      authorUid: author.uid,
      authorName: author.displayName,
      authorAvatarUrl: author.avatarUrl,
      title,
      body,
      createdAt: isoMinutesAgo(createdMinutes),
      lastActivityAt: isoMinutesAgo(createdMinutes),
      replyCount: 0,
      sticky: false,
      locked: false,
      helpfulCount: Math.floor(rand() * 12),
    });
  }

  // Replies (2–6 per thread).
  for (const thread of threads) {
    const replyCount = Math.floor(rand() * 5) + 2;
    const threadCreated = new Date(thread.createdAt).getTime();
    let cursor = threadCreated;
    for (let r = 0; r < replyCount; r++) {
      const stepMinutes = Math.floor(rand() * 60 * 12) + 15;
      cursor += stepMinutes * 60 * 1000;
      // Don't allow replies in the future.
      if (cursor > Date.now()) cursor = Date.now() - Math.floor(rand() * 60 * 60 * 1000);
      const author = FRIENDS[Math.floor(rand() * FRIENDS.length)];
      replies.push({
        id: `seed-${thread.id}-reply-${r}`,
        threadId: thread.id,
        authorUid: author.uid,
        authorName: author.displayName,
        authorAvatarUrl: author.avatarUrl,
        body: SECONDARY_BODIES[Math.floor(rand() * SECONDARY_BODIES.length)],
        createdAt: new Date(cursor).toISOString(),
        helpfulCount: Math.floor(rand() * 8),
      });
    }
  }

  // Recompute replyCount + lastActivityAt from the reply list.
  for (const thread of threads) {
    const tReplies = replies.filter((r) => r.threadId === thread.id);
    thread.replyCount = tReplies.length;
    if (tReplies.length > 0) {
      const latest = tReplies.reduce((acc, r) =>
        new Date(r.createdAt).getTime() > new Date(acc.createdAt).getTime() ? r : acc,
      );
      thread.lastActivityAt = latest.createdAt;
    }
  }

  return { threads, replies };
}

const SEED: BuildResult = (() => {
  const allThreads: ForumThread[] = [];
  const allReplies: ForumReply[] = [];
  for (const game of GAMES) {
    const built = buildForGame(game.id);
    allThreads.push(...built.threads);
    allReplies.push(...built.replies);
  }
  return { threads: allThreads, replies: allReplies };
})();

/**
 * Exactly one seeded thread in the catalog is locked, so the
 * locked-no-composer UI path is always exercised. Picked deterministically:
 * the non-sticky `gta-5` "tips for beginners"-style thread (thread index 1).
 */
export const LOCKED_THREAD_ID = "seed-gta-5-thread-1";

for (const thread of SEED.threads) {
  if (thread.id === LOCKED_THREAD_ID) {
    thread.locked = true;
  }
}

export const SEED_THREADS: ForumThread[] = SEED.threads;
export const SEED_REPLIES: ForumReply[] = SEED.replies;
