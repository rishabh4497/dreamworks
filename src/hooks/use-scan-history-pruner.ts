import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { pruneScanHistory } from "@/lib/api/scan-history";

const LAST_RUN_KEY = "scan_history_last_pruned";
const MIN_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h between prunes

/**
 * Once per session — and at most every 6h — sweep the user's scan_history
 * subcollection against their current retention preference. The interval gate
 * uses localStorage so a quick navigation across pages doesn't repeatedly hit
 * Firestore.
 */
export function useScanHistoryPruner(): void {
  const uid = useAuthStore((s) => s.profile?.uid);

  useEffect(() => {
    if (!uid) return;
    const lastRun = Number(localStorage.getItem(LAST_RUN_KEY) ?? "0");
    if (Number.isFinite(lastRun) && Date.now() - lastRun < MIN_INTERVAL_MS) {
      return;
    }
    const retention = useUiStore.getState().settings.scanHistoryRetentionDays;
    void pruneScanHistory(uid, retention)
      .then(() => {
        localStorage.setItem(LAST_RUN_KEY, String(Date.now()));
      })
      .catch(() => {
        // best effort
      });
  }, [uid]);
}
