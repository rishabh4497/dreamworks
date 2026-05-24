import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import { COLLECTIONS, writeAudit } from "./shared.js";
import { assertPermission } from "../lib/assert-permission.js";
import { assertFreshAuth } from "../lib/recent-auth.js";

type Role = "user" | "developer" | "publisher" | "admin" | "owner";

interface SetRoleRequest {
  targetUid: string;
  role: Role;
  permissions?: string[];
}

// "owner" cannot be granted via this function — only mintable via
// claimOwnerIfEligible with the OWNER_UID secret check + MFA gate.
const ALLOWED_ROLES: ReadonlySet<Role> = new Set(["user", "developer", "publisher", "admin"]);

export const setUserRole = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<SetRoleRequest>): Promise<{ ok: true }> => {
    // Sensitive: requires fresh reauth + explicit permission.
    assertFreshAuth(request, 300);
    const actor = await assertPermission(request, "admin.users.role_change");
    const { uid: actorUid, email } = actor;
    const { targetUid, role, permissions } = request.data ?? ({} as SetRoleRequest);

    if (!targetUid) throw new HttpsError("invalid-argument", "targetUid required.");
    if (!ALLOWED_ROLES.has(role)) throw new HttpsError("invalid-argument", `Invalid role: ${role}`);

    const db = getFirestore();
    const userRef = db.collection(COLLECTIONS.users).doc(targetUid);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new HttpsError("not-found", "User not found.");
      const currentRole = snap.data()?.role ?? null;
      if (currentRole === "owner") {
        throw new HttpsError("permission-denied", "Cannot demote the owner.");
      }
      const before = {
        role: currentRole,
        permissions: snap.data()?.permissions ?? [],
      };
      tx.update(userRef, {
        role,
        permissions: permissions ?? [],
      });
      writeAudit(tx, {
        actorUid,
        actorEmail: email,
        action: "user.role_set",
        targetType: "user",
        targetId: targetUid,
        beforeState: before,
        afterState: { role, permissions: permissions ?? [] },
      });
    });

    // Mirror the role onto custom claims so firestore.rules can fast-path admin checks.
    try {
      const userRecord = await getAuth().getUser(targetUid);
      const existing = (userRecord.customClaims as Record<string, unknown> | undefined) ?? {};
      await getAuth().setCustomUserClaims(targetUid, {
        ...existing,
        admin: role === "admin",
        role,
      });
    } catch (err) {
      logger.warn("setUserRole: failed to update custom claims", { targetUid, err: String(err) });
    }

    logger.info("setUserRole", { actorUid, targetUid, role });
    return { ok: true };
  },
);
