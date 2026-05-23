import type { CloudSaveResolution, CloudSaveSlot, GameId } from "../types";
import { getDb } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

const STORAGE_KEY = "dreamworks-cloud-save-slots";
const COLLECTION = "dw_cloud_saves";

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

async function fetchFromFirestore(userId: string): Promise<CloudSaveSlot[]> {
  try {
    const q = query(collection(getDb(), COLLECTION), where("userId", "==", userId));
    const snap = await getDocs(q);
    const out: CloudSaveSlot[] = [];
    snap.forEach((d) => out.push(d.data() as CloudSaveSlot));
    return out;
  } catch {
    return [];
  }
}

function mergeSlots(...sources: CloudSaveSlot[][]): CloudSaveSlot[] {
  const byId = new Map<string, CloudSaveSlot>();
  for (const source of sources) {
    for (const slot of source) {
      const existing = byId.get(slot.id);
      if (!existing) {
        byId.set(slot.id, slot);
        continue;
      }
      // Prefer the entry with the newest local timestamp.
      const existingTs = existing.localUpdatedAt ?? existing.remoteUpdatedAt ?? "";
      const incomingTs = slot.localUpdatedAt ?? slot.remoteUpdatedAt ?? "";
      if (incomingTs > existingTs) byId.set(slot.id, slot);
    }
  }
  return Array.from(byId.values());
}

export async function listCloudSaveSlots(input: {
  userId: string;
  gameId?: GameId;
}): Promise<CloudSaveSlot[]> {
  const local = readStored();
  const remote = await fetchFromFirestore(input.userId);
  const merged = mergeSlots(remote, local, SEED_SLOTS);
  // Refresh the local cache so subsequent reads start from the merged set.
  writeStored(merged);
  return merged.filter(
    (slot) =>
      slot.userId === input.userId &&
      (!input.gameId || slot.gameId === input.gameId),
  );
}

export async function upsertCloudSaveSlot(slot: CloudSaveSlot): Promise<CloudSaveSlot> {
  const existing = readStored();
  const next = [slot, ...existing.filter((candidate) => candidate.id !== slot.id)];
  writeStored(next);
  try {
    await setDoc(doc(getDb(), COLLECTION, slot.id), slot);
  } catch {
    // Best-effort — local cache already updated, retry will happen on next write.
  }
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
  const merged = mergeSlots(readStored(), SEED_SLOTS);
  const slot = merged.find((candidate) => candidate.id === input.slotId);
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
  return upsertCloudSaveSlot(updated);
}
