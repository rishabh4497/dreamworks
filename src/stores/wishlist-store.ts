import { create } from "zustand";
import type { GameId, WishlistEntry } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { getDb, COLLECTIONS } from "@/lib/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

interface WishlistStore {
  entries: WishlistEntry[];
  ids: GameId[];
  add: (id: GameId) => Promise<void>;
  remove: (id: GameId) => Promise<void>;
  toggle: (id: GameId) => Promise<boolean>;
  has: (id: GameId) => boolean;
  clear: () => Promise<void>;
  getEntry: (id: GameId) => WishlistEntry | undefined;
  updateEntry: (id: GameId, patch: Partial<WishlistEntry>) => Promise<void>;
}

function deriveIds(entries: WishlistEntry[]): GameId[] {
  return entries.map((e) => e.gameId);
}

export const useWishlistStore = create<WishlistStore>((_set, get) => ({
  entries: [],
  ids: [],
  add: async (id) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    if (get().entries.some((e) => e.gameId === id)) return;
    const docRef = doc(getDb(), COLLECTIONS.wishlist, `${profile.uid}_${id}`);
    await setDoc(docRef, {
      userId: profile.uid,
      gameId: id,
      addedAt: new Date().toISOString(),
      priority: 0,
      notifyOnSale: true,
    });
  },
  remove: async (id) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    const docRef = doc(getDb(), COLLECTIONS.wishlist, `${profile.uid}_${id}`);
    await deleteDoc(docRef);
  },
  toggle: async (id) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return false;
    const exists = get().entries.some((e) => e.gameId === id);
    const docRef = doc(getDb(), COLLECTIONS.wishlist, `${profile.uid}_${id}`);
    if (exists) {
      await deleteDoc(docRef);
      return false;
    } else {
      await setDoc(docRef, {
        userId: profile.uid,
        gameId: id,
        addedAt: new Date().toISOString(),
        priority: 0,
        notifyOnSale: true,
      });
      return true;
    }
  },
  has: (id) => get().entries.some((e) => e.gameId === id),
  clear: async () => {
    // Delete all wishlist docs for the user
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    // We can loop over entries and delete them
    const promises = get().entries.map((e) => {
      const docRef = doc(getDb(), COLLECTIONS.wishlist, `${profile.uid}_${e.gameId}`);
      return deleteDoc(docRef);
    });
    await Promise.all(promises);
  },
  getEntry: (id) => get().entries.find((e) => e.gameId === id),
  updateEntry: async (id, patch) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    const docRef = doc(getDb(), COLLECTIONS.wishlist, `${profile.uid}_${id}`);
    await updateDoc(docRef, patch);
  },
}));

let lastUid: string | undefined = undefined;
let unsubscribeWishlist: (() => void) | null = null;

useAuthStore.subscribe((state) => {
  const uid = state.profile?.uid;
  if (uid === lastUid) return;
  lastUid = uid;

  if (unsubscribeWishlist) {
    unsubscribeWishlist();
    unsubscribeWishlist = null;
  }

  if (!uid) {
    useWishlistStore.setState({ entries: [], ids: [] });
    return;
  }

  const q = query(collection(getDb(), COLLECTIONS.wishlist), where("userId", "==", uid));
  unsubscribeWishlist = onSnapshot(q, (snap) => {
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
    useWishlistStore.setState({ entries, ids: deriveIds(entries) });
  });
});

