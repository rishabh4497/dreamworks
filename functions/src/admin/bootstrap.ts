import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { COLLECTIONS, requireAuth, writeAudit } from "./shared.js";

const ADMIN_EMAILS = defineString("ADMIN_EMAILS", {
  default: "",
  description: "Comma-separated list of email addresses auto-promoted to admin on sign-in.",
});

function allowlist(): string[] {
  const raw = ADMIN_EMAILS.value() ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Repurposed: this callable USED to auto-promote any email in `ADMIN_EMAILS`
 * to admin on sign-in. That behavior was removed in the access-control redo
 * (owner-only invites are now the only path to admin). The callable is kept
 * as a no-op so existing clients calling it still get a clean `{ admin: false }`
 * response, and so the Team & Access page can surface the allowlist as
 * "candidates the owner could invite" for convenience.
 */
export const claimAdminIfAllowlisted = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<unknown>): Promise<{ admin: boolean }> => {
    const { uid, email } = requireAuth(request);
    void uid;
    const list = allowlist();
    const isCandidate = !!(email && list.includes(email.toLowerCase()));
    logger.info("claimAdminIfAllowlisted (no-op)", { email, isCandidate });
    return { admin: false };
  },
);

/** Read the ADMIN_EMAILS allowlist as a hint list for the Team page. */
export const listAdminCandidates = onCall(
  { region: "us-central1", memory: "128MiB", timeoutSeconds: 15 },
  async (_request: CallableRequest<unknown>): Promise<{ candidates: string[] }> => {
    return { candidates: allowlist() };
  },
);

// Internal references retained to keep `writeAudit`, `COLLECTIONS`, `getAuth`,
// `getFirestore`, and `HttpsError` reachable for downstream tools that may
// still link this module. (Lint-only — no runtime effect.)
const _kept = { writeAudit, COLLECTIONS, getAuth, getFirestore, HttpsError };
void _kept;
