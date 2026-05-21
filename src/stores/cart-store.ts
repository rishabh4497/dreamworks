import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, FamilyApprovalMetadata, GameId, GiftRecipient, ISODate } from "@/lib/types";

interface CartStore {
  items: CartItem[];
  add: (id: GameId, asGift?: boolean) => void;
  remove: (id: GameId) => void;
  updateGift: (
    id: GameId,
    gift: {
      asGift: boolean;
      recipient?: GiftRecipient;
      scheduledDeliveryAt?: ISODate;
    },
  ) => void;
  updateFamilyApproval: (id: GameId, approval: FamilyApprovalMetadata) => void;
  clear: () => void;
  has: (id: GameId) => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (id, asGift = false) =>
        set((s) =>
          s.items.some((i) => i.gameId === id)
            ? s
            : { items: [...s.items, { gameId: id, asGift, addedAt: new Date().toISOString() }] },
        ),
      remove: (id) => set((s) => ({ items: s.items.filter((x) => x.gameId !== id) })),
      updateGift: (id, gift) =>
        set((s) => ({
          items: s.items.map((item) =>
            item.gameId === id
              ? {
                  ...item,
                  asGift: gift.asGift,
                  giftRecipient: gift.asGift ? gift.recipient : undefined,
                  scheduledDeliveryAt: gift.asGift ? gift.scheduledDeliveryAt : undefined,
                }
              : item,
          ),
        })),
      updateFamilyApproval: (id, approval) =>
        set((s) => ({
          items: s.items.map((item) =>
            item.gameId === id ? { ...item, familyApproval: approval } : item,
          ),
        })),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((i) => i.gameId === id),
    }),
    { name: "dreamworks-cart" },
  ),
);
