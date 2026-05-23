import type { Collection, GameId } from "../types";
import { COLLECTIONS, getDb, getFirebaseAuth } from "../firebase";
import {
  arrayRemove,
  arrayUnion,
  collection as fsCollection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function currentUid(): string {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  return uid;
}

export async function listCollections(): Promise<Collection[]> {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) return [];
  const q = query(
    fsCollection(getDb(), COLLECTIONS.collections),
    where("userId", "==", uid),
  );
  const snap = await getDocs(q);
  const out: Collection[] = [];
  snap.forEach((d) => {
    const data = d.data();
    out.push({
      id: d.id,
      name: data.name || "Collection",
      gameIds: data.gameIds || [],
    });
  });
  return out;
}

export async function createCollection(name: string, initialGameIds: GameId[] = []): Promise<Collection> {
  const uid = currentUid();
  const id = newId("col");
  const docRef = doc(getDb(), COLLECTIONS.collections, id);
  const data = {
    userId: uid,
    name: name.trim() || "Collection",
    gameIds: initialGameIds,
    createdAt: new Date().toISOString(),
  };
  await setDoc(docRef, data);
  return { id, name: data.name, gameIds: data.gameIds };
}

export async function renameCollection(collectionId: string, name: string): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTIONS.collections, collectionId), {
    name: name.trim() || "Collection",
  });
}

export async function addToCollection(collectionId: string, gameId: GameId): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTIONS.collections, collectionId), {
    gameIds: arrayUnion(gameId),
  });
}

export async function removeFromCollection(collectionId: string, gameId: GameId): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTIONS.collections, collectionId), {
    gameIds: arrayRemove(gameId),
  });
}

export async function deleteCollection(collectionId: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.collections, collectionId));
}
