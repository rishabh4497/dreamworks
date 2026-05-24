import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { startPresenceHeartbeat } from "@/lib/presence";

/**
 * Boot the presence heartbeat for the signed-in user. Tears down on sign-out
 * or uid change. Mounted once at AppLayout.
 */
export function usePresenceHeartbeat(): void {
  const uid = useAuthStore((s) => s.profile?.uid);

  useEffect(() => {
    if (!uid) return;
    const stop = startPresenceHeartbeat(uid);
    return stop;
  }, [uid]);
}
