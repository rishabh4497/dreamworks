import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DrmType, GameId, LauncherSource, LibraryEntry, LibrarySourceCopy } from "@/lib/types";
import { MOCK_LIBRARY, buildGameDetail } from "@/lib/mock";
import { computeRefundWindow, isRefundEligible } from "@/lib/refund";
import { defaultCloudSaveStatus } from "@/lib/native-launcher";

interface AddExternalOptions {
  installed?: boolean;
  sizeBytes?: number;
  externalId?: string;
  installPath?: string;
  launchCommand?: string;
  installedVersion?: string;
  canLaunchOffline?: boolean;
}

interface LibraryStore {
  entries: LibraryEntry[];
  addFromPurchase: (ids: GameId[], orderId?: string) => void;
  addExternal: (
    gameId: GameId,
    sourceLauncher: LauncherSource,
    opts?: AddExternalOptions,
  ) => void;
  toggleInstalled: (id: GameId) => void;
  moveInstallPath: (id: GameId, installPath: string) => void;
  requestRefund: (id: GameId) => boolean;
  has: (id: GameId) => boolean;
  reset: () => void;
}

const seeded = MOCK_LIBRARY.map((entry) => {
  const detail = buildGameDetail(entry.gameId);
  const mainHours = detail?.playtime.mainHours ?? 0;
  const sourceLauncher = entry.sourceLauncher ?? "dreamworks";
  return {
    ...entry,
    sourceLauncher,
    cloudSaveStatus: entry.cloudSaveStatus ?? defaultCloudSaveStatus(sourceLauncher),
    drmType: entry.drmType ?? ("dreamworks" as DrmType),
    canLaunchOffline: entry.canLaunchOffline ?? true,
    refundWindow: computeRefundWindow(entry.ownedSince, mainHours, entry.playMinutes),
  };
});

function drmForSource(sourceLauncher: LauncherSource): DrmType {
  if (sourceLauncher === "dreamworks" || sourceLauncher === "manual") return "dreamworks";
  if (sourceLauncher === "steam" || sourceLauncher === "epic") return sourceLauncher;
  return "third-party";
}

function sourceCopy(
  sourceLauncher: LauncherSource,
  opts?: AddExternalOptions,
): LibrarySourceCopy {
  const drmType = drmForSource(sourceLauncher);
  return {
    sourceLauncher,
    externalId: opts?.externalId,
    installPath: opts?.installPath,
    launchCommand: opts?.launchCommand,
    installed: opts?.installed ?? true,
    lastSeenAt: new Date().toISOString(),
    canLaunchOffline: opts?.canLaunchOffline ?? drmType === "dreamworks",
    drmType,
  };
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      entries: seeded,
      addFromPurchase: (ids, orderId) =>
        set((s) => {
          const known = new Set(s.entries.map((e) => e.gameId));
          const now = new Date().toISOString();
          const additions: LibraryEntry[] = ids
            .filter((id) => !known.has(id))
            .map((id) => {
              const detail = buildGameDetail(id);
              const mainHours = detail?.playtime.mainHours ?? 0;
              return {
                gameId: id,
                ownedSince: now,
                installed: false,
                sizeBytes: 0,
                playMinutes: 0,
                lastPlayed: null,
                collectionIds: [],
                achievementsUnlocked: 0,
                completionPct: 0,
                refundWindow: computeRefundWindow(now, mainHours, 0),
                orderId,
                sourceLauncher: "dreamworks",
                cloudSaveStatus: "synced",
                drmType: "dreamworks",
                canLaunchOffline: true,
              };
            });
          return { entries: [...s.entries, ...additions] };
        }),
      addExternal: (id, sourceLauncher, opts) =>
        set((s) => {
          const existing = s.entries.find((e) => e.gameId === id);
          const copy = sourceCopy(sourceLauncher, opts);
          if (existing) {
            return {
              entries: s.entries.map((entry) =>
                entry.gameId === id
                  ? {
                      ...entry,
                      sources: [
                        ...(entry.sources ?? []).filter(
                          (source) =>
                            !(
                              source.sourceLauncher === sourceLauncher &&
                              source.externalId === opts?.externalId
                            ),
                        ),
                        copy,
                      ],
                    }
                  : entry,
              ),
            };
          }
          const now = new Date().toISOString();
          const drmType = drmForSource(sourceLauncher);
          const entry: LibraryEntry = {
            gameId: id,
            ownedSince: now,
            installed: opts?.installed ?? true,
            sizeBytes: opts?.sizeBytes ?? 0,
            playMinutes: 0,
            lastPlayed: null,
            collectionIds: [],
            achievementsUnlocked: 0,
            completionPct: 0,
            // External titles can't be refunded through Dreamworks.
            refundWindow: null,
            sourceLauncher,
            externalId: opts?.externalId,
            installPath: opts?.installPath,
            launchCommand: opts?.launchCommand,
            installedVersion: opts?.installedVersion,
            lastVerifiedAt: null,
            cloudSaveStatus: defaultCloudSaveStatus(sourceLauncher),
            drmType,
            canLaunchOffline: opts?.canLaunchOffline ?? drmType === "dreamworks",
            sources: [copy],
          };
          return { entries: [...s.entries, entry] };
        }),
      toggleInstalled: (id) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.gameId === id ? { ...e, installed: !e.installed } : e,
          ),
        })),
      moveInstallPath: (id, installPath) =>
        set((s) => ({
          entries: s.entries.map((entry) =>
            entry.gameId === id ? { ...entry, installed: true, installPath } : entry,
          ),
        })),
      requestRefund: (id) => {
        const entry = get().entries.find((e) => e.gameId === id);
        if (!entry) return false;
        if (!isRefundEligible(entry.refundWindow, entry.playMinutes)) return false;
        set((s) => ({
          entries: s.entries
            .map((e) => (e.gameId === id ? { ...e, installed: false } : e))
            .filter((e) => e.gameId !== id),
        }));
        return true;
      },
      has: (id) => get().entries.some((e) => e.gameId === id),
      reset: () => set({ entries: seeded }),
    }),
    { name: "dreamworks-library" },
  ),
);
