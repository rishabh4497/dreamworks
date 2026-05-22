import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

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
} as const;

