import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameId, WishlistEntry } from "@/lib/types";

interface WishlistStore {
  entries: WishlistEntry[];
  /** Back-compat accessor. Prefer `entries`. */
  ids: GameId[];
  add: (id: GameId) => void;
  remove: (id: GameId) => void;
  toggle: (id: GameId) => boolean;
  has: (id: GameId) => boolean;
  clear: () => void;
  getEntry: (id: GameId) => WishlistEntry | undefined;
  updateEntry: (id: GameId, patch: Partial<WishlistEntry>) => void;
}

function makeEntry(id: GameId): WishlistEntry {
  return {
    gameId: id,
    addedAt: new Date().toISOString(),
    priority: 0,
    notifyOnSale: true,
  };
}

function deriveIds(entries: WishlistEntry[]): GameId[] {
  return entries.map((e) => e.gameId);
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      entries: [],
      ids: [],
      add: (id) =>
        set((s) => {
          if (s.entries.some((e) => e.gameId === id)) return s;
          const entries = [...s.entries, makeEntry(id)];
          return { entries, ids: deriveIds(entries) };
        }),
      remove: (id) =>
        set((s) => {
          const entries = s.entries.filter((e) => e.gameId !== id);
          return { entries, ids: deriveIds(entries) };
        }),
      toggle: (id) => {
        const exists = get().entries.some((e) => e.gameId === id);
        if (exists) {
          set((s) => {
            const entries = s.entries.filter((e) => e.gameId !== id);
            return { entries, ids: deriveIds(entries) };
          });
        } else {
          set((s) => {
            const entries = [...s.entries, makeEntry(id)];
            return { entries, ids: deriveIds(entries) };
          });
        }
        return !exists;
      },
      has: (id) => get().entries.some((e) => e.gameId === id),
      clear: () => set({ entries: [], ids: [] }),
      getEntry: (id) => get().entries.find((e) => e.gameId === id),
      updateEntry: (id, patch) =>
        set((s) => {
          const entries = s.entries.map((e) =>
            e.gameId === id ? { ...e, ...patch } : e,
          );
          return { entries, ids: deriveIds(entries) };
        }),
    }),
    {
      name: "dreamworks-wishlist",
      version: 2,
      migrate: (persistedState, version) => {
        // v1 shape: { ids: string[] }. v2 shape: { entries: WishlistEntry[] }.
        if (!persistedState || typeof persistedState !== "object") {
          return { entries: [], ids: [] } as Partial<WishlistStore>;
        }
        const legacy = persistedState as { ids?: unknown; entries?: unknown };
        if (version < 2 && Array.isArray(legacy.ids)) {
          const now = new Date().toISOString();
          const entries: WishlistEntry[] = (legacy.ids as unknown[])
            .filter((x): x is string => typeof x === "string")
            .map((id) => ({
              gameId: id,
              addedAt: now,
              priority: 0,
              notifyOnSale: true,
            }));
          return { entries, ids: deriveIds(entries) } as Partial<WishlistStore>;
        }
        const entries = Array.isArray(legacy.entries)
          ? (legacy.entries as WishlistEntry[])
          : [];
        return { entries, ids: deriveIds(entries) } as Partial<WishlistStore>;
      },
      // Only persist `entries`; `ids` is derived on rehydrate.
      partialize: (s) => ({ entries: s.entries }) as Partial<WishlistStore>,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.ids = deriveIds(state.entries);
        }
      },
    },
  ),
);
