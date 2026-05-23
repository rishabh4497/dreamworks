import { create } from "zustand";
import { doc, onSnapshot } from "firebase/firestore";
import { COLLECTIONS, getDb } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";
import {
  addFamilyMember,
  removeFamilyMember,
  setMemberAuthorized,
  type FamilyMemberInput,
} from "@/lib/api/user-family";
import type { FamilyMember, UserFamilyDoc } from "@/lib/types";

interface FamilyStore {
  members: FamilyMember[];
  add: (member: FamilyMemberInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setAuthorized: (id: string, next: boolean) => Promise<void>;
}

export const useFamilyStore = create<FamilyStore>(() => ({
  members: [],
  add: async (member) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await addFamilyMember(uid, member);
  },
  remove: async (id) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await removeFamilyMember(uid, id);
  },
  setAuthorized: async (id, next) => {
    const uid = useAuthStore.getState().profile?.uid;
    if (!uid) return;
    await setMemberAuthorized(uid, id, next);
  },
}));

let lastUid: string | undefined = undefined;
let unsubscribe: (() => void) | null = null;

function sync(state: ReturnType<typeof useAuthStore.getState>) {
  const uid = state.profile?.uid;
  if (uid === lastUid) return;
  lastUid = uid;

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  if (!uid) {
    useFamilyStore.setState({ members: [] });
    return;
  }

  const ref = doc(getDb(), COLLECTIONS.userFamily, uid);
  unsubscribe = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      useFamilyStore.setState({ members: [] });
      return;
    }
    const data = snap.data() as UserFamilyDoc;
    useFamilyStore.setState({ members: data.members ?? [] });
  });
}

useAuthStore.subscribe(sync);
sync(useAuthStore.getState());
