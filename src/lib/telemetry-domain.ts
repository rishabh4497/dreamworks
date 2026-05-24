// Domain-specific telemetry helpers. Thin wrappers on top of `track()` that
// emit named events for the install pipeline, game launches, voice QoS,
// DRM checks, search, recommendations, referrals, email, and onboarding.
// All helpers are fail-soft and safe to call from anywhere in the app.

import { addDoc, collection } from "firebase/firestore";
import { getDb, COLLECTIONS } from "@/lib/firebase";
import { track } from "@/lib/telemetry";
import type { InstallStage, LaunchOutcome, EmailTemplate, OnboardingStep } from "@/lib/types";

// ── Install pipeline ────────────────────────────────────────────────────────

export function trackInstallStage(
  stage: InstallStage,
  gameId: string,
  meta?: { startedAt?: number; bytes?: number; reason?: string },
): void {
  const dur = meta?.startedAt ? Date.now() - meta.startedAt : undefined;
  track(stage, {
    gameId,
    durationMs: dur,
    bytes: meta?.bytes,
    reason: meta?.reason,
  });
}

export function trackInstallFailed(gameId: string, reason: string): void {
  track("install_failed", { gameId, reason });
}

// ── Game launch ─────────────────────────────────────────────────────────────

export function trackLaunch(
  outcome: LaunchOutcome,
  gameId: string,
  meta?: { startedAt?: number; reason?: string },
): void {
  const dur = meta?.startedAt ? Date.now() - meta.startedAt : undefined;
  track(outcome, { gameId, durationMs: dur, reason: meta?.reason });
}

// ── Voice QoS ──────────────────────────────────────────────────────────────

export async function recordVoiceQos(sample: {
  uid: string | null;
  channelId: string;
  packetLossPct: number;
  jitterMs: number;
  rttMs: number;
  mos: number;
  bitrateKbps: number;
}): Promise<void> {
  try {
    const db = getDb();
    await addDoc(collection(db, COLLECTIONS.voiceQosSamples), {
      ...sample,
      ts: new Date().toISOString(),
    });
  } catch {
    /* fail-soft */
  }
}

// ── DRM checks ──────────────────────────────────────────────────────────────

export function trackDrmCheck(
  outcome: "drm_check_success" | "drm_check_fail",
  meta: { gameId: string; reason?: string; latencyMs?: number; offline?: boolean },
): void {
  track(outcome, meta);
}

// ── Search analytics ────────────────────────────────────────────────────────

export function trackSearchQuery(term: string, resultCount: number): void {
  track("search_query", {
    term: term.slice(0, 80),
    resultCount,
    zeroResults: resultCount === 0,
  });
}

export function trackSearchClick(term: string, gameId: string, position: number): void {
  track("search_click", { term: term.slice(0, 80), gameId, position });
}

// ── Recommendation impressions/clicks ──────────────────────────────────────

export function trackRecImpression(slot: string, gameIds: string[]): void {
  track("rec_impression", { slot, count: gameIds.length });
}

export function trackRecClick(slot: string, gameId: string, position: number): void {
  track("rec_click", { slot, gameId, position });
}

// ── Onboarding ──────────────────────────────────────────────────────────────

export function trackOnboarding(step: OnboardingStep): void {
  track(step);
}

// ── Email pipeline (server normally writes send/deliver; client writes open/click) ──

export async function recordEmailEvent(args: {
  template: EmailTemplate;
  kind: "open" | "click" | "convert";
  uid?: string | null;
  campaignId?: string;
}): Promise<void> {
  try {
    const db = getDb();
    await addDoc(collection(db, COLLECTIONS.emailEvents), {
      ...args,
      uid: args.uid ?? null,
      ts: new Date().toISOString(),
    });
  } catch {
    /* fail-soft */
  }
}

// ── Referral pipeline ──────────────────────────────────────────────────────

export async function recordReferralInvite(args: {
  inviterUid: string;
  recipientHandle: string;
  channel: "email" | "link" | "in_app";
}): Promise<void> {
  try {
    const db = getDb();
    await addDoc(collection(db, COLLECTIONS.referrals), {
      ...args,
      status: "sent",
      ts: new Date().toISOString(),
    });
  } catch {
    /* fail-soft */
  }
}

export async function recordReferralAccept(args: {
  inviterUid: string;
  acceptedByUid: string;
}): Promise<void> {
  try {
    const db = getDb();
    await addDoc(collection(db, COLLECTIONS.referrals), {
      ...args,
      status: "accepted",
      ts: new Date().toISOString(),
    });
  } catch {
    /* fail-soft */
  }
}

// ── Auth anomalies (server is preferred writer; client may report client-side hints) ──

export async function recordAuthAnomaly(args: {
  uid: string | null;
  displayName?: string;
  kind: string;
  detail: string;
  severity: "info" | "warn" | "critical";
}): Promise<void> {
  try {
    const db = getDb();
    await addDoc(collection(db, COLLECTIONS.authAnomalies), {
      ...args,
      ts: new Date().toISOString(),
    });
  } catch {
    /* fail-soft */
  }
}

// ── Fraud signals (admin-callable; surface client-side suspicions too) ─────

export async function recordFraudSignal(args: {
  uid: string | null;
  displayName?: string;
  kind: string;
  severity: "info" | "warn" | "critical";
  detail: string;
  evidence?: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = getDb();
    await addDoc(collection(db, COLLECTIONS.fraudSignals), {
      ...args,
      ts: new Date().toISOString(),
    });
  } catch {
    /* fail-soft */
  }
}
