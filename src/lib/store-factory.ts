import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Query,
} from "firebase/firestore";
import type { StoreApi, UseBoundStore } from "zustand";
import { COLLECTIONS, getDb } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";

type AnyStore<S> = UseBoundStore<StoreApi<S>>;

interface DocBinding<S, D extends DocumentData> {
  collectionKey: keyof typeof COLLECTIONS;
  mapDoc: (data: D | undefined) => Partial<S>;
  empty: Partial<S>;
}

interface QueryBinding<S, D extends DocumentData> {
  collectionKey: keyof typeof COLLECTIONS;
  field: string;
  mapDocs: (rows: D[]) => Partial<S>;
  empty: Partial<S>;
}

/**
 * Bind a Zustand store to a single Firestore doc keyed by the signed-in user's
 * uid. The store's data slice resets to `empty` on signout/error, and the
 * subscription is torn down before re-subscribing on uid change.
 */
export function attachUserDocSync<S, D extends DocumentData>(
  store: AnyStore<S>,
  binding: DocBinding<S, D>,
): void {
  let lastUid: string | undefined;
  let unsubscribe: (() => void) | null = null;

  function sync(state: ReturnType<typeof useAuthStore.getState>) {
    const uid = state.profile?.uid;
    if (uid === lastUid) return;
    lastUid = uid;

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    if (!uid) {
      store.setState(binding.empty as Partial<S>);
      return;
    }

    const ref = doc(getDb(), COLLECTIONS[binding.collectionKey], uid);
    unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? (snap.data() as D) : undefined;
        store.setState(binding.mapDoc(data));
      },
      () => {
        store.setState(binding.empty as Partial<S>);
      },
    );
  }

  useAuthStore.subscribe(sync);
  sync(useAuthStore.getState());
}

/**
 * Bind a Zustand store to a Firestore collection query filtered by the
 * signed-in user's uid via `where(field, "==", uid)`. Same lifecycle rules as
 * `attachUserDocSync`.
 */
export function attachUserQuerySync<S, D extends DocumentData>(
  store: AnyStore<S>,
  binding: QueryBinding<S, D>,
): void {
  let lastUid: string | undefined;
  let unsubscribe: (() => void) | null = null;

  function sync(state: ReturnType<typeof useAuthStore.getState>) {
    const uid = state.profile?.uid;
    if (uid === lastUid) return;
    lastUid = uid;

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    if (!uid) {
      store.setState(binding.empty as Partial<S>);
      return;
    }

    const q: Query<DocumentData> = query(
      collection(getDb(), COLLECTIONS[binding.collectionKey]),
      where(binding.field, "==", uid),
    );
    unsubscribe = onSnapshot(
      q,
      (snap) => {
        const rows: D[] = [];
        snap.forEach((d) => rows.push(d.data() as D));
        store.setState(binding.mapDocs(rows));
      },
      () => {
        store.setState(binding.empty as Partial<S>);
      },
    );
  }

  useAuthStore.subscribe(sync);
  sync(useAuthStore.getState());
}
