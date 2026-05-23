import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppNotification, NotificationKind } from "@/lib/types";
import {
  clearNotificationsOlderThan,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  pushNotification,
} from "@/lib/api/notifications";
import { useAuthStore } from "./auth-store";

/** Max entries retained in the panel before FIFO trimming. */
const MAX_ENTRIES = 200;
/** Default housekeeping window — drop entries older than this on hydrate. */
const DEFAULT_TTL_DAYS = 90;

interface NotificationsStore {
  notifications: AppNotification[];
  /** Persisted so the bell-chip paints instantly on reload. */
  unreadCount: number;
  /** Internal flag used to seed mock notifications on first hydrate. */
  _seeded: boolean;
  hydrate: () => Promise<void>;
  push: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clear: () => void;
  clearOlderThan: (days: number) => void;
  /**
   * Internal — replaces the list wholesale (used by the seed bootstrap so we
   * don't fire `push` for each entry and end up with a different ordering).
   */
  _hydrateSeed: (entries: AppNotification[]) => void;
}

function recomputeUnread(entries: AppNotification[]): number {
  let count = 0;
  for (const n of entries) if (!n.read) count += 1;
  return count;
}

function currentUserId(): string | null {
  return useAuthStore.getState().profile?.uid ?? null;
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      _seeded: false,
      hydrate: async () => {
        const userId = currentUserId();
        if (!userId) return;
        try {
          const entries = await listNotifications(userId);
          set({
            notifications: entries.slice(0, MAX_ENTRIES),
            unreadCount: recomputeUnread(entries),
            _seeded: true,
          });
        } catch {
          // Firestore unavailable — leave local cache as-is.
        }
      },
      push: async (n) => {
        const userId = currentUserId();
        if (!userId) {
          // Local-only fallback (e.g. anonymous sessions)
          const entry: AppNotification = {
            ...n,
            id: `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            read: false,
          };
          set((s) => {
            const next = [entry, ...s.notifications].slice(0, MAX_ENTRIES);
            return { notifications: next, unreadCount: recomputeUnread(next) };
          });
          return;
        }
        try {
          const entry = await pushNotification(userId, n);
          set((s) => {
            const next = [entry, ...s.notifications].slice(0, MAX_ENTRIES);
            return { notifications: next, unreadCount: recomputeUnread(next) };
          });
        } catch {
          // ignore; bell stays as-is
        }
      },
      markRead: async (id) => {
        const before = get().notifications;
        let changed = false;
        const next = before.map((n) => {
          if (n.id === id && !n.read) {
            changed = true;
            return { ...n, read: true };
          }
          return n;
        });
        if (!changed) return;
        set({ notifications: next, unreadCount: recomputeUnread(next) });
        try {
          await markNotificationRead(id);
        } catch {
          // best-effort
        }
      },
      markAllRead: async () => {
        const userId = currentUserId();
        if (get().unreadCount === 0) return;
        const next = get().notifications.map((n) => (n.read ? n : { ...n, read: true }));
        set({ notifications: next, unreadCount: 0 });
        if (!userId) return;
        try {
          await markAllNotificationsRead(userId);
        } catch {
          // best-effort
        }
      },
      clear: () => set({ notifications: [], unreadCount: 0 }),
      clearOlderThan: (days) => {
        const userId = currentUserId();
        set((s) => {
          if (s.notifications.length === 0) return s;
          const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
          const next = s.notifications.filter((n) => {
            const t = new Date(n.createdAt).getTime();
            return Number.isFinite(t) && t >= cutoff;
          });
          if (next.length === s.notifications.length) return s;
          return { notifications: next, unreadCount: recomputeUnread(next) };
        });
        if (userId) {
          void clearNotificationsOlderThan(userId, days).catch(() => {});
        }
      },
      _hydrateSeed: (entries) =>
        set(() => ({
          notifications: entries.slice(0, MAX_ENTRIES),
          unreadCount: recomputeUnread(entries),
          _seeded: true,
        })),
    }),
    {
      name: "dreamworks-notifications",
      version: 1,
      partialize: (s) => ({
        notifications: s.notifications,
        unreadCount: s.unreadCount,
        _seeded: s._seeded,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Housekeeping: drop anything past the TTL.
        state.clearOlderThan(DEFAULT_TTL_DAYS);
        state._seeded = true;
        state.unreadCount = recomputeUnread(state.notifications);
        // Refresh from Firestore so the user sees server-side notifications
        // (price drops, system events, etc.) once authenticated. Pre-auth
        // sessions show an empty list rather than mock seeds — see
        // `dw_notifications` in the seed script.
        void state.hydrate();
      },
    },
  ),
);

/**
 * Selector helper to read a sorted, filtered slice. Components should subscribe
 * to `notifications` directly and apply filters inline — this is a convenience
 * for places that need the raw list elsewhere.
 */
export function selectNotificationsByKind(
  kinds: NotificationKind[],
): (s: NotificationsStore) => AppNotification[] {
  return (s) =>
    kinds.length === 0
      ? s.notifications
      : s.notifications.filter((n) => kinds.includes(n.kind));
}
