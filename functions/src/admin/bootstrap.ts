import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { COLLECTIONS, requireAuth, writeAudit } from "./shared.js";

const ADMIN_EMAILS = defineString("ADMIN_EMAILS", {
  default: "",
  description: "Comma-separated list of email addresses auto-promoted to admin on sign-in.",
});

function allowlist(): string[] {
  const raw = ADMIN_EMAILS.value() ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function ensureAdminClaim(uid: string, email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const list = allowlist();
  if (list.length === 0 || !list.includes(email.toLowerCase())) return false;

  const userRecord = await getAuth().getUser(uid).catch(() => null);
  const existingClaims = (userRecord?.customClaims as Record<string, unknown> | undefined) ?? {};
  if (existingClaims.admin === true && existingClaims.role === "admin") {
    return true;
  }

  await getAuth().setCustomUserClaims(uid, { ...existingClaims, admin: true, role: "admin" });
  const userRef = getFirestore().collection(COLLECTIONS.users).doc(uid);

  await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const before = snap.exists ? { role: snap.data()?.role ?? null } : { role: null };
    tx.set(
      userRef,
      {
        uid,
        email,
        role: "admin",
        permissions: ["*"],
      },
      { merge: true },
    );
    writeAudit(tx, {
      actorUid: "system:bootstrap",
      actorEmail: email,
      action: "user.role_set",
      targetType: "user",
      targetId: uid,
      beforeState: before,
      afterState: { role: "admin" },
      metadata: { source: "ADMIN_EMAILS allowlist" },
    });
  });

  logger.info("Admin claim granted via ADMIN_EMAILS allowlist", { uid, email });
  return true;
}

/**
 * Callable invoked once per session from the client auth-store. Idempotent
 * for non-allowlisted users (returns { admin: false } and writes nothing).
 */
export const claimAdminIfAllowlisted = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<unknown>): Promise<{ admin: boolean }> => {
    const { uid, email } = requireAuth(request);
    try {
      const granted = await ensureAdminClaim(uid, email);
      return { admin: granted };
    } catch (err) {
      logger.error("claimAdminIfAllowlisted failed", { uid, err: String(err) });
      throw new HttpsError("internal", "Failed to evaluate admin allowlist.");
    }
  },
);
