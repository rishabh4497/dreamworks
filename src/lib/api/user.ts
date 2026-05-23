import type { Collection, LibraryEntry, UserProfile, UserRole, WishlistEntry } from "../types";
import { getDb, COLLECTIONS, getFirebaseAuth } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuthStore } from "@/stores/auth-store";
import { DEFAULT_AVATAR_OPTIONS } from "@/lib/avatar";

export async function getCurrentUser(): Promise<UserProfile> {
  const profile = useAuthStore.getState().profile;
  if (profile) return profile;

  const authUser = getFirebaseAuth().currentUser;
  if (!authUser) {
    throw new Error("No authenticated user");
  }

  const profileDoc = await getProfile(authUser.uid);
  if (!profileDoc) {
    throw new Error("User profile not found");
  }
  return profileDoc;
}

export async function getProfile(uid: string): Promise<UserProfile | undefined> {
  const userRef = doc(getDb(), COLLECTIONS.users, uid);
  const profileDoc = await getDoc(userRef);
  if (!profileDoc.exists()) return undefined;
  
  const data = profileDoc.data();
  return {
    uid: data.uid || uid,
    email: data.email || "",
    displayName: data.displayName || "User",
    avatarUrl: data.photoURL || `https://picsum.photos/seed/${uid}/96/96`,
    avatarOptions: data.avatarOptions || DEFAULT_AVATAR_OPTIONS,
    level: typeof data.level === "number" ? data.level : 1,
    bio: data.bio || "",
    country: data.country || "India",
    memberSince: data.memberSince || new Date().toISOString(),
    showcaseGameIds: data.showcaseGameIds || [],
    isSubscribed: !!data.isSubscribed,
    role: ((data.role as UserRole) ?? "user"),
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    suspended: !!data.suspended,
  };
}

export async function getLibrary(): Promise<LibraryEntry[]> {
  const authUser = getFirebaseAuth().currentUser;
  if (!authUser) return [];

  const q = query(collection(getDb(), COLLECTIONS.library), where("userId", "==", authUser.uid));
  const snap = await getDocs(q);
  const entries: LibraryEntry[] = [];
  snap.forEach((d) => {
    const data = d.data();
    entries.push({
      gameId: data.gameId,
      ownedSince: data.ownedSince,
      installed: !!data.installed,
      sizeBytes: data.sizeBytes || 0,
      playMinutes: data.playMinutes || 0,
      lastPlayed: data.lastPlayed || null,
      collectionIds: data.collectionIds || [],
      achievementsUnlocked: data.achievementsUnlocked || 0,
      completionPct: data.completionPct || 0,
      refundWindow: data.refundWindow || null,
      orderId: data.orderId,
      sourceLauncher: data.sourceLauncher || "dreamworks",
      externalId: data.externalId,
      installPath: data.installPath,
      launchCommand: data.launchCommand,
      installedVersion: data.installedVersion,
      lastVerifiedAt: data.lastVerifiedAt || null,
      cloudSaveStatus: data.cloudSaveStatus || "synced",
      drmType: data.drmType || "dreamworks",
      canLaunchOffline: data.canLaunchOffline !== false,
      sources: data.sources || [],
    });
  });
  return entries;
}

export async function getWishlist(): Promise<WishlistEntry[]> {
  const authUser = getFirebaseAuth().currentUser;
  if (!authUser) return [];

  const q = query(collection(getDb(), COLLECTIONS.wishlist), where("userId", "==", authUser.uid));
  const snap = await getDocs(q);
  const entries: WishlistEntry[] = [];
  snap.forEach((d) => {
    const data = d.data();
    entries.push({
      gameId: data.gameId,
      addedAt: data.addedAt,
      priority: data.priority || 0,
      notifyOnSale: data.notifyOnSale !== false,
      priceCeilingCents: data.priceCeilingCents,
      notifyOnlyAtATL: !!data.notifyOnlyAtATL,
      lastAlertedAt: data.lastAlertedAt,
    });
  });
  return entries;
}

export async function getCollections(): Promise<Collection[]> {
  const authUser = getFirebaseAuth().currentUser;
  if (!authUser) return [];

  const q = query(collection(getDb(), COLLECTIONS.collections), where("userId", "==", authUser.uid));
  const snap = await getDocs(q);
  const collections: Collection[] = [];
  snap.forEach((d) => {
    const data = d.data();
    collections.push({
      id: d.id,
      name: data.name || "Collection",
      gameIds: data.gameIds || [],
    });
  });
  return collections;
}

