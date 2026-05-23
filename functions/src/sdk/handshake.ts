import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import { verifyHmac, buildCanonicalString } from "../lib/verify-hmac.js";
import { checkRateLimit } from "../lib/rate-limit.js";

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
    const requestId = newRequestId();

    if (req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed", requestId });
      return;
    }

    const body = (req.body ?? {}) as HandshakeBody;
    if (!body.appId || !body.sdkVersion) {
      res.status(400).json({ error: "missing_fields", required: ["appId", "sdkVersion"], requestId });
      return;
    }

    const appId = String(body.appId);
    const sdkVersion = String(body.sdkVersion);
    const buildLabel = body.buildLabel ? String(body.buildLabel) : undefined;

    try {
      // 1. Rate limit by appId (20 req/min steady-state). Unauthenticated callers
      //    cannot flood the endpoint into amplifying Firestore writes.
      const rl = await checkRateLimit({
        key: `handshake:${appId}`,
        capacity: 20,
        refillPerSec: 20 / 60,
      });
      if (!rl.allowed) {
        res.set("Retry-After", String(rl.retryAfterSeconds));
        res.status(429).json({ error: "rate_limited", requestId });
        return;
      }

      const db = getFirestore();
      const appRef = db.collection("dw_apps").doc(appId);

      // 2. Look up app + secret. App must exist and have an sdkSecret provisioned.
      const appSnap = await appRef.get();
      if (!appSnap.exists) {
        res.status(401).json({ error: "unauthorized", requestId });
        return;
      }
      const appData = appSnap.data() as { sdkSecret?: string } | undefined;
      const secret = appData?.sdkSecret;
      if (!secret) {
        logger.warn("sdkHandshake: app missing sdkSecret", { appId, requestId });
        res.status(401).json({ error: "unauthorized", requestId });
        return;
      }

      // 3. Verify HMAC signature with a 5-minute replay window.
      const signatureHeader = headerValue(req.get("x-dreamworks-signature"));
      const timestampHeader = headerValue(req.get("x-dreamworks-timestamp"));
      const canonical = buildCanonicalString({
        appId,
        sdkVersion,
        buildLabel: buildLabel ?? "",
      });
      const verify = verifyHmac({ signatureHeader, timestampHeader, secret, canonical });
      if (!verify.ok) {
        logger.warn("sdkHandshake: hmac verification failed", {
          appId,
          reason: verify.reason,
          requestId,
        });
        res.status(401).json({ error: "unauthorized", requestId });
        return;
      }

      // 4. Record the handshake.
      const now = new Date().toISOString();
      const handshakeId = `${now}-${Math.random().toString(36).slice(2, 10)}`;

      await appRef
        .collection(HANDSHAKES_SUBCOLLECTION)
        .doc(handshakeId)
        .set({
          appId,
          sdkVersion,
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
      logger.error("sdkHandshake: write failed", { requestId, err: serializeErr(err) });
      res.status(500).json({ error: "internal", requestId });
    }
  },
);

function headerValue(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
}

function newRequestId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function serializeErr(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
