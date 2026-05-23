import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type {
  LinkedPlatform,
  LinkedPlatformId,
  UserPlatformsDoc,
} from "../types";

function now(): string {
  return new Date().toISOString();
}

const PLATFORM_NAMES: Record<LinkedPlatformId, string> = {
  psn: "PlayStation Network",
  "xbox-live": "Xbox Live",
  steam: "Steam",
  epic: "Epic Games",
};

export function emptyPlatforms(userId: string): UserPlatformsDoc {
  const platforms = {} as Record<LinkedPlatformId, LinkedPlatform>;
  (Object.keys(PLATFORM_NAMES) as LinkedPlatformId[]).forEach((id) => {
    platforms[id] = {
      id,
      name: PLATFORM_NAMES[id],
      connected: false,
      lastSyncedAt: null,
    };
  });
  return { userId, platforms, updatedAt: now() };
}

export async function getUserPlatforms(
  userId: string,
): Promise<UserPlatformsDoc> {
  const snap = await getDoc(doc(getDb(), COLLECTIONS.userPlatforms, userId));
  if (!snap.exists()) return emptyPlatforms(userId);
  const data = snap.data() as UserPlatformsDoc;
  // Fill in any platform ids that didn't exist when the user last wrote.
  return {
    ...data,
    platforms: { ...emptyPlatforms(userId).platforms, ...data.platforms },
  };
}

async function writePlatforms(next: UserPlatformsDoc): Promise<void> {
  await setDoc(doc(getDb(), COLLECTIONS.userPlatforms, next.userId), {
    ...next,
    updatedAt: now(),
  });
}

export async function connectPlatform(
  userId: string,
  id: LinkedPlatformId,
): Promise<void> {
  const current = await getUserPlatforms(userId);
  current.platforms[id] = {
    ...current.platforms[id],
    connected: true,
    lastSyncedAt: now(),
  };
  await writePlatforms(current);
}

export async function unlinkPlatform(
  userId: string,
  id: LinkedPlatformId,
): Promise<void> {
  const current = await getUserPlatforms(userId);
  current.platforms[id] = {
    ...current.platforms[id],
    connected: false,
    lastSyncedAt: null,
  };
  await writePlatforms(current);
}

export async function markPlatformSynced(
  userId: string,
  id: LinkedPlatformId,
): Promise<void> {
  const current = await getUserPlatforms(userId);
  current.platforms[id] = {
    ...current.platforms[id],
    lastSyncedAt: now(),
  };
  await writePlatforms(current);
}
