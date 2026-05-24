// Creator + admin onboarding pipeline.
//
// Three flows, all auditable, all server-issued:
//
// 1. submitCreatorApplication — any signed-in user applies to become a
//    developer/publisher. Lands in dw_creator_applications/{id}.
// 2. approveCreatorApplication / rejectCreatorApplication — gated on
//    `admin.creators.review`. On approve, creates the dw_developers/dw_publishers
//    entity, flips role, notifies applicant, audits.
// 3. inviteCreator — gated on `admin.creators.invite`. If the email already
//    has an account, instantly creates entity + flips role. If not, generates
//    a cryptographically-random invite token, stores its SHA-256 hash in
//    dw_creator_invites/{tokenHash} with brand details, emits an email event
//    via Firebase Auth sendSignInLinkToEmail (passwordless flow continues to
//    /claim-invite?token=PLAIN).
// 4. claimCreatorInvite — verifies token + email match, creates entity,
//    flips role, marks invite claimed, audits.
//
// Mirror pair: inviteAdmin / claimAdminInvite for internal team onboarding.

import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import * as crypto from "node:crypto";

import { COLLECTIONS, requireAuth, writeAudit, nowIso, stripUndefined } from "./shared.js";
import { assertPermission, loadActor } from "../lib/assert-permission.js";

type CreatorRole = "creator-developer" | "creator-publisher";
import { assertFreshAuth } from "../lib/recent-auth.js";

const INVITE_TTL_DAYS = 7;
const EMAIL_EVENTS = "dw_email_events";
const CREATOR_INVITES = "dw_creator_invites";
const ADMIN_INVITES = "dw_admin_invites";
const CREATOR_APPS = "dw_creator_applications";

// Mirror of `src/lib/permissions.ts` PRESET_BUNDLES — kept here so the server
// is the source of truth for what an invited admin actually receives.
const PRESETS: Record<string, string[]> = {
  "support-agent": [
    "admin.access", "admin.users.read", "admin.users.suspend", "admin.audit.read",
    "console.access", "console.overview.read", "console.health.errors.read", "console.health.friction.read",
  ],
  "submissions-reviewer": [
    "admin.access", "admin.submissions.read", "admin.submissions.review",
    "admin.creators.review", "admin.audit.read",
  ],
  "data-analyst": [
    "console.access", "console.overview.read",
    "console.people.users.read", "console.people.rigs.read", "console.people.cohorts.read", "console.people.onboarding.read",
    "console.creators.studios.read", "console.creators.publishers.read",
    "console.health.performance.read", "console.health.apdex.read", "console.health.errors.read",
    "console.health.friction.read", "console.health.usage.read",
    "console.reports.read", "console.reports.queries.run",
  ],
  "trust-safety": [
    "admin.access", "admin.moderation.access",
    "console.access", "console.health.fraud.read", "console.health.auth.read", "console.health.moderation.read",
  ],
  "full-admin": [
    "admin.access", "admin.dashboard.read", "admin.submissions.read", "admin.submissions.review",
    "admin.apps.read", "admin.apps.write", "admin.users.read", "admin.users.suspend",
    "admin.creators.review", "admin.creators.invite", "admin.creators.write",
    "admin.moderation.access", "admin.audit.read", "admin.cdn.manage",
    "console.access", "console.overview.read",
    "console.people.users.read", "console.people.users.replay", "console.people.rigs.read",
    "console.people.cohorts.read", "console.people.onboarding.read",
    "console.creators.studios.read", "console.creators.publishers.read",
    "console.money.read", "console.money.export",
    "console.health.performance.read", "console.health.apdex.read", "console.health.errors.read",
    "console.health.friction.read", "console.health.usage.read",
    "console.health.install.read", "console.health.launch.read", "console.health.voice.read",
    "console.health.cdn.read", "console.health.drm.read", "console.health.fraud.read",
    "console.health.auth.read", "console.health.moderation.read",
    "console.reports.read", "console.reports.alerts.write", "console.reports.experiments.write",
    "console.reports.funnels.write", "console.reports.queries.write", "console.reports.queries.run",
    "console.reports.dashboards.write", "console.reports.annotations.write",
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function genTokenPair(): { plain: string; hash: string } {
  const plain = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(plain).digest("hex");
  return { plain, hash };
}

function hashToken(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

interface BrandInput {
  name: string;
  brandColor: string;
  logoUrl: string;
  bannerUrl?: string;
  tagline: string;
  about?: string;
  websiteUrl?: string;
  socialLinks?: Record<string, string>;
}

function validateBrand(b: BrandInput): void {
  if (!b?.name || b.name.length < 2) throw new HttpsError("invalid-argument", "name required.");
  if (!b.brandColor) throw new HttpsError("invalid-argument", "brandColor required.");
  if (!b.logoUrl) throw new HttpsError("invalid-argument", "logoUrl required.");
  if (!b.tagline) throw new HttpsError("invalid-argument", "tagline required.");
}

async function createCreatorEntity(args: {
  kind: CreatorRole;
  ownerUserId: string;
  brand: BrandInput;
}): Promise<{ id: string }> {
  const collection =
    args.kind === "creator-developer" ? COLLECTIONS.developers : COLLECTIONS.publishers;
  const baseId = slugify(args.brand.name);
  if (!baseId) throw new HttpsError("invalid-argument", "Brand name produces empty slug.");
  const db = getFirestore();
  // Suffix with -N until a free slug appears.
  let id = baseId;
  let n = 1;
  while ((await db.collection(collection).doc(id).get()).exists) {
    id = `${baseId}-${++n}`;
    if (n > 50) throw new HttpsError("internal", "Could not allocate slug.");
  }
  const doc = stripUndefined({
    id,
    name: args.brand.name,
    ownerUserId: args.ownerUserId,
    brandColor: args.brand.brandColor,
    logoUrl: args.brand.logoUrl,
    bannerUrl: args.brand.bannerUrl,
    tagline: args.brand.tagline,
    about: args.brand.about,
    websiteUrl: args.brand.websiteUrl,
    socialLinks: args.brand.socialLinks,
    appIds: [],
    verificationStatus: "approved",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  await db.collection(collection).doc(id).set(doc);
  return { id };
}

async function setRoleAndMirrorClaims(
  targetUid: string,
  role: CreatorRole | "admin",
  permissions?: string[],
): Promise<void> {
  const db = getFirestore();
  await db.collection(COLLECTIONS.users).doc(targetUid).set(
    stripUndefined({ role, permissions: permissions ?? FieldValue.delete() }),
    { merge: true },
  );
  try {
    const userRecord = await getAuth().getUser(targetUid);
    const existing = (userRecord.customClaims as Record<string, unknown> | undefined) ?? {};
    await getAuth().setCustomUserClaims(targetUid, {
      ...existing,
      admin: role === "admin",
      role,
    });
  } catch (err) {
    logger.warn("setRoleAndMirrorClaims: claim update failed", { targetUid, err: String(err) });
  }
}

async function writeNotification(args: {
  uid: string;
  title: string;
  body?: string;
  href?: string;
  kind: string;
}): Promise<void> {
  await getFirestore().collection("dw_notifications").add(stripUndefined({
    userId: args.uid,
    kind: args.kind,
    title: args.title,
    body: args.body,
    href: args.href,
    createdAt: nowIso(),
    read: false,
  }));
}

async function enqueueInviteEmail(args: {
  to: string;
  subject: string;
  body: string;
  link: string;
  kind: "creator_invite" | "admin_invite";
}): Promise<void> {
  await getFirestore().collection(EMAIL_EVENTS).add({
    template: args.kind,
    kind: "queued",
    to: args.to,
    subject: args.subject,
    body: args.body,
    link: args.link,
    ts: nowIso(),
  });
}

async function generateMagicLink(email: string, claimToken: string): Promise<string> {
  // Build a sign-in-with-link URL that, after auth, redirects to the claim
  // page with the plain token in the query string. The continueUrl host must
  // be authorized in Firebase Auth → "Authorized domains".
  const continueUrl = `https://dreamworks.app/claim-invite?token=${encodeURIComponent(claimToken)}`;
  try {
    const link = await getAuth().generateSignInWithEmailLink(email, {
      url: continueUrl,
      handleCodeInApp: true,
    });
    return link;
  } catch (err) {
    logger.warn("generateMagicLink failed; falling back to direct claim URL", { err: String(err) });
    // Fallback: just return the direct claim URL. Recipient signs in manually.
    return continueUrl;
  }
}

// ── 1) Submit application ───────────────────────────────────────────────────

interface SubmitAppRequest {
  kind: CreatorRole;
  brand: BrandInput;
  pitch: string;
  links?: string[];
}

export const submitCreatorApplication = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<SubmitAppRequest>): Promise<{ id: string }> => {
    const { uid, email } = requireAuth(request);
    const { kind, brand, pitch, links } = request.data ?? ({} as SubmitAppRequest);
    if (kind !== "creator-developer" && kind !== "creator-publisher") {
      throw new HttpsError("invalid-argument", "kind must be creator-developer or creator-publisher.");
    }
    validateBrand(brand);
    if (!pitch || pitch.length < 20) {
      throw new HttpsError("invalid-argument", "pitch must be at least 20 characters.");
    }

    const db = getFirestore();
    const ref = db.collection(CREATOR_APPS).doc();
    await db.runTransaction(async (tx) => {
      tx.set(ref, stripUndefined({
        id: ref.id,
        kind,
        submitterUserId: uid,
        submitterEmail: email,
        brand,
        pitch,
        links: links ?? [],
        status: "pending",
        submittedAt: nowIso(),
      }));
      writeAudit(tx, {
        actorUid: uid,
        actorEmail: email,
        action: "creator.application_submitted",
        targetType: "creatorApplication",
        targetId: ref.id,
        metadata: { kind, brandName: brand.name },
      });
    });
    return { id: ref.id };
  },
);

// ── 2) Approve / reject application ────────────────────────────────────────

interface ApproveAppRequest {
  applicationId: string;
  /** Optional final overrides to the brand details before entity creation. */
  brandOverrides?: Partial<BrandInput>;
}

export const approveCreatorApplication = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<ApproveAppRequest>): Promise<{ entityId: string }> => {
    const actor = await assertPermission(request, "admin.creators.review");
    const { applicationId, brandOverrides } = request.data ?? ({} as ApproveAppRequest);
    if (!applicationId) throw new HttpsError("invalid-argument", "applicationId required.");

    const db = getFirestore();
    const appRef = db.collection(CREATOR_APPS).doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists) throw new HttpsError("not-found", "Application not found.");
    const appData = appSnap.data() as { kind: CreatorRole; brand: BrandInput; submitterUserId: string; status: string };
    if (appData.status !== "pending" && appData.status !== "in_review") {
      throw new HttpsError("failed-precondition", `Application is already ${appData.status}.`);
    }
    const finalBrand: BrandInput = { ...appData.brand, ...brandOverrides };
    validateBrand(finalBrand);
    const { id: entityId } = await createCreatorEntity({
      kind: appData.kind,
      ownerUserId: appData.submitterUserId,
      brand: finalBrand,
    });
    await setRoleAndMirrorClaims(appData.submitterUserId, appData.kind);

    await db.runTransaction(async (tx) => {
      tx.update(appRef, {
        status: "approved",
        decidedAt: nowIso(),
        decidedByUid: actor.uid,
      });
      writeAudit(tx, {
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: "creator.application_approved",
        targetType: "creatorApplication",
        targetId: applicationId,
        afterState: { entityId, role: appData.kind },
      });
    });
    await writeNotification({
      uid: appData.submitterUserId,
      kind: "system",
      title: `You're approved as a ${appData.kind}!`,
      body: `Welcome to Dreamworks — head to the Developer Portal to start managing your apps.`,
      href: "/developer-portal/apps",
    });
    return { entityId };
  },
);

interface RejectAppRequest {
  applicationId: string;
  reason: string;
}

export const rejectCreatorApplication = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<RejectAppRequest>): Promise<{ ok: true }> => {
    const actor = await assertPermission(request, "admin.creators.review");
    const { applicationId, reason } = request.data ?? ({} as RejectAppRequest);
    if (!applicationId) throw new HttpsError("invalid-argument", "applicationId required.");
    if (!reason || reason.length < 5) throw new HttpsError("invalid-argument", "reason required.");

    const db = getFirestore();
    const appRef = db.collection(CREATOR_APPS).doc(applicationId);
    let submitterUid = "";
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(appRef);
      if (!snap.exists) throw new HttpsError("not-found", "Application not found.");
      const data = snap.data() as { status: string; submitterUserId: string };
      if (data.status !== "pending" && data.status !== "in_review") {
        throw new HttpsError("failed-precondition", `Already ${data.status}.`);
      }
      submitterUid = data.submitterUserId;
      tx.update(appRef, {
        status: "rejected",
        decidedAt: nowIso(),
        decidedByUid: actor.uid,
        decisionNote: reason,
      });
      writeAudit(tx, {
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: "creator.application_rejected",
        targetType: "creatorApplication",
        targetId: applicationId,
        metadata: { reason },
      });
    });
    if (submitterUid) {
      await writeNotification({
        uid: submitterUid,
        kind: "system",
        title: "Application update",
        body: `Your creator application wasn't approved this time. Reason: ${reason}`,
      });
    }
    return { ok: true };
  },
);

// ── 3) Invite creator (direct or magic link) ───────────────────────────────

interface InviteCreatorRequest {
  email: string;
  kind: CreatorRole;
  brand: BrandInput;
}

export const inviteCreator = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (
    request: CallableRequest<InviteCreatorRequest>,
  ): Promise<
    | { mode: "direct"; entityId: string; recipientUid: string }
    | { mode: "invite"; tokenHash: string; magicLink: string; expiresAt: string }
  > => {
    const actor = await assertPermission(request, "admin.creators.invite");
    const { email, kind, brand } = request.data ?? ({} as InviteCreatorRequest);
    if (!email || !email.includes("@")) throw new HttpsError("invalid-argument", "Valid email required.");
    if (kind !== "creator-developer" && kind !== "creator-publisher") {
      throw new HttpsError("invalid-argument", "kind must be creator-developer or creator-publisher.");
    }
    validateBrand(brand);
    const lcEmail = email.toLowerCase().trim();

    // Look up the user — if exists, direct grant; else invite token.
    let existingUid: string | null = null;
    try {
      const user = await getAuth().getUserByEmail(lcEmail);
      existingUid = user.uid;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "auth/user-not-found") {
        logger.error("inviteCreator: lookup failed", { lcEmail, err: String(err) });
        throw new HttpsError("internal", "Lookup failed.");
      }
    }

    if (existingUid) {
      const { id: entityId } = await createCreatorEntity({
        kind,
        ownerUserId: existingUid,
        brand,
      });
      await setRoleAndMirrorClaims(existingUid, kind);
      await getFirestore().collection(COLLECTIONS.adminAudit).add({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: "creator.invited_direct",
        targetType: "creatorInvite",
        targetId: existingUid,
        ts: FieldValue.serverTimestamp(),
        metadata: { kind, brandName: brand.name, entityId },
      });
      await writeNotification({
        uid: existingUid,
        kind: "system",
        title: `You've been invited as a ${kind}`,
        body: `${actor.email} added you as the ${kind} owner of "${brand.name}". Open the Developer Portal to start.`,
        href: "/developer-portal/apps",
      });
      return { mode: "direct", entityId, recipientUid: existingUid };
    }

    // No account — issue magic-link invite.
    const { plain, hash } = genTokenPair();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await getFirestore().collection(CREATOR_INVITES).doc(hash).set(stripUndefined({
      id: hash,
      kind,
      email: lcEmail,
      brand,
      createdByUid: actor.uid,
      createdAt: nowIso(),
      expiresAt,
      status: "pending",
    }));
    const magicLink = await generateMagicLink(lcEmail, plain);
    await enqueueInviteEmail({
      to: lcEmail,
      kind: "creator_invite",
      subject: `You're invited to sell ${kind === "creator-developer" ? "as a studio" : "as a publisher"} on Dreamworks`,
      body: `Open this link to claim your invitation: ${magicLink}`,
      link: magicLink,
    });
    await getFirestore().collection(COLLECTIONS.adminAudit).add({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: "creator.invite_sent",
      targetType: "creatorInvite",
      targetId: hash,
      ts: FieldValue.serverTimestamp(),
      metadata: { kind, email: lcEmail, expiresAt },
    });
    return { mode: "invite", tokenHash: hash, magicLink, expiresAt };
  },
);

// ── 4) Claim creator invite ────────────────────────────────────────────────

interface ClaimCreatorRequest {
  token: string;
}

export const claimCreatorInvite = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<ClaimCreatorRequest>): Promise<{ entityId: string; kind: CreatorRole }> => {
    const { uid, email } = requireAuth(request);
    const token = (request.data?.token ?? "").trim();
    if (!token) throw new HttpsError("invalid-argument", "token required.");
    const hash = hashToken(token);
    const db = getFirestore();
    const ref = db.collection(CREATOR_INVITES).doc(hash);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Invite not found.");
    const data = snap.data() as { email: string; kind: CreatorRole; brand: BrandInput; status: string; expiresAt: string };
    if (data.status !== "pending") {
      throw new HttpsError("failed-precondition", `Invite is ${data.status}.`);
    }
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      await ref.update({ status: "expired" });
      await db.collection(COLLECTIONS.adminAudit).add({
        actorUid: "system",
        actorEmail: "",
        action: "creator.invite_expired",
        targetType: "creatorInvite",
        targetId: hash,
        ts: FieldValue.serverTimestamp(),
      });
      throw new HttpsError("failed-precondition", "Invite expired.");
    }
    if (data.email.toLowerCase() !== (email || "").toLowerCase()) {
      throw new HttpsError("permission-denied", "Invite was issued to a different email.");
    }

    const { id: entityId } = await createCreatorEntity({
      kind: data.kind,
      ownerUserId: uid,
      brand: data.brand,
    });
    await setRoleAndMirrorClaims(uid, data.kind);
    await ref.update({ status: "claimed", claimedByUid: uid, claimedAt: nowIso() });
    await db.collection(COLLECTIONS.adminAudit).add({
      actorUid: uid,
      actorEmail: email,
      action: "creator.invite_claimed",
      targetType: "creatorInvite",
      targetId: hash,
      ts: FieldValue.serverTimestamp(),
      metadata: { kind: data.kind, entityId },
    });
    return { entityId, kind: data.kind };
  },
);

// ── 5) Invite admin teammate (owner-only) ──────────────────────────────────

interface InviteAdminRequest {
  email: string;
  preset: string;
  /** Extra permission keys on top of the preset. */
  extraPermissions?: string[];
}

export const inviteAdmin = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (
    request: CallableRequest<InviteAdminRequest>,
  ): Promise<
    | { mode: "direct"; recipientUid: string }
    | { mode: "invite"; tokenHash: string; magicLink: string; expiresAt: string }
  > => {
    // Inviting an admin teammate is sensitive: requires fresh reauth + the
    // explicit admin.team.manage permission (top admin has it by default
    // via the "*" preset).
    assertFreshAuth(request, 300);
    const actor = await assertPermission(request, "admin.team.manage");
    const { email, preset, extraPermissions } = request.data ?? ({} as InviteAdminRequest);
    if (!email || !email.includes("@")) throw new HttpsError("invalid-argument", "Valid email required.");
    if (!PRESETS[preset]) throw new HttpsError("invalid-argument", `Unknown preset: ${preset}`);
    const lcEmail = email.toLowerCase().trim();
    const finalPerms = Array.from(new Set([...PRESETS[preset], ...(extraPermissions ?? [])]));

    let existingUid: string | null = null;
    try {
      existingUid = (await getAuth().getUserByEmail(lcEmail)).uid;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "auth/user-not-found") throw new HttpsError("internal", "Lookup failed.");
    }

    if (existingUid) {
      await setRoleAndMirrorClaims(existingUid, "admin", finalPerms);
      await getFirestore().collection(COLLECTIONS.adminAudit).add({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: "owner.granted_admin",
        targetType: "user",
        targetId: existingUid,
        ts: FieldValue.serverTimestamp(),
        metadata: { preset, extraPermissions, finalPerms },
      });
      await writeNotification({
        uid: existingUid,
        kind: "system",
        title: "You've been added as an admin",
        body: `${actor.email} added you to the Dreamworks team with the ${preset} preset.`,
        href: "/admin",
      });
      return { mode: "direct", recipientUid: existingUid };
    }

    const { plain, hash } = genTokenPair();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await getFirestore().collection(ADMIN_INVITES).doc(hash).set({
      id: hash,
      email: lcEmail,
      preset,
      extraPermissions: extraPermissions ?? [],
      createdByUid: actor.uid,
      createdAt: nowIso(),
      expiresAt,
      status: "pending",
    });
    const magicLink = await generateMagicLink(lcEmail, plain);
    await enqueueInviteEmail({
      to: lcEmail,
      kind: "admin_invite",
      subject: "You're invited to the Dreamworks admin team",
      body: `Open this link to accept your admin invitation: ${magicLink}`,
      link: magicLink,
    });
    await getFirestore().collection(COLLECTIONS.adminAudit).add({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: "owner.invited_admin",
      targetType: "adminInvite",
      targetId: hash,
      ts: FieldValue.serverTimestamp(),
      metadata: { email: lcEmail, preset, expiresAt },
    });
    return { mode: "invite", tokenHash: hash, magicLink, expiresAt };
  },
);

interface ClaimAdminRequest {
  token: string;
}

export const claimAdminInvite = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<ClaimAdminRequest>): Promise<{ ok: true; preset: string }> => {
    const { uid, email } = requireAuth(request);
    const token = (request.data?.token ?? "").trim();
    if (!token) throw new HttpsError("invalid-argument", "token required.");
    const hash = hashToken(token);
    const db = getFirestore();
    const ref = db.collection(ADMIN_INVITES).doc(hash);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Invite not found.");
    const data = snap.data() as { email: string; preset: string; extraPermissions?: string[]; status: string; expiresAt: string };
    if (data.status !== "pending") {
      throw new HttpsError("failed-precondition", `Invite is ${data.status}.`);
    }
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      await ref.update({ status: "expired" });
      throw new HttpsError("failed-precondition", "Invite expired.");
    }
    if (data.email.toLowerCase() !== (email || "").toLowerCase()) {
      throw new HttpsError("permission-denied", "Invite was issued to a different email.");
    }
    const perms = Array.from(new Set([...(PRESETS[data.preset] ?? []), ...(data.extraPermissions ?? [])]));
    await setRoleAndMirrorClaims(uid, "admin", perms);
    await ref.update({ status: "claimed", claimedByUid: uid, claimedAt: nowIso() });
    await db.collection(COLLECTIONS.adminAudit).add({
      actorUid: uid,
      actorEmail: email,
      action: "creator.invite_claimed", // closest existing action; admin-invite-claimed surfaced via adminInvite target type
      targetType: "adminInvite",
      targetId: hash,
      ts: FieldValue.serverTimestamp(),
      metadata: { preset: data.preset, finalPermsCount: perms.length },
    });
    return { ok: true, preset: data.preset };
  },
);

// Tiny dummy export to suppress the unused-import warning on `loadActor` —
// used by other functions but we import it for future helpers here.
export const _internal = { loadActor };
