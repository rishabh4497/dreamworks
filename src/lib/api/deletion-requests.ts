import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";

/**
 * Writes a `dw_deletion_requests/{uid}` doc that an admin (or a Cloud Function)
 * picks up to actually purge the account. The client only schedules — actual
 * deletion is server-side so it can run with elevated privileges across
 * collections the client can't reach.
 */
export async function requestAccountDeletion(uid: string): Promise<void> {
  await setDoc(
    doc(getDb(), COLLECTIONS.deletionRequests, uid),
    {
      uid,
      status: "scheduled",
      requestedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
