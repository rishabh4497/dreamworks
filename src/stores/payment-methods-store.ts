import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaymentMethod } from "@/lib/types";

const SEED_CARDS: PaymentMethod[] = [
  {
    id: "card-visa-4242",
    brand: "Visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2028,
    holderName: "Card Holder",
    isDefault: true,
  },
];

type AddInput = Omit<PaymentMethod, "id" | "isDefault"> & { isDefault?: boolean };

interface PaymentMethodsStore {
  cards: PaymentMethod[];
  add: (card: AddInput) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
}

export const usePaymentMethodsStore = create<PaymentMethodsStore>()(
  persist(
    (set) => ({
      cards: [...SEED_CARDS],
      add: (card) =>
        set((s) => {
          const makeDefault = card.isDefault || s.cards.length === 0;
          const next: PaymentMethod = {
            ...card,
            id: `card-${Date.now()}`,
            isDefault: makeDefault,
          };
          const others = makeDefault
            ? s.cards.map((c) => ({ ...c, isDefault: false }))
            : s.cards;
          return { cards: [...others, next] };
        }),
      remove: (id) =>
        set((s) => {
          const filtered = s.cards.filter((c) => c.id !== id);
          // If we removed the default and any cards remain, promote the first.
          const hasDefault = filtered.some((c) => c.isDefault);
          const next = !hasDefault && filtered.length > 0
            ? filtered.map((c, i) => ({ ...c, isDefault: i === 0 }))
            : filtered;
          return { cards: next };
        }),
      setDefault: (id) =>
        set((s) => ({
          cards: s.cards.map((c) => ({ ...c, isDefault: c.id === id })),
        })),
    }),
    {
      name: "dreamworks-payment-methods",
      version: 1,
    },
  ),
);
