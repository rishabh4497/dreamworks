// Owner / team-manager mutations for permission management.
//
// - setUserPermissions: replace a target user's permission array. Owner-only
//   by default; admins can be granted `admin.team.manage` to delegate. Always
//   requires fresh reauth (<5min) since this is a sensitive mutation.
// - migrateAdminsToPermissions: one-shot owner-only migration. Walks every
//   `users/{uid}` doc with `role === "admin"` and grants them the "full-admin"
//   preset key list (everything except owner-only keys). Idempotent — already-
//   migrated admins are skipped.

import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import { COLLECTIONS, requireAuth, writeAudit } from "./shared.js";
import { assertPermission, loadActor } from "../lib/assert-permission.js";
import { assertFreshAuth } from "../lib/recent-auth.js";

const TOP_ROLE = "admin";

// Mirror the client-side digest builder. Keep these in sync with
// `src/lib/permissions.ts` `buildClaimDigest`.

const CLAIM_DIGEST_KEYS = [
  "admin.access",
  "console.access",
  "admin.creators.review",
  "admin.creators.write",
  "admin.creators.invite",
  "admin.users.read",
  "admin.users.role_change",
  "admin.users.suspend",
  "admin.team.manage",
  "admin.apps.write",
  "admin.config.write",
  "admin.cdn.manage",
  "admin.moderation.access",
] as const;

function hasKey(perms: string[], _role: string, key: string): boolean {
  if (perms.includes("*")) return true;
  if (perms.includes(key)) return true;
  const segments = key.split(".");
  for (let i = segments.length - 1; i >= 1; i--) {
    const prefix = `${segments.slice(0, i).join(".")}.*`;
    if (perms.includes(prefix)) return true;
  }
  return false;
}

function buildDigest(role: string, perms: string[]): Record<string, boolean> {
  const digest: Record<string, boolean> = {
    admin: role === TOP_ROLE,
  };
  for (const k of CLAIM_DIGEST_KEYS) {
    if (hasKey(perms, role, k)) digest[k] = true;
  }
  return digest;
}

async function mirrorClaims(targetUid: string, role: string, perms: string[]): Promise<void> {
  try {
    const userRecord = await getAuth().getUser(targetUid);
    const existing = (userRecord.customClaims as Record<string, unknown> | undefined) ?? {};
    const digest = buildDigest(role, perms);
    await getAuth().setCustomUserClaims(targetUid, {
      ...existing,
      ...digest,
      role,
    });
  } catch (err) {
    logger.warn("mirrorClaims: failed", { targetUid, err: String(err) });
  }
}

interface SetPermsRequest {
  targetUid: string;
  permissions: string[];
}

const FULL_ADMIN_PRESET: string[] = [
  "admin.access",
  "admin.dashboard.read",
  "admin.submissions.read",
  "admin.submissions.review",
  "admin.apps.read",
  "admin.apps.write",
  "admin.users.read",
  "admin.users.suspend",
  "admin.creators.review",
  "admin.creators.invite",
  "admin.creators.write",
  "admin.moderation.access",
  "admin.audit.read",
  "admin.cdn.manage",
  "console.access",
  "console.overview.read",
  "console.people.users.read",
  "console.people.users.replay",
  "console.people.rigs.read",
  "console.people.cohorts.read",
  "console.people.onboarding.read",
  "console.creators.studios.read",
  "console.creators.publishers.read",
  "console.money.read",
  "console.money.export",
  "console.health.performance.read",
  "console.health.apdex.read",
  "console.health.errors.read",
  "console.health.friction.read",
  "console.health.usage.read",
  "console.health.install.read",
  "console.health.launch.read",
  "console.health.voice.read",
  "console.health.cdn.read",
  "console.health.drm.read",
  "console.health.fraud.read",
  "console.health.auth.read",
  "console.health.moderation.read",
  "console.reports.read",
  "console.reports.alerts.write",
  "console.reports.experiments.write",
  "console.reports.funnels.write",
  "console.reports.queries.write",
  "console.reports.queries.run",
  "console.reports.dashboards.write",
  "console.reports.annotations.write",
];

export const setUserPermissions = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<SetPermsRequest>): Promise<{ ok: true }> => {
    // Admins with `admin.team.manage` (which the top admin has by default
    // via the "*" preset) may call. Requires fresh reauth (5min) since this
    // is a privilege-changing mutation.
    assertFreshAuth(request, 300);
    const actor = await loadActor(request);
    const isTopAdmin = actor.role === TOP_ROLE && actor.permissions.includes("*");
    const hasTeamMgmt = isTopAdmin || actor.permissions.includes("admin.team.manage");
    if (!hasTeamMgmt) {
      throw new HttpsError("permission-denied", "admin.team.manage required.");
    }

    const { targetUid, permissions } = request.data ?? ({} as SetPermsRequest);
    if (!targetUid) throw new HttpsError("invalid-argument", "targetUid required.");
    if (!Array.isArray(permissions)) {
      throw new HttpsError("invalid-argument", "permissions must be an array.");
    }
    if (targetUid === actor.uid && !isTopAdmin) {
      throw new HttpsError("permission-denied", "Self-mutation requires top-admin role.");
    }

    // Only the top admin can grant top-admin-default keys.
    if (!isTopAdmin) {
      const topAdminOnly = new Set([
        "admin.users.role_change",
        "admin.team.manage",
        "admin.config.write",
        "console.reports.deploys.write",
        "*",
      ]);
      const violation = permissions.find((p) => topAdminOnly.has(p));
      if (violation) {
        throw new HttpsError(
          "permission-denied",
          `Only the top admin can grant: ${violation}`,
        );
      }
    }

    const db = getFirestore();
    const userRef = db.collection(COLLECTIONS.users).doc(targetUid);
    let targetRole = "user";
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new HttpsError("not-found", "User not found.");
      const data = snap.data() ?? {};
      const before = {
        role: data.role ?? null,
        permissions: data.permissions ?? [],
      };
      const targetIsTopAdmin =
        data.role === TOP_ROLE && Array.isArray(data.permissions) && data.permissions.includes("*");
      if (targetIsTopAdmin && actor.uid !== targetUid) {
        throw new HttpsError("permission-denied", "Cannot mutate the top admin's permissions.");
      }
      targetRole = (data.role as string | undefined) ?? "user";
      tx.update(userRef, { permissions });
      writeAudit(tx, {
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: "owner.permissions_changed",
        targetType: "user",
        targetId: targetUid,
        beforeState: before,
        afterState: { role: targetRole, permissions },
      });
    });

    await mirrorClaims(targetUid, targetRole, permissions);
    logger.info("setUserPermissions", { actorUid: actor.uid, targetUid, count: permissions.length });
    return { ok: true };
  },
);

/**
 * One-shot owner-only migration. Reads every `users/*` doc with role === "admin"
 * (or with permissions containing "*") and replaces their permissions with the
 * full-admin preset. Pre-existing entries that already include any of the
 * preset keys are normalized to the full preset. Audit entry per user.
 */
export const migrateAdminsToPermissions = onCall(
  { region: "us-central1", memory: "512MiB", timeoutSeconds: 540 },
  async (request: CallableRequest<unknown>): Promise<{ migrated: number; skipped: number }> => {
    const { uid: actorUid, email } = requireAuth(request);
    // Top-admin only — uses the wildcard star as the gate so newly-invited
    // admins can't accidentally call it.
    const actor = await loadActor(request);
    if (actor.role !== TOP_ROLE || !actor.permissions.includes("*")) {
      throw new HttpsError("permission-denied", "Top admin required for migration.");
    }
    const db = getFirestore();
    const snap = await db.collection(COLLECTIONS.users).where("role", "==", "admin").get();
    let migrated = 0;
    let skipped = 0;
    for (const docSnap of snap.docs) {
      const data = docSnap.data() ?? {};
      const targetUid = docSnap.id;
      const current = Array.isArray(data.permissions) ? (data.permissions as string[]) : [];
      // Already migrated if their list matches the preset exactly OR contains "*"
      // but is more than just ["*"] (i.e. has been explicitly set).
      const alreadyMigrated =
        current.length === FULL_ADMIN_PRESET.length &&
        FULL_ADMIN_PRESET.every((k) => current.includes(k));
      if (alreadyMigrated) {
        skipped += 1;
        continue;
      }
      const userRef = db.collection(COLLECTIONS.users).doc(targetUid);
      await db.runTransaction(async (tx) => {
        const fresh = await tx.get(userRef);
        if (!fresh.exists) return;
        const before = { permissions: fresh.data()?.permissions ?? [] };
        tx.update(userRef, { permissions: FULL_ADMIN_PRESET });
        writeAudit(tx, {
          actorUid,
          actorEmail: email,
          action: "owner.permissions_changed",
          targetType: "user",
          targetId: targetUid,
          beforeState: before,
          afterState: { permissions: FULL_ADMIN_PRESET },
          metadata: { source: "migrateAdminsToPermissions" },
        });
      });
      await mirrorClaims(targetUid, "admin", FULL_ADMIN_PRESET);
      migrated += 1;
    }
    logger.info("migrateAdminsToPermissions complete", { migrated, skipped, actorUid });
    return { migrated, skipped };
  },
);

/**
 * One-shot role rename migration. Top-admin only. Walks every `users/*` doc
 * and rewrites legacy role strings:
 *   - "owner"     → "admin"
 *   - "publisher" → "creator-publisher"
 *   - "developer" stays as "developer" ONLY if explicit `keepDeveloperAsStaff`
 *     is true (your employees); otherwise treated as legacy external creator
 *     and rewritten to "creator-developer".
 * Custom claims are re-mirrored to match. Audit entry per user.
 */
export const renameLegacyRoles = onCall(
  { region: "us-central1", memory: "512MiB", timeoutSeconds: 540 },
  async (
    request: CallableRequest<{ keepDeveloperAsStaff?: boolean }>,
  ): Promise<{ migrated: number; skipped: number; renames: Record<string, string> }> => {
    const { uid: actorUid, email } = requireAuth(request);
    const actor = await loadActor(request);
    if (actor.role !== TOP_ROLE || !actor.permissions.includes("*")) {
      throw new HttpsError("permission-denied", "Top admin required.");
    }
    const keepDeveloperAsStaff = Boolean(request.data?.keepDeveloperAsStaff);

    const db = getFirestore();
    const snap = await db.collection(COLLECTIONS.users).get();
    let migrated = 0;
    let skipped = 0;
    const renames: Record<string, string> = {
      owner: "admin",
      publisher: "creator-publisher",
    };
    if (!keepDeveloperAsStaff) renames.developer = "creator-developer";

    for (const docSnap of snap.docs) {
      const data = docSnap.data() ?? {};
      const oldRole = (data.role as string | undefined) ?? "user";
      const newRole = renames[oldRole];
      if (!newRole || newRole === oldRole) {
        skipped += 1;
        continue;
      }
      const targetUid = docSnap.id;
      const userRef = db.collection(COLLECTIONS.users).doc(targetUid);
      await db.runTransaction(async (tx) => {
        const fresh = await tx.get(userRef);
        if (!fresh.exists) return;
        const before = { role: fresh.data()?.role ?? null };
        tx.update(userRef, { role: newRole });
        writeAudit(tx, {
          actorUid,
          actorEmail: email,
          action: "user.role_set",
          targetType: "user",
          targetId: targetUid,
          beforeState: before,
          afterState: { role: newRole },
          metadata: { source: "renameLegacyRoles" },
        });
      });
      // Mirror role into custom claim; keep existing permissions.
      const perms = Array.isArray(data.permissions) ? (data.permissions as string[]) : [];
      await mirrorClaims(targetUid, newRole, perms);
      migrated += 1;
    }
    logger.info("renameLegacyRoles complete", { migrated, skipped, actorUid });
    return { migrated, skipped, renames };
  },
);

/** Re-mirror a user's custom claims from their Firestore profile. */
export const refreshUserClaims = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<{ targetUid: string }>): Promise<{ ok: true }> => {
    await assertPermission(request, "admin.team.manage");
    const { targetUid } = request.data ?? ({} as { targetUid: string });
    if (!targetUid) throw new HttpsError("invalid-argument", "targetUid required.");
    const db = getFirestore();
    const snap = await db.collection(COLLECTIONS.users).doc(targetUid).get();
    if (!snap.exists) throw new HttpsError("not-found", "User not found.");
    const data = snap.data() ?? {};
    const role = (data.role as string | undefined) ?? "user";
    const perms = Array.isArray(data.permissions) ? (data.permissions as string[]) : [];
    await mirrorClaims(targetUid, role, perms);
    return { ok: true };
  },
);
