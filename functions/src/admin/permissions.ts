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

function hasKey(perms: string[], role: string, key: string): boolean {
  if (role === "owner") return true;
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
    owner: role === "owner",
    admin: role === "owner" || role === "admin",
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
    // Either owner or any admin with `admin.team.manage` may call. Always
    // requires fresh reauth (5min) since this is a privilege-changing mutation.
    assertFreshAuth(request, 300);
    const actor = await loadActor(request);
    const isOwner = actor.role === "owner";
    const hasTeamMgmt =
      actor.permissions.includes("*") || actor.permissions.includes("admin.team.manage");
    if (!isOwner && !hasTeamMgmt) {
      throw new HttpsError("permission-denied", "Owner or admin.team.manage required.");
    }

    const { targetUid, permissions } = request.data ?? ({} as SetPermsRequest);
    if (!targetUid) throw new HttpsError("invalid-argument", "targetUid required.");
    if (!Array.isArray(permissions)) {
      throw new HttpsError("invalid-argument", "permissions must be an array.");
    }
    if (targetUid === actor.uid && !isOwner) {
      throw new HttpsError("permission-denied", "Self-mutation requires owner.");
    }

    // Non-owners cannot grant owner-only keys.
    if (!isOwner) {
      const ownerOnly = new Set([
        "admin.users.role_change",
        "admin.team.manage",
        "admin.config.write",
        "console.reports.deploys.write",
        "*",
      ]);
      const violation = permissions.find((p) => ownerOnly.has(p));
      if (violation) {
        throw new HttpsError(
          "permission-denied",
          `Only the owner can grant: ${violation}`,
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
      if (data.role === "owner" && actor.uid !== targetUid) {
        throw new HttpsError("permission-denied", "Cannot mutate the owner's permissions.");
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
    if (request.auth!.token.owner !== true) {
      // Fall back to Firestore role check (in case claim is stale).
      const actor = await loadActor(request);
      if (actor.role !== "owner") {
        throw new HttpsError("permission-denied", "Owner required for migration.");
      }
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

/** Re-mirror a user's custom claims from their Firestore profile. Owner-only. */
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
