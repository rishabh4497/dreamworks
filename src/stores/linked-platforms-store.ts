import { create } from "zustand";
import { attachUserDocSync } from "@/lib/store-factory";
import { useAuthStore } from "@/stores/auth-store";
import {
  connectPlatform,
  emptyPlatforms,
  markPlatformSynced,
  unlinkPlatform,
} from "@/lib/api/user-platforms";
import type {
  LinkedPlatform,
  LinkedPlatformId,
  UserPlatformsDoc,
} from "@/lib/types";

interface LinkedPlatformsStore {
  platforms: Record<LinkedPlatformId, LinkedPlatform>;
  connect: (id: LinkedPlatformId) => Promise<void>;
  unlink: (id: LinkedPlatformId) => Promise<void>;
  sync: (id: LinkedPlatformId) => Promise<void>;
}

const INITIAL_PLATFORMS = emptyPlatforms("").platforms;

export const useLinkedPlatformsStore = create<LinkedPlatformsStore>(() => ({
  platforms: { ...INITIAL_PLATFORMS },
  connect: async (id) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await connectPlatform(uid, id);
  },
  unlink: async (id) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await unlinkPlatform(uid, id);
  },
  sync: async (id) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await markPlatformSynced(uid, id);
  },
}));

attachUserDocSync<LinkedPlatformsStore, UserPlatformsDoc>(useLinkedPlatformsStore, {
  collectionKey: "userPlatforms",
  mapDoc: (data) => ({
    platforms: { ...INITIAL_PLATFORMS, ...(data?.platforms ?? {}) },
  }),
  empty: { platforms: { ...INITIAL_PLATFORMS } },
});
