import { create } from "zustand";
import { doc, onSnapshot } from "firebase/firestore";
import { COLLECTIONS, getDb } from "@/lib/firebase";
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
    useGiftRecipientsStore.setState({ recipients: [] });
    return;
  }

  const ref = doc(getDb(), COLLECTIONS.userGiftRecipients, uid);
  unsubscribe = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      useGiftRecipientsStore.setState({ recipients: [] });
      return;
    }
    const data = snap.data() as UserGiftRecipientsDoc;
    useGiftRecipientsStore.setState({ recipients: data.recipients ?? [] });
  });
});
