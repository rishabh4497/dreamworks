import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const MAX_ENTRIES = 6;

interface RecentSearchesStore {
  queries: string[];
  push: (query: string) => void;
  clear: () => void;
}

/**
 * Tiny localStorage-only store for the topbar typeahead. Recent searches are
 * device-local by design — they leak less of the user's intent across machines
 * and never hit Firestore.
 */
export const useRecentSearchesStore = create<RecentSearchesStore>()(
  persist(
    (set) => ({
      queries: [],
      push: (rawQuery) =>
        set((state) => {
          const q = rawQuery.trim();
          if (!q) return state;
          const next = [q, ...state.queries.filter((x) => x.toLowerCase() !== q.toLowerCase())];
          return { queries: next.slice(0, MAX_ENTRIES) };
        }),
      clear: () => set({ queries: [] }),
    }),
    {
      name: "dw-recent-searches",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
