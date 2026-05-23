import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";
import { ToggleRow } from "@/components/ui/toggle-row";
import { ControllerHub } from "@/components/settings/ControllerHub";
import { PlatformIntegrations } from "@/components/settings/PlatformIntegrations";
import { LanSyncToggle } from "@/components/settings/LanSyncToggle";
import { HardwareBenchmarker } from "@/components/settings/HardwareBenchmarker";
import { ThemeCustomizer } from "@/components/settings/ThemeCustomizer";
import { ControllerProfiles } from "@/components/settings/ControllerProfiles";
import { SubscriptionPausing } from "@/components/settings/SubscriptionPausing";
import { RefundMeter } from "@/components/settings/RefundMeter";
import { cn } from "@/lib/utils";
import {
  QuickResumePC,
  CrossPlatformWishlistSync,
  SeamlessRemotePlay,
  DynamicStoreBackgrounds,
} from "@/components/features/UserFeatures";
import {
  AiStuckAssistant,
  AiVoiceTranslation,
  AiHardwareOptimizer,
  AiTextureUpscaler,
} from "@/components/features/AiFeatures";
import { useAuthStore } from "@/stores/auth-store";
import { usePlatform } from "@/hooks/use-platform";
import { useUiStore } from "@/stores/ui-store";
import { toast } from "@/stores/toast-store";
import { pickFolder } from "@/lib/platform";
import { useTranslation } from "@/lib/i18n";
import { useCloudSaveSlots } from "@/hooks/use-cloud-saves";
import { formatBytes, relativeTime } from "@/lib/utils";
import { usePaymentMethodsStore } from "@/stores/payment-methods-store";
import { useFamilyStore } from "@/stores/family-store";
import type {
  NotificationKind,
  StartupLocation,
  FpsCounterLocation,
  DownloadLimitOption,
  PaymentBrand,
  FamilyRelationship,
} from "@/lib/types";
import {
  Bell,
  Check,
  Database,
  Download,
  Folder,
  Gamepad2,
  Lock,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Smartphone,
  Trash2,
  User as UserIcon,
  WifiOff,
  X,
} from "lucide-react";

const NOTIFICATION_ROWS: { kind: NotificationKind; label: string; description?: string }[] = [
  {
    kind: "wishlist-alert",
    label: "Wishlist price alerts",
    description: "When a wishlisted game hits your threshold.",
  },
  {
    kind: "sale-ending",
    label: "Sale ending reminders",
    description: "24-hour warning before a wishlisted sale ends.",
  },
  {
    kind: "friend-activity",
    label: "Friend activity",
    description: "When friends play or review games you care about.",
  },
  {
    kind: "achievement-unlock",
    label: "Achievement unlocks",
    description: "Celebrate every milestone in your library.",
  },
  {
    kind: "library-import",
    label: "Library imports",
    description: "After a purchase or launcher scan finishes.",
  },
  {
    kind: "system",
    label: "Dreamworks announcements",
    description: "Release notes, status updates, platform news.",
  },
];

const LANGUAGE_OPTIONS = ["English", "Français", "Deutsch", "Español", "日本語", "한국어"];

const CLOUD_QUOTA_BYTES = 15 * 1_000_000_000;

type SettingsTab =
  | "account"
  | "general"
  | "downloads"
  | "gameplay"
  | "social"
  | "privacy";

interface TabItem {
  id: SettingsTab;
  labelKey: string;
  icon: typeof UserIcon;
}

const TABS: TabItem[] = [
  { id: "account", labelKey: "Account", icon: UserIcon },
  { id: "general", labelKey: "General", icon: Sliders },
  { id: "downloads", labelKey: "Downloads & Storage", icon: Download },
  { id: "gameplay", labelKey: "Gameplay", icon: Gamepad2 },
  { id: "social", labelKey: "Notifications & Chat", icon: Bell },
  { id: "privacy", labelKey: "Privacy", icon: Lock },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const { isDesktop, os } = usePlatform();
  const { t } = useTranslation();

  const { settings, updateSettings, notificationPrefs, setNotificationPref } = useUiStore();
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [customKeyBinding, setCustomKeyBinding] = useState(false);
  const { data: cloudSaveSlots = [] } = useCloudSaveSlots(profile?.uid);

  const cloudUsedBytes = cloudSaveSlots.reduce((sum, slot) => sum + (slot.sizeBytes || 0), 0);
  const cloudUsagePct = Math.min(100, (cloudUsedBytes / CLOUD_QUOTA_BYTES) * 100);
  const cloudLastSyncedSorted = cloudSaveSlots
    .map((slot) => slot.remoteUpdatedAt)
    .filter((v): v is string => Boolean(v))
    .sort();
  const cloudLastSyncedIso = cloudLastSyncedSorted[cloudLastSyncedSorted.length - 1];
  const cloudSyncState = !settings.cloudSavesEnabled
    ? t("Disabled")
    : settings.offlineModeEnabled
      ? t("Offline")
      : t("Connected");

  useEffect(() => {
    if (!customKeyBinding) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

      let keyString = "";
      if (e.ctrlKey) keyString += "Ctrl+";
      if (e.shiftKey) keyString += "Shift+";
      if (e.altKey) keyString += "Alt+";

      const keyName = e.key.toUpperCase();
      keyString += keyName;

      updateSettings({ screenshotKey: keyString });
      setCustomKeyBinding(false);
      toast.success(`Screenshot shortcut set to ${keyString}`);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [customKeyBinding, updateSettings]);

  const handleCheckForUpdates = () => {
    setIsCheckingUpdates(true);
    setTimeout(() => {
      setIsCheckingUpdates(false);
      toast.success(t("Dreamworks Launcher is up to date (v0.1.0)"));
    }, 1200);
  };

  const notifyRestartRequired = () => {
    toast.info(t("Restart Dreamworks for this to take effect."));
  };

  const handleBrowseFolder = async () => {
    if (!isDesktop) {
      toast.info(t("Folder picker is desktop-only"));
      return;
    }
    const picked = await pickFolder(t("Choose install folder"));
    if (picked) {
      updateSettings({ installPath: picked });
      toast.success(t("Install path updated"));
    }
  };

  const handleExportData = () => {
    updateSettings({ privacyDataExportStatus: "preparing" });
    toast.info("Preparing privacy export");
    window.setTimeout(() => {
      updateSettings({ privacyDataExportStatus: "ready" });
      toast.success("Privacy export is ready");
    }, 900);
  };

  const handleDeleteData = () => {
    updateSettings({ privacyDeleteRequestStatus: "scheduled" });
    toast.info("Account data deletion request scheduled");
  };

  const offlineCacheUpdated = settings.offlineCacheUpdatedAt
    ? new Date(settings.offlineCacheUpdatedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : t("Never");

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header>
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/50">
          <SettingsIcon className="h-3 w-3" />
          {t("Settings")}
        </p>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          {t("Preferences & account")}
        </h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted/65">
          {t(
            "Manage your account, configure the launcher, tune in-game overlays, and control your privacy, notifications, and family sharing.",
          )}
        </p>
      </header>

      <nav className="flex flex-wrap items-center gap-1.5 rounded-xl bg-input p-1.5">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all",
                active
                  ? "bg-card-active text-foreground shadow-sm"
                  : "text-muted hover:bg-card-hover/50 hover:text-foreground/80",
              )}
            >
              <tab.icon className="h-4 w-4 opacity-80" />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </nav>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {activeTab === "account" && (
          <SectionStack>
            <Section title={t("Account profile")}>
              <ProfileCard
                profile={profile}
                updateProfile={updateProfile}
                signOut={signOut}
                t={t}
              />
              <GuardCard
                enabled={settings.twoFactorEnabled}
                onCheckedChange={(next) => updateSettings({ twoFactorEnabled: next })}
                t={t}
              />
            </Section>

            <Section title={t("Linked platforms")}>
              <CrossPlatformWishlistSync />
              <PlatformIntegrations />
            </Section>

            <Section title={t("Billing & refunds")}>
              <SubscriptionPausing />
              <RefundMeter />
              <PaymentMethods t={t} />
            </Section>

            <Section title={t("Family library sharing")}>
              <Card>
                <ToggleRow
                  label={t("Authorize library sharing on this device")}
                  description={t("Allows authorized family members access to your installed games")}
                  checked={settings.librarySharingEnabled}
                  onCheckedChange={(next) => updateSettings({ librarySharingEnabled: next })}
                />
              </Card>

              {settings.librarySharingEnabled ? (
                <FamilyList t={t} />
              ) : (
                <div className="rounded-xl border border-dashed border-separator bg-card-active/40 p-6 text-center">
                  <Shield className="mx-auto mb-2 h-7 w-7 text-muted/45" />
                  <p className="text-[12px] text-muted/65">
                    {t("Library sharing is disabled. Turn it on above to manage family member access.")}
                  </p>
                </div>
              )}
            </Section>
          </SectionStack>
        )}

        {activeTab === "general" && (
          <SectionStack>
            <Section title={t("General preferences")}>
              <QuickResumePC />
              <SeamlessRemotePlay />

              <SelectField
                label={t("Client language")}
                value={settings.language}
                onChange={(v) => updateSettings({ language: v })}
                options={LANGUAGE_OPTIONS.map((l) => ({ value: l, label: l }))}
              />

              <SelectField
                label={t("Startup location")}
                value={settings.startupLocation}
                onChange={(v) => updateSettings({ startupLocation: v as StartupLocation })}
                options={[
                  { value: "store", label: t("Store Home") },
                  { value: "library", label: t("Library") },
                  { value: "feed", label: t("Social Feed") },
                  { value: "db", label: t("SteamDB Analytics") },
                ]}
              />
            </Section>

            <Section title={t("Offline mode")}>
              <Card>
                <ToggleRow
                  label={t("Start and browse in offline mode")}
                  description={t("Use cached library data and only launch games marked offline-ready")}
                  checked={settings.offlineModeEnabled}
                  onCheckedChange={(next) => updateSettings({ offlineModeEnabled: next })}
                />
                <div className="flex flex-col gap-3 border-t border-separator/50 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      {t("Offline cache status")}
                    </p>
                    <p className="text-[11px] text-muted/55">
                      {t("Last refreshed: {time}", { time: offlineCacheUpdated })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest",
                        settings.offlineCacheStatus === "ready" &&
                          "border-green/30 bg-green/10 text-green",
                        settings.offlineCacheStatus === "syncing" &&
                          "border-cyan/30 bg-cyan/10 text-cyan",
                        settings.offlineCacheStatus === "needs-attention" &&
                          "border-red/30 bg-red/10 text-red",
                      )}
                    >
                      <WifiOff className="h-3 w-3" />
                      {t(settings.offlineCacheStatus.replace("-", " "))}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings({
                          offlineCacheStatus: "syncing",
                          offlineCacheUpdatedAt: new Date().toISOString(),
                        });
                        toast.success(t("Offline cache refresh queued"));
                        window.setTimeout(() => {
                          updateSettings({
                            offlineCacheStatus: "ready",
                            offlineCacheUpdatedAt: new Date().toISOString(),
                          });
                        }, 900);
                      }}
                      className="rounded-lg border border-separator bg-card px-3 py-1.5 text-[12px] font-medium text-foreground/85 hover:bg-card-active"
                    >
                      {t("Refresh")}
                    </button>
                  </div>
                </div>
              </Card>
            </Section>

            <Section title={t("Window & layout")}>
              <AiHardwareOptimizer />
              <AiTextureUpscaler />
              <Card divide>
                <ToggleRow
                  label={t("Close window to system tray")}
                  description={t("Keep launcher active in background when clicking close button")}
                  checked={settings.closeToTray}
                  onCheckedChange={(next) => {
                    updateSettings({ closeToTray: next });
                    notifyRestartRequired();
                  }}
                />
                <ToggleRow
                  label={t("Enable hardware acceleration")}
                  description={t("Requires launcher restart to apply changes")}
                  checked={settings.hardwareAcceleration}
                  onCheckedChange={(next) => {
                    updateSettings({ hardwareAcceleration: next });
                    notifyRestartRequired();
                  }}
                />
                <ToggleRow
                  label={t("Use compact side navigation mode")}
                  description={t("Minimize sidebar visual space")}
                  checked={settings.compactMode}
                  onCheckedChange={(next) => updateSettings({ compactMode: next })}
                />
              </Card>
            </Section>

            <Section title={t("Color theme")}>
              <DynamicStoreBackgrounds />
              <div className="flex gap-2 rounded-xl border border-separator bg-card p-1.5">
                {(["dark", "light", "system"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-2 text-[12px] font-medium capitalize transition-all",
                      mode === m
                        ? "bg-card-active text-foreground shadow-sm"
                        : "text-muted hover:bg-card-hover/50 hover:text-foreground/80",
                    )}
                  >
                    {t(m)}
                  </button>
                ))}
              </div>
            </Section>

            <Section title={t("About Dreamworks")}>
              <div className="space-y-3 rounded-xl border border-separator bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">
                      {t("Dreamworks Launcher")}
                    </p>
                    <p className="text-[12px] text-muted/65">
                      {t("Version {version} · Running on {target}", {
                        version: "0.1.0-alpha",
                        target: isDesktop ? t("Desktop ({os})", { os }) : t("Web"),
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckForUpdates}
                    disabled={isCheckingUpdates}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-separator bg-card px-3 py-2 text-[12px] font-medium text-foreground/85 hover:bg-card-active disabled:opacity-50"
                  >
                    <RefreshCw
                      className={cn("h-3.5 w-3.5", isCheckingUpdates && "animate-spin")}
                    />
                    {isCheckingUpdates ? t("Checking…") : t("Check for updates")}
                  </button>
                </div>
                <div className="border-t border-separator/50" />
                <p className="text-[12px] leading-relaxed text-muted/65">
                  {t(
                    "Dreamworks is a dual-target, unified Steam storefront and database analytics client, powered by Tauri, React 19, and Tailwind 4.",
                  )}
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-muted/55">
                {t(
                  "© 2026 Dreamworks Interactive. All rights reserved. Valve, Steam, SteamDB, Epic, GOG, and their respective logos are trademarks or registered trademarks of their owners. Software is provided “as is” without warranties.",
                )}
              </p>
            </Section>
          </SectionStack>
        )}

        {activeTab === "gameplay" && (
          <SectionStack>
            <Section title="Overlay settings">
              <AiStuckAssistant />
              <Card>
                <ToggleRow
                  label="Enable in-game overlay"
                  description="Access chat, guides and overlay widgets while playing"
                  checked={settings.inGameOverlay}
                  onCheckedChange={(next) => updateSettings({ inGameOverlay: next })}
                />
              </Card>
            </Section>

            <Section title="FPS counter">
              <SelectField
                label="Screen corner position"
                value={settings.fpsCounter}
                onChange={(v) => updateSettings({ fpsCounter: v as FpsCounterLocation })}
                options={[
                  { value: "off", label: "Off" },
                  { value: "top-left", label: "Top-Left Corner" },
                  { value: "top-right", label: "Top-Right Corner" },
                  { value: "bottom-left", label: "Bottom-Left Corner" },
                  { value: "bottom-right", label: "Bottom-Right Corner" },
                ]}
              />
              <Card>
                <ToggleRow
                  label="High contrast color"
                  description="Use bright green/neon font color for better visibility"
                  checked={settings.fpsHighContrast}
                  onCheckedChange={(next) => updateSettings({ fpsHighContrast: next })}
                  disabled={settings.fpsCounter === "off"}
                />
              </Card>
            </Section>

            <Section title="Screenshots">
              <div className="flex flex-col gap-3 rounded-xl border border-separator bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    Screenshot shortcut key
                  </p>
                  <p className="text-[11px] text-muted/55">
                    Press current key or bind a new shortcut
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customKeyBinding ? "PRESS KEY…" : settings.screenshotKey}
                    readOnly
                    onClick={() => {
                      setCustomKeyBinding(true);
                      toast.info("Press any key to assign");
                    }}
                    className="w-24 cursor-pointer rounded-lg border border-separator bg-input px-2.5 py-1.5 text-center text-[12px] font-semibold uppercase text-foreground focus:border-acid/40 focus:outline-none focus:ring-1 focus:ring-acid/15"
                  />
                  <button
                    type="button"
                    onClick={() => updateSettings({ screenshotKey: "F12" })}
                    className="rounded-lg border border-separator bg-card px-3 py-1.5 text-[12px] font-medium text-muted hover:bg-card-active hover:text-foreground"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <Card>
                <ToggleRow
                  label="Play sound on screenshot"
                  description="Fires a camera shutter notification sound"
                  checked={settings.screenshotSound}
                  onCheckedChange={(next) => updateSettings({ screenshotSound: next })}
                />
              </Card>
            </Section>

            <Section title="Handheld mode">
              <Card divide>
                <ToggleRow
                  label="Use handheld layout"
                  description="Prioritize library launch actions, larger spacing, and controller-friendly navigation"
                  checked={settings.handheldMode}
                  onCheckedChange={(next) => updateSettings({ handheldMode: next })}
                />
                <ToggleRow
                  label="Use larger focus targets"
                  description="Increase hit areas for topbar, settings rows, and launch controls"
                  checked={settings.largerFocusTargets}
                  onCheckedChange={(next) => updateSettings({ largerFocusTargets: next })}
                />
                <ToggleRow
                  label="Show controller hints"
                  description="Display button prompts and focus guidance on launcher surfaces"
                  checked={settings.controllerHints}
                  onCheckedChange={(next) => updateSettings({ controllerHints: next })}
                />
              </Card>

              <div className="rounded-xl border border-separator bg-card p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Smartphone className="h-4 w-4 text-cyan" />
                  <p className="text-[13px] font-semibold">
                    {settings.handheldMode ? "Handheld controls active" : "Desktop controls active"}
                  </p>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-muted/65">
                  Focus targets are {settings.largerFocusTargets ? "expanded" : "standard"} and
                  controller hints are {settings.controllerHints ? "visible" : "hidden"}.
                </p>
              </div>
            </Section>

            <Section title="Universal controller hub">
              <div className="grid gap-3 md:grid-cols-2">
                <LanSyncToggle />
                <HardwareBenchmarker />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <ThemeCustomizer />
                <ControllerProfiles />
              </div>
              <ControllerHub />
            </Section>
          </SectionStack>
        )}

        {activeTab === "downloads" && (
          <SectionStack>
            <Section title={t("Bandwidth throttling")}>
              <SelectField
                label={t("Limit download speed")}
                value={settings.downloadLimit}
                onChange={(v) => updateSettings({ downloadLimit: v as DownloadLimitOption })}
                options={[
                  { value: "unlimited", label: t("Unlimited") },
                  { value: "10", label: "10 MB/s" },
                  { value: "25", label: "25 MB/s" },
                  { value: "50", label: "50 MB/s" },
                  { value: "100", label: "100 MB/s" },
                ]}
              />
            </Section>

            <Section title={t("Default installation path")}>
              <div className="flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-separator bg-input px-3 py-2 text-[13px] text-foreground">
                  <Folder className="h-4 w-4 text-muted/60" />
                  <input
                    type="text"
                    value={settings.installPath}
                    onChange={(e) => updateSettings({ installPath: e.target.value })}
                    className="w-full bg-transparent focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleBrowseFolder}
                  className="rounded-xl border border-separator bg-card px-4 py-2 text-[12px] font-medium text-muted hover:bg-card-active hover:text-foreground"
                >
                  {t("Browse")}
                </button>
              </div>
            </Section>

            <Section title={t("Dreamworks cloud saves")}>
              <Card>
                <ToggleRow
                  label={t("Enable cloud synchronization")}
                  description={t(
                    "Keep your game saves, achievements and settings in sync across all devices",
                  )}
                  checked={settings.cloudSavesEnabled}
                  onCheckedChange={(next) => updateSettings({ cloudSavesEnabled: next })}
                />
              </Card>

              {settings.cloudSavesEnabled ? (
                <div className="space-y-4 rounded-xl border border-separator bg-card p-4">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-foreground">{t("Cloud storage usage")}</span>
                    <span className="text-muted/65">
                      {t("{used} of {total} used", {
                        used: formatBytes(cloudUsedBytes),
                        total: formatBytes(CLOUD_QUOTA_BYTES),
                      })}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-input">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan to-acid transition-all duration-300"
                      style={{ width: `${cloudUsagePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] leading-relaxed text-muted/55">
                    <span>{t("Active sync: {state}", { state: cloudSyncState })}</span>
                    <span>
                      {t("Last synced: {time}", {
                        time: cloudLastSyncedIso ? relativeTime(cloudLastSyncedIso, t) : t("Never"),
                      })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-separator bg-card-active/40 p-6 text-center">
                  <Database className="mx-auto mb-2 h-7 w-7 text-muted/45" />
                  <p className="text-[13px] font-semibold text-foreground">
                    {t("Cloud saves disabled")}
                  </p>
                  <p className="mt-1 text-[12px] text-muted/65">
                    {t("Turn cloud saves on to back up game progress across devices.")}
                  </p>
                </div>
              )}
            </Section>
          </SectionStack>
        )}

        {activeTab === "social" && (
          <SectionStack>
            <Section title="Delivery preferences">
              <Card divide>
                <ToggleRow
                  label="Show desktop notifications"
                  description="Notify on game updates, friend activities, and system alerts"
                  checked={settings.browserNotify}
                  onCheckedChange={(next) => updateSettings({ browserNotify: next })}
                />
                <ToggleRow
                  label="Play notification sound"
                  description="Trigger an acoustic beep for incoming pop-up highlights"
                  checked={settings.playNotificationSound}
                  onCheckedChange={(next) => updateSettings({ playNotificationSound: next })}
                />
                <ToggleRow
                  label="Email me about wishlist sales"
                  checked={settings.emailOnSale}
                  onCheckedChange={(next) => updateSettings({ emailOnSale: next })}
                />
              </Card>
            </Section>

            <Section title="In-app alert subscriptions">
              <Card divide>
                {NOTIFICATION_ROWS.map((row) => (
                  <ToggleRow
                    key={row.kind}
                    label={row.label}
                    description={row.description}
                    checked={notificationPrefs[row.kind] !== false}
                    onCheckedChange={(next) => setNotificationPref(row.kind, next)}
                  />
                ))}
              </Card>
            </Section>

            <Section title="Chat preferences">
              <AiVoiceTranslation />
              <Card divide>
                <ToggleRow
                  label="Sign in to friends list on startup"
                  description="Go online immediately when launcher starts"
                  checked={settings.friendOnlineNotify}
                  onCheckedChange={(next) => updateSettings({ friendOnlineNotify: next })}
                />
                <ToggleRow
                  label="Enable chat profanity filtering"
                  description="Obscure offensive language with stars (*)"
                  checked={settings.chatProfanityFilter}
                  onCheckedChange={(next) => updateSettings({ chatProfanityFilter: next })}
                />
                <ToggleRow
                  label="Play sound on new messages"
                  description="Fires a sound notification on received chat text"
                  checked={settings.playChatSound}
                  onCheckedChange={(next) => updateSettings({ playChatSound: next })}
                />
              </Card>
            </Section>

            <Section title="Friend status notifications">
              <Card divide>
                <ToggleRow
                  label="When a friend comes online"
                  checked={settings.friendOnlineNotify}
                  onCheckedChange={(next) => updateSettings({ friendOnlineNotify: next })}
                />
                <ToggleRow
                  label="When a friend starts playing a game"
                  checked={settings.friendStartGameNotify}
                  onCheckedChange={(next) => updateSettings({ friendStartGameNotify: next })}
                />
              </Card>
            </Section>
          </SectionStack>
        )}

        {activeTab === "privacy" && (
          <SectionStack>
            <Section title="Telemetry">
              <Card divide>
                <ToggleRow
                  label="Send crash reports"
                  description="Share crash dumps and device context needed to diagnose launcher failures"
                  checked={settings.crashReportsEnabled}
                  onCheckedChange={(next) => updateSettings({ crashReportsEnabled: next })}
                />
                <ToggleRow
                  label="Share usage diagnostics"
                  description="Help improve navigation, installs, and launch reliability with anonymized events"
                  checked={settings.usageDiagnosticsEnabled}
                  onCheckedChange={(next) => updateSettings({ usageDiagnosticsEnabled: next })}
                />
              </Card>
            </Section>

            <Section title="Scan history">
              <FieldLabel>Keep local launcher scan history</FieldLabel>
              <div className="flex items-center gap-2 rounded-xl border border-separator bg-input px-3 py-2 text-[13px] text-foreground">
                <Database className="h-4 w-4 shrink-0 text-muted/60" />
                <select
                  value={settings.scanHistoryRetentionDays}
                  onChange={(e) =>
                    updateSettings({
                      scanHistoryRetentionDays: Number(e.target.value) as 0 | 30 | 90 | 365,
                    })
                  }
                  className="w-full bg-transparent focus:outline-none"
                >
                  <option value={0}>Do not keep scan history</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>1 year</option>
                </select>
              </div>
            </Section>

            <Section title="Your data">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-separator bg-card p-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <Download className="h-4 w-4 text-cyan" />
                    <p className="text-[13px] font-semibold">Export personal data</p>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted/65">
                    Includes account profile, library metadata, settings, and retained scan
                    records.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="mt-4 rounded-lg border border-separator bg-card px-3 py-2 text-[12px] font-medium text-foreground/85 hover:bg-card-active"
                  >
                    {settings.privacyDataExportStatus === "ready"
                      ? "Download export"
                      : settings.privacyDataExportStatus === "preparing"
                        ? "Preparing…"
                        : "Request export"}
                  </button>
                </div>
                <div className="rounded-xl border border-red/25 bg-red/5 p-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <Trash2 className="h-4 w-4 text-red" />
                    <p className="text-[13px] font-semibold">Delete account data</p>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted/65">
                    Schedules deletion for profile data, telemetry, scan history, and cloud
                    preferences.
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteData}
                    className="mt-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-[12px] font-medium text-red hover:bg-red/15"
                  >
                    {settings.privacyDeleteRequestStatus === "scheduled"
                      ? "Deletion scheduled"
                      : "Request deletion"}
                  </button>
                </div>
              </div>
            </Section>
          </SectionStack>
        )}

      </motion.div>
    </motion.div>
  );
}

// ── Layout primitives (mirror admin design language) ────────────────────────

function SectionStack({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[16px] font-semibold text-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Card({
  children,
  divide,
}: {
  children: React.ReactNode;
  divide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-separator bg-card px-4",
        divide && "divide-y divide-separator/50",
      )}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted/55">
      {children}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-xl border border-separator bg-input px-3 py-2 text-[13px] text-foreground focus:border-acid/40 focus:outline-none focus:ring-1 focus:ring-acid/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PaymentMethods() {
  return (
    <div className="space-y-3 rounded-xl border border-separator bg-card p-4">
      <div className="flex items-center justify-between rounded-lg border border-separator bg-input p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-12 items-center justify-center rounded bg-foreground p-1">
            <span className="text-[14px] font-bold italic text-background">Visa</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">•••• 4242</p>
            <p className="text-[11px] text-muted/65">Expires 12/28</p>
          </div>
        </div>
        <span className="rounded-md bg-acid/10 px-2 py-0.5 text-[10px] font-bold text-acid">
          Default
        </span>
      </div>
      <button
        type="button"
        className="w-full text-left text-[12px] font-semibold text-cyan transition-colors hover:underline"
      >
        + Add new payment method
      </button>
    </div>
  );
}
