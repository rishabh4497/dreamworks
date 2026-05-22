import { create } from "zustand";
import type { DrmType, GameId, LauncherSource, LibraryEntry, LibrarySourceCopy } from "@/lib/types";
import { buildGameDetail } from "@/lib/mock";
import { computeRefundWindow, isRefundEligible } from "@/lib/refund";
import { defaultCloudSaveStatus } from "@/lib/native-launcher";
import { useAuthStore } from "@/stores/auth-store";
import { getDb, COLLECTIONS } from "@/lib/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  writeBatch
} from "firebase/firestore";

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
      const detail = buildGameDetail(id);
      const mainHours = detail?.playtime.mainHours ?? 0;
      const docRef = doc(getDb(), COLLECTIONS.library, `${profile.uid}_${id}`);
      batch.set(docRef, {
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
      });
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
      await setDoc(docRef, {
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
      });
    }
  },
  toggleInstalled: async (id) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    const entry = get().entries.find((e) => e.gameId === id);
    if (!entry) return;
    const docRef = doc(getDb(), COLLECTIONS.library, `${profile.uid}_${id}`);
    await updateDoc(docRef, { installed: !entry.installed });
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

let lastUid: string | undefined = undefined;
let unsubscribeLibrary: (() => void) | null = null;

useAuthStore.subscribe((state) => {
  const uid = state.profile?.uid;
  if (uid === lastUid) return;
  lastUid = uid;

  if (unsubscribeLibrary) {
    unsubscribeLibrary();
    unsubscribeLibrary = null;
  }

  if (!uid) {
    useLibraryStore.setState({ entries: [] });
    return;
  }

  const q = query(collection(getDb(), COLLECTIONS.library), where("userId", "==", uid));
  unsubscribeLibrary = onSnapshot(q, (snap) => {
    const entries: LibraryEntry[] = [];
    snap.forEach((d) => {
      const data = d.data();
      entries.push({
        gameId: data.gameId,
        ownedSince: data.ownedSince,
        installed: !!data.installed,
        sizeBytes: data.sizeBytes || 0,
        playMinutes: data.playMinutes || 0,
        lastPlayed: data.lastPlayed || null,
        collectionIds: data.collectionIds || [],
        achievementsUnlocked: data.achievementsUnlocked || 0,
        completionPct: data.completionPct || 0,
        refundWindow: data.refundWindow || null,
        orderId: data.orderId,
        sourceLauncher: data.sourceLauncher || "dreamworks",
        externalId: data.externalId,
        installPath: data.installPath,
        launchCommand: data.launchCommand,
        installedVersion: data.installedVersion,
        lastVerifiedAt: data.lastVerifiedAt || null,
        cloudSaveStatus: data.cloudSaveStatus || "synced",
        drmType: data.drmType || "dreamworks",
        canLaunchOffline: data.canLaunchOffline !== false,
        sources: data.sources || [],
      });
    });
    useLibraryStore.setState({ entries });
  });
});

