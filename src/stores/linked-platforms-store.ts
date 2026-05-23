import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LinkedPlatform, LinkedPlatformId } from "@/lib/types";

const SEED_PLATFORMS: Record<LinkedPlatformId, LinkedPlatform> = {
  psn: {
    id: "psn",
    name: "PlayStation Network",
    connected: true,
    lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  "xbox-live": {
    id: "xbox-live",
    name: "Xbox Live",
    connected: false,
    lastSyncedAt: null,
  },
  steam: {
    id: "steam",
    name: "Steam",
    connected: true,
    lastSyncedAt: new Date().toISOString(),
  },
  epic: {
    id: "epic",
    name: "Epic Games",
    connected: false,
    lastSyncedAt: null,
  },
};

interface LinkedPlatformsStore {
  platforms: Record<LinkedPlatformId, LinkedPlatform>;
  connect: (id: LinkedPlatformId) => void;
  unlink: (id: LinkedPlatformId) => void;
  sync: (id: LinkedPlatformId) => void;
}

export const useLinkedPlatformsStore = create<LinkedPlatformsStore>()(
  persist(
    (set) => ({
      platforms: { ...SEED_PLATFORMS },
      connect: (id) =>
        set((s) => ({
          platforms: {
            ...s.platforms,
            [id]: {
              ...s.platforms[id],
              connected: true,
              lastSyncedAt: new Date().toISOString(),
            },
          },
        })),
      unlink: (id) =>
        set((s) => ({
          platforms: {
            ...s.platforms,
            [id]: { ...s.platforms[id], connected: false, lastSyncedAt: null },
          },
        })),
      sync: (id) =>
        set((s) => ({
          platforms: {
            ...s.platforms,
            [id]: { ...s.platforms[id], lastSyncedAt: new Date().toISOString() },
          },
        })),
    }),
    {
      name: "dreamworks-linked-platforms",
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Fill in any platform ids that didn't exist when the user last persisted.
        state.platforms = { ...SEED_PLATFORMS, ...state.platforms };
      },
    },
  ),
);
