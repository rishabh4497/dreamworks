import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { COLLECTIONS, getDb, getFirebaseAuth } from "../firebase";
import type { MaintenanceWindow } from "../types";

function now() {
  return new Date().toISOString();
}

function requireUserId(): string {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to use the developer portal.");
  return user.uid;
}

function stripUndefined<T>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).filter(([, v]) => v !== undefined),
  ) as T;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `mw_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export interface MaintenanceWindowInput {
  id?: string;
  appId: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  affectedRegions?: string[];
}

export async function listMaintenanceByApp(appId: string): Promise<MaintenanceWindow[]> {
  if (!appId) return [];
  const q = query(
    collection(getDb(), COLLECTIONS.maintenanceWindows),
    where("appId", "==", appId),
  );
  const snap = await getDocs(q);
  const out: MaintenanceWindow[] = [];
  snap.forEach((d) => out.push(d.data() as MaintenanceWindow));
  return out.sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1));
}

export async function saveMaintenanceWindow(
  input: MaintenanceWindowInput,
): Promise<MaintenanceWindow> {
  requireUserId();
  if (!input.appId) throw new Error("appId is required.");
  if (new Date(input.endsAt) <= new Date(input.startsAt)) {
    throw new Error("Maintenance end must be after start.");
  }
  const id = input.id ?? newId();
  const ref = doc(getDb(), COLLECTIONS.maintenanceWindows, id);
  const existing = await getDoc(ref);
  const prior = existing.exists() ? (existing.data() as MaintenanceWindow) : null;
  const next: MaintenanceWindow = stripUndefined({
    id,
    appId: input.appId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    reason: input.reason || "Scheduled maintenance",
    affectedRegions: input.affectedRegions?.length ? input.affectedRegions : ["global"],
    createdAt: prior?.createdAt ?? now(),
  }) as MaintenanceWindow;
  await setDoc(ref, next, { merge: true });
  return next;
}

export async function deleteMaintenanceWindow(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.maintenanceWindows, id));
}

export function activeWindow(
  windows: MaintenanceWindow[],
  nowMs = Date.now(),
): MaintenanceWindow | null {
  for (const w of windows) {
    if (
      new Date(w.startsAt).getTime() <= nowMs &&
      nowMs < new Date(w.endsAt).getTime()
    ) {
      return w;
    }
  }
  return null;
}
