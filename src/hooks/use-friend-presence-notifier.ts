import { useEffect, useRef } from "react";
import { useFriends, useFriendActivity } from "@/hooks/use-friends";
import { useUiStore } from "@/stores/ui-store";
import { dispatchAppNotification } from "@/lib/notify-dispatch";
import type { Friend, FriendActivity } from "@/lib/types";

/**
 * Watches the friends list + activity feed and fires notifications when:
 *   • a friend transitions from offline → online/in-game (gated by friendOnlineNotify)
 *   • a new now-playing activity appears (gated by friendStartGameNotify)
 *
 * Mounted once at AppLayout. Primes its refs on first run so existing data
 * never replays as fresh alerts.
 */
export function useFriendPresenceNotifier(): void {
  const friends = useFriends();
  const activity = useFriendActivity();
  const friendStatusRef = useRef<Map<string, Friend["status"]> | null>(null);
  const lastActivityKeyRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const list = friends.data;
    if (!list) return;
    const next = new Map<string, Friend["status"]>();
    list.forEach((f) => next.set(f.uid, f.status));

    const prev = friendStatusRef.current;
    if (prev) {
      const { friendOnlineNotify } = useUiStore.getState().settings;
      if (friendOnlineNotify) {
        for (const f of list) {
          const before = prev.get(f.uid);
          if (!before) continue;
          const cameOnline =
            before === "offline" && (f.status === "online" || f.status === "in-game");
          if (cameOnline) {
            dispatchAppNotification({
              kind: "friend-activity",
              title: `${f.displayName} is online`,
            });
          }
        }
      }
    }
    friendStatusRef.current = next;
  }, [friends.data]);

  useEffect(() => {
    const entries = activity.data;
    if (!entries) return;
    const nowPlaying = entries.filter((e) => e.kind === "now-playing");
    const keys = new Set(nowPlaying.map(activityKey));
    const prev = lastActivityKeyRef.current;
    if (prev) {
      const { friendStartGameNotify } = useUiStore.getState().settings;
      if (friendStartGameNotify) {
        const fresh = nowPlaying.filter((e) => !prev.has(activityKey(e)));
        for (const e of fresh) {
          dispatchAppNotification({
            kind: "friend-activity",
            title: "A friend started playing",
            body: e.payload,
            gameId: e.gameId,
          });
        }
      }
    }
    lastActivityKeyRef.current = keys;
  }, [activity.data]);
}

function activityKey(e: FriendActivity): string {
  return `${e.uid}:${e.kind}:${e.gameId}:${e.at}`;
}
