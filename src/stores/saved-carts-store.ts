import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, GameId } from "@/lib/types";

export interface SavedCart {
  id: string;
  name: string;
  savedAt: string;
  items: CartItem[];
}

interface SavedCartsStore {
  saved: SavedCart[];
  save: (name: string, items: CartItem[]) => string;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  /** Get a saved cart's items by id. */
  itemsFor: (id: string) => CartItem[] | null;
}

/**
 * Saved carts live in localStorage only — never synced to Firestore. They are
 * scratchpads: birthday wishlists, sale-day plans, gift carts for different
 * recipients. Per the user's "no extra Firebase usage" constraint, we don't
 * push these anywhere.
 */
export const useSavedCartsStore = create<SavedCartsStore>()(
  persist(
    (set, get) => ({
      saved: [],
      save: (name, items) => {
        const id = Math.random().toString(36).slice(2, 10);
        const entry: SavedCart = {
          id,
          name: name.trim() || `Cart ${new Date().toLocaleDateString()}`,
          savedAt: new Date().toISOString(),
          items: items.map((i) => ({ ...i })),
        };
        set((s) => ({ saved: [entry, ...s.saved].slice(0, 20) }));
        return id;
      },
      remove: (id) => set((s) => ({ saved: s.saved.filter((c) => c.id !== id) })),
      rename: (id, name) =>
        set((s) => ({
          saved: s.saved.map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c)),
        })),
      itemsFor: (id) => get().saved.find((c) => c.id === id)?.items ?? null,
    }),
    {
      name: "dw-saved-carts",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export type { GameId };
