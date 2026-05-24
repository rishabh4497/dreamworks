import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getFunctions, type Functions } from "firebase/functions";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let functionsInstance: Functions | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  const existing = getApps();
  app = existing[0] ?? initializeApp(config);
  return app;
}

export function getDb(): Firestore {
  if (firestoreInstance) return firestoreInstance;
  firestoreInstance = getFirestore(getFirebaseApp());
  return firestoreInstance;
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

export function getFirebaseFunctions(): Functions {
  if (functionsInstance) return functionsInstance;
  functionsInstance = getFunctions(getFirebaseApp(), "us-central1");
  return functionsInstance;
}

export const db = new Proxy({} as Firestore, {
  get(_t, prop) {
    return getDb()[prop as keyof Firestore];
  },
});

export const COLLECTIONS = {
  users: "users",
  games: "dw_games",
  library: "dw_library",
  wishlist: "dw_wishlist",
  collections: "dw_collections",
  forumThreads: "dw_forum_threads",
  forumReplies: "dw_forum_replies",
  orders: "dw_orders",
  reviews: "dw_reviews",
  feed: "dw_feed",
  notifications: "dw_notifications",
  developerDrafts: "dw_developer_drafts",
  publisherProfiles: "dw_publishers",
  developers: "dw_developers",
  publishers: "dw_publishers",
  apps: "dw_apps",
  appSubmissions: "dw_app_submissions",
  publisherSubmissions: "dw_publisher_submissions",
  developerSubmissions: "dw_developer_submissions",
  moderationRecords: "dw_moderation_records",
  adminAudit: "dw_admin_audit",
  aiCache: "dw_ai_cache",
  aiQuotas: "dw_ai_quotas",
  aiUsage: "dw_ai_usage",
  meta: "dw_meta",
  announcements: "dw_announcements",
  liveEvents: "dw_live_events",
  maintenanceWindows: "dw_maintenance_windows",
  promoCampaigns: "dw_promo_campaigns",
  promoKeys: "dw_promo_keys",
  socialDrafts: "dw_social_drafts",
  workshopMods: "dw_workshop_mods",
  workshopSubs: "dw_workshop_subs",
  lfgPosts: "dw_lfg_posts",
  lfgGuides: "dw_lfg_guides",
  followSuggestions: "dw_follow_suggestions",
  // User-scoped account/billing docs (one per uid)
  userBilling: "dw_user_billing",
  userFamily: "dw_user_family",
  userPlatforms: "dw_user_platforms",
  userFollowing: "dw_user_following",
  userGiftRecipients: "dw_user_gift_recipients",
  userHardware: "dw_user_hardware",
  // Community catalogs
  controllerLayouts: "dw_controller_layouts",
  themes: "dw_themes",
  // Global app config — admin-tunable enums (countries, languages, brands…)
  config: "dw_config",
  // Static catalog data formerly under src/lib/mock
  categories: "dw_categories",
  tags: "dw_tags",
  news: "dw_news",
  postImagePresets: "dw_post_image_presets",
  // Legacy fake-friend collections — retained only so seed cleanup can purge
  // them. Runtime code reads the real friend graph at users/{uid}/friends/*
  // (see src/lib/api/friend-graph.ts) and real chat under `dw_chats`.
  friends: "dw_friends",
  friendActivity: "dw_friend_activity",
  friendOwned: "dw_friend_owned",
  // Real 1:1 chat docs. chatId = sorted([uidA,uidB]).join("_").
  chats: "dw_chats",
  // Mock-only collections promoted to Firestore (Phase 4)
  charts: "dw_charts",
  gameDbMetrics: "dw_game_db_metrics",
  lfgGroups: "dw_lfg_groups",
  speedrunRuns: "dw_speedrun_runs",
  // Avatar wardrobe catalog
  cosmetics: "dw_cosmetics",
  // CDN / distribution backbone
  cdnNodes: "dw_cdn_nodes",
  distributionStats: "dw_distribution_stats",
  gameManifests: "dw_game_manifests",
  deltaPatches: "dw_delta_patches",
  // DRM / licensing
  drmLicenses: "dw_drm_licenses",
  // Voice chat
  voiceChannels: "dw_voice_channels",
  voiceSessions: "dw_voice_sessions",
  // Communities / social-graph scale
  communities: "dw_communities",
  communityMembers: "dw_community_members",
  communityPosts: "dw_community_posts",
  socialGraphCounters: "dw_social_graph_counters",
  // Telemetry (Console / observability backbone)
  telemetrySessions: "dw_telemetry_sessions",
  telemetryEvents: "dw_telemetry_events",
  telemetryErrors: "dw_telemetry_errors",
  telemetryPerf: "dw_telemetry_perf",
  telemetryDevices: "dw_telemetry_devices",
  // Console operator surface
  consoleAnnotations: "dw_console_annotations",
  consoleErrorIssues: "dw_console_error_issues",
  consoleSavedViews: "dw_console_saved_views",
  consoleInsights: "dw_console_insights",
  // Per-actor rollups (nightly job or on-demand)
  telemetryUserRollups: "dw_telemetry_user_rollups",
  telemetryAppRollups: "dw_telemetry_app_rollups",
  telemetryPublisherRollups: "dw_telemetry_publisher_rollups",
  // Privacy: scheduled deletion queue. Cloud Function picks up + processes.
  deletionRequests: "dw_deletion_requests",
  // ── Tier 1–6 expansion ────────────────────────────────────────────────────
  // Tier 1: Replay, funnels, experiments, alerts
  telemetryReplays: "dw_telemetry_replays",
  consoleFunnels: "dw_console_funnels",
  consoleExperiments: "dw_console_experiments",
  consoleAlertRules: "dw_console_alert_rules",
  consoleAlertEvents: "dw_console_alert_events",
  // Tier 2: Deploys, resource timings (sampled)
  consoleDeploys: "dw_console_deploys",
  // Tier 3: Voice QoS samples
  voiceQosSamples: "dw_voice_qos_samples",
  // Tier 5: Fraud / Auth anomalies
  fraudSignals: "dw_fraud_signals",
  authAnomalies: "dw_auth_anomalies",
  // Tier 6: Ad-hoc queries + dashboards
  consoleQueries: "dw_console_queries",
  consoleDashboards: "dw_console_dashboards",
  // Email pipeline (server-issued events; client logs opens)
  emailEvents: "dw_email_events",
  // Referral invites
  referrals: "dw_referrals",
  // ── Access control (Owner / team permissions / creator onboarding) ────────
  // Tokens are stored hashed at the document ID; only Cloud Functions read/write.
  creatorInvites: "dw_creator_invites",
  adminInvites: "dw_admin_invites",
  creatorApplications: "dw_creator_applications",
} as const;

// Per-user subcollection paths under `users/{uid}/...`.
// (Most user docs live in COLLECTIONS.users which currently resolves to
// "users" — see CLAUDE.md for the prefix-rename caveat.)
export const USER_SUBCOLLECTIONS = {
  saveHistory: "save_history",
  preferences: "preferences",
  recentlyViewed: "recently_viewed",
  scanHistory: "scan_history",
  /** Friend-graph edges: users/{uid}/friends/{friendUid}. Mirrored on both sides. */
  friends: "friends",
} as const;

// Subcollection under each chat document — dw_chats/{chatId}/messages/{msgId}.
export const CHAT_SUBCOLLECTIONS = {
  messages: "messages",
} as const;

// Subcollection name fragments (used as second-level path segments under apps/{appId}/...)
export const SUBCOLLECTIONS = {
  appBuilds: "builds",
  appAchievements: "achievements",
} as const;

