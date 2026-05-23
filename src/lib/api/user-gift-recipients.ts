import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type { GiftRecipient, UserGiftRecipientsDoc } from "../types";

function now(): string {
  return new Date().toISOString();
}

function recipientKey(r: GiftRecipient): string {
  return r.friendId ? `friend:${r.friendId}` : `email:${(r.email ?? "").toLowerCase()}`;
}

export function emptyGiftRecipients(userId: string): UserGiftRecipientsDoc {
  return { userId, recipients: [], updatedAt: now() };
}

export async function getUserGiftRecipients(
  userId: string,
): Promise<UserGiftRecipientsDoc> {
  const snap = await getDoc(
    doc(getDb(), COLLECTIONS.userGiftRecipients, userId),
  );
  if (!snap.exists()) return emptyGiftRecipients(userId);
  return snap.data() as UserGiftRecipientsDoc;
}

async function writeRecipients(next: UserGiftRecipientsDoc): Promise<void> {
  await setDoc(doc(getDb(), COLLECTIONS.userGiftRecipients, next.userId), {
    ...next,
    updatedAt: now(),
  });
}

export async function addRecipient(
  userId: string,
  recipient: GiftRecipient,
): Promise<void> {
  const current = await getUserGiftRecipients(userId);
  const key = recipientKey(recipient);
  const without = current.recipients.filter((r) => recipientKey(r) !== key);
  await writeRecipients({ ...current, recipients: [...without, recipient] });
}

export async function removeRecipient(
  userId: string,
  recipient: GiftRecipient,
): Promise<void> {
  const current = await getUserGiftRecipients(userId);
  const key = recipientKey(recipient);
  await writeRecipients({
    ...current,
    recipients: current.recipients.filter((r) => recipientKey(r) !== key),
  });
}
