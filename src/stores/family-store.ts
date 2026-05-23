import { create } from "zustand";
import { attachUserDocSync } from "@/lib/store-factory";
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

attachUserDocSync<FamilyStore, UserFamilyDoc>(useFamilyStore, {
  collectionKey: "userFamily",
  mapDoc: (data) => ({ members: data?.members ?? [] }),
  empty: { members: [] },
});
