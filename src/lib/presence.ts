import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { COLLECTIONS, getDb } from "./firebase";

/**
 * Heartbeat presence — writes `lastActiveAt: serverTimestamp()` to
 * `users/{uid}` every 30s while the tab is visible. Friend cards derive
 * online/offline by checking how fresh that field is (see
 * `src/lib/api/friend-graph.ts:profileToFriend`).
 */
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

async function ping(uid: string): Promise<void> {
  if (!uid) return;
  try {
    await setDoc(
      doc(getDb(), COLLECTIONS.users, uid),
      { lastActiveAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    // Heartbeats are fire-and-forget. A transient failure (offline, rules
    // hiccup) doesn't warrant surfacing anything to the user.
  }
}

/**
 * Start the heartbeat for the given uid. Returns a teardown that stops
 * future pings — call it on sign-out or on the dependency change that
 * supplied a new uid.
 */
export function startPresenceHeartbeat(uid: string): () => void {
  if (!uid || typeof window === "undefined") return () => {};

  let stopped = false;

  const pingIfVisible = () => {
    if (stopped) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    void ping(uid);
  };

  // Fire immediately so the user goes online without waiting for the first tick.
  pingIfVisible();

  const intervalId = window.setInterval(pingIfVisible, HEARTBEAT_INTERVAL_MS);
  const onVisibility = () => {
    if (document.visibilityState === "visible") pingIfVisible();
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    stopped = true;
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
