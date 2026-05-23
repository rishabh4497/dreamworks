import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, FamilyApprovalMetadata, GameId, GiftRecipient, ISODate } from "@/lib/types";
import { getDb } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthStore } from "./auth-store";

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
  hydrateFromFirestore: () => Promise<void>;
}

const CART_COL = "dw_carts";

function syncToFirestore(items: CartItem[]): void {
  const uid = useAuthStore.getState().profile?.uid;
  if (!uid) return;
  // Fire-and-forget; localStorage stays the source of truth for instant render
  // and the Firestore write only matters for cross-device roaming.
  void setDoc(doc(getDb(), CART_COL, uid), {
    userId: uid,
    items,
    updatedAt: new Date().toISOString(),
  }).catch(() => {});
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (id, asGift = false) =>
        set((s) => {
          if (s.items.some((i) => i.gameId === id)) return s;
          const next = [...s.items, { gameId: id, asGift, addedAt: new Date().toISOString() }];
          syncToFirestore(next);
          return { items: next };
        }),
      remove: (id) =>
        set((s) => {
          const next = s.items.filter((x) => x.gameId !== id);
          if (next.length === s.items.length) return s;
          syncToFirestore(next);
          return { items: next };
        }),
      updateGift: (id, gift) =>
        set((s) => {
          const next = s.items.map((item) =>
            item.gameId === id
              ? {
                  ...item,
                  asGift: gift.asGift,
                  giftRecipient: gift.asGift ? gift.recipient : undefined,
                  scheduledDeliveryAt: gift.asGift ? gift.scheduledDeliveryAt : undefined,
                }
              : item,
          );
          syncToFirestore(next);
          return { items: next };
        }),
      updateFamilyApproval: (id, approval) =>
        set((s) => {
          const next = s.items.map((item) =>
            item.gameId === id ? { ...item, familyApproval: approval } : item,
          );
          syncToFirestore(next);
          return { items: next };
        }),
      clear: () => {
        syncToFirestore([]);
        set({ items: [] });
      },
      has: (id) => get().items.some((i) => i.gameId === id),
      hydrateFromFirestore: async () => {
        const uid = useAuthStore.getState().profile?.uid;
        if (!uid) return;
        try {
          const snap = await getDoc(doc(getDb(), CART_COL, uid));
          if (!snap.exists()) return;
          const data = snap.data() as { items?: CartItem[] };
          if (!data.items) return;
          // Merge: prefer Firestore for cross-device, but don't drop in-flight
          // local items that haven't synced yet.
          const local = get().items;
          const merged = [...data.items];
          const seen = new Set(merged.map((i) => i.gameId));
          for (const item of local) {
            if (!seen.has(item.gameId)) merged.push(item);
          }
          set({ items: merged });
        } catch {
          // Network unavailable — local cache remains authoritative.
        }
      },
    }),
    { name: "dreamworks-cart" },
  ),
);

// Hydrate from Firestore on auth state change (sign-in or session restore).
let lastCartUid: string | undefined;
useAuthStore.subscribe((state) => {
  const uid = state.profile?.uid;
  if (uid === lastCartUid) return;
  lastCartUid = uid;
  if (uid) void useCartStore.getState().hydrateFromFirestore();
});
