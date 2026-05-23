import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type { FamilyMember, FamilyRelationship, UserFamilyDoc } from "../types";

function now(): string {
  return new Date().toISOString();
}

export function emptyFamily(userId: string): UserFamilyDoc {
  return { userId, members: [], updatedAt: now() };
}

export async function getUserFamily(userId: string): Promise<UserFamilyDoc> {
  const snap = await getDoc(doc(getDb(), COLLECTIONS.userFamily, userId));
  if (!snap.exists()) return emptyFamily(userId);
  return snap.data() as UserFamilyDoc;
}

async function writeFamily(next: UserFamilyDoc): Promise<void> {
  await setDoc(doc(getDb(), COLLECTIONS.userFamily, next.userId), {
    ...next,
    updatedAt: now(),
  });
}

export interface FamilyMemberInput {
  name: string;
  relationship: FamilyRelationship;
  authorized?: boolean;
}

export async function addFamilyMember(
  userId: string,
  input: FamilyMemberInput,
): Promise<FamilyMember> {
  const current = await getUserFamily(userId);
  const member: FamilyMember = {
    id: `family-${Date.now()}`,
    name: input.name,
    relationship: input.relationship,
    authorized: input.authorized ?? false,
    lastActiveAt: null,
  };
  await writeFamily({ ...current, members: [...current.members, member] });
  return member;
}

export async function removeFamilyMember(
  userId: string,
  id: string,
): Promise<void> {
  const current = await getUserFamily(userId);
  await writeFamily({
    ...current,
    members: current.members.filter((m) => m.id !== id),
  });
}

export async function setMemberAuthorized(
  userId: string,
  id: string,
  authorized: boolean,
): Promise<void> {
  const current = await getUserFamily(userId);
  await writeFamily({
    ...current,
    members: current.members.map((m) =>
      m.id === id ? { ...m, authorized } : m,
    ),
  });
}
