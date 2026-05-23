/**
 * Seed the real Firebase project with the 20 local GAME_SEEDS + the studio
 * owner accounts they imply, mirroring every image into Firebase Storage
 * under the `dw_` prefix convention.
 *
 * Usage:
 *   1. Drop a service-account key at <repo-root>/serviceAccountKey.json
 *      (Firebase Console → Project Settings → Service Accounts → "Generate Private Key").
 *      The IAM principal must have:
 *        - "Firebase Authentication Admin"  (create/update users)
 *        - "Cloud Datastore User"           (Firestore writes)
 *        - "Storage Object Admin"           (upload + makePublic)
 *      The default Firebase Admin SDK service account has all three.
 *   2. Optional: set FIREBASE_STORAGE_BUCKET if your bucket isn't
 *      `<project-id>.firebasestorage.app` (older projects use `.appspot.com`).
 *   3. yarn seed:firebase
 *
 * Idempotent. Re-runs skip images that already exist in Storage and use
 * setDoc(merge: true) for Firestore. Each phase commits its own batch so
 * a failure in one collection doesn't lose work in another.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth, type UserRecord } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import { GAME_SEEDS } from "../src/lib/mock/games.js";
import { buildGameDetail } from "../src/lib/mock/game-detail.js";
import { CATEGORIES, TAGS } from "../src/lib/mock/index.js";
import { NEWS } from "../src/lib/mock/news.js";
import { SEED_THREADS, SEED_REPLIES } from "../src/lib/mock/forums.js";
import { SEED_POSTS, PRESET_POST_IMAGES } from "../src/lib/mock/feed.js";
import { SEED_NOTIFICATIONS } from "../src/lib/mock/notifications.js";
import { THEME_SEEDS } from "../src/lib/mock/themes.js";
import { CONTROLLER_LAYOUT_SEEDS } from "../src/lib/mock/controller-layouts.js";
import { WORKSHOP_MODS } from "../src/lib/mock/workshop-mods.js";
import {
  LFG_BOARD_SEED_POSTS,
  LFG_BOARD_SEED_GUIDES,
} from "../src/lib/mock/lfg-board.js";
import { LFG_GROUPS } from "../src/lib/mock/lfg-groups.js";
import { FOLLOW_SUGGESTIONS } from "../src/lib/mock/follow-suggestions.js";
import {
  FRIENDS,
  FRIEND_ACTIVITY,
  FRIEND_OWNED,
} from "../src/lib/mock/friends.js";
import { SPEEDRUN_RUNS } from "../src/lib/mock/speedrun-runs.js";
import { buildReviewsForGame } from "../src/lib/mock/reviews.js";
import { slugify } from "../src/lib/utils.js";
import { studioBrand } from "../src/lib/studio-logos.js";
import type {
  App,
  AppBranch,
  Cosmetic,
  Developer,
  GameDetail,
  Publisher,
} from "../src/lib/types.js";

// ────────────────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────────────────

const SHARED_PASSWORD = "Dreamworks2026!";
const EMAIL_DOMAIN = "dreamworks.test";

const COLLECTIONS = {
  developers: "dw_developers",
  publishers: "dw_publishers",
  apps: "dw_apps",
  games: "dw_games",
} as const;

const SERVICE_ACCOUNT_PATH = resolve(process.cwd(), "serviceAccountKey.json");
const MOCK_USERS_MD_PATH = resolve(process.cwd(), "MOCK_USERS.md");
const DEFAULT_BRAND_COLOR = "#66c0f4";

// ────────────────────────────────────────────────────────────────────────────
// Firebase init
// ────────────────────────────────────────────────────────────────────────────

let projectId = "";
let bucketName = "";

function initAdmin(): void {
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(
      `\n❌ Missing service-account key at ${SERVICE_ACCOUNT_PATH}\n\n` +
        `Download one from Firebase Console → Project Settings → Service Accounts → ` +
        `"Generate new private key" and save it as serviceAccountKey.json in the project root.\n`,
    );
    process.exit(1);
  }
  const sa = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8")) as {
    project_id: string;
  };
  projectId = sa.project_id;
  bucketName = process.env.FIREBASE_STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`;
  initializeApp({
    credential: cert(SERVICE_ACCOUNT_PATH),
    storageBucket: bucketName,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Studio identity dedup
// ────────────────────────────────────────────────────────────────────────────

type Role = "dev" | "pub" | "both";

interface StudioIdentity {
  slug: string;
  name: string;
  role: Role;
  games: string[]; // Game display names this studio is associated with
  uid?: string;    // Firebase Auth UID (set during ensureAuthUser)
  logoUrl?: string;// Mirrored Firebase Storage URL (set during mirror phase)
  brandColor: string;
}

function buildStudioMap(): Map<string, StudioIdentity> {
  const map = new Map<string, StudioIdentity>();
  const touch = (rawName: string, role: "dev" | "pub", gameName: string) => {
    const slug = slugify(rawName);
    if (!slug) return;
    const existing = map.get(slug);
    if (existing) {
      if (existing.role !== role && existing.role !== "both") existing.role = "both";
      if (!existing.games.includes(gameName)) existing.games.push(gameName);
    } else {
      const brand = studioBrand(rawName);
      map.set(slug, {
        slug,
        name: rawName,
        role,
        games: [gameName],
        brandColor: brand?.brandColor ?? DEFAULT_BRAND_COLOR,
      });
    }
  };
  for (const seed of GAME_SEEDS) {
    touch(seed.developer, "dev", seed.name);
    touch(seed.publisher, "pub", seed.name);
  }
  return map;
}

// ────────────────────────────────────────────────────────────────────────────
// Auth: ensure user
// ────────────────────────────────────────────────────────────────────────────

async function ensureAuthUser(
  email: string,
  password: string,
  displayName: string,
): Promise<{ uid: string; created: boolean }> {
  // Idempotent: if the user exists, return its UID untouched. Never resets
  // password/displayName so manual changes are preserved.
  const auth = getAuth();
  try {
    const existing = await auth.getUserByEmail(email);
    return { uid: existing.uid, created: false };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== "auth/user-not-found") throw err;
    const created: UserRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });
    return { uid: created.uid, created: true };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Storage: mirror an external URL into our bucket. Idempotent — skips if the
// destination already exists.
// ────────────────────────────────────────────────────────────────────────────

function storagePublicUrl(path: string): string {
  return `https://storage.googleapis.com/${bucketName}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

const mirrorStats = { hits: 0, uploaded: 0, skipped: 0, failed: 0 };

async function mirrorToStorage(sourceUrl: string, destPath: string): Promise<string | null> {
  if (!sourceUrl) return null;
  const bucket = getStorage().bucket();
  const file = bucket.file(destPath);
  try {
    const [exists] = await file.exists();
    if (exists) {
      mirrorStats.hits += 1;
      return storagePublicUrl(destPath);
    }
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      mirrorStats.skipped += 1;
      console.warn(`  ⚠ ${destPath} <- ${res.status} from ${sourceUrl}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    await file.save(buf, {
      contentType,
      metadata: { cacheControl: "public, max-age=31536000, immutable" },
      public: true,
      resumable: false,
    });
    mirrorStats.uploaded += 1;
    return storagePublicUrl(destPath);
  } catch (err) {
    mirrorStats.failed += 1;
    console.warn(`  ⚠ ${destPath}: ${(err as Error).message}`);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Doc builders
// ────────────────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function defaultBranches(): AppBranch[] {
  const n = nowIso();
  return [
    { name: "default", updatedAt: n, description: "Public live build" },
    { name: "beta", updatedAt: n, description: "Opt-in beta channel" },
    { name: "internal", updatedAt: n, description: "Team-only test channel" },
  ];
}

function stripUndefinedDeep<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefinedDeep(v)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v === undefined) continue;
    out[k] = stripUndefinedDeep(v);
  }
  return out as T;
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length === 0) return true;
  return false;
}

interface FillResult {
  status: "created" | "updated" | "unchanged";
  fieldsAdded: string[];
}

/**
 * Fill-in-the-blanks merge. Reads the existing doc; only writes fields that
 * are missing/empty in the existing doc. Preserves user edits.
 *
 * Special cases:
 *   - `unionArrays`: arrays in this list get unioned (existing ∪ candidate)
 *     instead of fill-missing semantics. Used for `appIds` so the seed can
 *     add new games to a studio without erasing manually-linked ones.
 *   - If the doc doesn't exist at all, every non-undefined field from the
 *     candidate is written.
 *   - `updatedAt` is bumped only when something else actually changed.
 */
async function fillMissingDoc(
  ref: FirebaseFirestore.DocumentReference,
  candidate: Record<string, unknown>,
  opts?: { unionArrays?: string[] },
): Promise<FillResult> {
  const snap = await ref.get();
  const existing = snap.exists ? (snap.data() ?? {}) : {};
  const isNew = !snap.exists;
  const patch: Record<string, unknown> = {};
  const fieldsAdded: string[] = [];

  for (const [k, v] of Object.entries(candidate)) {
    if (v === undefined) continue;
    if (k === "updatedAt") continue; // handled at the end

    const cur = (existing as Record<string, unknown>)[k];

    if (opts?.unionArrays?.includes(k) && Array.isArray(v) && Array.isArray(cur)) {
      const union = Array.from(new Set([...(cur as unknown[]), ...v]));
      if (union.length !== cur.length) {
        patch[k] = union;
        fieldsAdded.push(k);
      }
      continue;
    }

    if (isNew || isEmpty(cur)) {
      patch[k] = v;
      fieldsAdded.push(k);
    }
  }

  if (Object.keys(patch).length === 0) {
    return { status: "unchanged", fieldsAdded: [] };
  }
  if ("updatedAt" in candidate) patch.updatedAt = candidate.updatedAt;
  await ref.set(patch, { merge: true });
  return { status: isNew ? "created" : "updated", fieldsAdded };
}

function buildAppFromDetail(
  detail: GameDetail,
  ownerUserId: string,
  releaseDate: string,
): App {
  const developerSlug = slugify(detail.developer);
  const publisherSlug = slugify(detail.publisher);
  return stripUndefinedDeep({
    id: detail.id,
    developerIds: [developerSlug],
    publisherIds: [publisherSlug],
    ownerUserId,
    stage: "released",

    gameTitle: detail.name,
    shortDescription: detail.shortDescription,
    longDescription: detail.longDescription,
    genres: detail.genres,
    tags: detail.tags,
    languages: detail.languages,
    ageRating: detail.ageRating?.rating ?? "Everyone",
    platforms: detail.platforms,
    features: detail.features,
    systemRequirements: detail.systemRequirements,

    coverUrl: detail.coverUrl,
    capsuleUrl: detail.capsuleUrl,
    headerUrl: detail.headerUrl,
    screenshots: detail.screenshots.map((s) => s.url),
    trailers: detail.trailers,

    releaseDate,
    releaseWindow: "morning",

    basePriceCents: detail.price.base,
    launchDiscountPct: detail.price.discountPct,
    pricesByRegion: detail.pricesByRegion,

    branches: defaultBranches(),
    achievementCount: detail.achievementCount,

    checklist: {
      capsuleArt: true,
      controllerSupport:
        detail.features.includes("controller-full") ||
        detail.features.includes("controller-partial"),
      cloudSaves: detail.features.includes("cloud-saves"),
      achievements: detail.features.includes("achievements"),
      newsPost: true,
    },

    submittedAt: releaseDate,
    createdAt: releaseDate,
    updatedAt: nowIso(),
  }) as App;
}

function buildDeveloperDoc(
  studio: StudioIdentity,
  appIds: string[],
): Developer {
  return stripUndefinedDeep({
    id: studio.slug,
    name: studio.name,
    ownerUserId: studio.uid!,
    brandColor: studio.brandColor,
    logoUrl: studio.logoUrl ?? "",
    tagline:
      studio.games.length === 1
        ? `Studio behind ${studio.games[0]}.`
        : `Studio behind ${studio.games.slice(0, -1).join(", ")} and ${studio.games[studio.games.length - 1]}.`,
    appIds,
    updatedAt: nowIso(),
  }) as Developer;
}

function buildPublisherDoc(
  studio: StudioIdentity,
  appIds: string[],
): Publisher {
  return stripUndefinedDeep({
    id: studio.slug,
    name: studio.name,
    ownerUserId: studio.uid!,
    brandColor: studio.brandColor,
    logoUrl: studio.logoUrl ?? "",
    tagline:
      studio.games.length === 1
        ? `Publisher of ${studio.games[0]}.`
        : `Publisher of ${studio.games.slice(0, -1).join(", ")} and ${studio.games[studio.games.length - 1]}.`,
    appIds,
    updatedAt: nowIso(),
  }) as Publisher;
}

// ────────────────────────────────────────────────────────────────────────────
// MOCK_USERS.md
// ────────────────────────────────────────────────────────────────────────────

function renderMockUsersMarkdown(studios: StudioIdentity[]): string {
  const sorted = [...studios].sort((a, b) => a.name.localeCompare(b.name));
  const rows = sorted
    .map((s) => {
      const email = `${s.slug}@${EMAIL_DOMAIN}`;
      const role =
        s.role === "both" ? "dev + pub" : s.role === "dev" ? "dev only" : "pub only";
      return `| ${s.name} | \`${email}\` | \`${SHARED_PASSWORD}\` | ${role} | ${s.games.join(", ")} |`;
    })
    .join("\n");
  return [
    "# Dreamworks mock studio accounts",
    "",
    `**Shared password:** \`${SHARED_PASSWORD}\``,
    "",
    "Sign in with any of these emails in the app to act as that studio's owner.",
    "Generated by `yarn seed:firebase` — do not edit by hand.",
    "",
    `_Total: ${studios.length} studio accounts._`,
    "",
    "| Studio | Email | Password | Role | Games |",
    "| --- | --- | --- | --- | --- |",
    rows,
    "",
  ].join("\n");
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  const startedAt = Date.now();
  initAdmin();
  console.log(`\nSeeding project: ${projectId}`);
  console.log(`Storage bucket : ${bucketName}\n`);

  const db = getFirestore();
  const studios = buildStudioMap();

  // ── Phase 1: Auth users ─────────────────────────────────────────────────
  let authCreated = 0;
  let authExisting = 0;
  let authFailed = 0;
  for (const studio of studios.values()) {
    const email = `${studio.slug}@${EMAIL_DOMAIN}`;
    try {
      const result = await ensureAuthUser(email, SHARED_PASSWORD, studio.name);
      studio.uid = result.uid;
      if (result.created) authCreated += 1;
      else authExisting += 1;
    } catch (err) {
      authFailed += 1;
      const code = (err as { code?: string }).code ?? "unknown";
      console.error(`  ✗ Auth ${email} [${code}]: ${(err as Error).message}`);
    }
  }
  console.log(
    `✓ Auth: ${authCreated + authExisting}/${studios.size} users ` +
      `(${authCreated} new, ${authExisting} existing, ${authFailed} failed)`,
  );
  if (authFailed === studios.size) {
    console.error(
      `\n❌ Every Auth user failed. The service account probably lacks the\n` +
        `   "Firebase Authentication Admin" IAM role. Grant it in Google Cloud\n` +
        `   Console → IAM → <serviceAccount> → Edit → Add Role.\n`,
    );
    process.exit(1);
  }

  // ── Phase 2: Mirror studio logos to Storage (parallel) ──────────────────
  await Promise.all(
    [...studios.values()].map(async (studio) => {
      const brand = studioBrand(studio.name);
      if (!brand?.logoUrl) return;
      const subdir = studio.role === "pub" ? COLLECTIONS.publishers : COLLECTIONS.developers;
      // For dev+pub studios we mirror under BOTH paths so each Creator
      // Homepage type renders from its own collection's logo.
      const targets =
        studio.role === "both"
          ? [`${COLLECTIONS.developers}/${studio.slug}/logo.png`, `${COLLECTIONS.publishers}/${studio.slug}/logo.png`]
          : [`${subdir}/${studio.slug}/logo.png`];
      const urls = await Promise.all(
        targets.map((t) => mirrorToStorage(brand.logoUrl, t)),
      );
      studio.logoUrl = urls.find((u) => u) ?? undefined;
    }),
  );
  console.log(
    `✓ Logos mirrored: ${mirrorStats.uploaded} new, ${mirrorStats.hits} reused, ` +
      `${mirrorStats.skipped} 404, ${mirrorStats.failed} failed`,
  );
  const logosBaseline = { ...mirrorStats };

  // ── Phase 3: Mirror app media to Storage (parallel across games) ────────
  const mirroredMedia = new Map<
    string,
    {
      coverUrl?: string;
      capsuleUrl?: string;
      headerUrl?: string;
      screenshots: string[];
    }
  >();
  await Promise.all(
    GAME_SEEDS.map(async (seed) => {
      const detail = buildGameDetail(seed.id);
      if (!detail) return;
      const id = seed.id;
      const [cover, capsule, header] = await Promise.all([
        mirrorToStorage(detail.coverUrl, `${COLLECTIONS.apps}/${id}/cover.jpg`),
        mirrorToStorage(detail.capsuleUrl, `${COLLECTIONS.apps}/${id}/capsule.jpg`),
        mirrorToStorage(detail.headerUrl, `${COLLECTIONS.apps}/${id}/header.jpg`),
      ]);
      const screenshots = (
        await Promise.all(
          detail.screenshots.map((s, i) =>
            mirrorToStorage(
              s.url,
              `${COLLECTIONS.apps}/${id}/screenshots/${String(i + 1).padStart(2, "0")}.jpg`,
            ),
          ),
        )
      ).filter((u): u is string => Boolean(u));
      mirroredMedia.set(id, {
        coverUrl: cover ?? undefined,
        capsuleUrl: capsule ?? undefined,
        headerUrl: header ?? undefined,
        screenshots,
      });
    }),
  );
  const appsDelta = {
    uploaded: mirrorStats.uploaded - logosBaseline.uploaded,
    hits: mirrorStats.hits - logosBaseline.hits,
    skipped: mirrorStats.skipped - logosBaseline.skipped,
    failed: mirrorStats.failed - logosBaseline.failed,
  };
  console.log(
    `✓ App media mirrored: ${appsDelta.uploaded} new, ${appsDelta.hits} reused, ` +
      `${appsDelta.skipped} 404, ${appsDelta.failed} failed`,
  );

  // ── Phase 4: dw_developers ──────────────────────────────────────────────
  const devAppsBySlug = new Map<string, string[]>();
  const pubAppsBySlug = new Map<string, string[]>();
  for (const seed of GAME_SEEDS) {
    const devSlug = slugify(seed.developer);
    const pubSlug = slugify(seed.publisher);
    devAppsBySlug.set(devSlug, [...(devAppsBySlug.get(devSlug) ?? []), seed.id]);
    pubAppsBySlug.set(pubSlug, [...(pubAppsBySlug.get(pubSlug) ?? []), seed.id]);
  }
  await writeFillPhase(COLLECTIONS.developers, devAppsBySlug, async (slug, appIds) => {
    const studio = studios.get(slug);
    if (!studio?.uid) return null;
    return {
      ref: db.collection(COLLECTIONS.developers).doc(slug),
      candidate: buildDeveloperDoc(studio, appIds) as unknown as Record<string, unknown>,
      unionArrays: ["appIds"],
    };
  });

  // ── Phase 5: dw_publishers ──────────────────────────────────────────────
  await writeFillPhase(COLLECTIONS.publishers, pubAppsBySlug, async (slug, appIds) => {
    const studio = studios.get(slug);
    if (!studio?.uid) return null;
    return {
      ref: db.collection(COLLECTIONS.publishers).doc(slug),
      candidate: buildPublisherDoc(studio, appIds) as unknown as Record<string, unknown>,
      unionArrays: ["appIds"],
    };
  });

  // ── Phase 6: dw_apps + dw_games (per game, both writes side-by-side) ────
  const appsTally = { created: 0, updated: 0, unchanged: 0, failed: 0 };
  const gamesTally = { created: 0, updated: 0, unchanged: 0, failed: 0 };
  for (const seed of GAME_SEEDS) {
    const detail = buildGameDetail(seed.id);
    if (!detail) {
      console.warn(`  ⚠ Skipping ${seed.id}: buildGameDetail returned undefined`);
      continue;
    }
    const devStudio = studios.get(slugify(seed.developer));
    if (!devStudio?.uid) {
      console.warn(`  ⚠ Skipping ${seed.id}: missing developer studio "${seed.developer}"`);
      continue;
    }

    // Swap in mirrored URLs so docs never reference the external Steam CDN.
    const mirrored = mirroredMedia.get(seed.id);
    const finalDetail: GameDetail = stripUndefinedDeep({
      ...detail,
      coverUrl: mirrored?.coverUrl ?? detail.coverUrl,
      capsuleUrl: mirrored?.capsuleUrl ?? detail.capsuleUrl,
      headerUrl: mirrored?.headerUrl ?? detail.headerUrl,
      screenshots:
        mirrored && mirrored.screenshots.length > 0
          ? mirrored.screenshots.map((url) => ({ url, thumbUrl: url }))
          : detail.screenshots,
    });
    const app = buildAppFromDetail(finalDetail, devStudio.uid, seed.releaseDate);

    try {
      const r = await fillMissingDoc(
        db.collection(COLLECTIONS.apps).doc(seed.id),
        app as unknown as Record<string, unknown>,
      );
      appsTally[r.status] += 1;
    } catch (err) {
      appsTally.failed += 1;
      console.error(`  ✗ ${COLLECTIONS.apps}/${seed.id}: ${(err as Error).message}`);
    }
    try {
      const r = await fillMissingDoc(
        db.collection(COLLECTIONS.games).doc(seed.id),
        stripUndefinedDeep(finalDetail) as unknown as Record<string, unknown>,
      );
      gamesTally[r.status] += 1;
    } catch (err) {
      gamesTally.failed += 1;
      console.error(`  ✗ ${COLLECTIONS.games}/${seed.id}: ${(err as Error).message}`);
    }
  }
  logTally(COLLECTIONS.apps, appsTally, GAME_SEEDS.length);
  logTally(COLLECTIONS.games, gamesTally, GAME_SEEDS.length);

  // ── Phase 6b: dw_meta/catalog.version ───────────────────────────────────
  // Clients hold a 30-min sessionStorage catalog snapshot keyed by version.
  // Bumping this field tells every open tab on the next storefront fetch
  // that its cache is stale, so users see the freshly-seeded data without
  // having to clear sessionStorage by hand.
  const catalogVersion = Date.now();
  try {
    await db.collection("dw_meta").doc("catalog").set(
      {
        version: catalogVersion,
        seededAt: nowIso(),
        games: GAME_SEEDS.length,
      },
      { merge: true },
    );
    console.log(`✓ dw_meta/catalog: version=${catalogVersion}`);
  } catch (err) {
    console.error(`  ✗ dw_meta/catalog: ${(err as Error).message}`);
  }

  // ── Phase 6c: live ops + marketing seeds ─────────────────────────────────
  // Pre-populates the developer portal (and the public Game Detail page) with
  // realistic announcements, live events, and a handful of promo campaigns so
  // the new Analytics/Marketing/Live Ops tabs aren't empty on first load.
  await seedLiveOpsAndMarketing(studios);

  // ── Phase 6d: dw_config (admin-tunable enums) ────────────────────────────
  // Countries, languages, payment brands, family relationships, … — every
  // dropdown the storefront renders is fed from here so an admin can add a
  // new market or supported language without a code release.
  await seedConfig();

  // ── Phase 6e: Catalog/community data (categories, tags, news, etc.) ──────
  // Static or slow-moving content that the storefront pulls without auth.
  // Previously auto-seeded by `ensureXSeeded()` helpers — now pre-populated
  // here so the app reads pure Firestore at runtime.
  await seedCatalogAndCommunity(studios);

  // ── Phase 7: MOCK_USERS.md ──────────────────────────────────────────────
  const ownedStudios = [...studios.values()].filter((s) => s.uid);
  writeFileSync(MOCK_USERS_MD_PATH, renderMockUsersMarkdown(ownedStudios), "utf-8");
  console.log(`✓ MOCK_USERS.md written (${ownedStudios.length} rows)`);

  console.log(`\nDone in ${((Date.now() - startedAt) / 1000).toFixed(1)}s\n`);
}

interface WritePlan {
  ref: FirebaseFirestore.DocumentReference;
  candidate: Record<string, unknown>;
  unionArrays?: string[];
}

type Tally = { created: number; updated: number; unchanged: number; failed: number };

function logTally(label: string, tally: Tally, total: number): void {
  const ok = tally.created + tally.updated + tally.unchanged;
  console.log(
    `✓ ${label}: ${ok}/${total} docs ` +
      `(${tally.created} created, ${tally.updated} filled, ` +
      `${tally.unchanged} unchanged, ${tally.failed} failed)`,
  );
}

/**
 * Fill-in-the-blanks write phase. The planner returns either a WritePlan or
 * null (to skip that entry). Each write reads the existing doc and only adds
 * missing fields — manual edits in Firestore are preserved across re-runs.
 */
async function writeFillPhase<K, V>(
  label: string,
  entries: Map<K, V>,
  planner: (k: K, v: V) => Promise<WritePlan | null>,
): Promise<void> {
  const tally: Tally = { created: 0, updated: 0, unchanged: 0, failed: 0 };
  for (const [k, v] of entries) {
    const plan = await planner(k, v);
    if (!plan) continue;
    try {
      const r = await fillMissingDoc(plan.ref, plan.candidate, {
        unionArrays: plan.unionArrays,
      });
      tally[r.status] += 1;
    } catch (err) {
      tally.failed += 1;
      console.error(`  ✗ ${label}/${String(k)}: ${(err as Error).message}`);
    }
  }
  logTally(label, tally, entries.size);
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 6c: live-ops and marketing content
// ────────────────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

function daysFromNowIso(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

async function seedLiveOpsAndMarketing(
  studios: Map<string, StudioIdentity>,
): Promise<void> {
  const db = getFirestore();
  const annTally: Tally = { created: 0, updated: 0, unchanged: 0, failed: 0 };
  const evtTally: Tally = { created: 0, updated: 0, unchanged: 0, failed: 0 };
  const promoTally: Tally = { created: 0, updated: 0, unchanged: 0, failed: 0 };

  let promoCount = 0;
  for (let i = 0; i < GAME_SEEDS.length; i++) {
    const seed = GAME_SEEDS[i];
    const appId = seed.id;
    const ownerSlug = slugify(seed.developer);
    const studio = studios.get(ownerSlug);
    const ownerUserId = studio?.uid ?? "system-seed";

    // 3 announcements per app: launch news, two patches.
    const announcements = [
      {
        id: `${appId}-launch`,
        category: "news" as const,
        title: `${seed.name} is now available`,
        body: `Years in the making — ${seed.name} is live worldwide today. Thanks to everyone who wishlisted, played the demo, and shared feedback in our Discord. See you in-game.`,
        publishedAt: daysAgoIso(85),
      },
      {
        id: `${appId}-patch-1`,
        category: "patch" as const,
        title: "Patch 1.1 — Balance and quality of life",
        body: "• Reduced grind for late-game crafting recipes.\n• Improved enemy AI in mid-game zones.\n• Fixed a crash when alt-tabbing during cutscenes.\n• Localization fixes for German and Brazilian Portuguese.",
        publishedAt: daysAgoIso(45),
      },
      {
        id: `${appId}-patch-2`,
        category: "patch" as const,
        title: "Patch 1.2 — Spring update",
        body: "A new biome, two questlines, and a cosmetic event. Full notes on our news hub. Save backups recommended before updating.",
        publishedAt: daysAgoIso(12),
        pinnedUntil: i % 3 === 0 ? daysFromNowIso(7) : undefined,
      },
    ];

    for (const a of announcements) {
      const ref = db.collection("dw_announcements").doc(a.id);
      const candidate: Record<string, unknown> = {
        id: a.id,
        appId,
        authorUserId: ownerUserId,
        category: a.category,
        title: a.title,
        body: a.body,
        publishedAt: a.publishedAt,
        pinnedUntil: a.pinnedUntil,
        createdAt: a.publishedAt,
        updatedAt: nowIso(),
      };
      try {
        const r = await fillMissingDoc(ref, candidate);
        annTally[r.status] += 1;
      } catch (err) {
        annTally.failed += 1;
        console.error(`  ✗ dw_announcements/${a.id}: ${(err as Error).message}`);
      }
    }

    // 2 live events per app: one recently ended, one upcoming.
    const events = [
      {
        id: `${appId}-event-free-weekend`,
        kind: "free-weekend" as const,
        title: "Free Weekend",
        description: `Play ${seed.name} free for 72 hours. Progress carries over to a full purchase.`,
        startsAt: daysAgoIso(7),
        endsAt: daysAgoIso(4),
      },
      {
        id: `${appId}-event-double-xp`,
        kind: "double-xp" as const,
        title: "Double XP Week",
        description: "All XP gains are doubled across every game mode.",
        startsAt: daysFromNowIso(3),
        endsAt: daysFromNowIso(10),
      },
    ];

    for (const e of events) {
      const ref = db.collection("dw_live_events").doc(e.id);
      const candidate: Record<string, unknown> = {
        id: e.id,
        appId,
        kind: e.kind,
        title: e.title,
        description: e.description,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      try {
        const r = await fillMissingDoc(ref, candidate);
        evtTally[r.status] += 1;
      } catch (err) {
        evtTally.failed += 1;
        console.error(`  ✗ dw_live_events/${e.id}: ${(err as Error).message}`);
      }
    }

    // ~30% of apps get an active promo campaign.
    if (i % 3 === 0) {
      const id = `${appId}-spring-sale`;
      const ref = db.collection("dw_promo_campaigns").doc(id);
      const startsAt = daysAgoIso(3);
      const endsAt = daysFromNowIso(11);
      const candidate: Record<string, unknown> = {
        id,
        appId,
        name: "Spring Sale",
        discountPct: 25,
        startsAt,
        endsAt,
        status: "active",
        createdAt: nowIso(),
      };
      try {
        const r = await fillMissingDoc(ref, candidate);
        promoTally[r.status] += 1;
        promoCount += 1;
      } catch (err) {
        promoTally.failed += 1;
        console.error(`  ✗ dw_promo_campaigns/${id}: ${(err as Error).message}`);
      }
    }
  }

  logTally("dw_announcements", annTally, GAME_SEEDS.length * 3);
  logTally("dw_live_events", evtTally, GAME_SEEDS.length * 2);
  logTally("dw_promo_campaigns", promoTally, promoCount);
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 6d: dw_config — admin-tunable enums and i18n strings
// ────────────────────────────────────────────────────────────────────────────

type ConfigLabel = { en: string } & Partial<Record<string, string>>;
interface ConfigEntry {
  id: string;
  labels: ConfigLabel;
  sortOrder: number;
  enabled: boolean;
  meta?: Record<string, unknown>;
}

/**
 * Convenience helper: build a flat list of ConfigEntries from a `{id, en}`
 * shape so the data tables below stay compact. Locale labels can be added per
 * entry via the optional `more` map.
 */
function buildEntries(
  rows: Array<{
    id: string;
    en: string;
    more?: Partial<Record<string, string>>;
    meta?: Record<string, unknown>;
  }>,
): ConfigEntry[] {
  return rows.map((r, i) => ({
    id: r.id,
    labels: { en: r.en, ...(r.more ?? {}) },
    sortOrder: i,
    enabled: true,
    meta: r.meta,
  }));
}

async function seedConfig(): Promise<void> {
  const db = getFirestore();
  const updatedAt = nowIso();
  const tally: Tally = { created: 0, updated: 0, unchanged: 0, failed: 0 };

  const writeConfig = async (id: string, payload: Record<string, unknown>) => {
    const ref = db.collection("dw_config").doc(id);
    try {
      const r = await fillMissingDoc(ref, { id, ...payload, updatedAt });
      tally[r.status] += 1;
    } catch (err) {
      tally.failed += 1;
      console.error(`  ✗ dw_config/${id}: ${(err as Error).message}`);
    }
  };

  // Countries — ISO-3166-1 alpha-2, ordered by population/market relevance.
  await writeConfig("countries", {
    entries: buildEntries([
      { id: "US", en: "United States" },
      { id: "GB", en: "United Kingdom" },
      { id: "CA", en: "Canada" },
      { id: "AU", en: "Australia" },
      { id: "IN", en: "India" },
      { id: "DE", en: "Germany", more: { de: "Deutschland", fr: "Allemagne", es: "Alemania" } },
      { id: "FR", en: "France", more: { fr: "France", de: "Frankreich", es: "Francia" } },
      { id: "ES", en: "Spain", more: { es: "España", fr: "Espagne", de: "Spanien" } },
      { id: "IT", en: "Italy", more: { it: "Italia" } },
      { id: "PT", en: "Portugal", more: { pt: "Portugal" } },
      { id: "BR", en: "Brazil", more: { pt: "Brasil", es: "Brasil" } },
      { id: "MX", en: "Mexico", more: { es: "México" } },
      { id: "AR", en: "Argentina", more: { es: "Argentina" } },
      { id: "CL", en: "Chile", more: { es: "Chile" } },
      { id: "CO", en: "Colombia", more: { es: "Colombia" } },
      { id: "JP", en: "Japan", more: { ja: "日本" } },
      { id: "KR", en: "South Korea", more: { ko: "대한민국" } },
      { id: "CN", en: "China", more: { zh: "中国" } },
      { id: "TW", en: "Taiwan", more: { zh: "台灣" } },
      { id: "HK", en: "Hong Kong" },
      { id: "SG", en: "Singapore" },
      { id: "MY", en: "Malaysia" },
      { id: "TH", en: "Thailand" },
      { id: "VN", en: "Vietnam" },
      { id: "ID", en: "Indonesia" },
      { id: "PH", en: "Philippines" },
      { id: "NZ", en: "New Zealand" },
      { id: "NL", en: "Netherlands" },
      { id: "BE", en: "Belgium" },
      { id: "CH", en: "Switzerland" },
      { id: "AT", en: "Austria" },
      { id: "SE", en: "Sweden" },
      { id: "NO", en: "Norway" },
      { id: "DK", en: "Denmark" },
      { id: "FI", en: "Finland" },
      { id: "IE", en: "Ireland" },
      { id: "PL", en: "Poland" },
      { id: "CZ", en: "Czechia" },
      { id: "RO", en: "Romania" },
      { id: "HU", en: "Hungary" },
      { id: "GR", en: "Greece" },
      { id: "TR", en: "Türkiye" },
      { id: "IL", en: "Israel" },
      { id: "AE", en: "United Arab Emirates" },
      { id: "SA", en: "Saudi Arabia" },
      { id: "ZA", en: "South Africa" },
      { id: "EG", en: "Egypt" },
      { id: "NG", en: "Nigeria" },
      { id: "KE", en: "Kenya" },
      { id: "RU", en: "Russia" },
      { id: "UA", en: "Ukraine" },
    ]),
  });

  // Languages — supported app locales. `meta.nativeName` is shown in the
  // language switcher so users see "Français" rather than "French".
  await writeConfig("languages", {
    entries: buildEntries([
      { id: "en", en: "English", meta: { nativeName: "English" } },
      { id: "es", en: "Spanish", more: { es: "Español" }, meta: { nativeName: "Español" } },
      { id: "fr", en: "French", more: { fr: "Français" }, meta: { nativeName: "Français" } },
      { id: "de", en: "German", more: { de: "Deutsch" }, meta: { nativeName: "Deutsch" } },
      { id: "pt-BR", en: "Portuguese (Brazil)", more: { pt: "Português (Brasil)" }, meta: { nativeName: "Português (BR)" } },
      { id: "pt-PT", en: "Portuguese (Portugal)", more: { pt: "Português (Portugal)" }, meta: { nativeName: "Português (PT)" } },
      { id: "it", en: "Italian", more: { it: "Italiano" }, meta: { nativeName: "Italiano" } },
      { id: "ja", en: "Japanese", more: { ja: "日本語" }, meta: { nativeName: "日本語" } },
      { id: "ko", en: "Korean", more: { ko: "한국어" }, meta: { nativeName: "한국어" } },
      { id: "zh-CN", en: "Chinese (Simplified)", more: { zh: "简体中文" }, meta: { nativeName: "简体中文" } },
      { id: "zh-TW", en: "Chinese (Traditional)", more: { zh: "繁體中文" }, meta: { nativeName: "繁體中文" } },
      { id: "ru", en: "Russian", more: { ru: "Русский" }, meta: { nativeName: "Русский" } },
      { id: "pl", en: "Polish", meta: { nativeName: "Polski" } },
      { id: "tr", en: "Turkish", meta: { nativeName: "Türkçe" } },
      { id: "ar", en: "Arabic", meta: { nativeName: "العربية" } },
      { id: "hi", en: "Hindi", meta: { nativeName: "हिन्दी" } },
      { id: "th", en: "Thai", meta: { nativeName: "ภาษาไทย" } },
      { id: "vi", en: "Vietnamese", meta: { nativeName: "Tiếng Việt" } },
      { id: "nl", en: "Dutch", meta: { nativeName: "Nederlands" } },
      { id: "sv", en: "Swedish", meta: { nativeName: "Svenska" } },
    ]),
  });

  // Payment card brands — accepted on the checkout page.
  // IDs must match the `PaymentBrand` union in `src/lib/types.ts` until the
  // union is liberalized; new brands require both a seed entry and a type
  // edit so the cart/checkout flows stay type-safe.
  await writeConfig("card_brands", {
    entries: buildEntries([
      { id: "Visa", en: "Visa" },
      { id: "Mastercard", en: "Mastercard" },
      { id: "Amex", en: "American Express", more: { es: "American Express" } },
      { id: "Discover", en: "Discover" },
    ]),
  });

  // Family relationships — labels for the family member picker. IDs match
  // the `FamilyRelationship` string-union in `src/lib/types.ts`; translations
  // are layered on top so the picker localizes without losing type safety.
  await writeConfig("family_relationships", {
    entries: buildEntries([
      { id: "Sister", en: "Sister", more: { es: "Hermana", fr: "Sœur", de: "Schwester", ja: "姉妹", ko: "자매" } },
      { id: "Brother", en: "Brother", more: { es: "Hermano", fr: "Frère", de: "Bruder", ja: "兄弟", ko: "형제" } },
      { id: "Mother", en: "Mother", more: { es: "Madre", fr: "Mère", de: "Mutter", ja: "母", ko: "어머니" } },
      { id: "Father", en: "Father", more: { es: "Padre", fr: "Père", de: "Vater", ja: "父", ko: "아버지" } },
      { id: "Spouse", en: "Spouse", more: { es: "Cónyuge", fr: "Conjoint(e)", de: "Ehepartner", ja: "配偶者", ko: "배우자" } },
      { id: "Child", en: "Child", more: { es: "Hijo/Hija", fr: "Enfant", de: "Kind", ja: "子供", ko: "자녀" } },
      { id: "Friend", en: "Friend", more: { es: "Amigo/Amiga", fr: "Ami(e)", de: "Freund(in)", ja: "友達", ko: "친구" } },
      { id: "Other", en: "Other", more: { es: "Otro", fr: "Autre", de: "Andere", ja: "その他", ko: "기타" } },
    ]),
  });

  // LFG session types — populates the looking-for-group filter dropdown.
  // IDs use the display label so they round-trip into the `lfgPost.type` field
  // unchanged. Adding a new locale to an existing entry is safe; renaming an
  // ID would orphan historical posts, so introduce new entries instead.
  await writeConfig("lfg_session_types", {
    entries: buildEntries([
      { id: "Co-op", en: "Co-op", more: { es: "Cooperativo", fr: "Coopératif", de: "Koop", ja: "協力", ko: "협동" } },
      { id: "Ranked", en: "Ranked", more: { es: "Clasificatorio", fr: "Classé", de: "Rangliste", ja: "ランク", ko: "랭크" } },
      { id: "Raid", en: "Raid", more: { es: "Incursión", fr: "Raid", de: "Raid", ja: "レイド", ko: "레이드" } },
      { id: "Campaign", en: "Campaign", more: { es: "Campaña", fr: "Campagne", de: "Kampagne", ja: "キャンペーン", ko: "캠페인" } },
      { id: "Trade", en: "Trade", more: { es: "Intercambio", fr: "Échange", de: "Handel", ja: "取引", ko: "거래" } },
      { id: "Achievement", en: "Achievement Hunt", more: { es: "Logros", fr: "Succès", de: "Erfolge", ja: "実績", ko: "도전과제" } },
    ]),
  });

  // Announcement categories — patch, event, news, maintenance.
  // `meta.tone` drives the badge color in AnnouncementsCard.
  await writeConfig("announcement_kinds", {
    entries: buildEntries([
      { id: "patch", en: "Patch", more: { es: "Parche", fr: "Correctif", de: "Patch", ja: "パッチ", ko: "패치" }, meta: { tone: "cyan" } },
      { id: "event", en: "Event", more: { es: "Evento", fr: "Événement", de: "Event", ja: "イベント", ko: "이벤트" }, meta: { tone: "acid" } },
      { id: "news", en: "News", more: { es: "Noticias", fr: "Actualités", de: "Neuigkeiten", ja: "ニュース", ko: "뉴스" }, meta: { tone: "green" } },
      { id: "maintenance", en: "Maintenance", more: { es: "Mantenimiento", fr: "Maintenance", de: "Wartung", ja: "メンテナンス", ko: "점검" }, meta: { tone: "orange" } },
    ]),
  });

  // Social platforms — outbound marketing channels for the developer portal.
  // IDs match the `SocialPlatform` union in `src/lib/types.ts`; expanding the
  // list requires both a new entry here and a corresponding union member.
  await writeConfig("social_platforms", {
    entries: buildEntries([
      { id: "twitter", en: "Twitter / X", meta: { icon: "twitter", color: "text-foreground" } },
      { id: "discord", en: "Discord", meta: { icon: "message-circle", color: "text-cyan" } },
      { id: "bluesky", en: "Bluesky", meta: { icon: "cloud", color: "text-acid" } },
    ]),
  });

  // External gaming platforms — for the "Linked platforms" settings card.
  // IDs match the `LinkedPlatformId` union in `src/lib/types.ts`. `meta.bg`
  // is a Tailwind arbitrary-value class so admins can adjust without code.
  await writeConfig("platforms", {
    entries: buildEntries([
      { id: "psn", en: "PlayStation Network", meta: { badge: "PSN", bg: "bg-[#00439C]" } },
      { id: "xbox-live", en: "Xbox Live", meta: { badge: "XBL", bg: "bg-[#107C10]" } },
      { id: "steam", en: "Steam", meta: { badge: "STM", bg: "bg-[#171a21]" } },
      { id: "epic", en: "Epic Games", meta: { badge: "EPC", bg: "bg-[#313131]" } },
    ]),
  });

  // Notification kinds — settings page toggles and notification panel filters.
  // IDs match the `NotificationKind` union in `src/lib/types.ts`.
  await writeConfig("notification_kinds", {
    entries: buildEntries([
      {
        id: "wishlist-alert",
        en: "Wishlist price alerts",
        meta: {
          icon: "tag",
          category: "wishlist",
          defaultEnabled: true,
          description: { en: "When a wishlisted game hits your threshold." },
        },
      },
      {
        id: "sale-ending",
        en: "Sale ending reminders",
        meta: {
          icon: "calendar",
          category: "wishlist",
          defaultEnabled: true,
          description: { en: "24-hour warning before a wishlisted sale ends." },
        },
      },
      {
        id: "friend-activity",
        en: "Friend activity",
        meta: {
          icon: "users",
          category: "friends",
          defaultEnabled: true,
          description: { en: "When friends play or review games you care about." },
        },
      },
      {
        id: "achievement-unlock",
        en: "Achievement unlocks",
        meta: {
          icon: "trophy",
          category: "other",
          defaultEnabled: true,
          description: { en: "Celebrate every milestone in your library." },
        },
      },
      {
        id: "library-import",
        en: "Library imports",
        meta: {
          icon: "download",
          category: "other",
          defaultEnabled: true,
          description: { en: "After a purchase or launcher scan finishes." },
        },
      },
      {
        id: "system",
        en: "Dreamworks announcements",
        meta: {
          icon: "settings",
          category: "system",
          defaultEnabled: true,
          description: { en: "Release notes, status updates, platform news." },
        },
      },
    ]),
  });

  // Telemetry scaffold cards — placeholder dashboard tiles until a real
  // telemetry pipeline lands per app.
  await writeConfig("telemetry_scaffold", {
    entries: buildEntries([
      {
        id: "session-length",
        en: "Median session length",
        meta: {
          icon: "clock",
          description: { en: "Time spent in a single play session, p50 across the last 30 days." },
        },
      },
      {
        id: "hardware-mix",
        en: "Hardware mix",
        meta: {
          icon: "cpu",
          description: { en: "GPU / CPU / RAM distribution of active players." },
        },
      },
      {
        id: "crash-dumps",
        en: "Crash dumps",
        meta: {
          icon: "alert-triangle",
          description: { en: "Crashes per 1000 sessions, bucketed by client version." },
        },
      },
      {
        id: "anr-rate",
        en: "ANR / freeze rate",
        meta: {
          icon: "activity",
          description: { en: "Application-not-responding incidents per 1000 sessions." },
        },
      },
    ]),
  });

  // Rejection reasons — admin moderation modal. Reason IDs match the
  // `SubmissionRejectionReason` union in `src/lib/types.ts` so payloads
  // round-trip into `dw_moderation_records` without translation.
  await writeConfig("rejection_reasons", {
    categoryGroups: [
      {
        id: "visual",
        label: { en: "Visual accuracy" },
        reasons: [
          { id: "capsule_art_missing", label: { en: "Capsule art missing" } },
          { id: "capsule_art_low_quality", label: { en: "Capsule art low quality" } },
          { id: "screenshots_insufficient", label: { en: "Screenshots insufficient" } },
          { id: "screenshots_misleading", label: { en: "Screenshots misleading" } },
          { id: "trailer_broken", label: { en: "Trailer broken / unplayable" } },
          { id: "trailer_misleading", label: { en: "Trailer misleading" } },
        ],
      },
      {
        id: "technical",
        label: { en: "Technical stability" },
        reasons: [
          { id: "build_missing", label: { en: "No live build on default branch" } },
          { id: "build_unverified", label: { en: "Build unverified" } },
          { id: "build_crashes", label: { en: "Build crashes / fails to launch" } },
        ],
      },
      {
        id: "metadata",
        label: { en: "Metadata & descriptions" },
        reasons: [
          { id: "description_too_short", label: { en: "Description too short" } },
          { id: "description_misleading", label: { en: "Description misleading" } },
          { id: "description_prohibited_content", label: { en: "Prohibited content in description" } },
          { id: "age_rating_mismatch", label: { en: "Age rating mismatch" } },
          { id: "tags_misleading", label: { en: "Tags misleading" } },
          { id: "metadata_incomplete", label: { en: "Metadata incomplete" } },
        ],
      },
      {
        id: "pricing",
        label: { en: "Pricing & release" },
        reasons: [
          { id: "pricing_outside_band", label: { en: "Pricing outside accepted band" } },
          { id: "release_date_invalid", label: { en: "Release date invalid" } },
        ],
      },
      {
        id: "policy",
        label: { en: "Policy" },
        reasons: [
          { id: "policy_violation", label: { en: "Policy violation" } },
          { id: "ip_infringement", label: { en: "IP infringement" } },
          { id: "duplicate_submission", label: { en: "Duplicate submission" } },
          { id: "other", label: { en: "Other (specify in notes)" } },
        ],
      },
    ],
    assetFields: [
      { id: "capsuleUrl", label: { en: "Capsule art" } },
      { id: "headerUrl", label: { en: "Header art" } },
      { id: "coverUrl", label: { en: "Cover art" } },
      { id: "screenshots", label: { en: "Screenshot" } },
      { id: "trailers", label: { en: "Trailer" } },
      { id: "shortDescription", label: { en: "Short description" } },
      { id: "longDescription", label: { en: "Long description" } },
      { id: "ageRating", label: { en: "Age rating" } },
      { id: "latestBuildId", label: { en: "Build" } },
      { id: "pricing", label: { en: "Pricing" } },
    ],
  });

  logTally("dw_config", tally, 11);
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 6e: catalog + community seed data
// ────────────────────────────────────────────────────────────────────────────
//
// One function per former `ensureXSeeded()` so each collection has a clear
// home and a separate tally line in the seed output. All writes are
// fill-missing-doc so manual edits in the console are preserved on re-run.

async function seedCatalogAndCommunity(
  studios: Map<string, StudioIdentity>,
): Promise<void> {
  const db = getFirestore();

  // dw_categories — keyed by slug.
  await seedById(db, "dw_categories", CATEGORIES, (c) => c.slug);

  // dw_tags — keyed by slug.
  await seedById(db, "dw_tags", TAGS, (t) => t.slug);

  // dw_themes — keyed by id.
  await seedById(db, "dw_themes", THEME_SEEDS, (t) => t.id);

  // dw_controller_layouts — keyed by id.
  await seedById(db, "dw_controller_layouts", CONTROLLER_LAYOUT_SEEDS, (l) => l.id);

  // dw_workshop_mods — keyed by id.
  await seedById(db, "dw_workshop_mods", WORKSHOP_MODS, (m) => m.id);

  // dw_lfg_posts — keyed by id.
  await seedById(db, "dw_lfg_posts", LFG_BOARD_SEED_POSTS, (p) => p.id);

  // dw_lfg_guides — keyed by id.
  await seedById(db, "dw_lfg_guides", LFG_BOARD_SEED_GUIDES, (g) => g.id);

  // dw_lfg_groups — Phase 4 collection; keyed by id (synthetic from index).
  await seedById(db, "dw_lfg_groups", LFG_GROUPS, (g, i) => `lfg-group-${i + 1}`);

  // dw_follow_suggestions — keyed by handle (sans the leading `@`).
  await seedById(db, "dw_follow_suggestions", FOLLOW_SUGGESTIONS, (s) =>
    s.handle.replace(/^@/, ""),
  );

  // dw_news — keyed by slug.
  await seedById(db, "dw_news", NEWS, (a) => a.slug);

  // dw_feed — social posts keyed by id, with empty interaction arrays.
  await seedById(
    db,
    "dw_feed",
    SEED_POSTS,
    (p) => p.id,
    (p) => ({
      ...p,
      likedBy: [] as string[],
      repostedBy: [] as string[],
      replies: p.replies ?? [],
    }),
  );

  // dw_post_image_presets — used by the post composer for one-tap art.
  // Synthesize stable IDs from the label (presets have no native id).
  await seedById(db, "dw_post_image_presets", PRESET_POST_IMAGES, (p) =>
    slugify(p.label),
  );

  // dw_forum_threads — keyed by id.
  await seedById(db, "dw_forum_threads", SEED_THREADS, (t) => t.id);

  // dw_forum_replies — keyed by id, batched 300 at a time (Firestore caps
  // batches at 500 writes; doc reads inside `fillMissingDoc` consume slots).
  await seedById(db, "dw_forum_replies", SEED_REPLIES, (r) => r.id);

  // dw_reviews — derived per-game by the mock review builder. Each review
  // already carries its own id from the builder.
  const allReviews = GAME_SEEDS.flatMap((seed) => buildReviewsForGame(seed.id));
  await seedById(db, "dw_reviews", allReviews, (r) => r.id);

  // dw_friends — social graph (per-user keyed by uid).
  await seedById(db, "dw_friends", FRIENDS, (f) => f.uid);

  // dw_friend_activity — keyed by `${uid}_${timestamp}` so the same friend
  // can have multiple activity entries without doc collisions.
  await seedById(
    db,
    "dw_friend_activity",
    FRIEND_ACTIVITY,
    (a) => `${a.uid}_${a.at}`,
  );

  // dw_friend_owned — one doc per friend listing the games they own.
  const friendOwnedEntries = Object.entries(FRIEND_OWNED).map(
    ([uid, gameIds]) => ({ uid, gameIds }),
  );
  await seedById(db, "dw_friend_owned", friendOwnedEntries, (e) => e.uid);

  // dw_speedrun_runs — leaderboard entries. Synthetic id from rank+player.
  await seedById(
    db,
    "dw_speedrun_runs",
    SPEEDRUN_RUNS,
    (r) => `${slugify(r.player)}-${r.rank}`,
  );

  // dw_cosmetics — Phase 6 wardrobe catalog. Inline seed since the data is
  // small and previously lived in the component.
  const cosmetics: Cosmetic[] = [
    {
      id: "neon-visor",
      name: "Neon Visor",
      game: "Cyber Strike",
      rarity: "legendary",
      slot: "head",
    },
    {
      id: "n7-hoodie",
      name: "N7 Hoodie",
      game: "Space Explorer",
      rarity: "epic",
      slot: "body",
    },
    {
      id: "dragon-wings",
      name: "Dragon Wings",
      game: "Fantasy Quest",
      rarity: "mythic",
      slot: "back",
    },
    {
      id: "pixel-glasses",
      name: "Pixel Glasses",
      game: "Retro Dash",
      rarity: "rare",
      slot: "head",
    },
    {
      id: "speedrun-medallion",
      name: "Speedrun Medallion",
      game: "Velocity",
      rarity: "epic",
      slot: "trinket",
    },
    {
      id: "obsidian-boots",
      name: "Obsidian Boots",
      game: "Volcano Trail",
      rarity: "rare",
      slot: "feet",
    },
  ];
  await seedById(db, "dw_cosmetics", cosmetics, (c) => c.id);

  // dw_notifications — seed one entry per studio owner so signed-in users on
  // a fresh project see something in the bell. Keyed by ${uid}__${seedId} so
  // the same template can apply to multiple users without collision.
  const notifEntries = [...studios.values()]
    .filter((s): s is StudioIdentity & { uid: string } => Boolean(s.uid))
    .flatMap((studio) =>
      SEED_NOTIFICATIONS.map((seed) => ({
        ...seed,
        id: `${studio.uid}__${seed.id}`,
        userId: studio.uid,
      })),
    );
  await seedById(db, "dw_notifications", notifEntries, (n) => n.id);
}

/**
 * Generic fill-missing seeder. Accepts an array of source items, a key
 * extractor, and an optional doc-shape transform. Emits one tally line.
 */
async function seedById<T>(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
  items: readonly T[],
  keyOf: (item: T, index: number) => string,
  shape: (item: T) => Record<string, unknown> = (item) =>
    item as unknown as Record<string, unknown>,
): Promise<void> {
  const tally: Tally = { created: 0, updated: 0, unchanged: 0, failed: 0 };
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const id = keyOf(item, i);
    if (!id) continue;
    const ref = db.collection(collectionName).doc(id);
    try {
      const r = await fillMissingDoc(ref, shape(item));
      tally[r.status] += 1;
    } catch (err) {
      tally.failed += 1;
      console.error(`  ✗ ${collectionName}/${id}: ${(err as Error).message}`);
    }
  }
  logTally(collectionName, tally, items.length);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  process.exit(1);
});
