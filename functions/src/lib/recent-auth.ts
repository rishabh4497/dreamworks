// Fresh-authentication guard for owner-only and other sensitive mutations.
// Inspired by Firebase's `requireRecentLogin` semantics: every JWT carries an
// `auth_time` claim (seconds since epoch when the user last signed in or
// re-authenticated). We compare it to "now" and reject if stale.
//
// On the client, catch the `failed-precondition` error with detail
// `requires-recent-login` and prompt the user to reauthenticate, then retry.

import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";

const DEFAULT_MAX_AGE_SEC = 300; // 5 minutes

export function assertFreshAuth(
  req: CallableRequest<unknown>,
  maxAgeSec: number = DEFAULT_MAX_AGE_SEC,
): void {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const authTime = req.auth.token.auth_time as number | undefined;
  if (typeof authTime !== "number" || authTime <= 0) {
    throw new HttpsError(
      "failed-precondition",
      "Recent sign-in required.",
      { code: "requires-recent-login", maxAgeSec },
    );
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec - authTime > maxAgeSec) {
    throw new HttpsError(
      "failed-precondition",
      `Recent sign-in required (within ${maxAgeSec}s).`,
      { code: "requires-recent-login", maxAgeSec },
    );
  }
}

/** Assert the JWT was issued post-MFA (second-factor present). */
export function assertSecondFactor(req: CallableRequest<unknown>): void {
  if (!req.auth) throw new HttpsError("unauthenticated", "Sign in required.");
  const firebase = req.auth.token.firebase as { sign_in_second_factor?: string } | undefined;
  if (!firebase?.sign_in_second_factor) {
    throw new HttpsError(
      "failed-precondition",
      "Second factor required for this action.",
      { code: "requires-mfa" },
    );
  }
}
