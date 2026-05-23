import { create } from "zustand";
import { attachUserDocSync } from "@/lib/store-factory";
import { useAuthStore } from "@/stores/auth-store";
import {
  addRecipient,
  removeRecipient,
} from "@/lib/api/user-gift-recipients";
import type { GiftRecipient, UserGiftRecipientsDoc } from "@/lib/types";

interface GiftRecipientsStore {
  recipients: GiftRecipient[];
  add: (recipient: GiftRecipient) => Promise<void>;
  remove: (recipient: GiftRecipient) => Promise<void>;
}

export const useGiftRecipientsStore = create<GiftRecipientsStore>(() => ({
  recipients: [],
  add: async (recipient) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await addRecipient(uid, recipient);
  },
  remove: async (recipient) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await removeRecipient(uid, recipient);
  },
}));

attachUserDocSync<GiftRecipientsStore, UserGiftRecipientsDoc>(useGiftRecipientsStore, {
  collectionKey: "userGiftRecipients",
  mapDoc: (data) => ({ recipients: data?.recipients ?? [] }),
  empty: { recipients: [] },
});
