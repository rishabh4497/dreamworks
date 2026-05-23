import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { getDb, COLLECTIONS, SUBCOLLECTIONS } from "../firebase";
import type { Achievement } from "../types";
import { saveApp } from "./apps";

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function listAchievements(appId: string): Promise<Achievement[]> {
  if (!appId) return [];
  const snap = await getDocs(
    collection(getDb(), COLLECTIONS.apps, appId, SUBCOLLECTIONS.appAchievements),
  );
  const out: Achievement[] = [];
  snap.forEach((d) => out.push(d.data() as Achievement));
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function upsertAchievement(
  appId: string,
  input: Omit<Achievement, "id"> & { id?: string },
): Promise<Achievement> {
  const id = input.id ?? "ach-" + crypto.randomUUID();
  const ref = doc(getDb(), COLLECTIONS.apps, appId, SUBCOLLECTIONS.appAchievements, id);
  const existing = await getDoc(ref);
  const next: Achievement = stripUndefined({
    ...(existing.exists() ? (existing.data() as Achievement) : {}),
    ...input,
    id,
  }) as Achievement;
  await setDoc(ref, next, { merge: true });
  const all = await listAchievements(appId);
  await saveApp(appId, { achievementCount: all.length });
  return next;
}

export async function deleteAchievement(appId: string, achievementId: string): Promise<void> {
  const ref = doc(getDb(), COLLECTIONS.apps, appId, SUBCOLLECTIONS.appAchievements, achievementId);
  await deleteDoc(ref);
  const all = await listAchievements(appId);
  await saveApp(appId, { achievementCount: all.length });
}
