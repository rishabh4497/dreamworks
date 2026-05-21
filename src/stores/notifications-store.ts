import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppNotification, NotificationKind } from "@/lib/types";
import { SEED_NOTIFICATIONS } from "@/lib/mock/notifications";

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
  push: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
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

function makeId(): string {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, _get) => ({
      notifications: [],
      unreadCount: 0,
      _seeded: false,
      push: (n) =>
        set((s) => {
          const entry: AppNotification = {
            ...n,
            id: makeId(),
            createdAt: new Date().toISOString(),
            read: false,
          };
          // Newest first; cap to MAX_ENTRIES (drop oldest).
          const next = [entry, ...s.notifications].slice(0, MAX_ENTRIES);
          return { notifications: next, unreadCount: recomputeUnread(next) };
        }),
      markRead: (id) =>
        set((s) => {
          let changed = false;
          const next = s.notifications.map((n) => {
            if (n.id === id && !n.read) {
              changed = true;
              return { ...n, read: true };
            }
            return n;
          });
          if (!changed) return s;
          return { notifications: next, unreadCount: recomputeUnread(next) };
        }),
      markAllRead: () =>
        set((s) => {
          if (s.unreadCount === 0) return s;
          const next = s.notifications.map((n) => (n.read ? n : { ...n, read: true }));
          return { notifications: next, unreadCount: 0 };
        }),
      clear: () => set({ notifications: [], unreadCount: 0 }),
      clearOlderThan: (days) =>
        set((s) => {
          if (s.notifications.length === 0) return s;
          const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
          const next = s.notifications.filter((n) => {
            const t = new Date(n.createdAt).getTime();
            return Number.isFinite(t) && t >= cutoff;
          });
          if (next.length === s.notifications.length) return s;
          return { notifications: next, unreadCount: recomputeUnread(next) };
        }),
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
        // Seed mock notifications on first ever load.
        if (!state._seeded && state.notifications.length === 0) {
          state._hydrateSeed(SEED_NOTIFICATIONS);
        } else {
          state._seeded = true;
          // Recompute unread count just in case the persisted value drifted.
          state.unreadCount = recomputeUnread(state.notifications);
        }
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
