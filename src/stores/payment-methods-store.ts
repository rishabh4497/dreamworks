import { create } from "zustand";
import { doc, onSnapshot } from "firebase/firestore";
import { COLLECTIONS, getDb } from "@/lib/firebase";
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

let lastUid: string | undefined = undefined;
let unsubscribe: (() => void) | null = null;

useAuthStore.subscribe((state) => {
  const uid = state.profile?.uid;
  if (uid === lastUid) return;
  lastUid = uid;

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  if (!uid) {
    usePaymentMethodsStore.setState({ cards: [] });
    return;
  }

  const ref = doc(getDb(), COLLECTIONS.userBilling, uid);
  unsubscribe = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      usePaymentMethodsStore.setState({ cards: [] });
      return;
    }
    const data = snap.data() as UserBillingDoc;
    usePaymentMethodsStore.setState({ cards: data.paymentMethods ?? [] });
  });
});
