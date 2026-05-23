import { useState } from "react";
import { X, CheckCircle, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useLibraryStore } from "@/stores/library-store";
import { toast } from "@/stores/toast-store";
import type { LauncherSource } from "@/lib/types";
import { useGames } from "@/hooks/use-games";
import { launcherLabel, markLauncherSynced, SUPPORTED_LAUNCHER_SOURCES } from "@/lib/api/launcher-accounts";

interface SyncModalProps {
  open: boolean;
  onClose: () => void;
}

export function SyncModal({ open, onClose }: SyncModalProps) {
  const addExternal = useLibraryStore((s) => s.addExternal);
  const { data: games = [] } = useGames();
  const [syncing, setSyncing] = useState<LauncherSource | null>(null);
  const [synced, setSynced] = useState<Set<LauncherSource>>(new Set());

  if (!open) return null;

  const handleSync = (source: LauncherSource) => {
    setSyncing(source);
    setTimeout(() => {
      const randomGames = [...games].sort(() => 0.5 - Math.random()).slice(0, 3);
      randomGames.forEach((g) => {
        addExternal(g.id, source, {
          installed: true,
          externalId: `${source}:${g.id}`,
          canLaunchOffline: false,
        });
      });
      void markLauncherSynced({ source, importedGameCount: randomGames.length });
      setSyncing(null);
      setSynced((prev) => new Set(prev).add(source));
      toast.success(`Successfully synced games from ${launcherLabel(source)}`);
    }, 2000);
  };

  const colorBySource: Partial<Record<LauncherSource, string>> = {
    steam: "bg-[#171a21]",
    epic: "bg-[#2a2a2a]",
    gog: "bg-[#86328a]",
    "xbox-pc": "bg-[#107c10]",
    "ea-app": "bg-[#ff4747]",
    ubisoft: "bg-[#0070ff]",
    battlenet: "bg-[#148eff]",
    rockstar: "bg-[#fcaf17]",
    amazon: "bg-[#00a8e1]",
  };

  const platforms: { id: LauncherSource; name: string; color: string }[] =
    SUPPORTED_LAUNCHER_SOURCES.map((source) => ({
      id: source,
      name: launcherLabel(source),
      color: colorBySource[source] ?? "bg-card-active",
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-separator bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-separator px-5 py-4">
          <h2 className="text-[16px] font-semibold text-foreground">Sync External Accounts</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-card-active hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-[13px] text-muted/80">
            Connect your other game launchers to bring your entire library into Dreamworks.
          </p>
          <div className="space-y-3">
            {platforms.map(platform => (
              <div key={platform.id} className="flex items-center justify-between rounded-xl border border-separator bg-card-active p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg ${platform.color} flex items-center justify-center shadow-inner`}>
                    <span className="text-[10px] font-bold text-white uppercase">{platform.id.substring(0,2)}</span>
                  </div>
                  <span className="text-[14px] font-medium text-foreground">{platform.name}</span>
                </div>
                <Button
                  variant={synced.has(platform.id) ? "secondary" : "primary"}
                  size="sm"
                  disabled={syncing === platform.id || synced.has(platform.id)}
                  onClick={() => handleSync(platform.id)}
                >
                  {syncing === platform.id ? (
                    <><RefreshCcw className="mr-2 h-3.5 w-3.5 animate-spin" /> Syncing...</>
                  ) : synced.has(platform.id) ? (
                    <><CheckCircle className="mr-2 h-3.5 w-3.5 text-green-500" /> Synced</>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-separator bg-card-active/50 px-5 py-4 flex justify-end">
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </motion.div>
    </div>
  );
}
