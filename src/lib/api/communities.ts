import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type {
  Community,
  CommunityMember,
  CommunityPost,
  SocialGraphCountersDoc,
} from "../types";

const memberDocId = (communityId: string, userId: string) => `${communityId}__${userId}`;

export async function listCommunities(): Promise<Community[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.communities));
  const out: Community[] = [];
  snap.forEach((d) => out.push(d.data() as Community));
  return out.sort((a, b) => b.trendingScore - a.trendingScore);
}

export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  const q = query(
    collection(getDb(), COLLECTIONS.communities),
    where("slug", "==", slug),
    limit(1),
  );
  const snap = await getDocs(q);
  const first = snap.docs[0];
  return first ? (first.data() as Community) : null;
}

export async function listCommunityPosts(communityId: string): Promise<CommunityPost[]> {
  const q = query(
    collection(getDb(), COLLECTIONS.communityPosts),
    where("communityId", "==", communityId),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  const snap = await getDocs(q);
  const out: CommunityPost[] = [];
  snap.forEach((d) => out.push(d.data() as CommunityPost));
  return out;
}

export async function getCommunityMembership(
  communityId: string,
  userId: string,
): Promise<CommunityMember | null> {
  if (!userId) return null;
  const ref = doc(getDb(), COLLECTIONS.communityMembers, memberDocId(communityId, userId));
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as CommunityMember) : null;
}

export async function listUserCommunityIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  const q = query(
    collection(getDb(), COLLECTIONS.communityMembers),
    where("userId", "==", userId),
  );
  const snap = await getDocs(q);
  const out: string[] = [];
  snap.forEach((d) => out.push((d.data() as CommunityMember).communityId));
  return out;
}

export async function joinCommunity(input: {
  communityId: string;
  userId: string;
}): Promise<void> {
  const { communityId, userId } = input;
  if (!userId) return;
  const existing = await getCommunityMembership(communityId, userId);
  if (existing) return;
  const member: CommunityMember = {
    id: memberDocId(communityId, userId),
    communityId,
    userId,
    role: "member",
    joinedAt: new Date().toISOString(),
  };
  await setDoc(doc(getDb(), COLLECTIONS.communityMembers, member.id), member);
  await updateDoc(doc(getDb(), COLLECTIONS.communities, communityId), {
    memberCount: increment(1),
  });
  await bumpUserCommunityCount(userId, 1);
}

export async function leaveCommunity(input: {
  communityId: string;
  userId: string;
}): Promise<void> {
  const { communityId, userId } = input;
  if (!userId) return;
  const existing = await getCommunityMembership(communityId, userId);
  if (!existing) return;
  await deleteDoc(doc(getDb(), COLLECTIONS.communityMembers, memberDocId(communityId, userId)));
  await updateDoc(doc(getDb(), COLLECTIONS.communities, communityId), {
    memberCount: increment(-1),
  });
  await bumpUserCommunityCount(userId, -1);
}

export async function createCommunityPost(
  input: Omit<CommunityPost, "id" | "likeCount" | "commentCount" | "createdAt"> & {
    id?: string;
  },
): Promise<CommunityPost> {
  const post: CommunityPost = {
    id: input.id ?? `${input.communityId}_${crypto.randomUUID().slice(0, 8)}`,
    communityId: input.communityId,
    authorId: input.authorId,
    authorName: input.authorName,
    authorAvatarUrl: input.authorAvatarUrl,
    title: input.title,
    body: input.body,
    gameId: input.gameId,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(getDb(), COLLECTIONS.communityPosts, post.id), post);
  await updateDoc(doc(getDb(), COLLECTIONS.communities, input.communityId), {
    postCount: increment(1),
    trendingScore: increment(1),
  });
  return post;
}

export async function getSocialGraphCounters(
  userId: string,
): Promise<SocialGraphCountersDoc | null> {
  if (!userId) return null;
  const ref = doc(getDb(), COLLECTIONS.socialGraphCounters, userId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as SocialGraphCountersDoc) : null;
}

async function bumpUserCommunityCount(userId: string, delta: number): Promise<void> {
  const ref = doc(getDb(), COLLECTIONS.socialGraphCounters, userId);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { communities: increment(delta) });
  } else {
    const fresh: SocialGraphCountersDoc = {
      userId,
      followers: 0,
      following: 0,
      communities: Math.max(0, delta),
    };
    await setDoc(ref, fresh);
  }
}
