import { useState } from "react";
import { CheckCircle2, Link as LinkIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, relativeTime } from "@/lib/utils";
import { useLinkedPlatformsStore } from "@/stores/linked-platforms-store";
import { useTranslation } from "@/lib/i18n";
import { toast } from "@/stores/toast-store";
import type { LinkedPlatformId } from "@/lib/types";

const PLATFORM_COLORS: Record<LinkedPlatformId, string> = {
  psn: "bg-[#00439C]",
  "xbox-live": "bg-[#107C10]",
  steam: "bg-[#171a21]",
  epic: "bg-[#313131]",
};

const PLATFORM_BADGE: Record<LinkedPlatformId, string> = {
  psn: "PSN",
  "xbox-live": "XBL",
  steam: "STM",
  epic: "EPC",
};

const PLATFORM_LABEL_KEY: Record<LinkedPlatformId, string> = {
  psn: "PlayStation Network",
  "xbox-live": "Xbox Live",
  steam: "Steam",
  epic: "Epic Games",
};

const PLATFORM_ORDER: LinkedPlatformId[] = ["psn", "xbox-live", "steam", "epic"];

export function PlatformIntegrations() {
  const platforms = useLinkedPlatformsStore((s) => s.platforms);
  const connect = useLinkedPlatformsStore((s) => s.connect);
  const unlink = useLinkedPlatformsStore((s) => s.unlink);
  const sync = useLinkedPlatformsStore((s) => s.sync);
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState<LinkedPlatformId | null>(null);

  const handleSync = (id: LinkedPlatformId) => {
    setSyncing(id);
    sync(id);
    window.setTimeout(() => {
      setSyncing(null);
      toast.success(t("Synced {platform}", { platform: t(PLATFORM_LABEL_KEY[id]) }));
    }, 1200);
  };

  const handleConnect = (id: LinkedPlatformId) => {
    connect(id);
    toast.success(t("Connected to {platform}", { platform: t(PLATFORM_LABEL_KEY[id]) }));
  };

  const handleUnlink = (id: LinkedPlatformId) => {
    unlink(id);
    toast.info(t("Unlinked {platform}", { platform: t(PLATFORM_LABEL_KEY[id]) }));
  };

  return (
    <div className="space-y-4">
      <div className="text-[13px] text-muted/80">
        {t("Connect your other gaming accounts to import your playtime, achievements, and library into Dreamworks.")}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PLATFORM_ORDER.map((id) => {
          const p = platforms[id];
          return (
            <div
              key={id}
              className={cn(
                "flex flex-col justify-between rounded-xl border p-4",
                p.connected
                  ? "border-separator bg-card"
                  : "border-dashed border-separator/50 bg-card-active/30",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-inner",
                    PLATFORM_COLORS[id],
                  )}
                >
                  <span className="text-[12px] font-bold text-white uppercase">
                    {PLATFORM_BADGE[id]}
                  </span>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {t(PLATFORM_LABEL_KEY[id])}
                  </p>
                  {p.connected ? (
                    <p className="flex items-center gap-1 text-[11px] text-green">
                      <CheckCircle2 className="h-3 w-3" /> {t("Connected")}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted">{t("Not connected")}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-separator/30 pt-4">
                <span className="text-[10px] text-muted/60">
                  {p.connected && p.lastSyncedAt
                    ? t("Last synced: {time}", { time: relativeTime(p.lastSyncedAt, t) })
                    : t("No data")}
                </span>
                {p.connected ? (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 px-3 text-[11px]"
                      onClick={() => handleSync(id)}
                      disabled={syncing === id}
                    >
                      <RefreshCw className={cn("mr-1.5 h-3 w-3", syncing === id && "animate-spin")} />
                      {t("Sync")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 px-3 text-[11px] text-red hover:bg-red/10 hover:text-red"
                      onClick={() => handleUnlink(id)}
                    >
                      {t("Unlink")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="h-7 px-3 text-[11px] bg-acid text-background hover:brightness-110"
                    onClick={() => handleConnect(id)}
                  >
                    <LinkIcon className="mr-1.5 h-3 w-3" /> {t("Connect")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
