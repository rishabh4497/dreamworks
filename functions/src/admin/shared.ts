import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, type Transaction, FieldValue } from "firebase-admin/firestore";

export const COLLECTIONS = {
  users: "users",
  apps: "dw_apps",
  games: "dw_games",
  appSubmissions: "dw_app_submissions",
  publisherSubmissions: "dw_publisher_submissions",
  developerSubmissions: "dw_developer_submissions",
  adminAudit: "dw_admin_audit",
  publishers: "dw_publishers",
  developers: "dw_developers",
  moderationRecords: "dw_moderation_records",
} as const;

export type AuditAction =
  | "submission.submit"
  | "submission.review"
  | "app.publish"
  | "user.role_set"
  | "user.permissions_set"
  | "publisher.review"
  | "studio.review"
  | "moderation.decide"
  | "owner.granted_admin"
  | "owner.revoked_admin"
  | "owner.permissions_changed"
  | "owner.invited_admin"
  | "owner.bootstrap"
  | "creator.application_submitted"
  | "creator.application_approved"
  | "creator.application_rejected"
  | "creator.invited_direct"
  | "creator.invite_sent"
  | "creator.invite_claimed"
  | "creator.invite_expired"
  | "auth.reauth_required"
  | "auth.mfa_enrolled";

export type AuditTargetType =
  | "app"
  | "submission"
  | "user"
  | "publisher"
  | "developer"
  | "moderationRecord"
  | "creatorApplication"
  | "creatorInvite"
  | "adminInvite";

export interface AuditEntry {
  actorUid: string;
  actorEmail: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export function requireAuth(req: CallableRequest<unknown>): { uid: string; email: string } {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  return { uid, email: (req.auth!.token.email as string | undefined) ?? "" };
}

/**
 * Assert the caller is an admin. Custom claims are the fast path; we fall
 * back to a Firestore doc read in case the token hasn't refreshed since
 * the role change.
 */
export async function assertAdmin(req: CallableRequest<unknown>): Promise<{ uid: string; email: string }> {
  const { uid, email } = requireAuth(req);
  if (req.auth!.token.admin === true) return { uid, email };
  const snap = await getFirestore().collection(COLLECTIONS.users).doc(uid).get();
  if (snap.exists && snap.data()?.role === "admin") return { uid, email };
  throw new HttpsError("permission-denied", "Admin role required.");
}

export function writeAudit(tx: Transaction, entry: AuditEntry): void {
  const ref = getFirestore().collection(COLLECTIONS.adminAudit).doc();
  tx.set(ref, {
    ...entry,
    ts: FieldValue.serverTimestamp(),
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
