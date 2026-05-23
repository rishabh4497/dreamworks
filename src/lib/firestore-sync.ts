import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import {
  COLLECTIONS,
  USER_SUBCOLLECTIONS,
  getDb,
  getFirebaseAuth,
} from "./firebase";

/**
 * Bidirectional sync between a local Zustand store and the signed-in user's
 * `dw_users/{uid}/preferences/{key}` doc.
 *
 * Pattern:
 *   1. Store hydrates from localStorage immediately (handled by zustand/persist).
 *   2. On sign-in, we subscribe to the remote doc:
 *        • If the doc exists, its contents replace the local state — the cloud
 *          is the source of truth so a fresh browser inherits prefs.
 *        • If the doc doesn't exist (first time on this account), we push the
 *          current local state up so the cloud receives it.
 *   3. After every mutation the store calls `push(state)` to mirror the change.
 *
 * Avoids `setDoc({ merge: true })` overwriting empty-array fields — we always
 * write the full slice so deletions propagate.
 */
export interface SyncedStoreOptions<T> {
  /** Subdocument key under `preferences/` — "theme", "ui", "profile", … */
  key: string;
  /** Capture the slice of store state that should be synced. */
  selectSlice: () => T;
  /** Replace the synced slice with what arrived from Firestore. */
  applyRemote: (remote: T) => void;
}

export interface SyncedStoreHandle<T> {
  /** Call after each mutation that should mirror to Firestore. */
  push: (slice: T) => void;
  /** Detach listeners (test cleanup; not used at runtime). */
  detach: () => void;
}

export function syncWithFirestore<T extends object>(
  opts: SyncedStoreOptions<T>,
): SyncedStoreHandle<T> {
  let currentUid: string | null = null;
  let snapshotUnsub: (() => void) | null = null;

  function detachSnapshot() {
    snapshotUnsub?.();
    snapshotUnsub = null;
  }

  function refFor(uid: string) {
    return doc(
      getDb(),
      COLLECTIONS.users,
      uid,
      USER_SUBCOLLECTIONS.preferences,
      opts.key,
    );
  }

  function attachForUser(user: User | null) {
    detachSnapshot();
    currentUid = user?.uid ?? null;
    if (!currentUid) return;

    const ref = refFor(currentUid);
    snapshotUnsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          // Cold device for this account — seed the cloud from local state.
          const slice = opts.selectSlice();
          void setDoc(ref, slice).catch(() => {});
          return;
        }
        opts.applyRemote(snap.data() as T);
      },
      // Best-effort sync — auth/permission failures shouldn't break the UI.
      () => {},
    );
  }

  const authUnsub = onAuthStateChanged(getFirebaseAuth(), attachForUser);

  return {
    push: (slice) => {
      if (!currentUid) return;
      void setDoc(refFor(currentUid), slice).catch(() => {});
    },
    detach: () => {
      authUnsub();
      detachSnapshot();
    },
  };
}
