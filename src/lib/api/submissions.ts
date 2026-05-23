import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  COLLECTIONS,
  getDb,
  getFirebaseAuth,
  getFirebaseFunctions,
} from "@/lib/firebase";
import type {
  AppSubmission,
  SubmissionAssetComment,
  SubmissionRejectionReason,
  SubmissionStatus,
} from "@/lib/types";

function requireUid(): string {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in required.");
  return user.uid;
}

function asAppSubmission(id: string, data: any): AppSubmission {
  return {
    id,
    appId: data.appId,
    submitterUserId: data.submitterUserId,
    submitterEmail: data.submitterEmail ?? "",
    appSnapshot: data.appSnapshot,
    status: data.status as SubmissionStatus,
    submittedAt: data.submittedAt,
    claimedAt: data.claimedAt,
    claimedByUid: data.claimedByUid,
    decidedAt: data.decidedAt,
    decidedByUid: data.decidedByUid,
    decision: data.decision,
    priorSubmissionId: data.priorSubmissionId ?? null,
  };
}

// ── Callables ──────────────────────────────────────────────────────────────

export async function submitAppForReviewCallable(appId: string): Promise<{ submissionId: string }> {
  const fn = httpsCallable<{ appId: string }, { submissionId: string }>(
    getFirebaseFunctions(),
    "submitAppForReview",
  );
  const res = await fn({ appId });
  return res.data;
}

export interface ReviewSubmissionInput {
  submissionId: string;
  outcome: "approve" | "request_changes" | "reject";
  summaryNote: string;
  reasons: SubmissionRejectionReason[];
  assetComments: SubmissionAssetComment[];
}

export async function reviewAppSubmissionCallable(
  input: ReviewSubmissionInput,
): Promise<{ submissionId: string; status: SubmissionStatus; appId: string }> {
  const fn = httpsCallable<ReviewSubmissionInput, { submissionId: string; status: SubmissionStatus; appId: string }>(
    getFirebaseFunctions(),
    "reviewAppSubmission",
  );
  const res = await fn(input);
  return res.data;
}

export async function publishApprovedAppCallable(appId: string): Promise<{ gameId: string }> {
  const fn = httpsCallable<{ appId: string }, { gameId: string }>(
    getFirebaseFunctions(),
    "publishApprovedApp",
  );
  const res = await fn({ appId });
  return res.data;
}

// ── Reads (rules-gated) ────────────────────────────────────────────────────

export async function getSubmission(id: string): Promise<AppSubmission | null> {
  const ref = doc(getDb(), COLLECTIONS.appSubmissions, id);
  const snap = await getDoc(ref);
  return snap.exists() ? asAppSubmission(snap.id, snap.data()) : null;
}

export async function listSubmissionsForApp(appId: string): Promise<AppSubmission[]> {
  const q = query(
    collection(getDb(), COLLECTIONS.appSubmissions),
    where("appId", "==", appId),
    orderBy("submittedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => asAppSubmission(d.id, d.data()));
}

export async function listMySubmissions(): Promise<AppSubmission[]> {
  const uid = requireUid();
  const q = query(
    collection(getDb(), COLLECTIONS.appSubmissions),
    where("submitterUserId", "==", uid),
    orderBy("submittedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => asAppSubmission(d.id, d.data()));
}

export async function listSubmissionQueue(status?: SubmissionStatus): Promise<AppSubmission[]> {
  const ref = collection(getDb(), COLLECTIONS.appSubmissions);
  const q = status
    ? query(ref, where("status", "==", status), orderBy("submittedAt", "desc"))
    : query(ref, orderBy("submittedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => asAppSubmission(d.id, d.data()));
}
