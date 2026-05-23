import { create } from "zustand";
import { doc, onSnapshot } from "firebase/firestore";
import { COLLECTIONS, getDb } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";
import { setFollowing, toggleFollow } from "@/lib/api/user-following";
import type { UserFollowingDoc } from "@/lib/types";

interface FollowingStore {
  handles: Record<string, boolean>;
  isFollowing: (handle: string) => boolean;
  set: (handle: string, value: boolean) => Promise<void>;
  toggle: (handle: string) => Promise<boolean>;
}

export const useFollowingStore = create<FollowingStore>((_, get) => ({
  handles: {},
  isFollowing: (handle) => !!get().handles[handle],
  set: async (handle, value) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await setFollowing(uid, handle, value);
  },
  toggle: async (handle) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return !!get().handles[handle];
    return toggleFollow(uid, handle);
  },
}));

let lastUid: string | undefined = undefined;
let unsubscribe: (() => void) | null = null;

useAuthStore.subscribe((state) => {
  const uid = state.profile?.uid;
  if (uid === lastUid) return;
  lastUid = uid;

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  if (!uid) {
    useFollowingStore.setState({ handles: {} });
    return;
  }

  const ref = doc(getDb(), COLLECTIONS.userFollowing, uid);
  unsubscribe = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      useFollowingStore.setState({ handles: {} });
      return;
    }
    const data = snap.data() as UserFollowingDoc;
    useFollowingStore.setState({ handles: data.handles ?? {} });
  });
});
