import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NotificationKind, ClientSettings } from "@/lib/types";

type NotificationPrefs = Record<NotificationKind, boolean>;

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  "wishlist-alert": true,
  "sale-ending": true,
  "friend-activity": true,
  "achievement-unlock": true,
  "library-import": true,
  system: true,
};

const DEFAULT_SETTINGS: ClientSettings = {
  startupLocation: "store",
  compactMode: false,
  offlineModeEnabled: false,
  offlineCacheStatus: "ready",
  offlineCacheUpdatedAt: "2026-05-21T18:30:00.000Z",
  closeToTray: true,
  hardwareAcceleration: true,
  inGameOverlay: true,
  fpsCounter: "off",
  fpsHighContrast: false,
  screenshotKey: "F12",
  screenshotSound: true,
  downloadLimit: "unlimited",
  installPath: "/Games/Dreamworks",
  emailOnSale: true,
  browserNotify: true,
  playNotificationSound: true,
  friendOnlineNotify: true,
  friendStartGameNotify: true,
  chatProfanityFilter: true,
  playChatSound: true,
  cloudSavesEnabled: true,
  librarySharingEnabled: false,
  crashReportsEnabled: true,
  usageDiagnosticsEnabled: false,
  scanHistoryRetentionDays: 90,
  privacyDataExportStatus: "idle",
  privacyDeleteRequestStatus: "idle",
  handheldMode: false,
  largerFocusTargets: false,
  controllerHints: true,
  language: "English",
};

interface UiStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  friendsRailVisible: boolean;
  toggleFriendsRail: () => void;
  /** Per-kind toggle gating the in-app notification panel pushes. */
  notificationPrefs: NotificationPrefs;
  setNotificationPref: (kind: NotificationKind, value: boolean) => void;
  settings: ClientSettings;
  updateSettings: (updates: Partial<ClientSettings>) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      friendsRailVisible: false,
      toggleFriendsRail: () => set((s) => ({ friendsRailVisible: !s.friendsRailVisible })),
      notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
      setNotificationPref: (kind, value) =>
        set((s) => ({
          notificationPrefs: { ...s.notificationPrefs, [kind]: value },
        })),
      settings: { ...DEFAULT_SETTINGS },
      updateSettings: (updates) =>
        set((s) => ({
          settings: { ...s.settings, ...updates },
        })),
    }),
    {
      name: "dreamworks-ui",
      version: 1,
      partialize: (s) => ({
        notificationPrefs: s.notificationPrefs,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Fill in any missing kinds (in case we add new ones later).
        state.notificationPrefs = {
          ...DEFAULT_NOTIFICATION_PREFS,
          ...state.notificationPrefs,
        };
        // Fill in any missing settings.
        state.settings = {
          ...DEFAULT_SETTINGS,
          ...state.settings,
        };
      },
    },
  ),
);

/** Convenience selector used by emitters to check the gate before pushing. */
export function notificationPrefEnabled(kind: NotificationKind): boolean {
  return useUiStore.getState().notificationPrefs[kind] !== false;
}
