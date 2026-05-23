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
import { COLLECTIONS, getDb, getFirebaseAuth } from "../firebase";
import type { PromoKey } from "../types";

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

const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomKeyCode(): string {
  let out = "";
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < bytes.length; i++) {
    out += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
  }
  // Group into 4-char chunks for readability
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}`;
}

export async function listPromoKeysByApp(appId: string): Promise<PromoKey[]> {
  if (!appId) return [];
  const q = query(
    collection(getDb(), COLLECTIONS.promoKeys),
    where("appId", "==", appId),
  );
  const snap = await getDocs(q);
  const out: PromoKey[] = [];
  snap.forEach((d) => out.push(d.data() as PromoKey));
  return out.sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
}

export async function listPromoKeysByApps(appIds: string[]): Promise<PromoKey[]> {
  if (!appIds.length) return [];
  const slice = appIds.slice(0, 30);
  const q = query(
    collection(getDb(), COLLECTIONS.promoKeys),
    where("appId", "in", slice),
  );
  const snap = await getDocs(q);
  const out: PromoKey[] = [];
  snap.forEach((d) => out.push(d.data() as PromoKey));
  return out;
}

export interface IssueKeysInput {
  appId: string;
  count: number;
  recipients?: string[];
  note?: string;
}

export async function issueKeys(input: IssueKeysInput): Promise<PromoKey[]> {
  requireUserId();
  if (!input.appId) throw new Error("appId is required.");
  if (!input.count || input.count < 1) throw new Error("Count must be at least 1.");
  if (input.count > 200) throw new Error("Up to 200 keys per batch.");

  const recipients = input.recipients ?? [];
  const issuedAt = now();
  const created: PromoKey[] = [];
  const batch = writeBatch(getDb());

  for (let i = 0; i < input.count; i++) {
    const code = randomKeyCode();
    const recipient = recipients[i] ?? "";
    const key: PromoKey = stripUndefined({
      id: code,
      appId: input.appId,
      recipient,
      note: input.note,
      status: "issued",
      issuedAt,
    }) as PromoKey;
    batch.set(doc(getDb(), COLLECTIONS.promoKeys, code), key);
    created.push(key);
  }
  await batch.commit();
  return created;
}

export async function revokeKey(id: string): Promise<void> {
  const ref = doc(getDb(), COLLECTIONS.promoKeys, id);
  await setDoc(ref, { status: "revoked" }, { merge: true });
}

export async function deleteKey(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.promoKeys, id));
}
