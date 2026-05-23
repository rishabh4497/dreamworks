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
} as const;

// Subcollection name fragments (used as second-level path segments under apps/{appId}/...)
export const SUBCOLLECTIONS = {
  appBuilds: "builds",
  appAchievements: "achievements",
} as const;

