import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import { COLLECTIONS, writeAudit } from "./shared.js";
import { assertPermission } from "../lib/assert-permission.js";

interface DeleteRequest {
  appId: string;
  alsoDeleteGame?: boolean;
}

interface DeleteResponse {
  deletedApp: boolean;
  deletedGame: boolean;
  deletedSubmissions: number;
  deletedBuilds: number;
  deletedAchievements: number;
}

const BATCH_SIZE = 200;

async function deleteSubcollection(parentPath: string, name: string): Promise<number> {
  const db = getFirestore();
  let total = 0;
  while (true) {
    const snap = await db.collection(`${parentPath}/${name}`).limit(BATCH_SIZE).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    total += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }
  return total;
}

async function deleteSubmissionsForApp(appId: string): Promise<number> {
  const db = getFirestore();
  let total = 0;
  while (true) {
    const snap = await db
      .collection(COLLECTIONS.appSubmissions)
      .where("appId", "==", appId)
      .limit(BATCH_SIZE)
      .get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    total += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }
  return total;
}

export const deleteAppAdmin = onCall(
  { region: "us-central1", memory: "512MiB", timeoutSeconds: 120 },
  async (request: CallableRequest<DeleteRequest>): Promise<DeleteResponse> => {
    const { uid, email } = await assertPermission(request, "admin.apps.write");
    const { appId, alsoDeleteGame = true } = request.data ?? ({} as DeleteRequest);
    if (!appId) throw new HttpsError("invalid-argument", "appId required.");

    const db = getFirestore();
    const appRef = db.collection(COLLECTIONS.apps).doc(appId);
    const snap = await appRef.get();
    if (!snap.exists) throw new HttpsError("not-found", `App "${appId}" not found.`);
    const before = snap.data() ?? {};

    const buildCount = await deleteSubcollection(`${COLLECTIONS.apps}/${appId}`, "builds");
    const achievementCount = await deleteSubcollection(
      `${COLLECTIONS.apps}/${appId}`,
      "achievements",
    );
    const submissionCount = await deleteSubmissionsForApp(appId);

    let deletedGame = false;
    if (alsoDeleteGame) {
      const gameRef = db.collection(COLLECTIONS.games).doc(appId);
      const gameSnap = await gameRef.get();
      if (gameSnap.exists) {
        await gameRef.delete();
        deletedGame = true;
      }
    }

    await appRef.delete();

    // Audit entry written outside the batch so it survives even if downstream
    // listeners fail.
    await db.runTransaction(async (tx) => {
      writeAudit(tx, {
        actorUid: uid,
        actorEmail: email,
        action: "app.publish",
        targetType: "app",
        targetId: appId,
        beforeState: {
          stage: before.stage ?? null,
          submissionStatus: before.submissionStatus ?? null,
          ownerUserId: before.ownerUserId ?? null,
        },
        afterState: { deleted: true },
        metadata: {
          event: "app.delete",
          alsoDeletedGame: deletedGame,
          submissionsDeleted: submissionCount,
          buildsDeleted: buildCount,
          achievementsDeleted: achievementCount,
        },
      });
    });

    logger.info("deleteAppAdmin", { uid, appId, deletedGame });
    return {
      deletedApp: true,
      deletedGame,
      deletedSubmissions: submissionCount,
      deletedBuilds: buildCount,
      deletedAchievements: achievementCount,
    };
  },
);
