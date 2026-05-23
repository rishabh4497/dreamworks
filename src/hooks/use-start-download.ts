import { useCallback } from "react";
import type { GameId, LauncherSource } from "@/lib/types";
import { useDownloadStore } from "@/stores/download-store";
import { useUiStore } from "@/stores/ui-store";
import { toast } from "@/stores/toast-store";

interface StartDownloadOpts {
  installPath?: string;
  sourceLauncher?: LauncherSource;
  silent?: boolean;
}

export function useStartDownload() {
  const start = useDownloadStore((s) => s.start);
  const installRoot = useUiStore((s) => s.settings.installPath);
  return useCallback(
    (gameId: GameId, sizeBytes: number, opts?: StartDownloadOpts) => {
      const installPath = opts?.installPath ?? `${installRoot}/${gameId}`;
      start(gameId, sizeBytes, {
        installPath,
        sourceLauncher: opts?.sourceLauncher,
      });
      if (!opts?.silent) toast.success(`${gameId} queued`);
    },
    [start, installRoot],
  );
}
