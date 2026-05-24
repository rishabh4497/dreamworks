// Single source of truth for the fine-grained permission system.
//
// Conventions:
// - Keys are dotted strings: `<scope>.<area>.<action>` (e.g. `admin.users.read`).
// - `*` (lone) = full access. `admin.*` = all admin keys. `console.*` = all console keys.
// - The "owner" role implicitly has `*` regardless of the array.
// - Server-side matching mirrors `hasPermission` in `functions/src/lib/assert-permission.ts`.
//
// IMPORTANT: when adding a key here, also add it server-side and decide if it
// needs to be reflected in the custom-claim digest for Firestore-rule gating
// (see `firestore.rules` `hasClaim()`).

import type { UserRole } from "./types";

// ── Admin Panel keys ────────────────────────────────────────────────────────

export const ADMIN_PERMISSIONS = [
  "admin.access",
  "admin.dashboard.read",
  "admin.submissions.read",
  "admin.submissions.review",
  "admin.apps.read",
  "admin.apps.write",
  "admin.users.read",
  "admin.users.role_change",
  "admin.users.suspend",
  "admin.creators.review",
  "admin.creators.invite",
  "admin.creators.write",
  "admin.moderation.access",
  "admin.audit.read",
  "admin.cdn.manage",
  "admin.team.manage",
  "admin.config.write",
] as const;

// ── Console keys ────────────────────────────────────────────────────────────

export const CONSOLE_PERMISSIONS = [
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
  "console.reports.deploys.write",
  "console.reports.annotations.write",
] as const;

export const ALL_PERMISSIONS = [...ADMIN_PERMISSIONS, ...CONSOLE_PERMISSIONS] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSIONS)[number];
export type ConsolePermissionKey = (typeof CONSOLE_PERMISSIONS)[number];
export type PermissionKey = AdminPermissionKey | ConsolePermissionKey;

// ── Sensitivity tags (UI hints) ─────────────────────────────────────────────
//
// Keys flagged as "owner_default" can only be granted by the owner.
// Keys flagged as "sensitive" deserve a confirmation modal in the team UI.

export const OWNER_ONLY_DEFAULTS: ReadonlySet<PermissionKey> = new Set<PermissionKey>([
  "admin.users.role_change",
  "admin.team.manage",
  "admin.config.write",
  "console.reports.deploys.write",
]);

export const SENSITIVE_PERMISSIONS: ReadonlySet<PermissionKey> = new Set<PermissionKey>([
  "admin.users.role_change",
  "admin.users.suspend",
  "admin.team.manage",
  "admin.config.write",
  "admin.cdn.manage",
  "console.money.read",
  "console.money.export",
  "console.people.users.replay",
  "console.health.fraud.read",
  "console.health.auth.read",
]);

// ── Permission grouping (UI section headers in Team page) ──────────────────

export interface PermissionGroup {
  label: string;
  keys: PermissionKey[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Admin Panel — access",
    keys: ["admin.access", "admin.dashboard.read", "admin.audit.read"],
  },
  {
    label: "Admin Panel — submissions",
    keys: ["admin.submissions.read", "admin.submissions.review"],
  },
  {
    label: "Admin Panel — apps",
    keys: ["admin.apps.read", "admin.apps.write"],
  },
  {
    label: "Admin Panel — users",
    keys: ["admin.users.read", "admin.users.role_change", "admin.users.suspend"],
  },
  {
    label: "Admin Panel — creators",
    keys: ["admin.creators.review", "admin.creators.invite", "admin.creators.write"],
  },
  {
    label: "Admin Panel — trust & safety",
    keys: ["admin.moderation.access"],
  },
  {
    label: "Admin Panel — infrastructure",
    keys: ["admin.cdn.manage", "admin.config.write"],
  },
  {
    label: "Admin Panel — team",
    keys: ["admin.team.manage"],
  },
  {
    label: "Console — access",
    keys: ["console.access", "console.overview.read"],
  },
  {
    label: "Console — people",
    keys: [
      "console.people.users.read",
      "console.people.users.replay",
      "console.people.rigs.read",
      "console.people.cohorts.read",
      "console.people.onboarding.read",
    ],
  },
  {
    label: "Console — creators",
    keys: ["console.creators.studios.read", "console.creators.publishers.read"],
  },
  {
    label: "Console — money",
    keys: ["console.money.read", "console.money.export"],
  },
  {
    label: "Console — health",
    keys: [
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
    ],
  },
  {
    label: "Console — reports",
    keys: [
      "console.reports.read",
      "console.reports.alerts.write",
      "console.reports.experiments.write",
      "console.reports.funnels.write",
      "console.reports.queries.write",
      "console.reports.queries.run",
      "console.reports.dashboards.write",
      "console.reports.deploys.write",
      "console.reports.annotations.write",
    ],
  },
];

// ── Preset bundles ──────────────────────────────────────────────────────────
//
// Used as one-click defaults in the Team & Access page. `full-admin` is the
// migration target for existing admins — everything except owner-only keys.

const adminMinusOwnerOnly = ADMIN_PERMISSIONS.filter((k) => !OWNER_ONLY_DEFAULTS.has(k));
const consoleMinusOwnerOnly = CONSOLE_PERMISSIONS.filter((k) => !OWNER_ONLY_DEFAULTS.has(k));

export const PRESET_BUNDLES: Record<
  string,
  { label: string; description: string; keys: PermissionKey[] }
> = {
  "support-agent": {
    label: "Support agent",
    description: "Reads users and audit log; can suspend; sees Console overview and errors.",
    keys: [
      "admin.access",
      "admin.users.read",
      "admin.users.suspend",
      "admin.audit.read",
      "console.access",
      "console.overview.read",
      "console.health.errors.read",
      "console.health.friction.read",
    ],
  },
  "submissions-reviewer": {
    label: "Submissions reviewer",
    description: "Reviews app and creator submissions.",
    keys: [
      "admin.access",
      "admin.submissions.read",
      "admin.submissions.review",
      "admin.creators.review",
      "admin.audit.read",
    ],
  },
  "data-analyst": {
    label: "Data analyst",
    description: "Read-only Console access across people, creators, and health. Can run ad-hoc queries.",
    keys: [
      "console.access",
      "console.overview.read",
      "console.people.users.read",
      "console.people.rigs.read",
      "console.people.cohorts.read",
      "console.people.onboarding.read",
      "console.creators.studios.read",
      "console.creators.publishers.read",
      "console.health.performance.read",
      "console.health.apdex.read",
      "console.health.errors.read",
      "console.health.friction.read",
      "console.health.usage.read",
      "console.reports.read",
      "console.reports.queries.run",
    ],
  },
  "trust-safety": {
    label: "Trust & safety",
    description: "Moderation queue plus fraud / auth / moderation health tabs.",
    keys: [
      "admin.access",
      "admin.moderation.access",
      "console.access",
      "console.health.fraud.read",
      "console.health.auth.read",
      "console.health.moderation.read",
    ],
  },
  "full-admin": {
    label: "Full admin (just below owner)",
    description: "Everything except owner-only keys (cannot change roles or manage team).",
    keys: [...adminMinusOwnerOnly, ...consoleMinusOwnerOnly],
  },
};

// ── Permission matching ─────────────────────────────────────────────────────

interface ProfileLike {
  role?: UserRole | string;
  permissions?: string[];
}

/** True if the profile holds the given key — direct, wildcard prefix, or `*`. */
export function hasPermission(
  profile: ProfileLike | null | undefined,
  key: PermissionKey,
): boolean {
  if (!profile) return false;
  if (profile.role === "owner") return true;
  const perms = profile.permissions ?? [];
  if (perms.includes("*")) return true;
  if (perms.includes(key)) return true;
  const segments = key.split(".");
  for (let i = segments.length - 1; i >= 1; i--) {
    const prefix = `${segments.slice(0, i).join(".")}.*`;
    if (perms.includes(prefix)) return true;
  }
  return false;
}

/** True iff any one of the keys passes. */
export function hasAnyPermission(
  profile: ProfileLike | null | undefined,
  keys: PermissionKey[],
): boolean {
  return keys.some((k) => hasPermission(profile, k));
}

/** Resolve a preset bundle id → its key list (or [] if unknown). */
export function presetKeys(presetId: string): PermissionKey[] {
  return PRESET_BUNDLES[presetId]?.keys ?? [];
}

// ── Custom-claim digest ─────────────────────────────────────────────────────
//
// Firestore rules can only inspect custom claims (not Firestore docs). We
// mirror a TINY subset of access flags into claims so rules stay cheap. The
// full permission list lives in `dw_users/{uid}.permissions` and is read by
// client code via `useAuthStore`.

export interface ClaimDigest {
  owner?: boolean;
  admin?: boolean;
  "admin.access"?: boolean;
  "console.access"?: boolean;
  "admin.creators.review"?: boolean;
  "admin.creators.write"?: boolean;
  "admin.creators.invite"?: boolean;
  "admin.users.read"?: boolean;
  "admin.users.role_change"?: boolean;
  "admin.users.suspend"?: boolean;
  "admin.team.manage"?: boolean;
  "admin.apps.write"?: boolean;
  "admin.config.write"?: boolean;
  "admin.cdn.manage"?: boolean;
  "admin.moderation.access"?: boolean;
}

/** Build the claim digest from a full permission list + role. */
export function buildClaimDigest(role: UserRole | string, permissions: string[]): ClaimDigest {
  const profile = { role, permissions };
  const isOwner = role === "owner";
  const digest: ClaimDigest = {
    owner: isOwner,
    admin: isOwner || role === "admin",
  };
  const claimKeys: Array<keyof ClaimDigest> = [
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
  ];
  for (const k of claimKeys) {
    if (k === "owner" || k === "admin") continue;
    if (hasPermission(profile, k as PermissionKey)) digest[k] = true;
  }
  return digest;
}
