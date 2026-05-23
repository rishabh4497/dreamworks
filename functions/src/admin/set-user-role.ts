import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import { COLLECTIONS, assertAdmin, writeAudit } from "./shared.js";

type Role = "user" | "developer" | "publisher" | "admin";

interface SetRoleRequest {
  targetUid: string;
  role: Role;
  permissions?: string[];
}

const ALLOWED_ROLES: ReadonlySet<Role> = new Set(["user", "developer", "publisher", "admin"]);

export const setUserRole = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<SetRoleRequest>): Promise<{ ok: true }> => {
    const { uid: actorUid, email } = await assertAdmin(request);
    const { targetUid, role, permissions } = request.data ?? ({} as SetRoleRequest);

    if (!targetUid) throw new HttpsError("invalid-argument", "targetUid required.");
    if (!ALLOWED_ROLES.has(role)) throw new HttpsError("invalid-argument", `Invalid role: ${role}`);

    const db = getFirestore();
    const userRef = db.collection(COLLECTIONS.users).doc(targetUid);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new HttpsError("not-found", "User not found.");
      const before = {
        role: snap.data()?.role ?? null,
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
