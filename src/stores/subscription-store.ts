import { create } from "zustand";
import { attachUserDocSync } from "@/lib/store-factory";
import { useAuthStore } from "@/stores/auth-store";
import {
  pauseSubscription,
  resumeSubscription,
} from "@/lib/api/user-billing";
import type { UserBillingDoc, UserSubscription } from "@/lib/types";

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  tier: "free",
  paused: false,
  pausedUntil: null,
  nextBillingAt: null,
};

interface SubscriptionStore {
  subscription: UserSubscription;
  /** True until the first snapshot has arrived for the current user. */
  loaded: boolean;
  pause: (untilISO: string) => Promise<void>;
  resume: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>(() => ({
  subscription: { ...DEFAULT_SUBSCRIPTION },
  loaded: false,
  pause: async (untilISO) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await pauseSubscription(uid, untilISO);
  },
  resume: async () => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await resumeSubscription(uid);
  },
}));

attachUserDocSync<SubscriptionStore, UserBillingDoc>(useSubscriptionStore, {
  collectionKey: "userBilling",
  mapDoc: (data) => ({
    subscription: { ...DEFAULT_SUBSCRIPTION, ...(data?.subscription ?? {}) },
    loaded: true,
  }),
  empty: { subscription: { ...DEFAULT_SUBSCRIPTION }, loaded: false },
});
