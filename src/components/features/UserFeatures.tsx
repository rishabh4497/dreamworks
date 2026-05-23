import { useState } from "react";
import { Camera, PlaySquare, FileCode2, Users, Trophy, RefreshCcw, HardDrive, Smartphone, BookOpen, MonitorPlay } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { useTranslation } from "@/lib/i18n";
import { toast } from "@/stores/toast-store";
import { cn, relativeTime } from "@/lib/utils";

export function UniversalPhotoGallery() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-cyan/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-cyan/10 text-cyan">
          <Camera className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Universal Photo Mode Gallery</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        A central masonry-grid hub to view, edit, apply filters, and share screenshots captured across any game.
      </p>
    </div>
  );
}

export function QuickResumePC() {
  const enabled = useUiStore((s) => s.settings.quickResumeEnabled);
  const updateSettings = useUiStore((s) => s.updateSettings);
  const { t } = useTranslation();

  const toggle = () => {
    const next = !enabled;
    updateSettings({ quickResumeEnabled: next });
    toast.success(next ? t("Quick Resume enabled") : t("Quick Resume disabled"));
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-acid/10 text-acid">
          <PlaySquare className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("\"Quick Resume\" for PC")}</h3>
          <p className="text-xs text-muted/60 mt-0.5">{t("Suspend game state to disk for instant hot-swapping.")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {enabled && (
          <span className="rounded-md bg-green/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-green">
            {t("Enabled")}
          </span>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-pressed={enabled}
          className={cn(
            "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
            enabled
              ? "border-acid/40 bg-acid/10 text-acid hover:bg-acid/15"
              : "border-separator bg-card-active hover:bg-card-hover",
          )}
        >
          {enabled ? t("Disable") : t("Enable")}
        </button>
      </div>
    </div>
  );
}

export function AutomatedModProfiles() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-acid/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
          <FileCode2 className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Automated Modding Profiles</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Share your exact loadout of 50+ mods with a single text string for friends to one-click install.
      </p>
    </div>
  );
}

export function LocalCoopMatchmaker() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-green/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-green/10 text-green">
          <Users className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Local Co-op Matchmaker</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Detects plugged-in controllers and dynamically suggests games you own that support that many local players.
      </p>
    </div>
  );
}

export function InteractiveAchievementRooms() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-yellow-500/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
          <Trophy className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Interactive Achievement Rooms</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        A customizable 3D/2D virtual room where your rarest achievements are displayed as physical trophies.
      </p>
    </div>
  );
}

export function CrossPlatformWishlistSync() {
  const lastSyncedAt = useUiStore((s) => s.settings.lastWishlistSyncAt);
  const updateSettings = useUiStore((s) => s.updateSettings);
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);

  const onClick = () => {
    if (syncing) return;
    setSyncing(true);
    window.setTimeout(() => {
      const now = new Date().toISOString();
      updateSettings({ lastWishlistSyncAt: now });
      setSyncing(false);
      toast.success(t("Wishlists synced"));
    }, 1500);
  };

  const subtitle = lastSyncedAt
    ? t("Last synced: {time}", { time: relativeTime(lastSyncedAt, t) })
    : t("Mirror wishlists across PlayStation, Xbox, and Steam.");

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
          <RefreshCcw className={cn("h-5 w-5", syncing && "animate-spin")} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("Cross-Platform Wishlist Sync")}</h3>
          <p className="text-xs text-muted/60 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={syncing}
        className="px-3 py-1.5 rounded-lg bg-card-active border border-separator text-xs font-medium hover:bg-card-hover disabled:opacity-60"
      >
        {syncing ? t("Syncing") : t("Sync Now")}
      </button>
    </div>
  );
}

export function HardwareAwareWarnings() {
  return (
    <div className="rounded-xl border border-red/30 bg-red/5 p-4 flex items-start gap-3">
      <HardDrive className="h-5 w-5 text-red shrink-0 mt-0.5" />
      <div>
        <h3 className="text-xs font-bold text-red uppercase tracking-wider mb-1">Hardware Warning</h3>
        <p className="text-xs text-red/80">
          Your current GPU (GTX 1060) is below the minimum required specs for this game. Performance may be severely degraded.
        </p>
      </div>
    </div>
  );
}

export function SeamlessRemotePlay() {
  const pairedDevice = useUiStore((s) => s.settings.remotePlayPairedDevice);
  const updateSettings = useUiStore((s) => s.updateSettings);
  const { t } = useTranslation();

  const onClick = () => {
    if (pairedDevice) {
      updateSettings({ remotePlayPairedDevice: null });
      toast.info(t("Device unpaired"));
      return;
    }
    const name = window.prompt(t("Name this device"));
    const trimmed = name?.trim();
    if (!trimmed) return;
    updateSettings({ remotePlayPairedDevice: trimmed });
    toast.success(t("Paired to {device}", { device: trimmed }));
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("Seamless Remote Play")}</h3>
          <p className="text-xs text-muted/60 mt-0.5">{t("Stream desktop games to your phone or laptop.")}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
          pairedDevice
            ? "border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/15"
            : "border-separator bg-card-active hover:bg-card-hover",
        )}
      >
        {pairedDevice ? t("Unpair {device}", { device: pairedDevice }) : t("Pair Device")}
      </button>
    </div>
  );
}

export function InteractiveDigitalManuals() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-pink-500/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
          <BookOpen className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Interactive Digital Manuals</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        High-resolution, flippable digital manuals and lore books accessible directly from the library.
      </p>
    </div>
  );
}

export function DynamicStoreBackgrounds() {
  const enabled = useUiStore((s) => s.settings.dynamicStoreBackgroundsEnabled);
  const updateSettings = useUiStore((s) => s.updateSettings);
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan/10 text-cyan">
          <MonitorPlay className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("Dynamic Store Backgrounds")}</h3>
          <p className="text-xs text-muted/60 mt-0.5">{t("Launcher theme adapts to the currently viewed game.")}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => updateSettings({ dynamicStoreBackgroundsEnabled: !enabled })}
        aria-pressed={enabled}
        className={cn(
          "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
          enabled
            ? "border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/15"
            : "border-separator bg-card-active hover:bg-card-hover",
        )}
      >
        {enabled ? t("On") : t("Off")}
      </button>
    </div>
  );
}
