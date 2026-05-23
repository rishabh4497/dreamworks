import { create } from "zustand";
import { attachUserDocSync } from "@/lib/store-factory";
import { useAuthStore } from "@/stores/auth-store";
import {
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "@/lib/api/user-billing";
import type { PaymentMethod, UserBillingDoc } from "@/lib/types";

type AddInput = Omit<PaymentMethod, "id" | "isDefault"> & {
  isDefault?: boolean;
};

interface PaymentMethodsStore {
  cards: PaymentMethod[];
  add: (card: AddInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
}

export const usePaymentMethodsStore = create<PaymentMethodsStore>(() => ({
  cards: [],
  add: async (card) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await addPaymentMethod(uid, card);
  },
  remove: async (id) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await removePaymentMethod(uid, id);
  },
  setDefault: async (id) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await setDefaultPaymentMethod(uid, id);
  },
}));

attachUserDocSync<PaymentMethodsStore, UserBillingDoc>(usePaymentMethodsStore, {
  collectionKey: "userBilling",
  mapDoc: (data) => ({ cards: data?.paymentMethods ?? [] }),
  empty: { cards: [] },
});
