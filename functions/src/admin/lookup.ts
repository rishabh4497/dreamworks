// Server-side user lookup. Firebase Admin SDK can resolve email→uid; clients
// cannot (no Firestore index on email). Returns a safe slice — no PII beyond
// what an admin already has access to.

import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { logger } from "firebase-functions";

import { assertPermission } from "../lib/assert-permission.js";

interface LookupRequest {
  email: string;
}

interface LookupResult {
  uid: string | null;
  email: string;
  displayName?: string;
  emailVerified?: boolean;
  hasMfa?: boolean;
  lastSignInAt?: string | null;
  createdAt?: string | null;
}

export const lookupUserByEmail = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<LookupRequest>): Promise<LookupResult> => {
    await assertPermission(request, "admin.users.read");
    const email = (request.data?.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "Valid email required.");
    }
    try {
      const user = await getAuth().getUserByEmail(email);
      const hasMfa = Array.isArray(user.multiFactor?.enrolledFactors)
        && user.multiFactor!.enrolledFactors.length > 0;
      return {
        uid: user.uid,
        email,
        displayName: user.displayName ?? undefined,
        emailVerified: user.emailVerified,
        hasMfa,
        lastSignInAt: user.metadata.lastSignInTime ?? null,
        createdAt: user.metadata.creationTime ?? null,
      };
    } catch (err: unknown) {
      // user-not-found is a normal outcome — return uid=null so the caller can
      // proceed to invite-by-email flow.
      const code = (err as { code?: string })?.code;
      if (code === "auth/user-not-found") {
        return { uid: null, email };
      }
      logger.error("lookupUserByEmail failed", { email, err: String(err) });
      throw new HttpsError("internal", "Lookup failed.");
    }
  },
);
