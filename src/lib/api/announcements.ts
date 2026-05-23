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
import type { Announcement, AnnouncementCategory } from "../types";

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
  return `ann_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export interface AnnouncementInput {
  id?: string;
  appId: string;
  category: AnnouncementCategory;
  title: string;
  body: string;
  heroImageUrl?: string;
  publishedAt?: string;
  pinnedUntil?: string;
}

export async function listAnnouncementsByApp(appId: string): Promise<Announcement[]> {
  if (!appId) return [];
  const q = query(
    collection(getDb(), COLLECTIONS.announcements),
    where("appId", "==", appId),
  );
  const snap = await getDocs(q);
  const out: Announcement[] = [];
  snap.forEach((d) => out.push(d.data() as Announcement));
  return out.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function listAnnouncementsByApps(appIds: string[]): Promise<Announcement[]> {
  if (!appIds.length) return [];
  const slice = appIds.slice(0, 30);
  const q = query(
    collection(getDb(), COLLECTIONS.announcements),
    where("appId", "in", slice),
  );
  const snap = await getDocs(q);
  const out: Announcement[] = [];
  snap.forEach((d) => out.push(d.data() as Announcement));
  return out.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  if (!id) return null;
  const snap = await getDoc(doc(getDb(), COLLECTIONS.announcements, id));
  return snap.exists() ? (snap.data() as Announcement) : null;
}

export async function saveAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  const userId = requireUserId();
  if (!input.appId) throw new Error("appId is required.");
  if (!input.title.trim()) throw new Error("Announcement title is required.");
  const id = input.id ?? newId();
  const ref = doc(getDb(), COLLECTIONS.announcements, id);
  const existing = await getDoc(ref);
  const prior = existing.exists() ? (existing.data() as Announcement) : null;
  const next: Announcement = stripUndefined({
    id,
    appId: input.appId,
    authorUserId: prior?.authorUserId ?? userId,
    category: input.category,
    title: input.title.trim(),
    body: input.body,
    heroImageUrl: input.heroImageUrl,
    publishedAt: input.publishedAt ?? prior?.publishedAt ?? now(),
    pinnedUntil: input.pinnedUntil,
    createdAt: prior?.createdAt ?? now(),
    updatedAt: now(),
  }) as Announcement;
  await setDoc(ref, next, { merge: true });
  return next;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.announcements, id));
}
