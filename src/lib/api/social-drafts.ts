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
import type { SocialDraft, SocialPlatform } from "../types";

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
  return `draft_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export const PLATFORM_LIMITS: Record<SocialPlatform, number> = {
  twitter: 280,
  discord: 2000,
  bluesky: 300,
};

export interface SocialDraftInput {
  id?: string;
  appId: string;
  platform: SocialPlatform;
  body: string;
  mediaUrls?: string[];
  scheduledFor?: string;
}

export async function listSocialDraftsByApp(appId: string): Promise<SocialDraft[]> {
  if (!appId) return [];
  const q = query(
    collection(getDb(), COLLECTIONS.socialDrafts),
    where("appId", "==", appId),
  );
  const snap = await getDocs(q);
  const out: SocialDraft[] = [];
  snap.forEach((d) => out.push(d.data() as SocialDraft));
  return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function saveSocialDraft(input: SocialDraftInput): Promise<SocialDraft> {
  requireUserId();
  if (!input.appId) throw new Error("appId is required.");
  if (!input.body.trim()) throw new Error("Post body is required.");
  const limit = PLATFORM_LIMITS[input.platform];
  if (input.body.length > limit) {
    throw new Error(`${input.platform} posts max out at ${limit} characters.`);
  }
  if ((input.mediaUrls?.length ?? 0) > 4) {
    throw new Error("Up to 4 attachments per post.");
  }
  const id = input.id ?? newId();
  const ref = doc(getDb(), COLLECTIONS.socialDrafts, id);
  const existing = await getDoc(ref);
  const prior = existing.exists() ? (existing.data() as SocialDraft) : null;
  const next: SocialDraft = stripUndefined({
    id,
    appId: input.appId,
    platform: input.platform,
    body: input.body,
    mediaUrls: input.mediaUrls ?? [],
    scheduledFor: input.scheduledFor,
    createdAt: prior?.createdAt ?? now(),
  }) as SocialDraft;
  await setDoc(ref, next, { merge: true });
  return next;
}

export async function deleteSocialDraft(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.socialDrafts, id));
}
