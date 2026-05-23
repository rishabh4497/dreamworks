import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameId } from "@/lib/types";
import { syncWithFirestore } from "@/lib/firestore-sync";

interface RecentlyViewedStore {
  ids: GameId[];
  push: (id: GameId) => void;
  clear: () => void;
}

const MAX = 50;

interface RemoteRecent {
  ids: GameId[];
}

let firestoreHandle: ReturnType<typeof syncWithFirestore<RemoteRecent>> | null = null;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => {
      if (typeof window !== "undefined" && !firestoreHandle) {
        firestoreHandle = syncWithFirestore<RemoteRecent>({
          key: "recently_viewed",
          selectSlice: () => ({ ids: get().ids }),
          applyRemote: (remote) => {
            if (Array.isArray(remote.ids)) {
              set({ ids: remote.ids.slice(0, MAX) });
            }
          },
        });
      }
      return {
        ids: [],
        push: (id) =>
          set((s) => {
            const next = [id, ...s.ids.filter((x) => x !== id)].slice(0, MAX);
            firestoreHandle?.push({ ids: next });
            return { ids: next };
          }),
        clear: () => {
          firestoreHandle?.push({ ids: [] });
          set({ ids: [] });
        },
      };
    },
    { name: "dreamworks-recent" },
  ),
);
