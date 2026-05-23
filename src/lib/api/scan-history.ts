import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { COLLECTIONS, USER_SUBCOLLECTIONS, getDb } from "../firebase";
import type { LauncherSource } from "@/lib/types";
import type { ScanResult } from "@/lib/scanner/types";

export interface ScanHistoryRecord {
  id: string;
  completedAt: string;
  totalGames: number;
  durationMs: number;
  errorCount: number;
  launcherCounts: Partial<Record<LauncherSource, number>>;
}

function colRef(uid: string) {
  return collection(
    getDb(),
    COLLECTIONS.users,
    uid,
    USER_SUBCOLLECTIONS.scanHistory,
  );
}

/** Persist a finished scan as a record under the user's scan_history. */
export async function recordScanRun(uid: string, result: ScanResult): Promise<void> {
  const launcherCounts: Partial<Record<LauncherSource, number>> = {};
  for (const game of result.detected) {
    const key = game.launcher as LauncherSource;
    launcherCounts[key] = (launcherCounts[key] ?? 0) + 1;
  }
  await addDoc(colRef(uid), {
    uid,
    completedAt: Timestamp.now(),
    totalGames: result.detected.length,
    durationMs: result.durationMs,
    errorCount: result.errors.length,
    launcherCounts,
  });
}

export async function listScanRuns(uid: string): Promise<ScanHistoryRecord[]> {
  const snap = await getDocs(query(colRef(uid), orderBy("completedAt", "desc")));
  return snap.docs.map((d) => {
    const data = d.data() as {
      completedAt?: Timestamp;
      totalGames?: number;
      durationMs?: number;
      errorCount?: number;
      launcherCounts?: Partial<Record<LauncherSource, number>>;
    };
    return {
      id: d.id,
      completedAt: data.completedAt?.toDate().toISOString() ?? "",
      totalGames: data.totalGames ?? 0,
      durationMs: data.durationMs ?? 0,
      errorCount: data.errorCount ?? 0,
      launcherCounts: data.launcherCounts ?? {},
    };
  });
}

/**
 * Delete scan_history docs older than `retentionDays`. When the argument is 0,
 * removes all docs (retention "Do not keep").
 */
export async function pruneScanHistory(uid: string, retentionDays: number): Promise<number> {
  if (retentionDays === 0) {
    return clearScanHistory(uid);
  }
  const cutoff = Timestamp.fromMillis(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const snap = await getDocs(query(colRef(uid), where("completedAt", "<", cutoff)));
  await Promise.all(
    snap.docs.map((d) => deleteDoc(doc(getDb(), d.ref.path))),
  );
  return snap.docs.length;
}

export async function clearScanHistory(uid: string): Promise<number> {
  const snap = await getDocs(colRef(uid));
  await Promise.all(
    snap.docs.map((d) => deleteDoc(doc(getDb(), d.ref.path))),
  );
  return snap.docs.length;
}
