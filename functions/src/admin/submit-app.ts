import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import {
  COLLECTIONS,
  nowIso,
  requireAuth,
  stripUndefined,
  writeAudit,
} from "./shared.js";

interface SubmitRequest {
  appId: string;
}

interface SubmitResponse {
  submissionId: string;
}

function validateForSubmission(app: any): void {
  const missing: string[] = [];
  if (!app.gameTitle || !String(app.gameTitle).trim()) missing.push("gameTitle");
  if (!app.shortDescription || !String(app.shortDescription).trim()) missing.push("shortDescription");
  if (!app.capsuleUrl) missing.push("capsuleUrl");
  if (!app.headerUrl) missing.push("headerUrl");
  if (!Array.isArray(app.screenshots) || app.screenshots.length < 3) missing.push("screenshots>=3");
  if (!Array.isArray(app.trailers) || app.trailers.length < 1) missing.push("trailers>=1");
  if (typeof app.basePriceCents !== "number" || app.basePriceCents < 0) missing.push("basePriceCents");
  const defaultBranch = (app.branches ?? []).find((b: any) => b?.name === "default");
  if (!defaultBranch?.liveBuildId) missing.push("default branch liveBuildId");
  if (missing.length > 0) {
    throw new HttpsError(
      "failed-precondition",
      `App is missing required fields: ${missing.join(", ")}`,
    );
  }
}

function buildSnapshot(app: any) {
  return stripUndefined({
    gameTitle: app.gameTitle,
    shortDescription: app.shortDescription ?? "",
    longDescription: app.longDescription ?? "",
    genres: app.genres ?? [],
    tags: app.tags ?? [],
    languages: app.languages ?? [],
    ageRating: app.ageRating ?? "",
    platforms: app.platforms ?? [],
    basePriceCents: app.basePriceCents ?? 0,
    releaseDate: app.releaseDate,
    releaseWindow: app.releaseWindow ?? "morning",
    coverUrl: app.coverUrl,
    capsuleUrl: app.capsuleUrl,
    headerUrl: app.headerUrl,
    screenshots: app.screenshots ?? [],
    trailers: app.trailers ?? [],
    latestBuildId: app.latestBuildId,
    checklist: app.checklist ?? {},
    features: app.features ?? [],
  });
}

export const submitAppForReview = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<SubmitRequest>): Promise<SubmitResponse> => {
    const { uid, email } = requireAuth(request);
    const { appId } = request.data ?? ({} as SubmitRequest);
    if (!appId) throw new HttpsError("invalid-argument", "appId is required.");

    const db = getFirestore();
    const appRef = db.collection(COLLECTIONS.apps).doc(appId);
    const subColl = db.collection(COLLECTIONS.appSubmissions);
    const subRef = subColl.doc();

    const submissionId = await db.runTransaction(async (tx) => {
      const appSnap = await tx.get(appRef);
      if (!appSnap.exists) {
        throw new HttpsError("not-found", `App "${appId}" not found.`);
      }
      const app = appSnap.data() as any;
      if (app.ownerUserId !== uid) {
        throw new HttpsError("permission-denied", "You are not the owner of this app.");
      }
      const blocked: string[] = ["pending", "in_review"];
      if (app.submissionStatus && blocked.includes(app.submissionStatus)) {
        throw new HttpsError("failed-precondition", "A submission is already pending review.");
      }
      validateForSubmission(app);

      const submission = stripUndefined({
        appId,
        submitterUserId: uid,
        submitterEmail: email,
        appSnapshot: buildSnapshot(app),
        status: "pending" as const,
        submittedAt: nowIso(),
        priorSubmissionId: app.latestSubmissionId ?? null,
      });

      tx.set(subRef, submission);
      tx.update(appRef, {
        stage: "in-review",
        submissionStatus: "pending",
        latestSubmissionId: subRef.id,
        submittedAt: nowIso(),
        updatedAt: nowIso(),
      });
      writeAudit(tx, {
        actorUid: uid,
        actorEmail: email,
        action: "submission.submit",
        targetType: "submission",
        targetId: subRef.id,
        metadata: { appId },
      });
      return subRef.id;
    });

    logger.info("submitAppForReview", { uid, appId, submissionId });
    return { submissionId };
  },
);
