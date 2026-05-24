import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { CHAT_SUBCOLLECTIONS, COLLECTIONS, getDb } from "../firebase";
import type { Chat, ChatMessage } from "../types";

/**
 * 1:1 chat backed by Firestore. The chat id is the sorted pair of uids joined
 * with `_` so any A↔B pair maps to exactly one document.
 */

/** Compute the deterministic chat id for two users. */
export function chatIdFor(uidA: string, uidB: string): string {
  const [lo, hi] = [uidA, uidB].sort();
  return `${lo}_${hi}`;
}

function chatRef(chatId: string) {
  return doc(getDb(), COLLECTIONS.chats, chatId);
}

function messagesCol(chatId: string) {
  return collection(
    getDb(),
    COLLECTIONS.chats,
    chatId,
    CHAT_SUBCOLLECTIONS.messages,
  );
}

function isoFromMaybeTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function parseChat(id: string, data: DocumentData | undefined): Chat | null {
  if (!data) return null;
  const participants = Array.isArray(data.participants) ? data.participants : [];
  if (participants.length !== 2) return null;
  return {
    id,
    participants: [String(participants[0]), String(participants[1])] as [string, string],
    lastMessage: data.lastMessage
      ? {
          text: String(data.lastMessage.text ?? ""),
          at: isoFromMaybeTimestamp(data.lastMessage.at),
          senderUid: String(data.lastMessage.senderUid ?? ""),
        }
      : null,
    updatedAt: isoFromMaybeTimestamp(data.updatedAt),
  };
}

function parseMessage(id: string, chatId: string, data: DocumentData): ChatMessage {
  return {
    id,
    chatId,
    senderUid: String(data.senderUid ?? ""),
    text: String(data.text ?? ""),
    at: isoFromMaybeTimestamp(data.at),
    readBy: Array.isArray(data.readBy) ? data.readBy.map(String) : [],
  };
}

/**
 * Materialize the chat doc for the (uidA, uidB) pair, creating it on first
 * write if it doesn't exist yet. Idempotent.
 */
export async function getOrCreateChat(uidA: string, uidB: string): Promise<Chat> {
  if (!uidA || !uidB || uidA === uidB) {
    throw new Error("getOrCreateChat requires two distinct uids");
  }
  const id = chatIdFor(uidA, uidB);
  const ref = chatRef(id);
  const snap = await getDoc(ref);
  if (snap.exists()) return parseChat(id, snap.data())!;

  const [lo, hi] = [uidA, uidB].sort();
  const chat: Omit<Chat, "updatedAt"> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
    id,
    participants: [lo, hi] as [string, string],
    lastMessage: null,
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, chat);
  // Re-read so we hand back resolved timestamps to the caller.
  const reread = await getDoc(ref);
  return parseChat(id, reread.data())!;
}

/**
 * Persist a message and denormalize it onto the parent chat in one batch so
 * the conversation list always sees the right preview.
 */
export async function sendMessage(
  chatId: string,
  senderUid: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!chatId || !senderUid || !trimmed) return;
  const db = getDb();
  const ref = doc(messagesCol(chatId));
  const batch = writeBatch(db);
  batch.set(ref, {
    chatId,
    senderUid,
    text: trimmed,
    at: serverTimestamp(),
    readBy: [senderUid],
  });
  batch.set(
    chatRef(chatId),
    {
      lastMessage: {
        text: trimmed,
        at: serverTimestamp(),
        senderUid,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await batch.commit();
}

/**
 * Live subscription to messages ordered oldest → newest. We cap at 200 to
 * keep the snapshot small; older history can be paged in later.
 */
export function subscribeMessages(
  chatId: string,
  cb: (messages: ChatMessage[]) => void,
): () => void {
  if (!chatId) return () => {};
  const q = query(messagesCol(chatId), orderBy("at", "asc"), limit(200));
  return onSnapshot(q, (snap: QuerySnapshot) => {
    const out: ChatMessage[] = [];
    snap.forEach((d) => out.push(parseMessage(d.id, chatId, d.data())));
    cb(out);
  });
}

/** Mark all messages up to and including `upToMsgId` as read by `uid`. */
export async function markRead(
  chatId: string,
  uid: string,
  messageIds: string[],
): Promise<void> {
  if (!chatId || !uid || messageIds.length === 0) return;
  const db = getDb();
  const batch = writeBatch(db);
  for (const id of messageIds) {
    batch.update(doc(messagesCol(chatId), id), { readBy: arrayUnion(uid) });
  }
  await batch.commit();
}
