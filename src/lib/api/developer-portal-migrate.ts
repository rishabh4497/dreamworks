import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { getDb, COLLECTIONS, getFirebaseAuth } from "../firebase";
import { slugify, parseScreenshots } from "../utils";
import type { App, AppBranch, Developer, Publisher, Trailer } from "../types";
import { saveDeveloper } from "./developers";
import { savePublisher } from "./publishers";

const FLAG_KEY = "dw_dev_portal_migrated";
const FLAG_VAL = "v1";

function now() {
  return new Date().toISOString();
}

function youtubeIdFromUrl(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : url;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

interface LegacyDraft {
  id: string;
  developerUserId?: string;
  gameTitle?: string;
  developerName?: string;
  publisherName?: string;
  shortDescription?: string;
  genre?: string;
  contentRating?: string;
  buildLabel?: string;
  buildNotes?: string;
  releaseDate?: string;
  releaseWindow?: App["releaseWindow"];
  basePriceCents?: number;
  launchDiscountPct?: number;
  regionalPricing?: boolean;
  previewHeadline?: string;
  previewBody?: string;
  coverUrl?: string;
  capsuleUrl?: string;
  headerUrl?: string;
  screenshotsRaw?: string;
  trailerUrl?: string;
  stage?: "draft" | "submitted";
  checklist?: App["checklist"];
  updatedAt?: string;
}

interface LegacyPublisherProfile {
  id?: string;
  name?: string;
  brandColor?: string;
  logoUrl?: string;
  bannerUrl?: string;
  tagline?: string;
}

async function fetchLegacyDraftsForUser(userId: string): Promise<LegacyDraft[]> {
  const col = collection(getDb(), COLLECTIONS.developerDrafts);
  const q = query(col, where("developerUserId", "==", userId));
  const snap = await getDocs(q);
  const drafts: LegacyDraft[] = [];
  snap.forEach((d) => drafts.push(d.data() as LegacyDraft));

  // Legacy "primary" doc keyed by uid (didn't carry developerUserId).
  const primaryRef = doc(getDb(), COLLECTIONS.developerDrafts, userId);
  const primarySnap = await getDoc(primaryRef);
  if (primarySnap.exists()) {
    const data = primarySnap.data() as LegacyDraft;
    if (!drafts.some((d) => d.id === data.id)) drafts.push(data);
  }
  return drafts;
}

async function fetchLegacyPublisherProfile(name: string): Promise<LegacyPublisherProfile | null> {
  const slug = slugify(name);
  if (!slug) return null;
  // dw_publishers collection is shared between legacy PublisherProfile docs
  // and the new Publisher entity. Read it raw and pick whichever fields exist.
  const ref = doc(getDb(), COLLECTIONS.publisherProfiles, slug);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as LegacyPublisherProfile) : null;
}

function draftToApp(draft: LegacyDraft, userId: string, devId: string, pubId: string): App {
  const id = slugify(draft.gameTitle || "untitled-game");
  const screenshots = parseScreenshots(draft.screenshotsRaw);
  const trailers: Trailer[] = draft.trailerUrl
    ? [
        {
          url: draft.trailerUrl,
          posterUrl: draft.headerUrl ?? "",
          provider: "youtube",
          id: youtubeIdFromUrl(draft.trailerUrl),
        },
      ]
    : [];

  const branches: AppBranch[] = [
    { name: "default", updatedAt: now(), description: "Public live build" },
    { name: "beta", updatedAt: now(), description: "Opt-in beta channel" },
    { name: "internal", updatedAt: now(), description: "Team-only test channel" },
  ];

  return stripUndefined({
    id,
    developerIds: [devId],
    publisherIds: [pubId],
    ownerUserId: userId,
    stage: draft.stage === "submitted" ? "released" : "draft",

    gameTitle: draft.gameTitle || "Untitled Game",
    shortDescription: draft.shortDescription || "",
    longDescription: draft.previewBody || draft.shortDescription || "",
    genres: draft.genre ? [draft.genre] : [],
    tags: draft.genre ? [draft.genre.toLowerCase()] : [],
    languages: ["English"],
    ageRating: draft.contentRating || "Everyone",
    platforms: ["windows", "mac"],
    features: [
      "single-player",
      ...(draft.checklist?.achievements ? (["achievements"] as const) : []),
      ...(draft.checklist?.cloudSaves ? (["cloud-saves"] as const) : []),
      ...(draft.checklist?.controllerSupport ? (["controller-full"] as const) : []),
    ],
    systemRequirements: {},

    coverUrl: draft.coverUrl || undefined,
    capsuleUrl: draft.capsuleUrl || undefined,
    headerUrl: draft.headerUrl || undefined,
    screenshots,
    trailers,

    releaseDate: draft.releaseDate || undefined,
    releaseWindow: draft.releaseWindow || "morning",

    basePriceCents: draft.basePriceCents ?? 0,
    launchDiscountPct: draft.launchDiscountPct ?? 0,
    pricesByRegion: [],

    branches,
    achievementCount: draft.checklist?.achievements ? 0 : 0,

    checklist: draft.checklist ?? {
      capsuleArt: false,
      controllerSupport: false,
      cloudSaves: false,
      achievements: false,
      newsPost: false,
      sdkIntegration: false,
    },

    createdAt: draft.updatedAt || now(),
    updatedAt: draft.updatedAt || now(),
  }) as App;
}

/**
 * One-shot, idempotent. Reads legacy `dw_developer_drafts` docs for the
 * current user, materializes `Developer`/`Publisher`/`App` records, then
 * sets a localStorage flag so subsequent loads skip the work. Safe to call
 * unconditionally from a portal entry point — does nothing after the first
 * successful run.
 */
export async function migrateLegacyDeveloperData(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(FLAG_KEY) === FLAG_VAL) return;
  const user = getFirebaseAuth().currentUser;
  if (!user) return;

  try {
    const drafts = await fetchLegacyDraftsForUser(user.uid);
    if (drafts.length === 0) {
      window.localStorage.setItem(FLAG_KEY, FLAG_VAL);
      return;
    }

    // Group by (developerName, publisherName) so we don't re-save the same
    // creator entity for every draft.
    const devCache = new Map<string, Developer>();
    const pubCache = new Map<string, Publisher>();

    for (const draft of drafts) {
      const devName = draft.developerName || "Unknown Studio";
      const pubName = draft.publisherName || devName;
      const devSlug = slugify(devName);
      const pubSlug = slugify(pubName);

      if (!devCache.has(devSlug)) {
        const legacyProfile = await fetchLegacyPublisherProfile(devName);
        const dev = await saveDeveloper({
          id: devSlug,
          name: devName,
          brandColor: legacyProfile?.brandColor || "#66c0f4",
          logoUrl: legacyProfile?.logoUrl || "",
          bannerUrl: legacyProfile?.bannerUrl || undefined,
          tagline: legacyProfile?.tagline || `${devName} catalog`,
        });
        devCache.set(devSlug, dev);
      }

      if (!pubCache.has(pubSlug)) {
        const legacyProfile = await fetchLegacyPublisherProfile(pubName);
        const pub = await savePublisher({
          id: pubSlug,
          name: pubName,
          brandColor: legacyProfile?.brandColor || "#66c0f4",
          logoUrl: legacyProfile?.logoUrl || "",
          bannerUrl: legacyProfile?.bannerUrl || undefined,
          tagline: legacyProfile?.tagline || `Published by ${pubName}`,
        });
        pubCache.set(pubSlug, pub);
      }

      const app = draftToApp(draft, user.uid, devSlug, pubSlug);
      const appRef = doc(getDb(), COLLECTIONS.apps, app.id);
      const existing = await getDoc(appRef);
      if (!existing.exists()) {
        await setDoc(appRef, app);
        // Re-save creators with appIds appended.
        const dev = devCache.get(devSlug)!;
        if (!dev.appIds?.includes(app.id)) {
          dev.appIds = [...(dev.appIds ?? []), app.id];
          await saveDeveloper({ ...dev, id: devSlug, appIds: dev.appIds });
        }
        const pub = pubCache.get(pubSlug)!;
        if (!pub.appIds?.includes(app.id)) {
          pub.appIds = [...(pub.appIds ?? []), app.id];
          await savePublisher({ ...pub, id: pubSlug, appIds: pub.appIds });
        }
      }
    }
    window.localStorage.setItem(FLAG_KEY, FLAG_VAL);
  } catch (err) {
    // Don't poison the flag on failure — next portal load will retry.
    console.warn("Developer portal migration skipped:", err);
  }
}
