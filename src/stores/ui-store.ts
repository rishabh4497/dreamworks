import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NotificationKind, ClientSettings } from "@/lib/types";
import { syncWithFirestore } from "@/lib/firestore-sync";

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
  quickResumeEnabled: false,
  remotePlayPairedDevice: null,
  dynamicStoreBackgroundsEnabled: true,
  textureUpscalerNotifyMe: false,
  twoFactorEnabled: true,
  lastWishlistSyncAt: null,
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

interface RemoteUi {
  notificationPrefs: NotificationPrefs;
  settings: ClientSettings;
}

let firestoreHandle: ReturnType<typeof syncWithFirestore<RemoteUi>> | null = null;

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => {
      if (typeof window !== "undefined" && !firestoreHandle) {
        firestoreHandle = syncWithFirestore<RemoteUi>({
          key: "ui",
          selectSlice: () => ({
            notificationPrefs: get().notificationPrefs,
            settings: get().settings,
          }),
          applyRemote: (remote) => {
            const patch: Partial<UiStore> = {};
            if (remote.notificationPrefs) {
              patch.notificationPrefs = {
                ...DEFAULT_NOTIFICATION_PREFS,
                ...remote.notificationPrefs,
              };
            }
            if (remote.settings) {
              patch.settings = { ...DEFAULT_SETTINGS, ...remote.settings };
            }
            if (Object.keys(patch).length > 0) set(patch);
          },
        });
      }
      return {
        sidebarCollapsed: false,
        toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
        friendsRailVisible: false,
        toggleFriendsRail: () =>
          set((s) => ({ friendsRailVisible: !s.friendsRailVisible })),
        notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
        setNotificationPref: (kind, value) =>
          set((s) => {
            const notificationPrefs = { ...s.notificationPrefs, [kind]: value };
            firestoreHandle?.push({
              notificationPrefs,
              settings: s.settings,
            });
            return { notificationPrefs };
          }),
        settings: { ...DEFAULT_SETTINGS },
        updateSettings: (updates) =>
          set((s) => {
            const settings = { ...s.settings, ...updates };
            firestoreHandle?.push({
              notificationPrefs: s.notificationPrefs,
              settings,
            });
            return { settings };
          }),
      };
    },
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
