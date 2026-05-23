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
import { slugify } from "../src/lib/utils.js";
import { studioBrand } from "../src/lib/studio-logos.js";
import type {
  App,
  AppBranch,
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
  await seedLiveOpsAndMarketing();

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

async function seedLiveOpsAndMarketing(): Promise<void> {
  const annTally: Tally = { created: 0, updated: 0, unchanged: 0, failed: 0 };
  const evtTally: Tally = { created: 0, updated: 0, unchanged: 0, failed: 0 };
  const promoTally: Tally = { created: 0, updated: 0, unchanged: 0, failed: 0 };

  let promoCount = 0;
  for (let i = 0; i < GAME_SEEDS.length; i++) {
    const seed = GAME_SEEDS[i];
    const appId = slugify(seed.title);
    const ownerSlug = slugify(seed.developer);
    const studio = [...studios.values()].find((s) => s.devSlug === ownerSlug);
    const ownerUserId = studio?.uid ?? "system-seed";

    // 3 announcements per app: launch news, two patches.
    const announcements = [
      {
        id: `${appId}-launch`,
        category: "news" as const,
        title: `${seed.title} is now available`,
        body: `Years in the making — ${seed.title} is live worldwide today. Thanks to everyone who wishlisted, played the demo, and shared feedback in our Discord. See you in-game.`,
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
        description: `Play ${seed.title} free for 72 hours. Progress carries over to a full purchase.`,
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

main().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  process.exit(1);
});
