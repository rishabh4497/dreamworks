import { create } from "zustand";
import { attachUserDocSync } from "@/lib/store-factory";
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

attachUserDocSync<FollowingStore, UserFollowingDoc>(useFollowingStore, {
  collectionKey: "userFollowing",
  mapDoc: (data) => ({ handles: data?.handles ?? {} }),
  empty: { handles: {} },
});
