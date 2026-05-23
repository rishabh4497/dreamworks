import type { LfgGuide, LfgPost } from "../types";

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

export const LFG_BOARD_SEED_POSTS: LfgPost[] = [
  {
    id: "lfg-seed-1",
    gameId: "helldivers-2",
    game: "Helldivers 2",
    author: "LibertyPrime",
    type: "Operation",
    desc: "Need 2 for Suicide Mission. Mic required.",
    createdAt: minutesAgo(2),
    friend: "Any friend",
    tags: ["Mic", "Experienced"],
  },
  {
    id: "lfg-seed-2",
    gameId: "baldurs-gate-3",
    game: "Baldur's Gate 3",
    author: "TavTheGreat",
    type: "Campaign",
    desc: "Starting fresh Honor Mode run. LF Bard.",
    createdAt: minutesAgo(5),
    friend: "Maya",
    tags: ["Fresh start", "Tryhard"],
  },
  {
    id: "lfg-seed-3",
    gameId: "counter-strike-2",
    game: "Counter-Strike 2",
    author: "AimBotz",
    type: "Ranked",
    desc: "Premier 15k+ ELO. Dust 2 only.",
    createdAt: minutesAgo(12),
    friend: "Aarav",
    tags: ["Competitive", "Voice"],
  },
];

export const LFG_BOARD_SEED_GUIDES: LfgGuide[] = [
  {
    id: "guide-seed-1",
    game: "Elden Ring",
    title: "Early-game bleed route",
    author: "Rishav",
    kind: "Build",
    votes: 128,
  },
  {
    id: "guide-seed-2",
    game: "Cyberpunk 2077",
    title: "Phantom Liberty stealth netrunner",
    author: "Maya",
    kind: "Guide",
    votes: 91,
  },
];
