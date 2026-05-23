import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import { COLLECTIONS, assertAdmin, nowIso, stripUndefined, writeAudit } from "./shared.js";

type Outcome = "approve" | "request_changes" | "reject";

interface AssetComment {
  field: string;
  index?: number;
  comment: string;
}

interface ReviewRequest {
  submissionId: string;
  outcome: Outcome;
  summaryNote: string;
  reasons: string[];
  assetComments: AssetComment[];
}

interface ReviewResponse {
  submissionId: string;
  status: "approved" | "rejected" | "changes_requested";
  appId: string;
}

const ALLOWED_OUTCOMES: ReadonlySet<Outcome> = new Set(["approve", "request_changes", "reject"]);

export const reviewAppSubmission = onCall(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<ReviewRequest>): Promise<ReviewResponse> => {
    const { uid, email } = await assertAdmin(request);
    const { submissionId, outcome, summaryNote, reasons, assetComments } =
      request.data ?? ({} as ReviewRequest);

    if (!submissionId) throw new HttpsError("invalid-argument", "submissionId required.");
    if (!ALLOWED_OUTCOMES.has(outcome)) {
      throw new HttpsError("invalid-argument", `Invalid outcome: ${outcome}`);
    }

    const db = getFirestore();
    const subRef = db.collection(COLLECTIONS.appSubmissions).doc(submissionId);

    const result = await db.runTransaction(async (tx) => {
      const subSnap = await tx.get(subRef);
      if (!subSnap.exists) {
        throw new HttpsError("not-found", "Submission not found.");
      }
      const sub = subSnap.data() as any;
      if (sub.status !== "pending" && sub.status !== "in_review") {
        throw new HttpsError("failed-precondition", `Submission is already ${sub.status}.`);
      }

      const nextStatus =
        outcome === "approve"
          ? "approved"
          : outcome === "reject"
            ? "rejected"
            : "changes_requested";

      const decision = stripUndefined({
        outcome,
        summaryNote: summaryNote ?? "",
        reasons: Array.isArray(reasons) ? reasons : [],
        assetComments: Array.isArray(assetComments) ? assetComments : [],
      });

      tx.update(subRef, {
        status: nextStatus,
        decidedAt: nowIso(),
        decidedByUid: uid,
        decision,
      });

      const appRef = db.collection(COLLECTIONS.apps).doc(sub.appId);
      const appSnap = await tx.get(appRef);
      if (!appSnap.exists) {
        throw new HttpsError("not-found", "Linked app not found.");
      }
      const app = appSnap.data() as any;
      const beforeStage = app.stage;
      const nextStage =
        nextStatus === "approved"
          ? "coming-soon"
          : nextStatus === "changes_requested" || nextStatus === "rejected"
            ? "draft"
            : app.stage;

      tx.update(appRef, {
        stage: nextStage,
        submissionStatus: nextStatus,
        lastReviewedAt: nowIso(),
        lastReviewerUid: uid,
        updatedAt: nowIso(),
      });

      writeAudit(tx, {
        actorUid: uid,
        actorEmail: email,
        action: "submission.review",
        targetType: "submission",
        targetId: submissionId,
        beforeState: { status: sub.status, stage: beforeStage },
        afterState: { status: nextStatus, stage: nextStage },
        metadata: { appId: sub.appId, outcome, reasons, summaryNote },
      });

      return { status: nextStatus as ReviewResponse["status"], appId: sub.appId as string };
    });

    logger.info("reviewAppSubmission", { uid, submissionId, outcome, status: result.status });
    return { submissionId, ...result };
  },
);
