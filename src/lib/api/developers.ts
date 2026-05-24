import { doc, getDoc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { getDb, COLLECTIONS, getFirebaseAuth } from "../firebase";
import { slugify } from "../utils";
import type { Developer } from "../types";

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

export async function getDeveloper(slug: string): Promise<Developer | null> {
  if (!slug) return null;
  const ref = doc(getDb(), COLLECTIONS.developers, slug);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Developer) : null;
}

export async function listDevelopers(): Promise<Developer[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.developers));
  const out: Developer[] = [];
  snap.forEach((d) => out.push(d.data() as Developer));
  return out;
}

export async function listMyDevelopers(): Promise<Developer[]> {
  const userId = requireUserId();
  const q = query(collection(getDb(), COLLECTIONS.developers), where("ownerUserId", "==", userId));
  const snap = await getDocs(q);
  const out: Developer[] = [];
  snap.forEach((d) => out.push(d.data() as Developer));
  return out;
}

export async function getMyPrimaryDeveloper(): Promise<Developer | null> {
  const all = await listMyDevelopers();
  if (all.length === 0) return null;
  return [...all].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
}

export type DeveloperInput = Omit<Developer, "id" | "updatedAt" | "ownerUserId" | "appIds"> & {
  id?: string;
  appIds?: string[];
};

/**
 * Update an EXISTING developer entity. Creation is admin-onboarded only —
 * new developers are minted by Cloud Functions (`approveCreatorApplication`,
 * `inviteCreator`, `claimCreatorInvite`). This client function will throw if
 * the doc doesn't exist, matching the tightened Firestore rule
 * (`allow create: if false`).
 */
export async function saveDeveloper(input: DeveloperInput): Promise<Developer> {
  const userId = requireUserId();
  const id = input.id ?? slugify(input.name);
  if (!id) throw new Error("Developer name is required.");
  const ref = doc(getDb(), COLLECTIONS.developers, id);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    throw new Error(
      "You don't own a developer profile yet. Apply at /become-a-creator or wait for an admin invite.",
    );
  }
  const current = existing.data() as Developer;
  if (current.ownerUserId !== userId) {
    throw new Error("You don't have permission to edit this developer.");
  }
  const next: Developer = stripUndefined({
    ...current,
    ...input,
    id,
    // Owner + appIds + verificationStatus are preserved server-side.
    ownerUserId: current.ownerUserId,
    appIds: input.appIds ?? current.appIds ?? [],
    updatedAt: now(),
  }) as Developer;
  // Strip verificationStatus from the client write — rules forbid changing it.
  const { verificationStatus: _vs, ...safeNext } = next as Developer & {
    verificationStatus?: string;
  };
  void _vs;
  await setDoc(ref, safeNext as Developer, { merge: true });
  return next;
}

export async function attachAppToDeveloper(developerId: string, appId: string): Promise<void> {
  const ref = doc(getDb(), COLLECTIONS.developers, developerId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const dev = snap.data() as Developer;
  if (dev.appIds?.includes(appId)) return;
  await setDoc(ref, { appIds: [...(dev.appIds ?? []), appId], updatedAt: now() }, { merge: true });
}
