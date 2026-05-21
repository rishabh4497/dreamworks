import type { Collection, LibraryEntry, UserProfile, WishlistEntry } from "../types";
import { MOCK_COLLECTIONS, MOCK_LIBRARY, MOCK_USER, MOCK_WISHLIST } from "../mock";
import { wait } from "./_delay";

export async function getCurrentUser(): Promise<UserProfile> {
  await wait();
  return MOCK_USER;
}

export async function getProfile(uid: string): Promise<UserProfile | undefined> {
  await wait();
  if (uid === MOCK_USER.uid) return MOCK_USER;
  return undefined;
}

export async function getLibrary(): Promise<LibraryEntry[]> {
  await wait();
  return MOCK_LIBRARY;
}

export async function getWishlist(): Promise<WishlistEntry[]> {
  await wait();
  return MOCK_WISHLIST;
}

export async function getCollections(): Promise<Collection[]> {
  await wait();
  return MOCK_COLLECTIONS;
}
