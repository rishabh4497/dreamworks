import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type { UserFollowingDoc } from "../types";

function now(): string {
  return new Date().toISOString();
}

export function emptyFollowing(userId: string): UserFollowingDoc {
  return { userId, handles: {}, updatedAt: now() };
}

export async function getUserFollowing(
  userId: string,
): Promise<UserFollowingDoc> {
  const snap = await getDoc(doc(getDb(), COLLECTIONS.userFollowing, userId));
  if (!snap.exists()) return emptyFollowing(userId);
  return snap.data() as UserFollowingDoc;
}

async function writeFollowing(next: UserFollowingDoc): Promise<void> {
  await setDoc(doc(getDb(), COLLECTIONS.userFollowing, next.userId), {
    ...next,
    updatedAt: now(),
  });
}

export async function setFollowing(
  userId: string,
  handle: string,
  following: boolean,
): Promise<void> {
  const current = await getUserFollowing(userId);
  await writeFollowing({
    ...current,
    handles: { ...current.handles, [handle]: following },
  });
}

export async function toggleFollow(
  userId: string,
  handle: string,
): Promise<boolean> {
  const current = await getUserFollowing(userId);
  const next = !current.handles[handle];
  await writeFollowing({
    ...current,
    handles: { ...current.handles, [handle]: next },
  });
  return next;
}
