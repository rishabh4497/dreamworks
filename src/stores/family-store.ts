import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FamilyMember } from "@/lib/types";

const SEED_MEMBERS: FamilyMember[] = [
  {
    id: "family-sarah",
    name: "Sarah",
    relationship: "Sister",
    authorized: true,
    lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "family-leo",
    name: "Leo",
    relationship: "Brother",
    authorized: false,
    lastActiveAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

type AddInput = Pick<FamilyMember, "name" | "relationship"> & {
  authorized?: boolean;
};

interface FamilyStore {
  members: FamilyMember[];
  add: (member: AddInput) => void;
  remove: (id: string) => void;
  setAuthorized: (id: string, next: boolean) => void;
}

export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set) => ({
      members: [...SEED_MEMBERS],
      add: (member) =>
        set((s) => ({
          members: [
            ...s.members,
            {
              id: `family-${Date.now()}`,
              name: member.name,
              relationship: member.relationship,
              authorized: member.authorized ?? false,
              lastActiveAt: null,
            },
          ],
        })),
      remove: (id) => set((s) => ({ members: s.members.filter((m) => m.id !== id) })),
      setAuthorized: (id, next) =>
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, authorized: next } : m)),
        })),
    }),
    {
      name: "dreamworks-family",
      version: 1,
    },
  ),
);
