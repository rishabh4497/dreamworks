import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import { COLLECTIONS, assertAdmin, nowIso, stripUndefined, writeAudit } from "./shared.js";

type Outcome = "approve" | "request_changes" | "reject";

interface ReviewProfileRequest {
  submissionId: string;
  outcome: Outcome;
  summaryNote: string;
  reasons?: string[];
}

const ALLOWED: ReadonlySet<Outcome> = new Set(["approve", "request_changes", "reject"]);

function makeHandler(
  submissionCollection: string,
  profileCollection: string,
  action: "publisher.review" | "studio.review",
  targetType: "publisher" | "developer",
) {
  return onCall(
    { region: "us-central1", memory: "256MiB", timeoutSeconds: 30 },
    async (request: CallableRequest<ReviewProfileRequest>) => {
      const { uid, email } = await assertAdmin(request);
      const { submissionId, outcome, summaryNote, reasons } = request.data ?? ({} as ReviewProfileRequest);
      if (!submissionId) throw new HttpsError("invalid-argument", "submissionId required.");
      if (!ALLOWED.has(outcome)) throw new HttpsError("invalid-argument", `Invalid outcome: ${outcome}`);

      const db = getFirestore();
      const subRef = db.collection(submissionCollection).doc(submissionId);

      const result = await db.runTransaction(async (tx) => {
        const subSnap = await tx.get(subRef);
        if (!subSnap.exists) throw new HttpsError("not-found", "Submission not found.");
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
          reasons: reasons ?? [],
          assetComments: [],
        });

        tx.update(subRef, {
          status: nextStatus,
          decidedAt: nowIso(),
          decidedByUid: uid,
          decision,
        });

        const profileRef = db.collection(profileCollection).doc(sub.creatorId);
        const profileSnap = await tx.get(profileRef);
        if (profileSnap.exists) {
          const verificationStatus =
            nextStatus === "approved"
              ? "approved"
              : nextStatus === "rejected"
                ? "rejected"
                : "pending";
          tx.update(profileRef, {
            verificationStatus,
            latestSubmissionId: submissionId,
            updatedAt: nowIso(),
          });
        }

        writeAudit(tx, {
          actorUid: uid,
          actorEmail: email,
          action,
          targetType,
          targetId: sub.creatorId,
          beforeState: { status: sub.status },
          afterState: { status: nextStatus },
          metadata: { submissionId, outcome, reasons, summaryNote },
        });
        return { creatorId: sub.creatorId as string, status: nextStatus };
      });

      logger.info(action, { uid, submissionId, outcome });
      return { submissionId, ...result };
    },
  );
}

export const reviewPublisherProfile = makeHandler(
  COLLECTIONS.publisherSubmissions,
  COLLECTIONS.publishers,
  "publisher.review",
  "publisher",
);

export const reviewStudioProfile = makeHandler(
  COLLECTIONS.developerSubmissions,
  COLLECTIONS.developers,
  "studio.review",
  "developer",
);
