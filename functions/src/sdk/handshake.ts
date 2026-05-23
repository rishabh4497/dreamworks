import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

interface HandshakeBody {
  appId?: string;
  sdkVersion?: string;
  buildLabel?: string;
  machineId?: string;
  timestamp?: string;
}

const HANDSHAKES_SUBCOLLECTION = "dw_sdk_handshakes";

export const sdkHandshake = onRequest(
  {
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
    cors: true,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed" });
      return;
    }

    const body = (req.body ?? {}) as HandshakeBody;
    if (!body.appId || !body.sdkVersion) {
      res.status(400).json({ error: "missing_fields", required: ["appId", "sdkVersion"] });
      return;
    }

    const appId = String(body.appId);
    const buildLabel = body.buildLabel ? String(body.buildLabel) : undefined;
    const now = new Date().toISOString();
    const handshakeId = `${now}-${Math.random().toString(36).slice(2, 10)}`;

    try {
      const db = getFirestore();
      const appRef = db.collection("dw_apps").doc(appId);

      await appRef
        .collection(HANDSHAKES_SUBCOLLECTION)
        .doc(handshakeId)
        .set({
          appId,
          sdkVersion: String(body.sdkVersion),
          buildLabel: buildLabel ?? null,
          machineId: body.machineId ? String(body.machineId) : null,
          receivedAt: FieldValue.serverTimestamp(),
          ip: req.ip ?? null,
        });

      if (buildLabel) {
        const buildsSnap = await appRef
          .collection("dw_app_builds")
          .where("buildLabel", "==", buildLabel)
          .limit(1)
          .get();
        if (!buildsSnap.empty) {
          const buildDoc = buildsSnap.docs[0];
          await buildDoc.ref.set(
            {
              lastHandshakeAt: now,
              validation: {
                handshake: {
                  status: "pass",
                  message: `Handshake received ${now}.`,
                },
              },
            },
            { merge: true },
          );
        }
      }

      res.status(204).send();
    } catch (err) {
      logger.error("sdkHandshake: write failed", err);
      res.status(500).json({ error: "internal" });
    }
  },
);
