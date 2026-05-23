import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, type Transaction } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import { COLLECTIONS, assertAdmin, nowIso, stripUndefined, writeAudit } from "./shared.js";

interface PublishRequest {
  appId: string;
}

interface PublishResponse {
  gameId: string;
}

function youtubeIdFromUrl(url: string): string {
  if (!url) return "";
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : url;
}

function ageRatingFor(label: string): { board: "ESRB" | "PEGI"; rating: string } | null {
  const trimmed = (label || "").trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase().includes("pegi")) return { board: "PEGI", rating: trimmed };
  return { board: "ESRB", rating: trimmed };
}

async function appToGameDetail(tx: Transaction, app: any, achievements: any[]) {
  const slug = app.id;
  const finalPrice = Math.round(
    (app.basePriceCents ?? 0) * (1 - (app.launchDiscountPct ?? 0) / 100),
  );

  const screenshots =
    Array.isArray(app.screenshots) && app.screenshots.length > 0
      ? app.screenshots.map((url: string) => ({ url, thumbUrl: url }))
      : [];

  const trailers =
    Array.isArray(app.trailers) && app.trailers.length > 0
      ? app.trailers.map((t: any) => ({
          ...t,
          posterUrl: t.posterUrl || app.headerUrl || "",
          id: t.id || youtubeIdFromUrl(t.url),
        }))
      : [];

  const platforms: string[] = app.platforms?.length ? app.platforms : ["windows"];
  const features: string[] = app.features?.length ? app.features : ["single-player"];

  // Resolve developer/publisher names from their docs.
  const db = getFirestore();
  const [devSnap, pubSnap] = await Promise.all([
    app.developerIds?.[0]
      ? tx.get(db.collection(COLLECTIONS.developers).doc(app.developerIds[0]))
      : Promise.resolve(null),
    app.publisherIds?.[0]
      ? tx.get(db.collection(COLLECTIONS.publishers).doc(app.publisherIds[0]))
      : Promise.resolve(null),
  ]);
  const developerName = devSnap?.exists
    ? (devSnap.data()?.name as string)
    : app.developerIds?.[0] ?? "Unknown Studio";
  const publisherName = pubSnap?.exists
    ? (pubSnap.data()?.name as string)
    : app.publisherIds?.[0] ?? developerName;

  const comingSoon = app.releaseDate ? new Date(app.releaseDate) > new Date() : false;

  return stripUndefined({
    id: slug,
    slug,
    name: app.gameTitle,
    developer: developerName,
    publisher: publisherName,
    releaseDate: app.releaseDate || nowIso().split("T")[0],
    comingSoon,
    coverUrl: app.coverUrl ?? "",
    headerUrl: app.headerUrl ?? "",
    capsuleUrl: app.capsuleUrl ?? "",
    tags: app.tags?.length ? app.tags : (app.genres ?? []).map((g: string) => g.toLowerCase()),
    genres: app.genres?.length ? app.genres : ["Indie"],
    platforms,
    price: {
      currency: "INR",
      base: app.basePriceCents ?? 0,
      final: finalPrice,
      discountPct: app.launchDiscountPct ?? 0,
      discountEndsAt:
        (app.launchDiscountPct ?? 0) > 0
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      isFree: (app.basePriceCents ?? 0) === 0,
    },
    reviewSummary: {
      label: "Positive",
      scorePct: 85,
      totalReviews: 1,
      recentLabel: "Positive",
      recentScorePct: 85,
      recentTotal: 1,
    },
    isFeatured: false,
    isOnSale: (app.launchDiscountPct ?? 0) > 0,
    salesRank: 9999,
    hasDemo: false,
    trailerUrl: app.trailers?.[0]?.url,
    shortDescription: app.shortDescription ?? "",
    longDescription: app.longDescription ?? app.shortDescription ?? "",
    screenshots,
    trailers,
    systemRequirements: app.systemRequirements ?? {},
    languages: app.languages?.length ? app.languages : ["English"],
    features,
    ageRating: ageRatingFor(app.ageRating ?? ""),
    drm: ["Dreamworks Account"],
    metaScore: null,
    estimatedSizeBytes: 10 * 1024 * 1024 * 1024,
    pricesByRegion: app.pricesByRegion ?? [],
    achievementCount: achievements.length,
    achievements,
    depots: [],
    patchNotes: [],
    relatedGameIds: [],
    storeTags: [],
    priceHistory: [],
    playerCountHistory: [],
    currentPlayers: 0,
    peakPlayers24h: 0,
    peakPlayersAllTime: 0,
    playtime: {
      mainHours: 8,
      mainPlusSidesHours: 12,
      completionistHours: 20,
      source: "estimated",
    },
  });
}

export const publishApprovedApp = onCall(
  { region: "us-central1", memory: "512MiB", timeoutSeconds: 60 },
  async (request: CallableRequest<PublishRequest>): Promise<PublishResponse> => {
    const { uid, email } = await assertAdmin(request);
    const { appId } = request.data ?? ({} as PublishRequest);
    if (!appId) throw new HttpsError("invalid-argument", "appId required.");

    const db = getFirestore();
    const appRef = db.collection(COLLECTIONS.apps).doc(appId);
    const gameRef = db.collection(COLLECTIONS.games).doc(appId);

    // Read achievements outside the transaction (subcollection enumeration
    // is not atomic with the parent doc anyway).
    const achSnap = await appRef.collection("achievements").get();
    const achievements: any[] = [];
    achSnap.forEach((d) => achievements.push(d.data()));

    const gameId = await db.runTransaction(async (tx) => {
      const appSnap = await tx.get(appRef);
      if (!appSnap.exists) throw new HttpsError("not-found", `App "${appId}" not found.`);
      const app = { id: appId, ...(appSnap.data() as Record<string, unknown>) } as any;

      if (app.submissionStatus && app.submissionStatus !== "approved") {
        throw new HttpsError(
          "failed-precondition",
          "App must have an approved submission before publishing.",
        );
      }

      const gameDetail = await appToGameDetail(tx, app, achievements);
      tx.set(gameRef, gameDetail, { merge: true });
      tx.update(appRef, {
        stage: "released",
        updatedAt: nowIso(),
      });
      writeAudit(tx, {
        actorUid: uid,
        actorEmail: email,
        action: "app.publish",
        targetType: "app",
        targetId: appId,
        beforeState: { stage: app.stage },
        afterState: { stage: "released" },
      });
      return appId;
    });

    logger.info("publishApprovedApp", { uid, appId, gameId });
    return { gameId };
  },
);
