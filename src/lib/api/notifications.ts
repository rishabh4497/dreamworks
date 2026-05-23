import type { AppNotification } from "../types";
import { COLLECTIONS, getDb } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";

interface StoredNotification extends AppNotification {
  userId: string;
}

export async function listNotifications(
  userId: string,
  limit = 200,
): Promise<AppNotification[]> {
  const q = query(
    collection(getDb(), COLLECTIONS.notifications),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    fsLimit(limit),
  );
  const snap = await getDocs(q);
  const out: AppNotification[] = [];
  snap.forEach((d) => {
    const data = d.data() as StoredNotification;
    const { userId: _u, ...rest } = data;
    out.push(rest);
  });
  return out;
}

export async function pushNotification(
  userId: string,
  notification: Omit<AppNotification, "id" | "createdAt" | "read">,
): Promise<AppNotification> {
  const id = `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const entry: AppNotification = {
    ...notification,
    id,
    createdAt: new Date().toISOString(),
    read: false,
  };
  await setDoc(doc(getDb(), COLLECTIONS.notifications, id), {
    ...entry,
    userId,
  });
  return entry;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTIONS.notifications, notificationId), {
    read: true,
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(
    collection(getDb(), COLLECTIONS.notifications),
    where("userId", "==", userId),
    where("read", "==", false),
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(getDb());
  snap.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function clearNotificationsOlderThan(
  userId: string,
  days: number,
): Promise<number> {
  const cutoffIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const q = query(
    collection(getDb(), COLLECTIONS.notifications),
    where("userId", "==", userId),
    where("createdAt", "<", cutoffIso),
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  return snap.size;
}
