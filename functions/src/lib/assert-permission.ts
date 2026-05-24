// Server-side permission matcher. Mirrors `src/lib/permissions.ts` `hasPermission`
// semantics. Reads the full permission list from Firestore (single doc, cached
// by Firestore SDK at the function invocation level) — slower than a custom-claim
// check, but the source of truth for fine-grained gating.
//
// Custom-claim digest is for Firestore-rule fast paths only; never trust it
// solely for sensitive Cloud Function gates.

import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

const USERS = "users"; // matches client COLLECTIONS.users (legacy collection name)

interface AuthedActor {
  uid: string;
  email: string;
  role: string;
  permissions: string[];
}

export function requireAuth(req: CallableRequest<unknown>): { uid: string; email: string } {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  return { uid, email: (req.auth!.token.email as string | undefined) ?? "" };
}

export async function loadActor(req: CallableRequest<unknown>): Promise<AuthedActor> {
  const { uid, email } = requireAuth(req);
  const snap = await getFirestore().collection(USERS).doc(uid).get();
  const data = snap.exists ? (snap.data() ?? {}) : {};
  return {
    uid,
    email,
    role: (data.role as string | undefined) ?? "user",
    permissions: Array.isArray(data.permissions) ? (data.permissions as string[]) : [],
  };
}

/** True if the actor holds `key` directly, via wildcard prefix, or via `*`. */
export function hasPermission(actor: { role: string; permissions: string[] }, key: string): boolean {
  if (actor.permissions.includes("*")) return true;
  if (actor.permissions.includes(key)) return true;
  const segments = key.split(".");
  for (let i = segments.length - 1; i >= 1; i--) {
    const prefix = `${segments.slice(0, i).join(".")}.*`;
    if (actor.permissions.includes(prefix)) return true;
  }
  return false;
}

/**
 * Assert the caller has the given permission key, or throw `permission-denied`.
 * Always loads the actor's profile from Firestore — do not use for hot paths.
 */
export async function assertPermission(
  req: CallableRequest<unknown>,
  key: string,
): Promise<AuthedActor> {
  const actor = await loadActor(req);
  if (!hasPermission(actor, key)) {
    throw new HttpsError("permission-denied", `Missing permission: ${key}`);
  }
  return actor;
}

/**
 * Assert caller is an admin (top role). For most callsites prefer
 * `assertPermission(req, "admin.team.manage")` or a more specific key.
 */
export async function assertAdminRole(req: CallableRequest<unknown>): Promise<AuthedActor> {
  const actor = await loadActor(req);
  if (actor.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin role required.");
  }
  return actor;
}
