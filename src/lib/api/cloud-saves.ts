import type { CloudSaveResolution, CloudSaveSlot, GameId } from "../types";
import { wait } from "./_delay";

const STORAGE_KEY = "dreamworks-cloud-save-slots";

const SEED_SLOTS: CloudSaveSlot[] = [
  {
    id: "cloud:rishav-001:elden-ring:legion-go",
    userId: "rishav-001",
    gameId: "elden-ring",
    deviceName: "Legion Go",
    status: "conflict",
    localUpdatedAt: "2026-05-18T19:42:00.000Z",
    remoteUpdatedAt: "2026-05-18T17:15:00.000Z",
    sizeBytes: 27_918_336,
    conflictReason: "Both this device and the cloud changed after the last sync.",
  },
  {
    id: "cloud:rishav-001:cyberpunk-2077:desktop",
    userId: "rishav-001",
    gameId: "cyberpunk-2077",
    deviceName: "Desktop",
    status: "synced",
    localUpdatedAt: "2026-05-17T21:08:00.000Z",
    remoteUpdatedAt: "2026-05-17T21:08:00.000Z",
    sizeBytes: 18_612_224,
  },
];

function readStored(): CloudSaveSlot[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CloudSaveSlot[]) : [];
  } catch {
    return [];
  }
}

function writeStored(slots: CloudSaveSlot[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

function listMergedSlots(): CloudSaveSlot[] {
  const stored = readStored();
  const storedIds = new Set(stored.map((slot) => slot.id));
  return [...stored, ...SEED_SLOTS.filter((slot) => !storedIds.has(slot.id))];
}

export async function listCloudSaveSlots(input: {
  userId: string;
  gameId?: GameId;
}): Promise<CloudSaveSlot[]> {
  await wait();
  return listMergedSlots().filter(
    (slot) =>
      slot.userId === input.userId &&
      (!input.gameId || slot.gameId === input.gameId),
  );
}

export async function upsertCloudSaveSlot(slot: CloudSaveSlot): Promise<CloudSaveSlot> {
  await wait();
  const existing = readStored();
  const next = [slot, ...existing.filter((candidate) => candidate.id !== slot.id)];
  writeStored(next);
  return slot;
}

export async function markCloudSaveConflict(input: {
  userId: string;
  gameId: GameId;
  deviceName: string;
  reason: string;
}): Promise<CloudSaveSlot> {
  return upsertCloudSaveSlot({
    id: `cloud:${input.userId}:${input.gameId}:${input.deviceName}`,
    userId: input.userId,
    gameId: input.gameId,
    deviceName: input.deviceName,
    status: "conflict",
    localUpdatedAt: new Date().toISOString(),
    remoteUpdatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    sizeBytes: 0,
    conflictReason: input.reason,
  });
}

export async function resolveCloudSaveConflict(input: {
  slotId: string;
  resolution: CloudSaveResolution;
}): Promise<CloudSaveSlot> {
  await wait();
  const slot = listMergedSlots().find((candidate) => candidate.id === input.slotId);
  if (!slot) {
    throw new Error(`Cloud save slot not found: ${input.slotId}`);
  }

  const winningTimestamp =
    input.resolution === "local" ? slot.localUpdatedAt : slot.remoteUpdatedAt;
  const syncedAt =
    winningTimestamp ??
    slot.localUpdatedAt ??
    slot.remoteUpdatedAt ??
    new Date().toISOString();

  const updated: CloudSaveSlot = {
    ...slot,
    status: "synced",
    localUpdatedAt: syncedAt,
    remoteUpdatedAt: syncedAt,
    conflictReason: undefined,
  };
  const existing = readStored();
  writeStored([updated, ...existing.filter((candidate) => candidate.id !== updated.id)]);
  return updated;
}
