import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { COLLECTIONS, USER_SUBCOLLECTIONS, getDb } from "../firebase";
import { DEFAULT_AVATAR_OPTIONS } from "@/lib/avatar";
import type {
  Friend,
  FriendEdge,
  FriendEdgeStatus,
  FriendRequest,
  GameId,
  UserProfile,
} from "../types";

/**
 * Real friend graph. Each friendship is stored as a pair of mirrored docs:
 *   users/{A}/friends/{B}  → { uid: B, status, initiator, ... }
 *   users/{B}/friends/{A}  → { uid: A, status, initiator, ... }
 *
 * That lets either side query their own subcollection without a fan-out read,
 * and lets security rules be expressed purely in terms of the path's {uid}.
 */

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // last activity within 2 minutes ⇒ online

function friendDoc(ownerUid: string, friendUid: string) {
  return doc(
    getDb(),
    COLLECTIONS.users,
    ownerUid,
    USER_SUBCOLLECTIONS.friends,
    friendUid,
  );
}

function friendsCol(ownerUid: string) {
  return collection(
    getDb(),
    COLLECTIONS.users,
    ownerUid,
    USER_SUBCOLLECTIONS.friends,
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

function isoFromMaybeTimestamp(value: unknown): string {
  if (!value) return nowIso();
  if (typeof value === "string") return value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return nowIso();
}

function parseEdge(data: DocumentData): FriendEdge | null {
  if (!data?.uid || !data?.status || !data?.initiator) return null;
  return {
    uid: String(data.uid),
    status: data.status as FriendEdgeStatus,
    initiator: String(data.initiator),
    createdAt: isoFromMaybeTimestamp(data.createdAt),
    acceptedAt: data.acceptedAt ? isoFromMaybeTimestamp(data.acceptedAt) : null,
  };
}

function profileToFriend(profile: UserProfile): Friend {
  const lastSeen = profile.lastActiveAt ?? new Date(0).toISOString();
  const fresh =
    profile.lastActiveAt
      ? Date.now() - new Date(profile.lastActiveAt).getTime() < ONLINE_WINDOW_MS
      : false;
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    status: fresh ? "online" : "offline",
    currentGameId: null,
    lastSeen,
  };
}

function profileFromDoc(uid: string, data: DocumentData | undefined): UserProfile {
  const d = data ?? {};
  return {
    uid: d.uid || uid,
    email: d.email || "",
    displayName: d.displayName || "User",
    avatarUrl: d.photoURL || d.avatarUrl || `https://picsum.photos/seed/${uid}/96/96`,
    avatarOptions: d.avatarOptions || DEFAULT_AVATAR_OPTIONS,
    level: typeof d.level === "number" ? d.level : 1,
    bio: d.bio || "",
    country: d.country || "",
    memberSince: d.memberSince || new Date().toISOString(),
    showcaseGameIds: d.showcaseGameIds || [],
    isSubscribed: !!d.isSubscribed,
    role: d.role ?? "user",
    permissions: Array.isArray(d.permissions) ? d.permissions : [],
    suspended: !!d.suspended,
    lastActiveAt: d.lastActiveAt ? isoFromMaybeTimestamp(d.lastActiveAt) : undefined,
  };
}

/** Fetch user profiles in batches of 10 (Firestore `in` query cap). */
async function fetchProfiles(uids: string[]): Promise<Map<string, UserProfile>> {
  const out = new Map<string, UserProfile>();
  if (uids.length === 0) return out;
  const unique = Array.from(new Set(uids));
  for (let i = 0; i < unique.length; i += 10) {
    const chunk = unique.slice(i, i + 10);
    const q = query(
      collection(getDb(), COLLECTIONS.users),
      where(documentId(), "in", chunk),
    );
    const snap = await getDocs(q);
    snap.forEach((d) => out.set(d.id, profileFromDoc(d.id, d.data())));
  }
  // Any uid that didn't materialize gets a synthetic minimal profile so the
  // UI doesn't crash on a dangling edge.
  for (const uid of unique) {
    if (!out.has(uid)) {
      out.set(uid, profileFromDoc(uid, undefined));
    }
  }
  return out;
}

async function readEdges(ownerUid: string): Promise<FriendEdge[]> {
  const snap = await getDocs(friendsCol(ownerUid));
  const edges: FriendEdge[] = [];
  snap.forEach((d) => {
    const edge = parseEdge(d.data());
    if (edge) edges.push(edge);
  });
  return edges;
}

export async function listFriends(ownerUid: string): Promise<Friend[]> {
  if (!ownerUid) return [];
  const edges = await readEdges(ownerUid);
  const accepted = edges.filter((e) => e.status === "accepted");
  const profiles = await fetchProfiles(accepted.map((e) => e.uid));
  return accepted.map((e) => profileToFriend(profiles.get(e.uid)!));
}

export async function listPendingIn(ownerUid: string): Promise<FriendRequest[]> {
  if (!ownerUid) return [];
  const edges = await readEdges(ownerUid);
  const incoming = edges.filter((e) => e.status === "pending-in");
  const profiles = await fetchProfiles(incoming.map((e) => e.uid));
  return incoming.map((e) => {
    const p = profiles.get(e.uid)!;
    return {
      uid: p.uid,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      createdAt: e.createdAt,
      direction: "in" as const,
    };
  });
}

export async function listPendingOut(ownerUid: string): Promise<FriendRequest[]> {
  if (!ownerUid) return [];
  const edges = await readEdges(ownerUid);
  const outgoing = edges.filter((e) => e.status === "pending-out");
  const profiles = await fetchProfiles(outgoing.map((e) => e.uid));
  return outgoing.map((e) => {
    const p = profiles.get(e.uid)!;
    return {
      uid: p.uid,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      createdAt: e.createdAt,
      direction: "out" as const,
    };
  });
}

/**
 * Search the `users` collection by displayName prefix or exact email.
 * Returns up to 10 matches. The current user is filtered out by the caller.
 */
export async function searchUsersByHandle(needle: string): Promise<UserProfile[]> {
  const trimmed = needle.trim();
  if (!trimmed) return [];
  const usersCol = collection(getDb(), COLLECTIONS.users);

  // Email exact match first (cheap & decisive).
  if (trimmed.includes("@")) {
    const snap = await getDocs(
      query(usersCol, where("email", "==", trimmed.toLowerCase())),
    );
    const out: UserProfile[] = [];
    snap.forEach((d) => out.push(profileFromDoc(d.id, d.data())));
    return out;
  }

  // Prefix match on displayName. Firestore "startsAt/endsAt" is implemented via
  // a >= / < pair on the string range.
  const end = trimmed + "";
  const snap = await getDocs(
    query(
      usersCol,
      where("displayName", ">=", trimmed),
      where("displayName", "<=", end),
    ),
  );
  const out: UserProfile[] = [];
  snap.forEach((d) => out.push(profileFromDoc(d.id, d.data())));
  return out.slice(0, 10);
}

/**
 * Send a friend request from `fromUid` to `toUid`. Idempotent: if an edge
 * already exists (in any state), this is a no-op. If the other side has an
 * outstanding outgoing request to us, this auto-accepts.
 */
export async function sendFriendRequest(
  fromUid: string,
  toUid: string,
): Promise<void> {
  if (!fromUid || !toUid || fromUid === toUid) return;
  const db = getDb();

  const [mineSnap, theirsSnap] = await Promise.all([
    getDoc(friendDoc(fromUid, toUid)),
    getDoc(friendDoc(toUid, fromUid)),
  ]);
  const mine = mineSnap.exists() ? parseEdge(mineSnap.data()) : null;
  const theirs = theirsSnap.exists() ? parseEdge(theirsSnap.data()) : null;

  // Already friends (or a pending-out from me) — nothing to do.
  if (mine?.status === "accepted" || mine?.status === "pending-out") return;

  const batch = writeBatch(db);

  // Auto-accept if the other side already sent us a request.
  if (mine?.status === "pending-in" || theirs?.status === "pending-out") {
    batch.set(
      friendDoc(fromUid, toUid),
      {
        uid: toUid,
        status: "accepted",
        initiator: theirs?.initiator ?? toUid,
        createdAt: serverTimestamp(),
        acceptedAt: serverTimestamp(),
      },
      { merge: true },
    );
    batch.set(
      friendDoc(toUid, fromUid),
      {
        uid: fromUid,
        status: "accepted",
        initiator: theirs?.initiator ?? toUid,
        createdAt: serverTimestamp(),
        acceptedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await batch.commit();
    void acceptedAt; // (silence unused if downstream stops needing it)
    return;
  }

  batch.set(friendDoc(fromUid, toUid), {
    uid: toUid,
    status: "pending-out",
    initiator: fromUid,
    createdAt: serverTimestamp(),
    acceptedAt: null,
  });
  batch.set(friendDoc(toUid, fromUid), {
    uid: fromUid,
    status: "pending-in",
    initiator: fromUid,
    createdAt: serverTimestamp(),
    acceptedAt: null,
  });
  await batch.commit();
}

/** The recipient accepts an incoming request from `requesterUid`. */
export async function acceptFriendRequest(
  recipientUid: string,
  requesterUid: string,
): Promise<void> {
  if (!recipientUid || !requesterUid) return;
  const batch = writeBatch(getDb());
  const stamp = serverTimestamp();
  batch.set(
    friendDoc(recipientUid, requesterUid),
    { uid: requesterUid, status: "accepted", initiator: requesterUid, acceptedAt: stamp },
    { merge: true },
  );
  batch.set(
    friendDoc(requesterUid, recipientUid),
    { uid: recipientUid, status: "accepted", initiator: requesterUid, acceptedAt: stamp },
    { merge: true },
  );
  await batch.commit();
}

/** Delete both mirror docs — used for decline, cancel-outgoing, and unfriend. */
export async function removeFriend(
  ownerUid: string,
  otherUid: string,
): Promise<void> {
  if (!ownerUid || !otherUid) return;
  const batch = writeBatch(getDb());
  batch.delete(friendDoc(ownerUid, otherUid));
  batch.delete(friendDoc(otherUid, ownerUid));
  await batch.commit();
}

export const declineFriendRequest = removeFriend;

/**
 * Live subscription to the current user's friend graph + presence.
 * The callback fires with accepted friends (hydrated with profile data) and
 * pending requests whenever either changes.
 */
export interface FriendGraphSnapshot {
  friends: Friend[];
  pendingIn: FriendRequest[];
  pendingOut: FriendRequest[];
}

export function subscribeFriendGraph(
  ownerUid: string,
  cb: (snap: FriendGraphSnapshot) => void,
): () => void {
  if (!ownerUid) return () => {};
  const edgesQuery = friendsCol(ownerUid);
  let edgeCache: FriendEdge[] = [];

  const emit = async () => {
    const uids = edgeCache.map((e) => e.uid);
    const profiles = await fetchProfiles(uids);
    const friends: Friend[] = [];
    const pendingIn: FriendRequest[] = [];
    const pendingOut: FriendRequest[] = [];
    for (const edge of edgeCache) {
      const profile = profiles.get(edge.uid);
      if (!profile) continue;
      if (edge.status === "accepted") {
        friends.push(profileToFriend(profile));
      } else if (edge.status === "pending-in") {
        pendingIn.push({
          uid: profile.uid,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          createdAt: edge.createdAt,
          direction: "in",
        });
      } else if (edge.status === "pending-out") {
        pendingOut.push({
          uid: profile.uid,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          createdAt: edge.createdAt,
          direction: "out",
        });
      }
    }
    cb({ friends, pendingIn, pendingOut });
  };

  const unsub = onSnapshot(edgesQuery, (snap: QuerySnapshot) => {
    const edges: FriendEdge[] = [];
    snap.forEach((d) => {
      const edge = parseEdge(d.data());
      if (edge) edges.push(edge);
    });
    edgeCache = edges;
    void emit();
  });

  return unsub;
}

/**
 * Build a `friendUid → owned-gameIds` map by reading the friends' library
 * entries from `dw_library`. Used by FriendsWhoOwn + recommendations.
 *
 * Skips entirely when there are no accepted friends.
 */
export async function getFriendLibraryMap(
  ownerUid: string,
): Promise<Map<string, GameId[]>> {
  const out = new Map<string, GameId[]>();
  if (!ownerUid) return out;
  const edges = await readEdges(ownerUid);
  const friendUids = edges.filter((e) => e.status === "accepted").map((e) => e.uid);
  if (friendUids.length === 0) return out;

  for (let i = 0; i < friendUids.length; i += 10) {
    const chunk = friendUids.slice(i, i + 10);
    const q = query(
      collection(getDb(), COLLECTIONS.library),
      where("userId", "in", chunk),
    );
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data() as { userId?: string; gameId?: GameId };
      if (!data.userId || !data.gameId) return;
      const prev = out.get(data.userId) ?? [];
      prev.push(data.gameId);
      out.set(data.userId, prev);
    });
  }
  return out;
}

/**
 * Return accepted friends that own the given game. Joins the per-friend
 * library lookup with the cached friend list to materialize avatars/names.
 */
export async function listFriendsWhoOwn(
  ownerUid: string,
  gameId: GameId,
): Promise<Friend[]> {
  if (!ownerUid || !gameId) return [];
  const [friends, libMap] = await Promise.all([
    listFriends(ownerUid),
    getFriendLibraryMap(ownerUid),
  ]);
  const owners = friends.filter((f) => (libMap.get(f.uid) ?? []).includes(gameId));
  return owners.sort((a, b) => {
    if (a.status === b.status) return a.displayName.localeCompare(b.displayName);
    return a.status === "online" ? -1 : 1;
  });
}

// `collectionGroup` import kept around for future expansion (e.g. counting how
// many users have me as a friend without iterating my own subcollection).
void collectionGroup;
void deleteDoc;
