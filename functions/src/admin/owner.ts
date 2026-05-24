// Owner identity Cloud Function — the only path that mints owner custom claims.
//
// Security model:
// - OWNER_UID is stored in GCP Secret Manager (defineSecret), not in code or env.
// - Owner can only be claimed by the account whose `auth.uid === OWNER_UID`.
// - We additionally require the caller's JWT to show a second factor was used
//   (`sign_in_second_factor === "totp"`). The owner cannot skip MFA.
// - On success: sets custom claim `{ owner: true, admin: true, ...digest }` and
//   writes `dw_users/{uid}` with `role: "owner"`, `permissions: ["*"]`.
//
// Reset path: if the owner account is locked out, only re-issuing the
// OWNER_UID secret (manual GCP Secret Manager edit by anyone with project
// IAM owner) can restore access. Deliberate hard fence.

import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { COLLECTIONS, requireAuth, writeAudit } from "./shared.js";

const OWNER_UID = defineSecret("OWNER_UID");

interface ClaimOwnerResult {
  owner: boolean;
  /** Reason for refusal when owner=false. */
  reason?: "uid_mismatch" | "mfa_required" | "secret_unset";
}

export const claimOwnerIfEligible = onCall(
  {
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
    secrets: [OWNER_UID],
  },
  async (request: CallableRequest<unknown>): Promise<ClaimOwnerResult> => {
    const { uid, email } = requireAuth(request);

    const ownerUid = OWNER_UID.value();
    if (!ownerUid) {
      logger.warn("claimOwnerIfEligible: OWNER_UID secret not set");
      return { owner: false, reason: "secret_unset" };
    }
    if (uid !== ownerUid) {
      // Silent refusal — return false. Don't reveal who the owner is.
      return { owner: false, reason: "uid_mismatch" };
    }

    // Enforce MFA: the JWT must show a second-factor sign-in (TOTP).
    const firebase = request.auth!.token.firebase as
      | { sign_in_second_factor?: string }
      | undefined;
    const secondFactor = firebase?.sign_in_second_factor;
    if (!secondFactor) {
      logger.warn("claimOwnerIfEligible: owner attempted to claim without MFA", { uid });
      return { owner: false, reason: "mfa_required" };
    }

    try {
      const userRecord = await getAuth().getUser(uid);
      const existingClaims = (userRecord.customClaims as Record<string, unknown> | undefined) ?? {};
      if (existingClaims.owner === true) {
        // Already an owner — idempotent.
        return { owner: true };
      }

      // Mint the owner claim + a complete admin/access digest.
      await getAuth().setCustomUserClaims(uid, {
        ...existingClaims,
        owner: true,
        admin: true,
        role: "owner",
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
            role: "owner",
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
          afterState: { role: "owner", permissions: ["*"] },
          metadata: { source: "OWNER_UID secret", secondFactor },
        });
      });

      logger.info("Owner claim minted", { uid, email });
      return { owner: true };
    } catch (err) {
      logger.error("claimOwnerIfEligible failed", { uid, err: String(err) });
      throw new HttpsError("internal", "Failed to claim owner.");
    }
  },
);
