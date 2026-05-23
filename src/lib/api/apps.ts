import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { getDb, COLLECTIONS, getFirebaseAuth, SUBCOLLECTIONS } from "../firebase";
import { slugify } from "../utils";
import type {
  App,
  AppBranch,
  AppBuild,
  Achievement,
  GameDetail,
  GameFeature,
  OSPlatform,
} from "../types";
import { getDeveloper, attachAppToDeveloper } from "./developers";
import { getPublisher, attachAppToPublisher } from "./publishers";
import {
  gameCoverUrl,
  gameHeaderUrl,
  gameCapsuleUrl,
  gameScreenshotUrl,
  gameScreenshotThumbUrl,
} from "../mock/images";

function now() {
  return new Date().toISOString();
}

function requireUserId(): string {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to use the developer portal.");
  return user.uid;
}

function stripUndefined<T>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).filter(([, v]) => v !== undefined),
  ) as T;
}

const DEFAULT_BRANCHES: AppBranch[] = [
  { name: "default", updatedAt: "1970-01-01T00:00:00.000Z", description: "Public live build" },
  { name: "beta", updatedAt: "1970-01-01T00:00:00.000Z", description: "Opt-in beta channel" },
  { name: "internal", updatedAt: "1970-01-01T00:00:00.000Z", description: "Team-only test channel" },
];

export interface CreateAppInput {
  title: string;
  developerId: string;
  publisherId: string;
}

export async function createApp(input: CreateAppInput): Promise<App> {
  const userId = requireUserId();
  const id = slugify(input.title);
  if (!id) throw new Error("Game title is required.");
  const ref = doc(getDb(), COLLECTIONS.apps, id);
  const existing = await getDoc(ref);
  if (existing.exists()) throw new Error(`An app with the slug "${id}" already exists.`);

  const app: App = stripUndefined({
    id,
    developerIds: [input.developerId],
    publisherIds: [input.publisherId],
    ownerUserId: userId,
    stage: "draft",

    gameTitle: input.title,
    shortDescription: "",
    longDescription: "",
    genres: [],
    tags: [],
    languages: ["English"],
    ageRating: "Everyone",
    platforms: ["windows"],
    features: ["single-player"],
    systemRequirements: {},

    screenshots: [],
    trailers: [],

    releaseDate: undefined,
    releaseWindow: "morning",

    basePriceCents: 0,
    launchDiscountPct: 0,
    pricesByRegion: [],

    branches: DEFAULT_BRANCHES.map((b) => ({ ...b, updatedAt: now() })),
    achievementCount: 0,
    checklist: {
      capsuleArt: false,
      controllerSupport: false,
      cloudSaves: false,
      achievements: false,
      newsPost: false,
      sdkIntegration: false,
    },
    createdAt: now(),
    updatedAt: now(),
  }) as App;

  await setDoc(ref, app);
  await Promise.all([
    attachAppToDeveloper(input.developerId, id),
    attachAppToPublisher(input.publisherId, id),
  ]);
  return app;
}

export async function getApp(id: string): Promise<App | null> {
  if (!id) return null;
  const ref = doc(getDb(), COLLECTIONS.apps, id);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as App) : null;
}

export async function listMyApps(): Promise<App[]> {
  const userId = requireUserId();
  const q = query(collection(getDb(), COLLECTIONS.apps), where("ownerUserId", "==", userId));
  const snap = await getDocs(q);
  const out: App[] = [];
  snap.forEach((d) => out.push(d.data() as App));
  return out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function listAppsByDeveloper(slug: string): Promise<App[]> {
  if (!slug) return [];
  const q = query(collection(getDb(), COLLECTIONS.apps), where("developerIds", "array-contains", slug));
  const snap = await getDocs(q);
  const out: App[] = [];
  snap.forEach((d) => out.push(d.data() as App));
  return out;
}

export async function listAppsByPublisher(slug: string): Promise<App[]> {
  if (!slug) return [];
  const q = query(collection(getDb(), COLLECTIONS.apps), where("publisherIds", "array-contains", slug));
  const snap = await getDocs(q);
  const out: App[] = [];
  snap.forEach((d) => out.push(d.data() as App));
  return out;
}

export type AppPatch = Partial<Omit<App, "id" | "createdAt" | "ownerUserId">>;

export async function saveApp(id: string, patch: AppPatch): Promise<App> {
  const ref = doc(getDb(), COLLECTIONS.apps, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`App "${id}" not found.`);
  const next: App = stripUndefined({
    ...(snap.data() as App),
    ...patch,
    id,
    updatedAt: now(),
  }) as App;
  await setDoc(ref, next, { merge: true });
  return next;
}

export async function deleteApp(id: string): Promise<void> {
  const ref = doc(getDb(), COLLECTIONS.apps, id);
  await deleteDoc(ref);
}

export async function submitAppForReview(id: string): Promise<App> {
  // Server-authoritative: validates checklist, creates an immutable submission
  // record in dw_app_submissions, and transitions the app stage atomically.
  const { submitAppForReviewCallable } = await import("./submissions");
  await submitAppForReviewCallable(id);
  const refreshed = await getApp(id);
  if (!refreshed) throw new Error(`App "${id}" not found after submission.`);
  return refreshed;
}

function youtubeIdFromUrl(url: string): string {
  if (!url) return "";
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : url;
}

export async function appToGameDetail(app: App): Promise<GameDetail> {
  const slug = app.id;

  const [primaryDev, primaryPub] = await Promise.all([
    app.developerIds[0] ? getDeveloper(app.developerIds[0]) : null,
    app.publisherIds[0] ? getPublisher(app.publisherIds[0]) : null,
  ]);

  const developerName = primaryDev?.name ?? app.developerIds[0] ?? "Unknown Studio";
  const publisherName = primaryPub?.name ?? primaryDev?.name ?? app.publisherIds[0] ?? developerName;

  const finalPrice = Math.round(app.basePriceCents * (1 - (app.launchDiscountPct || 0) / 100));

  const features: GameFeature[] = app.features?.length ? [...app.features] : ["single-player"];

  const screenshots =
    app.screenshots && app.screenshots.length > 0
      ? app.screenshots.map((url) => ({ url, thumbUrl: url }))
      : [1, 2, 3].map((n) => ({
          url: gameScreenshotUrl(slug, n),
          thumbUrl: gameScreenshotThumbUrl(slug, n),
        }));

  const trailers =
    app.trailers && app.trailers.length > 0
      ? app.trailers.map((t) => ({
          ...t,
          posterUrl: t.posterUrl || app.headerUrl || gameHeaderUrl(slug),
          id: t.id || youtubeIdFromUrl(t.url),
        }))
      : [];

  const platforms: OSPlatform[] = app.platforms?.length ? app.platforms : ["windows"];

  // Load achievements subcollection (so the public game page can render them).
  const achSnap = await getDocs(
    collection(getDb(), COLLECTIONS.apps, app.id, SUBCOLLECTIONS.appAchievements),
  );
  const achievements: Achievement[] = [];
  achSnap.forEach((d) => achievements.push(d.data() as Achievement));

  const comingSoon = app.releaseDate ? new Date(app.releaseDate) > new Date() : false;

  return {
    id: slug,
    slug,
    name: app.gameTitle,
    developer: developerName,
    publisher: publisherName,
    releaseDate: app.releaseDate || new Date().toISOString().split("T")[0],
    comingSoon,
    coverUrl: app.coverUrl || gameCoverUrl(slug),
    headerUrl: app.headerUrl || gameHeaderUrl(slug),
    capsuleUrl: app.capsuleUrl || gameCapsuleUrl(slug),
    tags: app.tags?.length ? app.tags : app.genres.map((g) => g.toLowerCase()),
    genres: app.genres?.length ? app.genres : ["Indie"],
    platforms,
    price: {
      currency: "INR",
      base: app.basePriceCents,
      final: finalPrice,
      discountPct: app.launchDiscountPct || 0,
      discountEndsAt:
        (app.launchDiscountPct || 0) > 0
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      isFree: app.basePriceCents === 0,
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
    isOnSale: (app.launchDiscountPct || 0) > 0,
    salesRank: 9999,
    hasDemo: false,
    trailerUrl: app.trailers?.[0]?.url,
    shortDescription: app.shortDescription || "",
    longDescription: app.longDescription || app.shortDescription || "",
    screenshots,
    trailers,
    systemRequirements: app.systemRequirements ?? {},
    languages: app.languages?.length ? app.languages : ["English"],
    features,
    ageRating: ageRatingFor(app.ageRating),
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
  };
}

function ageRatingFor(label: string): GameDetail["ageRating"] {
  const trimmed = (label || "").trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.includes("pegi")) return { board: "PEGI", rating: trimmed };
  return { board: "ESRB", rating: trimmed };
}

export async function publishApp(id: string): Promise<App> {
  // Admin-only: copies the app into dw_games and sets stage="released" in a
  // transaction. The callable validates the latest submission is "approved"
  // before publishing. Developers can no longer self-publish.
  const { publishApprovedAppCallable } = await import("./submissions");
  await publishApprovedAppCallable(id);
  const refreshed = await getApp(id);
  if (!refreshed) throw new Error(`App "${id}" not found after publish.`);
  return refreshed;
}

// Build/branch convenience reads (write paths live in app-builds.ts to keep
// builds-related Firestore calls colocated).
export async function getBuildsForApp(appId: string): Promise<AppBuild[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.apps, appId, SUBCOLLECTIONS.appBuilds));
  const out: AppBuild[] = [];
  snap.forEach((d) => out.push(d.data() as AppBuild));
  return out.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}
