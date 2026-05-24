import { doc, getDoc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { getDb, COLLECTIONS, getFirebaseAuth } from "../firebase";
import { slugify } from "../utils";
import type { Publisher } from "../types";

function now() {
  return new Date().toISOString();
}

function requireUserId(): string {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to use the developer portal.");
  return user.uid;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function getPublisher(slug: string): Promise<Publisher | null> {
  if (!slug) return null;
  const ref = doc(getDb(), COLLECTIONS.publishers, slug);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Publisher) : null;
}

export async function listPublishers(): Promise<Publisher[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.publishers));
  const out: Publisher[] = [];
  snap.forEach((d) => out.push(d.data() as Publisher));
  return out;
}

export async function listMyPublishers(): Promise<Publisher[]> {
  const userId = requireUserId();
  const q = query(collection(getDb(), COLLECTIONS.publishers), where("ownerUserId", "==", userId));
  const snap = await getDocs(q);
  const out: Publisher[] = [];
  snap.forEach((d) => out.push(d.data() as Publisher));
  return out;
}

export async function getMyPrimaryPublisher(): Promise<Publisher | null> {
  const all = await listMyPublishers();
  if (all.length === 0) return null;
  return [...all].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
}

export type PublisherInput = Omit<Publisher, "id" | "updatedAt" | "ownerUserId" | "appIds"> & {
  id?: string;
  appIds?: string[];
};

/**
 * Update an EXISTING publisher entity. Creation is admin-onboarded only.
 * See `saveDeveloper` for the matching pattern.
 */
export async function savePublisher(input: PublisherInput): Promise<Publisher> {
  const userId = requireUserId();
  const id = input.id ?? slugify(input.name);
  if (!id) throw new Error("Publisher name is required.");
  const ref = doc(getDb(), COLLECTIONS.publishers, id);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    throw new Error(
      "You don't own a publisher profile yet. Apply at /become-a-creator or wait for an admin invite.",
    );
  }
  const current = existing.data() as Publisher;
  if (current.ownerUserId !== userId) {
    throw new Error("You don't have permission to edit this publisher.");
  }
  const next: Publisher = stripUndefined({
    ...current,
    ...input,
    id,
    ownerUserId: current.ownerUserId,
    appIds: input.appIds ?? current.appIds ?? [],
    updatedAt: now(),
  }) as Publisher;
  const { verificationStatus: _vs, ...safeNext } = next as Publisher & {
    verificationStatus?: string;
  };
  void _vs;
  await setDoc(ref, safeNext as Publisher, { merge: true });
  return next;
}

export async function attachAppToPublisher(publisherId: string, appId: string): Promise<void> {
  const ref = doc(getDb(), COLLECTIONS.publishers, publisherId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const pub = snap.data() as Publisher;
  if (pub.appIds?.includes(appId)) return;
  await setDoc(ref, { appIds: [...(pub.appIds ?? []), appId], updatedAt: now() }, { merge: true });
}
