import type { GameId, WorkshopItem } from "../types";
import { wait } from "./_delay";

const STORAGE_KEY = "dreamworks-workshop-items";

const SEED_ITEMS: WorkshopItem[] = [
  {
    id: "workshop:elden-ring:seamless-coop",
    gameId: "elden-ring",
    title: "Seamless Co-op",
    authorId: "modder:luke",
    authorName: "LukeYui",
    version: "2.0",
    sizeBytes: 512_000_000,
    rating: 4.9,
    subscribers: 3_500_000,
    tags: ["co-op", "multiplayer"],
    status: "available",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
];

function readStored(): WorkshopItem[] {
  if (typeof localStorage === "undefined") return SEED_ITEMS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return SEED_ITEMS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WorkshopItem[]) : SEED_ITEMS;
  } catch {
    return SEED_ITEMS;
  }
}

function writeStored(items: WorkshopItem[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function listWorkshopItems(gameId?: GameId): Promise<WorkshopItem[]> {
  await wait();
  const items = readStored();
  return gameId ? items.filter((item) => item.gameId === gameId) : items;
}

export async function setWorkshopSubscription(input: {
  itemId: string;
  subscribed: boolean;
}): Promise<WorkshopItem | null> {
  await wait();
  const items = readStored();
  const next = items.map((item) =>
    item.id === input.itemId
      ? {
          ...item,
          status: input.subscribed ? ("subscribed" as const) : ("available" as const),
          subscribers: Math.max(0, item.subscribers + (input.subscribed ? 1 : -1)),
        }
      : item,
  );
  writeStored(next);
  return next.find((item) => item.id === input.itemId) ?? null;
}
