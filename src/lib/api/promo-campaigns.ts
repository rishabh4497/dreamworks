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
import type { PromoCampaign, PromoCampaignStatus } from "../types";

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
  return `promo_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function computeStatus(
  campaign: { startsAt: string; endsAt: string },
  nowMs = Date.now(),
): PromoCampaignStatus {
  const s = new Date(campaign.startsAt).getTime();
  const e = new Date(campaign.endsAt).getTime();
  if (nowMs < s) return "scheduled";
  if (nowMs >= e) return "ended";
  return "active";
}

export interface PromoCampaignInput {
  id?: string;
  appId: string;
  name: string;
  discountPct: number;
  startsAt: string;
  endsAt: string;
}

export async function listPromoCampaignsByApp(appId: string): Promise<PromoCampaign[]> {
  if (!appId) return [];
  const q = query(
    collection(getDb(), COLLECTIONS.promoCampaigns),
    where("appId", "==", appId),
  );
  const snap = await getDocs(q);
  const out: PromoCampaign[] = [];
  snap.forEach((d) => {
    const raw = d.data() as PromoCampaign;
    out.push({ ...raw, status: computeStatus(raw) });
  });
  return out.sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1));
}

export async function listPromoCampaignsByApps(appIds: string[]): Promise<PromoCampaign[]> {
  if (!appIds.length) return [];
  const slice = appIds.slice(0, 30);
  const q = query(
    collection(getDb(), COLLECTIONS.promoCampaigns),
    where("appId", "in", slice),
  );
  const snap = await getDocs(q);
  const out: PromoCampaign[] = [];
  snap.forEach((d) => {
    const raw = d.data() as PromoCampaign;
    out.push({ ...raw, status: computeStatus(raw) });
  });
  return out;
}

export async function savePromoCampaign(input: PromoCampaignInput): Promise<PromoCampaign> {
  requireUserId();
  if (!input.appId) throw new Error("appId is required.");
  if (!input.name.trim()) throw new Error("Campaign name is required.");
  if (input.discountPct < 0 || input.discountPct > 90) {
    throw new Error("Discount must be between 0 and 90%.");
  }
  if (new Date(input.endsAt) <= new Date(input.startsAt)) {
    throw new Error("Campaign end must be after start.");
  }
  const id = input.id ?? newId();
  const ref = doc(getDb(), COLLECTIONS.promoCampaigns, id);
  const existing = await getDoc(ref);
  const prior = existing.exists() ? (existing.data() as PromoCampaign) : null;
  const next: PromoCampaign = stripUndefined({
    id,
    appId: input.appId,
    name: input.name.trim(),
    discountPct: Math.round(input.discountPct),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status: computeStatus(input),
    createdAt: prior?.createdAt ?? now(),
  }) as PromoCampaign;
  await setDoc(ref, next, { merge: true });
  return next;
}

export async function deletePromoCampaign(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.promoCampaigns, id));
}
