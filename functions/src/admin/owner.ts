// Bootstrap admin Cloud Function.
//
// Mints the `admin` custom claim for the single account whose UID matches
// the `OWNER_UID` secret. This is the only auto-promotion path in the
// system — every other admin teammate must be invited by an existing admin.
//
// Security model:
// - OWNER_UID is stored in GCP Secret Manager (defineSecret), not in code or env.
// - Only the matching uid can be promoted; silent refusal otherwise.
// - Idempotent — subsequent calls return early if the claim is already set.
//
// Reset path: editing the OWNER_UID secret in GCP Secret Manager restores
// the bootstrap account. Deliberate hard fence.

import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { COLLECTIONS, requireAuth, writeAudit } from "./shared.js";

const OWNER_UID = defineSecret("OWNER_UID");

interface BootstrapResult {
  admin: boolean;
  /** Reason for refusal when admin=false. */
  reason?: "uid_mismatch" | "secret_unset";
}

export const claimOwnerIfEligible = onCall(
  {
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
    secrets: [OWNER_UID],
  },
  async (request: CallableRequest<unknown>): Promise<BootstrapResult> => {
    const { uid, email } = requireAuth(request);

    const ownerUid = OWNER_UID.value();
    if (!ownerUid) {
      logger.warn("claimOwnerIfEligible: OWNER_UID secret not set");
      return { admin: false, reason: "secret_unset" };
    }
    if (uid !== ownerUid) {
      return { admin: false, reason: "uid_mismatch" };
    }

    try {
      const userRecord = await getAuth().getUser(uid);
      const existingClaims = (userRecord.customClaims as Record<string, unknown> | undefined) ?? {};
      if (existingClaims.admin === true) {
        // Already promoted — idempotent.
        return { admin: true };
      }

      // Mint admin claim + full access digest.
      await getAuth().setCustomUserClaims(uid, {
        ...existingClaims,
        admin: true,
        role: "admin",
        "admin.access": true,
        "console.access": true,
      });

      const userRef = getFirestore().collection(COLLECTIONS.users).doc(uid);
      await getFirestore().runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const before = snap.exists
          ? {
              role: snap.data()?.role ?? null,
              permissions: snap.data()?.permissions ?? [],
            }
          : { role: null, permissions: [] };
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
          action: "owner.bootstrap",
          targetType: "user",
          targetId: uid,
          beforeState: before,
          afterState: { role: "admin", permissions: ["*"] },
          metadata: { source: "OWNER_UID secret" },
        });
      });

      logger.info("Bootstrap admin claim minted", { uid, email });
      return { admin: true };
    } catch (err) {
      logger.error("claimOwnerIfEligible failed", { uid, err: String(err) });
      throw new HttpsError("internal", "Failed to bootstrap admin.");
    }
  },
);
