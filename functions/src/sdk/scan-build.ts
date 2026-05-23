import { onObjectFinalized } from "firebase-functions/v2/storage";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import JSZip from "jszip";

import {
  type BuildValidation,
  type BuildValidationCheck,
  type DreamworksManifest,
  type ValidationStatus,
  MANIFEST_FILENAME,
  MIN_SDK_VERSION,
  SDK_MARKER,
  compareSemver,
  rollupStatus,
} from "./shared.js";

const BUILD_PATH_RE = /^dw_apps\/([^/]+)\/builds\/(build-[^./]+)(?:\.[^/]+)?$/;

export const scanBuild = onObjectFinalized(
  {
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async (event) => {
    const objectName = event.data.name;
    if (!objectName) return;

    const match = BUILD_PATH_RE.exec(objectName);
    if (!match) {
      logger.debug("Skipping non-build object", { objectName });
      return;
    }
    const [, appId, buildId] = match;

    const buildRef = getFirestore()
      .collection("dw_apps")
      .doc(appId)
      .collection("dw_app_builds")
      .doc(buildId);

    const buildSnap = await buildRef.get();
    const existingHandshake = (buildSnap.data()?.lastHandshakeAt as string | undefined) ?? null;

    const bucket = getStorage().bucket(event.data.bucket);
    const [contents] = await bucket.file(objectName).download();

    let manifestCheck: BuildValidationCheck;
    let binaryCheck: BuildValidationCheck;
    let manifest: DreamworksManifest | null = null;

    try {
      const zip = await JSZip.loadAsync(contents);
      const manifestEntry = zip.file(MANIFEST_FILENAME);
      if (!manifestEntry) {
        manifestCheck = {
          status: "fail",
          message: `Missing ${MANIFEST_FILENAME} at the archive root.`,
        };
        binaryCheck = { status: "skipped", message: "Skipped — manifest missing." };
      } else {
        const raw = await manifestEntry.async("string");
        try {
          manifest = JSON.parse(raw) as DreamworksManifest;
        } catch {
          manifest = null;
        }
        manifestCheck = manifest
          ? checkManifest(manifest, appId, await loadAchievementIds(appId))
          : { status: "fail", message: `${MANIFEST_FILENAME} is not valid JSON.` };

        if (manifest && manifestCheck.status !== "fail") {
          const exeEntry = manifest.executable
            ? zip.file(manifest.executable) ?? findCaseInsensitive(zip, manifest.executable)
            : null;
          if (!exeEntry) {
            binaryCheck = {
              status: "fail",
              message: `Manifest references "${manifest.executable}" but it is not in the zip.`,
            };
          } else {
            const buf = await exeEntry.async("nodebuffer");
            binaryCheck = checkBinary(buf, manifest.executable);
          }
        } else {
          binaryCheck = { status: "skipped", message: "Skipped — manifest invalid." };
        }
      }
    } catch (err) {
      logger.error("scanBuild: failed to read zip", err);
      manifestCheck = {
        status: "fail",
        message: "Build archive is not a valid zip file.",
      };
      binaryCheck = { status: "skipped", message: "Skipped — archive unreadable." };
    }

    const handshakeCheck: BuildValidationCheck = existingHandshake
      ? {
          status: "pass",
          message: `Handshake received ${existingHandshake}.`,
        }
      : {
          status: "pending",
          message: "Waiting for the first runtime handshake from a launched build.",
        };

    const validation: BuildValidation = {
      schemaVersion: 1,
      checkedAt: new Date().toISOString(),
      source: "cloud",
      manifest: manifestCheck,
      binary: binaryCheck,
      handshake: handshakeCheck,
      overall: rollupStatus([
        manifestCheck.status,
        binaryCheck.status,
        handshakeCheck.status,
      ]),
    };

    await buildRef.set({ validation }, { merge: true });
    logger.info("Build validation written", {
      appId,
      buildId,
      overall: validation.overall,
    });
  },
);

async function loadAchievementIds(appId: string): Promise<Set<string>> {
  const snap = await getFirestore()
    .collection("dw_apps")
    .doc(appId)
    .collection("dw_app_achievements")
    .get();
  const ids = new Set<string>();
  snap.forEach((doc) => ids.add(doc.id));
  return ids;
}

function checkManifest(
  manifest: DreamworksManifest,
  expectedAppId: string,
  knownAchievementIds: Set<string>,
): BuildValidationCheck {
  const issues: string[] = [];
  let status: ValidationStatus = "pass";

  if (manifest.schemaVersion !== 1) {
    issues.push("Unsupported schemaVersion (expected 1).");
    status = "fail";
  }
  if (manifest.appId !== expectedAppId) {
    issues.push(
      `appId in manifest is "${manifest.appId}" but this app is "${expectedAppId}".`,
    );
    status = "fail";
  }
  if (!manifest.sdkVersion || compareSemver(manifest.sdkVersion, MIN_SDK_VERSION) < 0) {
    issues.push(`SDK ${manifest.sdkVersion ?? "unknown"} is older than minimum ${MIN_SDK_VERSION}.`);
    status = "fail";
  }
  const unknown = (manifest.achievements ?? []).filter((id) => !knownAchievementIds.has(id));
  if (unknown.length > 0) {
    issues.push(`Unknown achievement IDs: ${unknown.join(", ")}.`);
    if (status === "pass") status = "warn";
  }

  return {
    status,
    message:
      status === "pass"
        ? "Manifest is valid and references known achievements."
        : status === "warn"
          ? "Manifest is valid but references unknown achievement IDs."
          : "Manifest failed validation.",
    details: issues.length > 0 ? issues : undefined,
  };
}

function checkBinary(buf: Buffer, executableName: string): BuildValidationCheck {
  const markerFound = buf.includes(SDK_MARKER);
  if (markerFound) {
    return {
      status: "pass",
      message: `SDK marker detected in ${executableName}.`,
    };
  }
  return {
    status: "fail",
    message: `SDK marker not found in ${executableName}. Link @dreamworks/sdk and call init() at startup.`,
  };
}

function findCaseInsensitive(zip: JSZip, name: string) {
  const lower = name.toLowerCase();
  let match: JSZip.JSZipObject | null = null;
  zip.forEach((path, obj) => {
    if (!match && path.toLowerCase() === lower) match = obj;
  });
  return match;
}
