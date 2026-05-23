// ── Primitive helpers ────────────────────────────────────────────────────────
export type ISODate = string;
export type PriceCents = number;
export type GameId = string;
export type OSPlatform = "windows" | "mac" | "linux";

export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "BRL" | "INR" | "CAD" | "AUD";

// ── Shared command/result contracts ─────────────────────────────────────────
export interface CommandError {
  code: string;
  message: string;
  recoverable: boolean;
}

export type CommandResult<T> =
  | { ok: true; data: T; error?: never }
  | { ok: false; data?: never; error: CommandError };

// ── Taxonomy ────────────────────────────────────────────────────────────────
export interface Category {
  slug: string;
  name: string;
  icon: string;
  gameCount: number;
}

export interface Tag {
  slug: string;
  name: string;
  voteCount: number;
}

// ── Pricing ─────────────────────────────────────────────────────────────────
export interface Price {
  currency: Currency;
  base: PriceCents;
  final: PriceCents;
  discountPct: number;
  discountEndsAt: ISODate | null;
  isFree: boolean;
}

export interface RegionalPrice {
  region: string;
  currency: Currency;
  price: PriceCents;
  usdEquivalentCents: PriceCents;
}

// ── Reviews ─────────────────────────────────────────────────────────────────
export type ReviewLabel =
  | "Overwhelmingly Positive"
  | "Very Positive"
  | "Positive"
  | "Mostly Positive"
  | "Mixed"
  | "Mostly Negative"
  | "Negative"
  | "Very Negative"
  | "Overwhelmingly Negative";

export interface ReviewSummary {
  label: ReviewLabel;
  scorePct: number;
  totalReviews: number;
  recentLabel: ReviewLabel;
  recentScorePct: number;
  recentTotal: number;
}

/**
 * Five-axis facet ratings, each 0–10. Optional per review — reviewers can
 * still post a low-friction thumbs-up/down via the `recommended` boolean
 * without scoring facets.
 */
export interface ReviewFacets {
  gameplay: number;
  story: number;
  polish: number;
  value: number;
  accessibility: number;
}

export interface Review {
  id: string;
  gameId: GameId;
  authorName: string;
  authorAvatarUrl: string;
  authorHoursOnRecord: number;
  recommended: boolean;
  postedAt: ISODate;
  body: string;
  helpfulCount: number;
  funnyCount: number;
  facets?: ReviewFacets;
  integrity?: ReviewIntegrity;
}

export interface ReviewIntegrity {
  ownershipVerified: boolean;
  playMinutesAtReview: number;
  editedAt?: ISODate;
  moderationState: "visible" | "pending" | "hidden";
  trustSignals: Array<"verified-owner" | "played-on-platform" | "high-effort" | "reported">;
}

/** Aggregated mean facet ratings across all reviews for a game. */
export interface FacetAverages {
  gameplay: number;
  story: number;
  polish: number;
  value: number;
  accessibility: number;
  /** How many reviews contributed facet scores. */
  ratedCount: number;
}

// ── Pre-orders ──────────────────────────────────────────────────────────────
export interface PreOrderBonus {
  name: string;
  description: string;
}

export interface PreOrderTier {
  /** "Standard Edition", "Deluxe Edition", "Ultimate Edition", etc. */
  name: string;
  priceCents: PriceCents;
  bonuses: PreOrderBonus[];
}

// ── Game (slim store-card payload) ──────────────────────────────────────────
export interface Game {
  id: GameId;
  slug: string;
  name: string;
  developer: string;
  publisher: string;
  releaseDate: ISODate;
  comingSoon: boolean;
  coverUrl: string;
  headerUrl: string;
  capsuleUrl: string;
  tags: string[];
  genres: string[];
  platforms: OSPlatform[];
  price: Price;
  reviewSummary: ReviewSummary;
  isFeatured: boolean;
  isOnSale: boolean;
  salesRank: number;
  /**
   * Quality signal from the first ~50 reviews. Used to surface promising
   * indies before the algorithm catches up (Hidden Gems shelf). 0–100.
   */
  firstReviewersScore?: number;
  /** Free downloadable demo available for this title. */
  hasDemo?: boolean;
  /** Only meaningful when comingSoon=true — available pre-order editions. */
  preOrderTiers?: PreOrderTier[];
  /** Estimated pre-load size in bytes (for "Pre-load X GB starting on Y" copy). */
  preLoadSizeBytes?: number;
  /** When pre-loading opens (ISO). Undefined = pre-load not available. */
  preLoadStartsAt?: ISODate;
  /** Hover-to-play preview video url */
  trailerUrl?: string;
  /** Whether this game is included in the Dreamworks+ subscription */
  includedInSubscription?: boolean;
  /** Whether this game can be streamed via cloud gaming */
  cloudPlayable?: boolean;
}

// ── Playtime estimates (HowLongToBeat-style) ────────────────────────────────
export interface Playtime {
  mainHours: number;
  mainPlusSidesHours: number;
  completionistHours: number;
  source: "publisher" | "community" | "estimated";
}

// ── Recommendation reasons (transparency layer) ─────────────────────────────
export type RecommendationKind =
  | "featured"
  | "on-sale"
  | "new-release"
  | "top-seller"
  | "tag-match"
  | "recently-viewed-similar"
  | "hidden-gem"
  | "free-promo"
  | "coming-soon";

export interface RecommendationReason {
  kind: RecommendationKind;
  /** Human-readable, e.g. "3 of your recently-viewed games are tagged souls-like" */
  label: string;
  /** Optional supporting evidence (matched tags, percentile, etc.) */
  detail?: string;
}

/** A game paired with the reason it appears in a shelf. */
export interface ShelfGame {
  game: Game;
  reason: RecommendationReason;
}

// ── Full game record ────────────────────────────────────────────────────────
export interface SystemRequirementsBlock {
  os: string;
  cpu: string;
  memory: string;
  gpu: string;
  storage: string;
  notes?: string;
}

export type GameFeature =
  | "single-player"
  | "multiplayer"
  | "co-op"
  | "online-pvp"
  | "controller-partial"
  | "controller-full"
  | "achievements"
  | "cloud-saves"
  | "workshop"
  | "vr-supported"
  | "trading-cards"
  | "remote-play";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  globalUnlockPct: number;
  hidden: boolean;
}

export interface Depot {
  id: string;
  name: string;
  platform: OSPlatform | "common";
  sizeBytes: number;
  lastUpdated: ISODate;
  buildId: string;
}

export interface PatchNote {
  version: string;
  date: ISODate;
  title: string;
  bullets: string[];
}

export interface PriceHistoryPoint {
  date: ISODate;
  cents: PriceCents;
  discountPct: number;
}

export interface HistoricalLows {
  allTimeLow: PriceCents;
  lastYearLow: PriceCents;
  lastMonthLow: PriceCents;
  currentPrice: PriceCents;
}

export interface PlayerCountPoint {
  date: ISODate;
  peak: number;
  avg: number;
}

export interface Screenshot {
  url: string;
  thumbUrl: string;
}

export interface Trailer {
  url: string;
  posterUrl: string;
  provider: "youtube" | "vimeo" | "self";
  id: string;
}

export interface GameDetail extends Game {
  shortDescription: string;
  longDescription: string;
  screenshots: Screenshot[];
  trailers: Trailer[];
  systemRequirements: {
    windows?: SystemRequirementsBlock;
    mac?: SystemRequirementsBlock;
    linux?: SystemRequirementsBlock;
  };
  languages: string[];
  features: GameFeature[];
  ageRating: { board: "ESRB" | "PEGI"; rating: string } | null;
  drm: string[];
  metaScore: number | null;
  estimatedSizeBytes: number;
  pricesByRegion: RegionalPrice[];
  achievementCount: number;
  achievements: Achievement[];
  depots: Depot[];
  patchNotes: PatchNote[];
  relatedGameIds: GameId[];
  storeTags: Tag[];
  priceHistory: PriceHistoryPoint[];
  playerCountHistory: PlayerCountPoint[];
  currentPlayers: number;
  peakPlayers24h: number;
  peakPlayersAllTime: number;
  /** HowLongToBeat-style time estimates. */
  playtime: Playtime;
  /** Dreamworks AI-generated 3-bullet summary, regenerated periodically. */
  aiOverview?: AIOverview;
}

export interface AIOverview {
  pros: string[];
  cons: string[];
  basedOnReviewCount: number;
  updatedAt: ISODate;
}

// ── Gemini AI proxy ─────────────────────────────────────────────────────────
//
// Shapes used by the geminiProxy callable Cloud Function. The function
// dispatches by `featureKey` to per-feature prompt modules in
// `functions/src/prompts/`. Response types live in `src/lib/ai/response-types`.

export interface AIProxyRequest<TPayload = unknown> {
  featureKey: string;
  payload: TPayload;
  /** Bumping the prompt version on the server invalidates the response cache. */
  promptVersion?: string;
}

export interface AIProxyResponse<TResult = unknown> {
  result: TResult;
  cacheHit: boolean;
  /** Server-reported usage for client-side telemetry display (not billing). */
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
  };
}

export interface AICacheEntry<TResult = unknown> {
  featureKey: string;
  promptVersion: string;
  model: string;
  payloadHash: string;
  response: TResult;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  createdAt: ISODate;
  hits: number;
}

export interface AIQuotaState {
  hourlyCount: number;
  hourlyResetAt: ISODate;
  dailyCount: number;
  dailyResetAt: ISODate;
}

// ── Developer Portal (Steamworks-style) ────────────────────────────────────
//
// Developer ≠ Publisher. Each is a first-class entity with its own Creator
// Homepage (/developer/:slug, /publisher/:slug). A game (App) can reference
// multiple of each. For self-publishing, the same user owns both a Developer
// and a Publisher doc with the same display name.

export interface CreatorSocialLinks {
  twitter?: string;
  discord?: string;
  youtube?: string;
  twitch?: string;
}

export type CreatorVerificationStatus = "unverified" | "pending" | "approved" | "rejected";

export interface Developer {
  id: string;                  // slug of name
  name: string;
  ownerUserId: string;
  brandColor: string;          // hex, used for storefront wash
  logoUrl: string;
  bannerUrl?: string;
  /** Optional promo video for the Creator Homepage hero. When set, the hero
   *  plays this muted/looping in place of the banner image. */
  promoVideoUrl?: string;
  tagline: string;
  about?: string;
  websiteUrl?: string;
  socialLinks?: CreatorSocialLinks;
  appIds: string[];            // denormalized list of owned app slugs
  updatedAt: ISODate;
  verificationStatus?: CreatorVerificationStatus;
  latestSubmissionId?: string;
}

export interface Publisher {
  id: string;
  name: string;
  ownerUserId: string;
  brandColor: string;
  logoUrl: string;
  bannerUrl?: string;
  promoVideoUrl?: string;
  tagline: string;
  about?: string;
  websiteUrl?: string;
  socialLinks?: CreatorSocialLinks;
  appIds: string[];
  updatedAt: ISODate;
  verificationStatus?: CreatorVerificationStatus;
  latestSubmissionId?: string;
}

export type AppStage = "draft" | "in-review" | "coming-soon" | "released";

export type ReleaseWindow = "morning" | "afternoon" | "evening" | "midnight";

export type BranchName = "default" | "beta" | "internal" | (string & {});

export interface AppBuild {
  id: string;
  appId: string;
  buildLabel: string;          // e.g. "0.4.2-rc1"
  notes: string;
  sizeBytes: number;
  uploadedAt: ISODate;
  uploaderUserId: string;
  platforms: OSPlatform[];
  assetUrl?: string;           // Firebase Storage URL or local desktop path
  status: "uploaded" | "processing" | "ready";
  validation?: BuildValidation;
  lastHandshakeAt?: ISODate;
}

// ── SDK build validation ────────────────────────────────────────────────────
export type ValidationStatus = "pass" | "fail" | "warn" | "pending" | "skipped";

export interface BuildValidationCheck {
  status: ValidationStatus;
  message: string;
  details?: string[];
}

export interface BuildValidation {
  schemaVersion: 1;
  checkedAt: ISODate;
  source: "client" | "tauri" | "cloud";
  manifest: BuildValidationCheck;
  binary: BuildValidationCheck;
  handshake: BuildValidationCheck;
  overall: ValidationStatus;
}

export interface DreamworksManifest {
  schemaVersion: 1;
  appId: string;
  sdkVersion: string;
  buildLabel: string;
  achievements: string[];
  platforms: OSPlatform[];
  executable: string;
}

export interface AppBranch {
  name: BranchName;
  liveBuildId?: string;        // build currently set live on this branch
  password?: string;
  description?: string;
  updatedAt: ISODate;
}

export interface AppChecklist {
  capsuleArt: boolean;
  controllerSupport: boolean;
  cloudSaves: boolean;
  achievements: boolean;
  newsPost: boolean;
  sdkIntegration: boolean;
}

export interface App {
  id: string;                  // slug of gameTitle, also the eventual GameId
  developerIds: string[];      // Steam allows multiple
  publisherIds: string[];
  ownerUserId: string;
  stage: AppStage;

  // Store page
  gameTitle: string;
  shortDescription: string;
  longDescription: string;
  genres: string[];
  tags: string[];
  languages: string[];
  ageRating: string;
  platforms: OSPlatform[];
  features: GameFeature[];
  systemRequirements: {
    windows?: SystemRequirementsBlock;
    mac?: SystemRequirementsBlock;
    linux?: SystemRequirementsBlock;
  };

  // Media
  coverUrl?: string;
  capsuleUrl?: string;
  headerUrl?: string;
  screenshots: string[];
  trailers: Trailer[];

  // Release
  releaseDate?: ISODate;
  releaseWindow: ReleaseWindow;

  // Pricing
  basePriceCents: PriceCents;
  launchDiscountPct: number;
  pricesByRegion: RegionalPrice[];

  // Pipeline
  branches: AppBranch[];
  latestBuildId?: string;

  // Achievements denorm
  achievementCount: number;

  // Legacy checklist (used in publish gating)
  checklist: AppChecklist;

  submittedAt?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;

  // ── Submission tracking (denormalized from latest dw_app_submissions doc) ──
  submissionStatus?: SubmissionStatus | "none";
  latestSubmissionId?: string;
  lastReviewedAt?: ISODate;
  lastReviewerUid?: string;
}

// ── App submissions (admin review pipeline) ────────────────────────────────
//
// Append-only history. One doc per submission attempt. Resubmissions create
// a new doc with `priorSubmissionId` linking back to the prior attempt. The
// `dw_apps/{id}.submissionStatus` field is a denormalized pointer to the
// latest doc's status; the submission record is the source of truth.

export type SubmissionStatus =
  | "pending"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export type SubmissionRejectionReason =
  | "capsule_art_missing"
  | "capsule_art_low_quality"
  | "screenshots_insufficient"
  | "screenshots_misleading"
  | "description_too_short"
  | "description_misleading"
  | "description_prohibited_content"
  | "age_rating_mismatch"
  | "tags_misleading"
  | "trailer_broken"
  | "trailer_misleading"
  | "build_missing"
  | "build_unverified"
  | "build_crashes"
  | "pricing_outside_band"
  | "release_date_invalid"
  | "policy_violation"
  | "ip_infringement"
  | "duplicate_submission"
  | "metadata_incomplete"
  | "other";

export type SubmissionAssetField =
  | "coverUrl"
  | "capsuleUrl"
  | "headerUrl"
  | "screenshots"
  | "trailers"
  | "shortDescription"
  | "longDescription"
  | "ageRating"
  | "latestBuildId"
  | "pricing";

export interface SubmissionAssetComment {
  field: SubmissionAssetField;
  index?: number;
  comment: string;
}

export interface SubmissionDecision {
  outcome: "approve" | "request_changes" | "reject";
  summaryNote: string;
  reasons: SubmissionRejectionReason[];
  assetComments: SubmissionAssetComment[];
}

export interface AppSnapshot {
  gameTitle: string;
  shortDescription: string;
  longDescription: string;
  genres: string[];
  tags: string[];
  languages: string[];
  ageRating: string;
  platforms: OSPlatform[];
  basePriceCents: PriceCents;
  releaseDate?: ISODate;
  releaseWindow: ReleaseWindow;
  coverUrl?: string;
  capsuleUrl?: string;
  headerUrl?: string;
  screenshots: string[];
  trailers: Trailer[];
  latestBuildId?: string;
  checklist: AppChecklist;
  features: GameFeature[];
}

export interface AppSubmission {
  id: string;
  appId: string;
  submitterUserId: string;
  submitterEmail: string;
  appSnapshot: AppSnapshot;
  status: SubmissionStatus;
  submittedAt: ISODate;
  claimedAt?: ISODate;
  claimedByUid?: string;
  decidedAt?: ISODate;
  decidedByUid?: string;
  decision?: SubmissionDecision;
  priorSubmissionId?: string | null;
}

// ── Creator-profile submissions (publisher/studio onboarding) ──────────────
export type CreatorSubmissionType = "publisher" | "developer";

export interface CreatorProfileSubmission {
  id: string;
  creatorType: CreatorSubmissionType;
  creatorId: string;
  submitterUserId: string;
  submitterEmail: string;
  profileSnapshot: Publisher | Developer;
  status: SubmissionStatus;
  submittedAt: ISODate;
  claimedAt?: ISODate;
  claimedByUid?: string;
  decidedAt?: ISODate;
  decidedByUid?: string;
  decision?: SubmissionDecision;
}

// ── Admin audit log ─────────────────────────────────────────────────────────
export type AuditAction =
  | "submission.review"
  | "submission.submit"
  | "app.publish"
  | "user.role_set"
  | "user.permissions_set"
  | "publisher.review"
  | "studio.review"
  | "moderation.decide";

export type AuditTargetType =
  | "app"
  | "submission"
  | "user"
  | "publisher"
  | "developer"
  | "moderationRecord";

export interface AuditEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ts: ISODate;
}

// ── User & ownership ───────────────────────────────────────────────────────
import type { AvatarOptions } from "./avatar";

export type UserRole = "user" | "developer" | "publisher" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  /** Legacy URL-based avatar — kept for any code path that still reads it. */
  avatarUrl: string;
  /**
   * Customizable Notion-style avatar (dicebear `notionists`). When set, UI
   * surfaces should prefer rendering this via `<UserAvatar>` and fall back
   * to `avatarUrl` only when missing.
   */
  avatarOptions?: AvatarOptions;
  level: number;
  bio: string;
  country: string;
  memberSince: ISODate;
  showcaseGameIds: GameId[];
  isSubscribed?: boolean;
  role: UserRole;
  permissions: string[];
  suspended?: boolean;
}

export interface AdminUserSummary {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  permissions: string[];
  suspended?: boolean;
  createdAt?: ISODate;
  lastSignInAt?: ISODate;
}

/**
 * Where a library entry originated. "dreamworks" is a real Dreamworks purchase;
 * "manual" is a user-typed add; the rest are launcher imports from the local
 * filesystem scanner.
 */
export type LauncherSource =
  | "dreamworks"
  | "manual"
  | "steam"
  | "epic"
  | "gog"
  | "ubisoft"
  | "ea-app"
  | "xbox-pc"
  | "rockstar"
  | "battlenet"
  | "amazon";

export type LauncherConnectionStatus =
  | "connected"
  | "needs-auth"
  | "scan-only"
  | "unsupported"
  | "error";

export interface LauncherAccount {
  id: string;
  source: LauncherSource;
  displayName: string;
  status: LauncherConnectionStatus;
  connectedAt: ISODate | null;
  lastSyncedAt: ISODate | null;
  importedGameCount: number;
  errorMessage?: string;
  privacyMode: "local-scan" | "oauth" | "manual";
}

export type EntitlementKind = "purchase" | "subscription" | "external" | "manual" | "trial" | "gift";
export type EntitlementStatus = "active" | "refunded" | "revoked" | "expired" | "pending";

export interface Entitlement {
  id: string;
  userId: string;
  gameId: GameId;
  kind: EntitlementKind;
  status: EntitlementStatus;
  sourceLauncher: LauncherSource;
  grantedAt: ISODate;
  expiresAt: ISODate | null;
  orderId?: string;
  externalId?: string;
  canInstall: boolean;
  canLaunch: boolean;
  canLaunchOffline: boolean;
  refundWindow?: RefundWindow | null;
}

export type CloudSaveStatus =
  | "unsupported"
  | "synced"
  | "syncing"
  | "conflict"
  | "offline"
  | "error";

export type CloudSaveResolution = "local" | "remote";

export type DrmType = "none" | "dreamworks" | "steam" | "epic" | "third-party" | "unknown";

export interface InstallManifest {
  gameId: GameId;
  sourceLauncher: LauncherSource;
  externalId?: string;
  installPath: string;
  launchCommand?: string;
  executablePath?: string;
  version?: string;
  buildId?: string;
  sizeBytes: number;
  installedAt: ISODate;
  lastVerifiedAt: ISODate | null;
  updatePolicy: "auto" | "manual" | "scheduled";
  canLaunchOffline: boolean;
  drmType: DrmType;
}

export interface LibrarySourceCopy {
  sourceLauncher: LauncherSource;
  externalId?: string;
  installPath?: string;
  launchCommand?: string;
  installed: boolean;
  lastSeenAt: ISODate;
  canLaunchOffline: boolean;
  drmType: DrmType;
}

export interface CloudSaveSlot {
  id: string;
  gameId: GameId;
  userId: string;
  deviceName: string;
  status: CloudSaveStatus;
  localUpdatedAt: ISODate | null;
  remoteUpdatedAt: ISODate | null;
  sizeBytes: number;
  conflictReason?: string;
}

export interface LibraryEntry {
  gameId: GameId;
  ownedSince: ISODate;
  installed: boolean;
  sizeBytes: number;
  playMinutes: number;
  lastPlayed: ISODate | null;
  collectionIds: string[];
  achievementsUnlocked: number;
  completionPct: number;
  /** Refund window computed at purchase time. Null = no longer eligible. */
  refundWindow?: RefundWindow | null;
  /** Order id this entry came from, if known. */
  orderId?: string;
  /** Where this entry came from (purchase, manual add, scanner import). */
  sourceLauncher?: LauncherSource;
  /** Stable id from the source launcher/store, e.g. Steam appid. */
  externalId?: string;
  /** Current install location, when known. */
  installPath?: string;
  /** Command or URI used to launch this copy. */
  launchCommand?: string;
  /** Installed build/version reported by the source launcher. */
  installedVersion?: string;
  /** Last time the install was verified by Dreamworks or a source scanner. */
  lastVerifiedAt?: ISODate | null;
  /** Local/cloud-save state shown in the library. */
  cloudSaveStatus?: CloudSaveStatus;
  /** DRM/runtime expected before launching. */
  drmType?: DrmType;
  /** Whether the entry can be launched without network access. */
  canLaunchOffline?: boolean;
  /** Additional stores/launchers where this same game was detected. */
  sources?: LibrarySourceCopy[];
}

/**
 * Per-game refund window. Generous & playtime-aware: the cap scales with the
 * game's main-story length so 3-hour narrative games aren't refundable after
 * a full playthrough, while live-service / sprawling games keep at least the
 * Steam-equivalent 2 hours.
 *
 *   eligibleMinutes = max(120, min(0.5 * mainHours * 60, mainHours * 60 - 30))
 *   eligibleUntil   = purchasedAt + 14 days
 *
 * `revoked` flips true if the player exceeded `eligibleMinutes` or the date
 * window passed.
 */
export interface RefundWindow {
  eligibleUntil: ISODate;
  eligibleMinutes: number;
  revoked: boolean;
}

export interface Order {
  id: string;
  placedAt: ISODate;
  gameIds: GameId[];
  subtotalCents: PriceCents;
  taxCents: PriceCents;
  totalCents: PriceCents;
  refunded: boolean;
  status?: "pending" | "paid" | "failed" | "refunded";
  currency?: Currency;
  userId?: string;
  country?: string;
  paymentProvider?: "mock" | "stripe" | "razorpay" | "paypal";
  receiptNumber?: string;
  lineItems?: OrderLineItem[];
  metadata?: {
    giftCount?: number;
    pendingGiftCount?: number;
    familyApprovalCount?: number;
    familyApprovalPendingCount?: number;
    familyApprovalDeniedCount?: number;
    notes?: string[];
  };
}

export interface OrderLineItem {
  id: string;
  gameId: GameId;
  name: string;
  quantity: number;
  unitCents: PriceCents;
  finalCents: PriceCents;
  entitlementKind: EntitlementKind;
  asGift: boolean;
  giftRecipient?: GiftRecipient;
  scheduledDeliveryAt?: ISODate;
  familyApproval?: FamilyApprovalMetadata;
}

export interface GiftRecipient {
  name: string;
  email?: string;
  friendId?: string;
}

export interface FamilyApprovalMetadata {
  required: boolean;
  status: "not_required" | "pending" | "approved" | "denied";
  requestedBy?: string;
  guardianName?: string;
  decidedAt?: ISODate;
  note?: string;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  gameId: GameId;
  userId: string;
  requestedAt: ISODate;
  status: "pending" | "approved" | "denied" | "cancelled";
  reason: string;
  policySnapshot: string;
  decidedAt?: ISODate;
  decisionNote?: string;
}

export interface Collection {
  id: string;
  name: string;
  gameIds: GameId[];
}

export interface WishlistEntry {
  gameId: GameId;
  addedAt: ISODate;
  priority: number;
  notifyOnSale: boolean;
  /** Alert the user only when the final price drops to/below this (cents). */
  priceCeilingCents?: number;
  /** Alert only when the price meets/beats its all-time low. */
  notifyOnlyAtATL?: boolean;
  /** Free-form natural-language rule parsed by the AI sniper (e.g. "below $30 OR at ATL"). */
  smartRule?: string;
  /** Last time we surfaced an alert for this entry — prevents re-firing. */
  lastAlertedAt?: ISODate;
}

export interface WorkshopItem {
  id: string;
  gameId: GameId;
  title: string;
  authorId: string;
  authorName: string;
  version: string;
  sizeBytes: number;
  rating: number;
  subscribers: number;
  tags: string[];
  status: "available" | "subscribed" | "downloading" | "installed" | "disabled";
  updatedAt: ISODate;
  installPath?: string;
}

export interface ModerationRecord {
  id: string;
  targetType: "review" | "post" | "reply" | "thread" | "workshop-item" | "profile";
  targetId: string;
  reporterUserId: string;
  reason: string;
  status: "open" | "triaged" | "actioned" | "dismissed";
  createdAt: ISODate;
  decidedAt?: ISODate;
  moderatorId?: string;
  action?: "none" | "hide" | "delete" | "warn" | "ban";
}

export interface CartItem {
  gameId: GameId;
  addedAt: ISODate;
  asGift: boolean;
  giftRecipient?: GiftRecipient;
  scheduledDeliveryAt?: ISODate;
  familyApproval?: FamilyApprovalMetadata;
}

// ── In-app notifications ────────────────────────────────────────────────────
export type NotificationKind =
  | "wishlist-alert"
  | "sale-ending"
  | "friend-activity"
  | "achievement-unlock"
  | "library-import"
  | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  /** Route to navigate to when clicked. */
  href?: string;
  /** Optional game for cover thumbnail. */
  gameId?: GameId;
  createdAt: ISODate;
  read: boolean;
}

// ── Forums ──────────────────────────────────────────────────────────────────
export interface ForumThread {
  id: string;
  gameId: GameId;
  authorUid: string;
  authorName: string;
  authorAvatarUrl: string;
  title: string;
  body: string;
  createdAt: ISODate;
  lastActivityAt: ISODate;
  replyCount: number;
  sticky: boolean;
  locked: boolean;
  helpfulCount: number;
}

export interface ForumReply {
  id: string;
  threadId: string;
  authorUid: string;
  authorName: string;
  authorAvatarUrl: string;
  body: string;
  createdAt: ISODate;
  helpfulCount: number;
}

// ── News ────────────────────────────────────────────────────────────────────
export interface NewsArticle {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  authorName: string;
  publishedAt: ISODate;
  heroUrl: string;
  tags: string[];
  relatedGameIds: GameId[];
}

// ── Friends ─────────────────────────────────────────────────────────────────
export type FriendStatus = "online" | "offline" | "in-game" | "away";

export interface Friend {
  uid: string;
  displayName: string;
  avatarUrl: string;
  status: FriendStatus;
  currentGameId: GameId | null;
  lastSeen: ISODate;
}

export type FriendActivityKind =
  | "achievement-unlocked"
  | "added-to-library"
  | "review-posted"
  | "now-playing";

export interface FriendActivity {
  uid: string;
  kind: FriendActivityKind;
  gameId: GameId;
  payload: string;
  at: ISODate;
}

// ── DB charts ───────────────────────────────────────────────────────────────
export type ChartType =
  | "top-played"
  | "top-wishlisted"
  | "trending"
  | "recently-updated"
  | "free";

export interface ChartEntry {
  rank: number;
  gameId: GameId;
  metric: number;
  deltaFromYesterday: number;
}

export interface SalesEntry {
  gameId: GameId;
  discountPct: number;
  endsAt: ISODate;
  finalCents: PriceCents;
  baseCents: PriceCents;
}

// ── Account analytics ──────────────────────────────────────────────────────
export interface LibraryValueBreakdown {
  totalSpentCents: PriceCents;
  currentRetailCents: PriceCents;
  gamesOwned: number;
  unplayedCount: number;
  unplayedValueCents: PriceCents;
}

export interface HeatmapCell {
  date: ISODate;
  minutesPlayed: number;
}

export interface CompletionStats {
  achievementsUnlocked: number;
  achievementsTotal: number;
  perfectGames: number;
  averageCompletionPct: number;
}

// ── Feature coverage roadmap ───────────────────────────────────────────────
export type FeatureArea =
  | "native"
  | "library"
  | "commerce"
  | "subscription"
  | "community"
  | "trust"
  | "polish"
  | "developer";

export type FeatureStatus = "done" | "partial" | "planned" | "blocked";
export type FeaturePriority = "P0" | "P1" | "P2";

export interface FeatureRoadmapItem {
  id: string;
  title: string;
  area: FeatureArea;
  status: FeatureStatus;
  priority: FeaturePriority;
  userValue: string;
  currentState: string;
  nextStep: string;
  acceptance: string;
  /** Optional route to the page where this feature lives. */
  href?: string;
}

// ── Downloads (mock UI state) ───────────────────────────────────────────────
export type DownloadStatus =
  | "queued"
  | "downloading"
  | "verifying"
  | "extracting"
  | "complete"
  | "error"
  | "cancelled"
  | "paused";

export interface DownloadTask {
  taskId: string;
  gameId: GameId;
  status: DownloadStatus;
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
  sourceLauncher?: LauncherSource;
  installPath?: string;
  speedBytesPerSec?: number;
  queuedAt?: ISODate;
  updatedAt?: ISODate;
  errorMessage?: string;
  canPause?: boolean;
  canResume?: boolean;
}

// ── Auth state (mirrors dreams-launcher) ───────────────────────────────────
export type AuthStateResponse =
  | { type: "Anonymous" }
  | { type: "Authenticating" }
  | { type: "Authenticated"; user: { uid: string; email: string; displayName: string } }
  | { type: "Error"; message: string };

// ── Client settings configuration ──────────────────────────────────────────
export type StartupLocation = "store" | "library" | "feed" | "db";
export type FpsCounterLocation = "off" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type DownloadLimitOption = "unlimited" | "10" | "25" | "50" | "100";

export interface ClientSettings {
  startupLocation: StartupLocation;
  compactMode: boolean;
  offlineModeEnabled: boolean;
  offlineCacheStatus: "ready" | "syncing" | "needs-attention";
  offlineCacheUpdatedAt: ISODate | null;
  closeToTray: boolean;
  hardwareAcceleration: boolean;
  inGameOverlay: boolean;
  fpsCounter: FpsCounterLocation;
  fpsHighContrast: boolean;
  screenshotKey: string;
  screenshotSound: boolean;
  downloadLimit: DownloadLimitOption;
  installPath: string;
  emailOnSale: boolean;
  browserNotify: boolean;
  playNotificationSound: boolean;
  friendOnlineNotify: boolean;
  friendStartGameNotify: boolean;
  chatProfanityFilter: boolean;
  playChatSound: boolean;
  cloudSavesEnabled: boolean;
  librarySharingEnabled: boolean;
  crashReportsEnabled: boolean;
  usageDiagnosticsEnabled: boolean;
  scanHistoryRetentionDays: 0 | 30 | 90 | 365;
  privacyDataExportStatus: "idle" | "preparing" | "ready";
  privacyDeleteRequestStatus: "idle" | "scheduled";
  handheldMode: boolean;
  largerFocusTargets: boolean;
  controllerHints: boolean;
  language: string;
  quickResumeEnabled: boolean;
  remotePlayPairedDevice: string | null;
  dynamicStoreBackgroundsEnabled: boolean;
  textureUpscalerNotifyMe: boolean;
  twoFactorEnabled: boolean;
  lastWishlistSyncAt: ISODate | null;
  /** Auto-start downloads for purchased games immediately on checkout success. */
  autoInstallOnPurchase: boolean;
  /** Override the displayed currency (null = follow profile region). */
  currencyOverride: Currency | null;
  /** When true, friends do not see the user's library on their profile. */
  hideLibraryFromFriends: boolean;
  /** Local-time window during which non-critical popups are suppressed. */
  quietHours: { enabled: boolean; startHour: number; endHour: number };
}

// ── Account-tab persisted entities ─────────────────────────────────────────
export type PaymentBrand = "Visa" | "Mastercard" | "Amex" | "Discover";

export interface PaymentMethod {
  id: string;
  brand: PaymentBrand;
  /** Last 4 digits only — never the full PAN. */
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
  isDefault: boolean;
}

export type FamilyRelationship =
  | "Sister"
  | "Brother"
  | "Mother"
  | "Father"
  | "Spouse"
  | "Child"
  | "Friend"
  | "Other";

export interface FamilyMember {
  id: string;
  name: string;
  relationship: FamilyRelationship;
  authorized: boolean;
  lastActiveAt: ISODate | null;
}

export type LinkedPlatformId = "psn" | "xbox-live" | "steam" | "epic";

export interface LinkedPlatform {
  id: LinkedPlatformId;
  /** English fallback name; UI calls t() at render time. */
  name: string;
  connected: boolean;
  lastSyncedAt: ISODate | null;
}

// ── Social Feed ─────────────────────────────────────────────────────────────
export interface SocialReply {
  id: string;
  authorUid: string;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string;
  authorAvatarOptions?: AvatarOptions;
  content: string;
  createdAt: ISODate;
  likes: number;
  likedByMe?: boolean;
}

export interface SocialPost {
  id: string;
  authorUid: string;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string;
  authorAvatarOptions?: AvatarOptions;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  gameId?: GameId;
  createdAt: ISODate;
  likes: number;
  likedByMe?: boolean;
  reposts: number;
  repostedByMe?: boolean;
  replies: SocialReply[];
}

// ── Diagnostics (desktop-only, Rust-backed) ─────────────────────────────────
export interface CpuInfo {
  brand: string;
  vendorId: string;
  physicalCores: number;
  logicalCores: number;
  baseFrequencyMhz: number;
}

export interface MemoryInfo {
  totalBytes: number;
  availableBytes: number;
  usedBytes: number;
  swapTotalBytes: number;
  swapUsedBytes: number;
}

export interface DiskInfo {
  name: string;
  mountPoint: string;
  totalBytes: number;
  availableBytes: number;
  fileSystem: string;
  isRemovable: boolean;
}

export interface GpuInfo {
  vendor: string;
  model: string;
  vramBytes: number;
  backend: string;
}

export interface OsInfo {
  name: string;
  version: string;
  kernelVersion: string;
  hostname: string;
  architecture: string;
}

export interface NetworkAdapter {
  interfaceName: string;
  macAddress: string;
  isLoopback: boolean;
}

export interface HardwareSnapshot {
  capturedAt: string;
  schemaVersion: number;
  cpu: CpuInfo;
  memory: MemoryInfo;
  disks: DiskInfo[];
  gpus: GpuInfo[];
  os: OsInfo;
  network: NetworkAdapter[];
}

export interface ProcessSample {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryBytes: number;
  parentPid?: number | null;
}

export interface ResourceMonitorSample {
  sampledAt: string;
  cpuGlobalPercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  topProcesses: ProcessSample[];
}

export interface LauncherCounts {
  steam: number;
  epic: number;
}

export interface OrphanedInstall {
  path: string;
  sizeBytes?: number | null;
  reason: "missing_manifest" | "library_offline" | "duplicate" | "unreadable";
}

export interface LauncherScanReport {
  gamesFound: number;
  totalInstallBytes: number;
  byLauncher: LauncherCounts;
  orphanedInstalls: OrphanedInstall[];
  scanDurationMs: number;
  pathsRead: string[];
  generatedAt: string;
}

export interface SystemRequirementScore {
  cpuScore: number;
  gpuScore: number;
  ramGb: number;
}

export type FpsTier = "unplayable" | "low" | "medium" | "high" | "ultra";

export interface FpsBreakdown {
  tier: FpsTier;
  cpuRatio: number;
  gpuRatio: number;
  ramRatio: number;
  bottleneck: "cpu" | "gpu" | "ram";
}

// ── Workshop mods (storefront-style browser shape, distinct from WorkshopItem) ──
export interface WorkshopMod {
  id: string;
  name: string;
  gameId: GameId;
  author: string;
  downloads: number;
  rating: number;
  imgUrl: string;
}

// ── Cloud save history (Time Machine slot list per game) ──
export interface SaveHistoryEntry {
  id: string;
  date: string;
  size: string;
  desc: string;
}

// ── Looking-for-Group matchmaking lobbies ──
export type LfgPlaystyle = "Casual" | "Tryhard" | "Achievement Hunter";

export interface LfgGroup {
  id: number;
  host: string;
  playstyle: LfgPlaystyle;
  needMic: boolean;
  spots: number;
  max: number;
  avatar: string;
}

// ── LFG Board (Feed page LFG tab) ──
export interface LfgPost {
  id: string;
  gameId: GameId;
  game: string;
  author: string;
  type: string;
  desc: string;
  createdAt: ISODate;
  friend: string;
  tags: string[];
}

export interface LfgGuide {
  id: string;
  game: string;
  title: string;
  author: string;
  kind: "Build" | "Guide" | "Walkthrough";
  votes: number;
}

// ── Speedrun leaderboard runs ──
export interface SpeedrunRun {
  rank: number;
  player: string;
  time: string;
  verified: boolean;
  avatar: string;
}

// ── Social: "who to follow" suggestions for the feed sidebar ──
export interface FollowSuggestion {
  name: string;
  handle: string;
  avatar: string;
}

// ── Social: preset images for the feed post composer ──
export interface PostImagePreset {
  label: string;
  url: string;
}

// ── Developer Portal: Live Ops ─────────────────────────────────────────────
//
// Player-facing content authored from /developer-portal/ops. Stored in their
// own collections keyed by appId so the public Game Detail / Creator Homepage
// can read them without rewiring App docs.

export type AnnouncementCategory = "patch" | "event" | "news" | "maintenance";

export interface Announcement {
  id: string;
  appId: string;
  authorUserId: string;
  category: AnnouncementCategory;
  title: string;
  body: string;
  heroImageUrl?: string;
  publishedAt: ISODate;
  pinnedUntil?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type LiveEventKind =
  | "free-weekend"
  | "double-xp"
  | "sale"
  | "tournament"
  | "season"
  | "drop";

export interface LiveEvent {
  id: string;
  appId: string;
  kind: LiveEventKind;
  title: string;
  description: string;
  startsAt: ISODate;
  endsAt: ISODate;
  bannerUrl?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface MaintenanceWindow {
  id: string;
  appId: string;
  startsAt: ISODate;
  endsAt: ISODate;
  reason: string;
  affectedRegions: string[];
  createdAt: ISODate;
}

// ── Developer Portal: Marketing ────────────────────────────────────────────

export type PromoCampaignStatus = "scheduled" | "active" | "ended";

export interface PromoCampaign {
  id: string;
  appId: string;
  name: string;
  discountPct: number;
  startsAt: ISODate;
  endsAt: ISODate;
  status: PromoCampaignStatus;
  createdAt: ISODate;
}

export type PromoKeyStatus = "issued" | "redeemed" | "revoked";

export interface PromoKey {
  id: string;
  appId: string;
  recipient: string;
  note?: string;
  status: PromoKeyStatus;
  issuedAt: ISODate;
  redeemedAt?: ISODate;
}

export type SocialPlatform = "twitter" | "discord" | "bluesky";

export interface SocialDraft {
  id: string;
  appId: string;
  platform: SocialPlatform;
  body: string;
  mediaUrls: string[];
  scheduledFor?: ISODate;
  createdAt: ISODate;
}

// ── Developer Portal: Analytics (derived; never persisted) ─────────────────

export interface PortfolioKpis {
  totalApps: number;
  totalWishlists: number;
  totalRevenueCents: number;
  totalCurrentPlayers: number;
  avgReviewScore: number;
}

export interface WishlistTrendPoint {
  date: ISODate;
  count: number;
}

export interface RevenuePoint {
  date: ISODate;
  cents: number;
}

export interface ReviewLabelBreakdown {
  label: ReviewLabel;
  count: number;
  pct: number;
}

export interface AchievementCompletionRow {
  id: string;
  name: string;
  iconUrl?: string;
  hidden: boolean;
  /** null when telemetry has not yet been ingested. */
  unlockedPct: number | null;
}

// ── User-scoped Firestore docs (one doc per uid) ────────────────────────────

export interface UserSubscription {
  tier: "free" | "plus" | "ultimate";
  paused: boolean;
  pausedUntil: ISODate | null;
  nextBillingAt: ISODate | null;
}

export interface UserBillingDoc {
  userId: string;
  paymentMethods: PaymentMethod[];
  subscription: UserSubscription;
  updatedAt: ISODate;
}

export interface UserFamilyDoc {
  userId: string;
  members: FamilyMember[];
  updatedAt: ISODate;
}

export interface UserPlatformsDoc {
  userId: string;
  platforms: Record<LinkedPlatformId, LinkedPlatform>;
  updatedAt: ISODate;
}

export interface UserFollowingDoc {
  userId: string;
  /** Handle (including leading `@`) → following true/false. */
  handles: Record<string, boolean>;
  updatedAt: ISODate;
}

export interface UserGiftRecipientsDoc {
  userId: string;
  recipients: GiftRecipient[];
  updatedAt: ISODate;
}

export interface UserHardwareDoc {
  userId: string;
  latestSnapshot: HardwareSnapshot | null;
  history: HardwareSnapshot[];
  updatedAt: ISODate;
}

// ── Community catalog docs ──────────────────────────────────────────────────

export interface ControllerLayout {
  id: string;
  name: string;
  creator: string;
  downloads: number;
  rating?: number;
  /** When set, layout is scoped to a specific game. */
  gameId?: GameId;
  createdAt: ISODate;
}

export interface ThemePreset {
  id: string;
  name: string;
  author: string;
  description: string;
  /** True for the curated "active by default" theme. */
  featured: boolean;
  createdAt: ISODate;
}

// ── App config (dw_config/*) ────────────────────────────────────────────────
//
// One document per "kind" (countries, languages, card_brands, …) so every
// dropdown / enum the storefront renders can be edited by an admin without a
// code release. Each entry carries i18n-keyed labels so the same doc serves
// every locale; the `useConfig*` hooks resolve to the active locale.

/** Locale-keyed display strings, with `en` mandatory as the fallback. */
export type ConfigLabel = { en: string } & Partial<Record<string, string>>;

export interface ConfigEntry {
  id: string;
  labels: ConfigLabel;
  /** Lower numbers sort first; ties broken by `id` ascending. */
  sortOrder: number;
  /** When false, the entry is hidden in dropdowns but kept for legacy data. */
  enabled: boolean;
  /** Free-form per-entry data — icon name, color, country code, etc. */
  meta?: Record<string, unknown>;
}

export interface ConfigDocument<E extends ConfigEntry = ConfigEntry> {
  id: string;
  entries: E[];
  updatedAt: ISODate;
}

/** Rejection reasons doc has a nested grouping that the flat `entries` shape
 *  doesn't model cleanly; this is its dedicated payload. */
export interface RejectionReasonsDoc {
  id: "rejection_reasons";
  categoryGroups: Array<{
    id: string;
    label: ConfigLabel;
    reasons: Array<{ id: string; label: ConfigLabel }>;
  }>;
  assetFields: Array<{ id: string; label: ConfigLabel }>;
  updatedAt: ISODate;
}

/** Notification kinds need a few extra display fields (icon name, default
 *  enabled, category) so we tighten the entry shape just for this doc. */
export interface NotificationKindEntry extends ConfigEntry {
  meta?: {
    /** Lucide icon name used in NotificationPanel. */
    icon?: string;
    /** Filter bucket — "all" / "wishlist" / "friends" / "system". */
    category?: "wishlist" | "friends" | "system" | "other";
    /** Default toggle state for new users. */
    defaultEnabled?: boolean;
    /** Long-form description shown under the toggle. */
    description?: ConfigLabel;
  };
}

export type ConfigKey =
  | "countries"
  | "languages"
  | "card_brands"
  | "family_relationships"
  | "lfg_session_types"
  | "announcement_kinds"
  | "social_platforms"
  | "platforms"
  | "notification_kinds"
  | "telemetry_scaffold"
  | "rejection_reasons";

// ── Avatar wardrobe / cross-game cosmetics ─────────────────────────────────
export type CosmeticRarity = "common" | "rare" | "epic" | "legendary" | "mythic";
export type CosmeticSlot = "head" | "body" | "back" | "feet" | "hand" | "trinket";

export interface Cosmetic {
  id: string;
  name: string;
  /** Source game that grants the cosmetic when earned. */
  game: string;
  rarity: CosmeticRarity;
  slot: CosmeticSlot;
}

// ── Global augmentations ─────────────────────────────────────────────────────
// Non-standard browser extensions used for capability detection. `window`-side
// Tauri internals are already typed by `@tauri-apps/plugin-os` and don't need
// re-declaration here.
declare global {
  interface Navigator {
    /** Device Memory API — non-standard, not in lib.dom.d.ts. Bucketed value in GB. */
    deviceMemory?: number;
  }
}
