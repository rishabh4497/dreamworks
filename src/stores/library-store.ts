import { create } from "zustand";
import type { DrmType, GameId, LauncherSource, LibraryEntry, LibrarySourceCopy } from "@/lib/types";
import { getGameDetail } from "@/lib/api/games";
import { computeRefundWindow, isRefundEligible } from "@/lib/refund";
import { defaultCloudSaveStatus } from "@/lib/native-launcher";
import { useAuthStore } from "@/stores/auth-store";
import { getDb, COLLECTIONS } from "@/lib/firebase";
import { doc, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { cleanForFirestore } from "@/lib/firestore-clean";
import { attachUserQuerySync } from "@/lib/store-factory";

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
  addFromPurchase: (ids: GameId[], orderId?: string) => Promise<void>;
  addExternal: (
    gameId: GameId,
    sourceLauncher: LauncherSource,
    opts?: AddExternalOptions,
  ) => Promise<void>;
  toggleInstalled: (id: GameId) => Promise<void>;
  moveInstallPath: (id: GameId, installPath: string) => Promise<void>;
  requestRefund: (id: GameId) => Promise<boolean>;
  has: (id: GameId) => boolean;
  reset: () => void;
}

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

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  entries: [],
  addFromPurchase: async (ids, orderId) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    const now = new Date().toISOString();
    const batch = writeBatch(getDb());
    for (const id of ids) {
      const detail = await getGameDetail(id);
      const mainHours = detail?.playtime.mainHours ?? 0;
      const docRef = doc(getDb(), COLLECTIONS.library, `${profile.uid}_${id}`);
      batch.set(
        docRef,
        cleanForFirestore({
          userId: profile.uid,
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
        }),
      );
    }
    await batch.commit();
  },
  addExternal: async (id, sourceLauncher, opts) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    const copy = sourceCopy(sourceLauncher, opts);
    const existing = get().entries.find((e) => e.gameId === id);
    const docRef = doc(getDb(), COLLECTIONS.library, `${profile.uid}_${id}`);

    if (existing) {
      const updatedSources = [
        ...(existing.sources ?? []).filter(
          (source) =>
            !(
              source.sourceLauncher === sourceLauncher &&
              source.externalId === opts?.externalId
            ),
        ),
        copy,
      ];
      await updateDoc(docRef, { sources: updatedSources });
    } else {
      const now = new Date().toISOString();
      const drmType = drmForSource(sourceLauncher);
      await setDoc(
        docRef,
        cleanForFirestore({
          userId: profile.uid,
          gameId: id,
          ownedSince: now,
          installed: opts?.installed ?? true,
          sizeBytes: opts?.sizeBytes ?? 0,
          playMinutes: 0,
          lastPlayed: null,
          collectionIds: [],
          achievementsUnlocked: 0,
          completionPct: 0,
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
        }),
      );
    }
  },
  toggleInstalled: async (id) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    const entry = get().entries.find((e) => e.gameId === id);
    if (!entry) return;
    const docRef = doc(getDb(), COLLECTIONS.library, `${profile.uid}_${id}`);
    await updateDoc(docRef, { installed: !entry.installed });
    void import("@/lib/telemetry").then((m) =>
      m.track(entry.installed ? "library_uninstall" : "library_install", {
        gameId: id,
      }),
    );
  },
  moveInstallPath: async (id, installPath) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    const docRef = doc(getDb(), COLLECTIONS.library, `${profile.uid}_${id}`);
    await updateDoc(docRef, { installed: true, installPath });
  },
  requestRefund: async (id) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return false;
    const entry = get().entries.find((e) => e.gameId === id);
    if (!entry) return false;
    if (!isRefundEligible(entry.refundWindow, entry.playMinutes)) return false;
    const docRef = doc(getDb(), COLLECTIONS.library, `${profile.uid}_${id}`);
    await deleteDoc(docRef);
    return true;
  },
  has: (id) => get().entries.some((e) => e.gameId === id),
  reset: () => {
    // No-op or clear firestore if needed, but standard reset is just empty local entries
    set({ entries: [] });
  },
}));

attachUserQuerySync<LibraryStore, LibraryEntry & Record<string, unknown>>(useLibraryStore, {
  collectionKey: "library",
  field: "userId",
  mapDocs: (rows) => ({
    entries: rows.map((data) => ({
      gameId: data.gameId,
      ownedSince: data.ownedSince,
      installed: !!data.installed,
      sizeBytes: (data.sizeBytes as number) || 0,
      playMinutes: (data.playMinutes as number) || 0,
      lastPlayed: data.lastPlayed || null,
      collectionIds: (data.collectionIds as string[]) || [],
      achievementsUnlocked: (data.achievementsUnlocked as number) || 0,
      completionPct: (data.completionPct as number) || 0,
      refundWindow: data.refundWindow || null,
      orderId: data.orderId as string | undefined,
      sourceLauncher: (data.sourceLauncher as LauncherSource) || "dreamworks",
      externalId: data.externalId as string | undefined,
      installPath: data.installPath as string | undefined,
      launchCommand: data.launchCommand as string | undefined,
      installedVersion: data.installedVersion as string | undefined,
      lastVerifiedAt: data.lastVerifiedAt || null,
      cloudSaveStatus: (data.cloudSaveStatus as LibraryEntry["cloudSaveStatus"]) || "synced",
      drmType: (data.drmType as DrmType) || "dreamworks",
      canLaunchOffline: data.canLaunchOffline !== false,
      sources: (data.sources as LibrarySourceCopy[]) || [],
    })) as LibraryEntry[],
  }),
  empty: { entries: [] },
});

