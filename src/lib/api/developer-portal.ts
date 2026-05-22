import { getDb, COLLECTIONS, getFirebaseAuth } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { slugify, parseScreenshots } from "../utils";
import type { GameDetail, GameFeature } from "../types";
import {
  gameCoverUrl,
  gameHeaderUrl,
  gameCapsuleUrl,
  gameScreenshotUrl,
  gameScreenshotThumbUrl,
} from "../mock/images";

export type ReleaseStage = "draft" | "submitted";
export type ReleaseWindow = "morning" | "afternoon" | "evening" | "midnight";

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
}

export interface DeveloperReleaseDraft {
  id: string;
  developerUserId?: string;
  gameTitle: string;
  developerName: string;
  shortDescription: string;
  genre: string;
  contentRating: string;
  buildLabel: string;
  buildNotes: string;
  releaseDate: string;
  releaseWindow: ReleaseWindow;
  basePriceCents: number;
  launchDiscountPct: number;
  regionalPricing: boolean;
  checklist: {
    achievements: boolean;
    newsPost: boolean;
    capsuleArt: boolean;
    controllerSupport: boolean;
    cloudSaves: boolean;
  };
  previewHeadline: string;
  previewBody: string;
  stage: ReleaseStage;
  coverUrl?: string;
  capsuleUrl?: string;
  headerUrl?: string;
  screenshotsRaw?: string;
  trailerUrl?: string;
  updatedAt: string;
  submittedAt?: string;
}

export type DeveloperReleaseDraftInput = Omit<
  DeveloperReleaseDraft,
  "id" | "updatedAt" | "submittedAt"
> & {
  id?: string;
  submittedAt?: string;
};

const DEFAULT_DRAFT: DeveloperReleaseDraft = {
  id: "release-draft-primary",
  gameTitle: "Moonlit Express",
  developerName: "Signal Bloom Studio",
  shortDescription: "A cozy rail-builder about restoring night routes between floating cities.",
  genre: "Simulation",
  contentRating: "Everyone 10+",
  buildLabel: "0.9.4-rc1",
  buildNotes: "Release candidate placeholder. Final depot upload and branch locks pending.",
  releaseDate: "2026-06-18",
  releaseWindow: "morning",
  basePriceCents: 2499,
  launchDiscountPct: 10,
  regionalPricing: true,
  checklist: {
    achievements: true,
    newsPost: false,
    capsuleArt: true,
    controllerSupport: true,
    cloudSaves: false,
  },
  previewHeadline: "Restore the midnight line",
  previewBody:
    "Build soft-lit routes, tune timetables, and bring isolated sky towns back into the network.",
  stage: "draft",
  coverUrl: "",
  capsuleUrl: "",
  headerUrl: "",
  screenshotsRaw: "",
  trailerUrl: "",
  updatedAt: "2026-05-21T12:00:00.000Z",
};

function now() {
  return new Date().toISOString();
}

function getUserId(): string {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("User must be authenticated to use developer portal.");
  return user.uid;
}

export async function listDeveloperReleaseDrafts(): Promise<DeveloperReleaseDraft[]> {
  const userId = getUserId();
  const draftsCol = collection(getDb(), COLLECTIONS.developerDrafts);
  const q = query(draftsCol, where("developerUserId", "==", userId));
  const snap = await getDocs(q);
  
  const drafts: DeveloperReleaseDraft[] = [];
  snap.forEach((d) => drafts.push(d.data() as DeveloperReleaseDraft));

  // Also try to fetch the legacy "primary" draft if it exists but wasn't caught by the query
  // (legacy drafts didn't have developerUserId).
  const legacyRef = doc(getDb(), COLLECTIONS.developerDrafts, userId);
  const legacySnap = await getDoc(legacyRef);
  if (legacySnap.exists()) {
    const legacyData = legacySnap.data() as DeveloperReleaseDraft;
    if (!drafts.some((d) => d.id === legacyData.id)) {
      drafts.push(legacyData);
    }
  }

  // If literally no drafts exist for this user, we don't automatically create one here anymore.
  // The UI will show an empty state.
  return drafts;
}

export function createEmptyDraft(publisherName?: string): DeveloperReleaseDraft {
  return {
    ...DEFAULT_DRAFT,
    id: "release-draft-" + crypto.randomUUID(),
    developerUserId: getUserId(),
    gameTitle: "Untitled Game",
    developerName: publisherName || "Unknown Studio",
    updatedAt: now(),
  };
}

export async function getPrimaryReleaseDraft(): Promise<DeveloperReleaseDraft | null> {
  // We keep this around for backward compatibility or when a component explicitly expects
  // to initialize the first draft if one doesn't exist, though UI should favor list + create.
  const drafts = await listDeveloperReleaseDrafts();
  if (drafts.length > 0) {
    return drafts[0];
  }
  return null;
}

export async function saveDeveloperReleaseDraft(
  input: DeveloperReleaseDraftInput,
): Promise<DeveloperReleaseDraft> {
  const userId = getUserId();
  const id = input.id ?? "release-draft-" + crypto.randomUUID();
  const docRef = doc(getDb(), COLLECTIONS.developerDrafts, id);
  const draft: DeveloperReleaseDraft = stripUndefined({
    ...input,
    id,
    developerUserId: userId,
    updatedAt: now(),
    submittedAt: input.submittedAt,
  });
  await setDoc(docRef, draft, { merge: true });
  return draft;
}

export async function submitDeveloperReleaseDraft(
  input: DeveloperReleaseDraftInput,
): Promise<DeveloperReleaseDraft> {
  const submittedAt = now();
  return saveDeveloperReleaseDraft({
    ...input,
    stage: "submitted",
    submittedAt,
  });
}

export function draftToGameDetail(draft: DeveloperReleaseDraft): GameDetail {
  const slug = slugify(draft.gameTitle);
  const gameId = slug;

  const basePrice = draft.basePriceCents;
  const finalPrice = Math.round(basePrice * (1 - draft.launchDiscountPct / 100));

  const features: GameFeature[] = ["single-player"];
  if (draft.checklist.achievements) features.push("achievements");
  if (draft.checklist.cloudSaves) features.push("cloud-saves");
  if (draft.checklist.controllerSupport) features.push("controller-full");

  const rawScreenshots = parseScreenshots(draft.screenshotsRaw);
  const screenshots =
    rawScreenshots.length > 0
      ? rawScreenshots.map((url) => ({ url, thumbUrl: url }))
      : [
          {
            url: gameScreenshotUrl(slug, 1),
            thumbUrl: gameScreenshotThumbUrl(slug, 1),
          },
          {
            url: gameScreenshotUrl(slug, 2),
            thumbUrl: gameScreenshotThumbUrl(slug, 2),
          },
          {
            url: gameScreenshotUrl(slug, 3),
            thumbUrl: gameScreenshotThumbUrl(slug, 3),
          },
        ];

  const trailers = draft.trailerUrl
    ? [
        {
          url: draft.trailerUrl,
          posterUrl: draft.headerUrl || gameHeaderUrl(slug),
          provider: "youtube" as const,
          id: draft.trailerUrl.split("v=")[1] || draft.trailerUrl,
        },
      ]
    : [];

  return {
    id: gameId,
    slug,
    name: draft.gameTitle,
    developer: draft.developerName,
    publisher: draft.developerName,
    releaseDate: draft.releaseDate || new Date().toISOString().split("T")[0],
    comingSoon: new Date(draft.releaseDate) > new Date(),
    coverUrl: draft.coverUrl || gameCoverUrl(slug),
    headerUrl: draft.headerUrl || gameHeaderUrl(slug),
    capsuleUrl: draft.capsuleUrl || gameCapsuleUrl(slug),
    tags: [draft.genre.toLowerCase(), "indie"],
    genres: [draft.genre],
    platforms: ["windows", "mac"],
    price: {
      currency: "INR", // catalog uses INR
      base: basePrice,
      final: finalPrice,
      discountPct: draft.launchDiscountPct,
      discountEndsAt:
        draft.launchDiscountPct > 0
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      isFree: basePrice === 0,
    },
    reviewSummary: {
      label: "Positive",
      scorePct: 85,
      totalReviews: 1,
      recentLabel: "Positive",
      recentScorePct: 85,
      recentTotal: 1,
    },
    isFeatured: true,
    isOnSale: (draft.launchDiscountPct || 0) > 0,
    salesRank: 1,
    firstReviewersScore: 98,
    hasDemo: false,
    trailerUrl: draft.trailerUrl || undefined,
    shortDescription: draft.shortDescription,
    longDescription:
      draft.previewBody || draft.shortDescription + "\n\nPublished via Developer Portal.",
    screenshots,
    trailers,
    systemRequirements: {
      windows: {
        os: "Windows 10 64-bit",
        cpu: "Intel Core i5-8400 / AMD Ryzen 5 2600",
        memory: "8 GB RAM",
        gpu: "NVIDIA GTX 1060 6GB / AMD RX 580 8GB",
        storage: "10 GB available space",
      },
      mac: {
        os: "macOS 12 (Apple Silicon recommended)",
        cpu: "Apple M1 or Intel Core i5 8th gen",
        memory: "8 GB RAM",
        gpu: "Integrated Apple GPU",
        storage: "10 GB available space",
      },
    },
    languages: ["English"],
    features,
    ageRating: { board: "ESRB", rating: "E (Everyone)" },
    drm: ["Dreamworks Account"],
    metaScore: null,
    estimatedSizeBytes: 10 * 1024 * 1024 * 1024,
    pricesByRegion: [],
    achievementCount: draft.checklist.achievements ? 10 : 0,
    achievements: [],
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

export async function publishGameFromDraft(draft: DeveloperReleaseDraft): Promise<void> {
  const gameDetail = draftToGameDetail(draft);
  const gameRef = doc(getDb(), COLLECTIONS.games, gameDetail.id);
  await setDoc(gameRef, stripUndefined(gameDetail));
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export interface PublisherProfile {
  id: string; // slugified name
  name: string; // display name
  brandColor: string;
  logoUrl: string;
  bannerUrl?: string;
  tagline: string;
  updatedAt: string;
}

export async function getPublisherProfile(name: string): Promise<PublisherProfile | null> {
  if (!name) return null;
  const slug = slugify(name);
  const docRef = doc(getDb(), COLLECTIONS.publisherProfiles, slug);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as PublisherProfile;
}

export async function savePublisherProfile(
  profile: Omit<PublisherProfile, "updatedAt">
): Promise<PublisherProfile> {
  const slug = slugify(profile.name);
  const docRef = doc(getDb(), COLLECTIONS.publisherProfiles, slug);
  const updated: PublisherProfile = {
    ...profile,
    id: slug,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(docRef, updated, { merge: true });
  return updated;
}

