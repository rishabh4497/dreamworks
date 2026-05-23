import type { GameId, WorkshopMod } from "../types";
import { WORKSHOP_MODS } from "../mock/workshop-mods";
import { COLLECTIONS, getDb } from "../firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";

let modsSeedingPromise: Promise<void> | null = null;

async function ensureWorkshopModsSeeded(): Promise<void> {
  if (modsSeedingPromise) return modsSeedingPromise;
  modsSeedingPromise = (async () => {
    const snap = await getDocs(collection(getDb(), COLLECTIONS.workshopMods));
    if (!snap.empty) return;
    const batch = writeBatch(getDb());
    for (const mod of WORKSHOP_MODS) {
      batch.set(doc(getDb(), COLLECTIONS.workshopMods, mod.id), mod);
    }
    await batch.commit();
  })();
  return modsSeedingPromise;
}

export async function listWorkshopMods(gameId?: GameId): Promise<WorkshopMod[]> {
  await ensureWorkshopModsSeeded();
  const colRef = collection(getDb(), COLLECTIONS.workshopMods);
  const snap = gameId
    ? await getDocs(query(colRef, where("gameId", "==", gameId)))
    : await getDocs(colRef);
  const out: WorkshopMod[] = [];
  snap.forEach((d) => out.push(d.data() as WorkshopMod));
  return out.sort((a, b) => b.downloads - a.downloads);
}

interface WorkshopSubDoc {
  userId: string;
  modId: string;
  createdAt: string;
}

function subDocId(userId: string, modId: string): string {
  return `${userId}__${modId}`;
}

export async function listWorkshopSubscriptions(userId: string): Promise<string[]> {
  if (!userId) return [];
  const q = query(
    collection(getDb(), COLLECTIONS.workshopSubs),
    where("userId", "==", userId),
  );
  const snap = await getDocs(q);
  const out: string[] = [];
  snap.forEach((d) => out.push((d.data() as WorkshopSubDoc).modId));
  return out;
}

export async function setWorkshopSubscription(input: {
  userId: string;
  modId: string;
  subscribed: boolean;
}): Promise<void> {
  const { userId, modId, subscribed } = input;
  if (!userId) return;
  const ref = doc(getDb(), COLLECTIONS.workshopSubs, subDocId(userId, modId));
  if (subscribed) {
    const entry: WorkshopSubDoc = {
      userId,
      modId,
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, entry);
  } else {
    await deleteDoc(ref);
  }
}
