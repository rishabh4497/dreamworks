import {
  collection,
  deleteDoc,
  getDoc,
  getDocs,
  doc,
  limit as fbLimit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  type QueryConstraint,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  COLLECTIONS,
  getDb,
  getFirebaseFunctions,
} from "@/lib/firebase";
import type {
  AdminUserSummary,
  App,
  AppStage,
  AuditAction,
  AuditEntry,
  AuditTargetType,
  CreatorProfileSubmission,
  CreatorSocialLinks,
  CreatorSubmissionType,
  CreatorVerificationStatus,
  Developer,
  Publisher,
  SubmissionStatus,
  UserRole,
} from "@/lib/types";

export type Creator = (Publisher | Developer) & { creatorType: CreatorSubmissionType };

export type CreatorPatch = Partial<{
  name: string;
  tagline: string;
  about: string;
  logoUrl: string;
  bannerUrl: string;
  brandColor: string;
  websiteUrl: string;
  socialLinks: CreatorSocialLinks;
}>;

// ── App management (admin) ─────────────────────────────────────────────────

export async function listAllApps(opts: {
  stage?: AppStage | "all";
  search?: string;
} = {}): Promise<App[]> {
  const ref = collection(getDb(), COLLECTIONS.apps);
  // Same pattern as the submission queues: drop the server-side orderBy when
  // a where filter is present, sort client-side. Avoids requiring a composite
  // (stage, updatedAt) index. 500-doc cap keeps the client sort cheap.
  const q = opts.stage && opts.stage !== "all"
    ? query(ref, where("stage", "==", opts.stage), fbLimit(500))
    : query(ref, orderBy("updatedAt", "desc"), fbLimit(500));
  const snap = await getDocs(q);
  const list: App[] = [];
  snap.forEach((d) => list.push(d.data() as App));
  if (opts.stage && opts.stage !== "all") {
    list.sort((a, b) => ((a.updatedAt ?? "") < (b.updatedAt ?? "") ? 1 : -1));
  }
  const search = opts.search?.trim().toLowerCase();
  if (!search) return list;
  return list.filter(
    (app) =>
      app.gameTitle?.toLowerCase().includes(search) ||
      app.id.toLowerCase().includes(search) ||
      app.developerIds?.some((slug) => slug.toLowerCase().includes(search)) ||
      app.publisherIds?.some((slug) => slug.toLowerCase().includes(search)),
  );
}

export interface DeleteAppAdminResult {
  deletedApp: boolean;
  deletedGame: boolean;
  deletedSubmissions: number;
  deletedBuilds: number;
  deletedAchievements: number;
  /** True when we fell back to a client-only delete (no audit, no submission purge). */
  clientFallback?: boolean;
}

export async function deleteAppAdmin(input: {
  appId: string;
  alsoDeleteGame?: boolean;
}): Promise<DeleteAppAdminResult> {
  // Preferred path: server-side cascade with audit log + submission purge.
  try {
    const fn = httpsCallable<typeof input, DeleteAppAdminResult>(
      getFirebaseFunctions(),
      "deleteAppAdmin",
    );
    const res = await fn(input);
    return res.data;
  } catch (err) {
    if (!shouldFallback(err)) throw err;
    console.warn(
      "deleteAppAdmin callable unavailable; falling back to client-side cascade.",
      err,
    );
    return clientSideDeleteApp(input);
  }
}

function shouldFallback(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code ?? "";
  const message = (err as { message?: string } | null)?.message ?? "";
  // Treat "not deployed", "internal", and "unavailable" as fallback signals.
  // Permission errors should bubble up so the caller knows they aren't admin.
  if (code === "functions/not-found" || code === "functions/unavailable" || code === "functions/internal") {
    return true;
  }
  if (/not found|unavailable|cors|network/i.test(message) && !/permission/i.test(message)) {
    return true;
  }
  return false;
}

async function clientSideDeleteApp(input: {
  appId: string;
  alsoDeleteGame?: boolean;
}): Promise<DeleteAppAdminResult> {
  const db = getDb();
  const { appId, alsoDeleteGame = true } = input;

  const [buildsSnap, achSnap] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.apps, appId, "builds")),
    getDocs(collection(db, COLLECTIONS.apps, appId, "achievements")),
  ]);
  await Promise.all([
    ...buildsSnap.docs.map((d) => deleteDoc(d.ref)),
    ...achSnap.docs.map((d) => deleteDoc(d.ref)),
  ]);

  let deletedGame = false;
  if (alsoDeleteGame) {
    try {
      const gameRef = doc(db, COLLECTIONS.games, appId);
      const gameSnap = await getDoc(gameRef);
      if (gameSnap.exists()) {
        await deleteDoc(gameRef);
        deletedGame = true;
      }
    } catch (err) {
      console.warn("Could not delete dw_games entry", err);
    }
  }

  await deleteDoc(doc(db, COLLECTIONS.apps, appId));

  return {
    deletedApp: true,
    deletedGame,
    deletedSubmissions: 0,
    deletedBuilds: buildsSnap.size,
    deletedAchievements: achSnap.size,
    clientFallback: true,
  };
}

// ── Bootstrap callable (used by auth-store) ────────────────────────────────

export async function claimAdminIfAllowlisted(): Promise<{ admin: boolean }> {
  const fn = httpsCallable<unknown, { admin: boolean }>(
    getFirebaseFunctions(),
    "claimAdminIfAllowlisted",
  );
  const res = await fn({});
  return res.data;
}

// ── User management ────────────────────────────────────────────────────────

export async function setUserRole(input: {
  targetUid: string;
  role: UserRole;
  permissions?: string[];
}): Promise<{ ok: true }> {
  const fn = httpsCallable<typeof input, { ok: true }>(
    getFirebaseFunctions(),
    "setUserRole",
  );
  const res = await fn(input);
  return res.data;
}

export async function listAdminUsers(opts: { search?: string; role?: UserRole | "all" } = {}): Promise<AdminUserSummary[]> {
  const ref = collection(getDb(), COLLECTIONS.users);
  // Without server-side full-text search, fetch the most recent N users and
  // filter client-side. Fine for the admin console where the working-set is
  // small; swap for Algolia/Typesense later if the user table grows.
  const constraints: QueryConstraint[] = [];
  if (opts.role && opts.role !== "all") {
    constraints.push(where("role", "==", opts.role));
  }
  constraints.push(fbLimit(200));
  const snap = await getDocs(query(ref, ...constraints));
  const list: AdminUserSummary[] = [];
  snap.forEach((d) => {
    const data = d.data() as any;
    list.push({
      uid: d.id,
      email: data.email ?? "",
      displayName: data.displayName ?? data.email?.split("@")[0] ?? "User",
      photoURL: data.photoURL,
      role: (data.role as UserRole) ?? "user",
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      suspended: !!data.suspended,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.memberSince,
      lastSignInAt: data.lastSignInAt,
    });
  });
  const search = opts.search?.trim().toLowerCase();
  if (search) {
    return list.filter(
      (u) =>
        u.email.toLowerCase().includes(search) ||
        u.displayName.toLowerCase().includes(search) ||
        u.uid.toLowerCase().includes(search),
    );
  }
  return list;
}

export async function getAdminUser(uid: string): Promise<AdminUserSummary | null> {
  const snap = await getDoc(doc(getDb(), COLLECTIONS.users, uid));
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    uid: snap.id,
    email: data.email ?? "",
    displayName: data.displayName ?? data.email?.split("@")[0] ?? "User",
    photoURL: data.photoURL,
    role: (data.role as UserRole) ?? "user",
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    suspended: !!data.suspended,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.memberSince,
    lastSignInAt: data.lastSignInAt,
  };
}

// ── Audit log ──────────────────────────────────────────────────────────────

function asAuditEntry(snap: QueryDocumentSnapshot<DocumentData>): AuditEntry {
  const data = snap.data() as any;
  return {
    id: snap.id,
    actorUid: data.actorUid,
    actorEmail: data.actorEmail ?? "",
    action: data.action as AuditAction,
    targetType: data.targetType as AuditTargetType,
    targetId: data.targetId,
    beforeState: data.beforeState,
    afterState: data.afterState,
    metadata: data.metadata,
    ts: data.ts?.toDate?.()?.toISOString?.() ?? data.ts ?? "",
  };
}

export interface AuditLogPage {
  entries: AuditEntry[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
}

export async function listAuditLog(opts: {
  action?: AuditAction;
  actorUid?: string;
  targetType?: AuditTargetType;
  targetId?: string;
  pageSize?: number;
  after?: QueryDocumentSnapshot<DocumentData> | null;
} = {}): Promise<AuditLogPage> {
  const ref = collection(getDb(), COLLECTIONS.adminAudit);
  const constraints: QueryConstraint[] = [];
  if (opts.action) constraints.push(where("action", "==", opts.action));
  if (opts.actorUid) constraints.push(where("actorUid", "==", opts.actorUid));
  if (opts.targetType) constraints.push(where("targetType", "==", opts.targetType));
  if (opts.targetId) constraints.push(where("targetId", "==", opts.targetId));
  constraints.push(orderBy("ts", "desc"));
  if (opts.after) constraints.push(startAfter(opts.after));
  constraints.push(fbLimit(opts.pageSize ?? 50));
  const snap = await getDocs(query(ref, ...constraints));
  const entries = snap.docs.map(asAuditEntry);
  const cursor = snap.docs[snap.docs.length - 1] ?? null;
  return { entries, cursor };
}

// ── Creator-profile submissions ────────────────────────────────────────────

function asCreatorSubmission(
  type: CreatorSubmissionType,
  snap: QueryDocumentSnapshot<DocumentData>,
): CreatorProfileSubmission {
  const data = snap.data() as any;
  return {
    id: snap.id,
    creatorType: type,
    creatorId: data.creatorId,
    submitterUserId: data.submitterUserId,
    submitterEmail: data.submitterEmail ?? "",
    profileSnapshot: data.profileSnapshot,
    status: data.status as SubmissionStatus,
    submittedAt: data.submittedAt,
    claimedAt: data.claimedAt,
    claimedByUid: data.claimedByUid,
    decidedAt: data.decidedAt,
    decidedByUid: data.decidedByUid,
    decision: data.decision,
  };
}

// ── Creator profiles (direct verification by admin) ────────────────────────
//
// Reads the actual dw_publishers / dw_developers collections (where profiles
// live) rather than the explicit-submission queue. Admin Firestore rules
// allow writing `verificationStatus`, so we update the doc directly.

export async function listAllCreators(
  type: CreatorSubmissionType,
  opts: { verification?: CreatorVerificationStatus | "all" } = {},
): Promise<Creator[]> {
  const ref = collection(
    getDb(),
    type === "publisher" ? COLLECTIONS.publishers : COLLECTIONS.developers,
  );
  const snap = await getDocs(query(ref, fbLimit(500)));
  const list: Creator[] = [];
  snap.forEach((d) => {
    const data = d.data() as Publisher | Developer;
    list.push({ ...data, id: d.id, creatorType: type } as Creator);
  });
  list.sort((a, b) => ((a.updatedAt ?? "") < (b.updatedAt ?? "") ? 1 : -1));
  if (!opts.verification || opts.verification === "all") return list;
  return list.filter(
    (c) => (c.verificationStatus ?? "unverified") === opts.verification,
  );
}

export async function setCreatorVerification(input: {
  type: CreatorSubmissionType;
  id: string;
  status: CreatorVerificationStatus;
}): Promise<void> {
  const ref = doc(
    getDb(),
    input.type === "publisher" ? COLLECTIONS.publishers : COLLECTIONS.developers,
    input.id,
  );
  await updateDoc(ref, {
    verificationStatus: input.status,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateCreator(input: {
  type: CreatorSubmissionType;
  id: string;
  patch: CreatorPatch;
}): Promise<void> {
  const ref = doc(
    getDb(),
    input.type === "publisher" ? COLLECTIONS.publishers : COLLECTIONS.developers,
    input.id,
  );
  const cleaned = Object.fromEntries(
    Object.entries(input.patch).filter(([, v]) => v !== undefined),
  );
  await updateDoc(ref, { ...cleaned, updatedAt: new Date().toISOString() });
}

export async function listCreatorSubmissionQueue(
  type: CreatorSubmissionType,
  status?: SubmissionStatus,
): Promise<CreatorProfileSubmission[]> {
  const ref = collection(
    getDb(),
    type === "publisher" ? COLLECTIONS.publisherSubmissions : COLLECTIONS.developerSubmissions,
  );
  // When filtering by status, skip the server-side orderBy so we don't need
  // a composite (status, submittedAt) index — pending queues are small enough
  // to sort client-side. Indexes in firestore.indexes.json are still set up
  // for when queue volume justifies switching back.
  const q = status
    ? query(ref, where("status", "==", status))
    : query(ref, orderBy("submittedAt", "desc"));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => asCreatorSubmission(type, d));
  if (status) rows.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  return rows;
}

export async function reviewPublisherProfile(input: {
  submissionId: string;
  outcome: "approve" | "request_changes" | "reject";
  summaryNote: string;
  reasons?: string[];
}): Promise<{ submissionId: string; status: SubmissionStatus; creatorId: string }> {
  const fn = httpsCallable<typeof input, { submissionId: string; status: SubmissionStatus; creatorId: string }>(
    getFirebaseFunctions(),
    "reviewPublisherProfile",
  );
  const res = await fn(input);
  return res.data;
}

export async function reviewStudioProfile(input: {
  submissionId: string;
  outcome: "approve" | "request_changes" | "reject";
  summaryNote: string;
  reasons?: string[];
}): Promise<{ submissionId: string; status: SubmissionStatus; creatorId: string }> {
  const fn = httpsCallable<typeof input, { submissionId: string; status: SubmissionStatus; creatorId: string }>(
    getFirebaseFunctions(),
    "reviewStudioProfile",
  );
  const res = await fn(input);
  return res.data;
}

// ── KPIs (small dashboard reads) ───────────────────────────────────────────

export interface AdminKpis {
  pendingSubmissions: number;
  inReviewSubmissions: number;
  approvedThisWeek: number;
  rejectedThisWeek: number;
  pendingPublisherClaims: number;
  pendingStudioClaims: number;
  newUsers7d: number;
}

export async function getAdminKpis(): Promise<AdminKpis> {
  const db = getDb();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [pendingSubs, inReviewSubs, recentDecided, pendingPub, pendingDev, recentUsers] =
    await Promise.all([
      getDocs(
        query(
          collection(db, COLLECTIONS.appSubmissions),
          where("status", "==", "pending"),
        ),
      ),
      getDocs(
        query(
          collection(db, COLLECTIONS.appSubmissions),
          where("status", "==", "in_review"),
        ),
      ),
      getDocs(
        query(
          collection(db, COLLECTIONS.appSubmissions),
          where("decidedAt", ">=", weekAgo),
          orderBy("decidedAt", "desc"),
        ),
      ),
      getDocs(
        query(
          collection(db, COLLECTIONS.publisherSubmissions),
          where("status", "==", "pending"),
        ),
      ),
      getDocs(
        query(
          collection(db, COLLECTIONS.developerSubmissions),
          where("status", "==", "pending"),
        ),
      ),
      getDocs(
        query(
          collection(db, COLLECTIONS.users),
          where("memberSince", ">=", weekAgo),
        ),
      ),
    ]);

  let approvedThisWeek = 0;
  let rejectedThisWeek = 0;
  recentDecided.forEach((d) => {
    const s = (d.data() as any).status;
    if (s === "approved") approvedThisWeek += 1;
    else if (s === "rejected") rejectedThisWeek += 1;
  });

  return {
    pendingSubmissions: pendingSubs.size,
    inReviewSubmissions: inReviewSubs.size,
    approvedThisWeek,
    rejectedThisWeek,
    pendingPublisherClaims: pendingPub.size,
    pendingStudioClaims: pendingDev.size,
    newUsers7d: recentUsers.size,
  };
}
