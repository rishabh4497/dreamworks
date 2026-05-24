// Client wrappers for the apply + claim Cloud Functions. Used by the public
// "Sell on Dreamworks" page and the invite-claim flow. Reads of the user's
// own application go directly through Firestore (rules allow self-read).

import { httpsCallable } from "firebase/functions";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit as fbLimit,
} from "firebase/firestore";
import { COLLECTIONS, getDb, getFirebaseFunctions } from "@/lib/firebase";
import type { CreatorApplication, CreatorInviteKind } from "@/lib/types";

interface BrandInput {
  name: string;
  brandColor: string;
  logoUrl: string;
  bannerUrl?: string;
  tagline: string;
  about?: string;
  websiteUrl?: string;
  socialLinks?: Record<string, string>;
}

export async function submitCreatorApplication(input: {
  kind: CreatorInviteKind;
  brand: BrandInput;
  pitch: string;
  links?: string[];
}): Promise<{ id: string }> {
  const fn = httpsCallable<typeof input, { id: string }>(
    getFirebaseFunctions(),
    "submitCreatorApplication",
  );
  const res = await fn(input);
  return res.data;
}

export async function claimCreatorInvite(token: string): Promise<{
  entityId: string;
  kind: CreatorInviteKind;
}> {
  const fn = httpsCallable<{ token: string }, { entityId: string; kind: CreatorInviteKind }>(
    getFirebaseFunctions(),
    "claimCreatorInvite",
  );
  const res = await fn({ token });
  return res.data;
}

export async function claimAdminInvite(token: string): Promise<{ ok: true; preset: string }> {
  const fn = httpsCallable<{ token: string }, { ok: true; preset: string }>(
    getFirebaseFunctions(),
    "claimAdminInvite",
  );
  const res = await fn({ token });
  return res.data;
}

/** Lists applications visible to the caller — own pending app for users,
 *  every pending+in_review app for admins with `admin.creators.review`. */
export async function listMyApplications(uid: string): Promise<CreatorApplication[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.creatorApplications),
      where("submitterUserId", "==", uid),
      orderBy("submittedAt", "desc"),
      fbLimit(20),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CreatorApplication, "id">) }) as CreatorApplication);
}

export async function listPendingApplications(): Promise<CreatorApplication[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.creatorApplications),
      where("status", "in", ["pending", "in_review"]),
      orderBy("submittedAt", "desc"),
      fbLimit(200),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CreatorApplication, "id">) }) as CreatorApplication);
}
