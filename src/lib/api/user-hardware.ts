import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type { HardwareSnapshot, UserHardwareDoc } from "../types";

const HISTORY_LIMIT = 10;

function now(): string {
  return new Date().toISOString();
}

export function emptyHardware(userId: string): UserHardwareDoc {
  return { userId, latestSnapshot: null, history: [], updatedAt: now() };
}

export async function getUserHardware(
  userId: string,
): Promise<UserHardwareDoc> {
  const snap = await getDoc(doc(getDb(), COLLECTIONS.userHardware, userId));
  if (!snap.exists()) return emptyHardware(userId);
  return snap.data() as UserHardwareDoc;
}

export async function saveHardwareSnapshot(
  userId: string,
  snapshot: HardwareSnapshot,
): Promise<void> {
  const current = await getUserHardware(userId);
  const history = [snapshot, ...current.history].slice(0, HISTORY_LIMIT);
  await setDoc(doc(getDb(), COLLECTIONS.userHardware, userId), {
    userId,
    latestSnapshot: snapshot,
    history,
    updatedAt: now(),
  });
}
