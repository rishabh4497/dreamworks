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
import type { LiveEvent, LiveEventKind } from "../types";

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
  return `evt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export interface LiveEventInput {
  id?: string;
  appId: string;
  kind: LiveEventKind;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  bannerUrl?: string;
}

export async function listLiveEventsByApp(appId: string): Promise<LiveEvent[]> {
  if (!appId) return [];
  const q = query(collection(getDb(), COLLECTIONS.liveEvents), where("appId", "==", appId));
  const snap = await getDocs(q);
  const out: LiveEvent[] = [];
  snap.forEach((d) => out.push(d.data() as LiveEvent));
  return out.sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1));
}

export async function listLiveEventsByApps(appIds: string[]): Promise<LiveEvent[]> {
  if (!appIds.length) return [];
  const slice = appIds.slice(0, 30);
  const q = query(collection(getDb(), COLLECTIONS.liveEvents), where("appId", "in", slice));
  const snap = await getDocs(q);
  const out: LiveEvent[] = [];
  snap.forEach((d) => out.push(d.data() as LiveEvent));
  return out;
}

export async function saveLiveEvent(input: LiveEventInput): Promise<LiveEvent> {
  requireUserId();
  if (!input.appId) throw new Error("appId is required.");
  if (!input.title.trim()) throw new Error("Event title is required.");
  if (new Date(input.endsAt) <= new Date(input.startsAt)) {
    throw new Error("Event end must be after start.");
  }
  const id = input.id ?? newId();
  const ref = doc(getDb(), COLLECTIONS.liveEvents, id);
  const existing = await getDoc(ref);
  const prior = existing.exists() ? (existing.data() as LiveEvent) : null;
  const next: LiveEvent = stripUndefined({
    id,
    appId: input.appId,
    kind: input.kind,
    title: input.title.trim(),
    description: input.description,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    bannerUrl: input.bannerUrl,
    createdAt: prior?.createdAt ?? now(),
    updatedAt: now(),
  }) as LiveEvent;
  await setDoc(ref, next, { merge: true });
  return next;
}

export async function deleteLiveEvent(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.liveEvents, id));
}

export function isActive(event: LiveEvent, nowMs = Date.now()): boolean {
  return new Date(event.startsAt).getTime() <= nowMs && nowMs < new Date(event.endsAt).getTime();
}

export function isUpcoming(event: LiveEvent, nowMs = Date.now()): boolean {
  return new Date(event.startsAt).getTime() > nowMs;
}
