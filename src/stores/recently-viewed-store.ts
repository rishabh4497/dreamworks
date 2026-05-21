import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameId } from "@/lib/types";

interface RecentlyViewedStore {
  ids: GameId[];
  push: (id: GameId) => void;
  clear: () => void;
}

const MAX = 10;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      ids: [],
      push: (id) =>
        set((s) => ({
          ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, MAX),
        })),
      clear: () => set({ ids: [] }),
    }),
    { name: "dreamworks-recent" },
  ),
);
