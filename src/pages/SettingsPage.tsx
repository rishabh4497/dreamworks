import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";
import { ToggleRow } from "@/components/ui/toggle-row";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { usePlatform } from "@/hooks/use-platform";
import { useUiStore } from "@/stores/ui-store";
import { toast } from "@/stores/toast-store";
import type { NotificationKind, StartupLocation, FpsCounterLocation, DownloadLimitOption } from "@/lib/types";
import {
  User,
  Settings,
  Gamepad2,
  Download,
  Cloud,
  Bell,
  MessageSquare,
  Shield,
  Info,
  RefreshCw,
  Folder,
  Check,
  Globe,
  WifiOff,
  Database,
  Trash2,
  Smartphone,
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

type SettingsTab =
  | "account"
  | "general"
  | "ingame"
  | "downloads"
  | "cloud"
  | "notifications"
  | "chat"
  | "privacy"
  | "controller"
  | "family"
  | "about";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const { isDesktop, os } = usePlatform();
  
  const { settings, updateSettings, notificationPrefs, setNotificationPref } = useUiStore();
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [customKeyBinding, setCustomKeyBinding] = useState(false);

  useEffect(() => {
    if (!customKeyBinding) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
      
      let keyString = "";
      if (e.ctrlKey) keyString += "Ctrl+";
      if (e.shiftKey) keyString += "Shift+";
      if (e.altKey) keyString += "Alt+";
      
      // Map standard keys or just use the upper-case key
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
      toast.success("Dreamworks Launcher is up to date (v0.1.0)");
    }, 1200);
  };

  const handleBrowseFolder = () => {
    toast.info("Folder picker opened (mock)");
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
    : "Never";

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "account", label: "Account", icon: <User className="h-4 w-4" /> },
    { id: "general", label: "General", icon: <Settings className="h-4 w-4" /> },
    { id: "ingame", label: "In-Game HUD", icon: <Gamepad2 className="h-4 w-4" /> },
    { id: "downloads", label: "Downloads & Storage", icon: <Download className="h-4 w-4" /> },
    { id: "cloud", label: "Cloud Saves", icon: <Cloud className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    { id: "chat", label: "Friends & Chat", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "privacy", label: "Privacy", icon: <Shield className="h-4 w-4" /> },
    { id: "controller", label: "Controller", icon: <Gamepad2 className="h-4 w-4" /> },
    { id: "family", label: "Family Sharing", icon: <Shield className="h-4 w-4" /> },
    { id: "about", label: "About", icon: <Info className="h-4 w-4" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="max-w-5xl mx-auto"
    >
      <h1 className="text-[22px] font-semibold tracking-tight text-foreground mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-start">
        {/* Sidebar tabs */}
        <aside className="rounded-xl border border-separator bg-card/45 p-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 sticky top-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium rounded-lg transition-all text-left whitespace-nowrap md:w-full",
                  isActive
                    ? "bg-card-active text-foreground font-semibold shadow-sm border border-separator"
                    : "text-muted/65 hover:text-foreground/80 hover:bg-card-hover"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content panel */}
        <main className="rounded-xl border border-separator bg-card p-6 min-h-[500px]">
          {/* Account Tab */}
          {activeTab === "account" && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-4">Account Profile</h2>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-separator bg-card-active/30">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-cyan to-acid flex items-center justify-center font-bold text-lg text-white shadow-md">
                    {profile?.displayName?.slice(0, 2).toUpperCase() || "DW"}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{profile?.displayName}</h3>
                    <p className="text-[11px] text-muted/60">{profile?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
                      <span className="text-[10px] text-muted/50 font-medium">Online</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => void signOut()}
                  className="w-full sm:w-auto rounded-md border border-separator bg-card px-4 py-2 text-[11px] text-muted hover:bg-card-active hover:text-foreground transition-all"
                >
                  Sign out
                </button>
              </div>

              <div className="rounded-xl border border-separator bg-card-active/10 p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-green">
                  <Shield className="h-4 w-4" />
                  <span className="text-[12px] font-semibold">Dreamworks Guard Protected</span>
                </div>
                <p className="text-[11px] text-muted/60 leading-relaxed">
                  Your account is secured with Dreamworks Guard. Two-factor authentication (2FA) is active. To change your security method or update your password, please contact system support.
                </p>
              </div>
            </motion.div>
          )}

          {/* General Tab */}
          {activeTab === "general" && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">General Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-muted/70 uppercase tracking-wider mb-1.5 font-medium">Client Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSettings({ language: e.target.value })}
                      className="w-full rounded-lg border border-separator bg-input px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-muted/50"
                    >
                      {["English", "Français", "Deutsch", "Español", "日本語", "한국어"].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-muted/70 uppercase tracking-wider mb-1.5 font-medium">Startup Location</label>
                    <select
                      value={settings.startupLocation}
                      onChange={(e) => updateSettings({ startupLocation: e.target.value as StartupLocation })}
                      className="w-full rounded-lg border border-separator bg-input px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-muted/50 capitalize"
                    >
                      <option value="store">Store Home</option>
                      <option value="library">Library</option>
                      <option value="feed">Social Feed</option>
                      <option value="db">SteamDB Analytics</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Offline Mode</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1 divide-y divide-separator/50">
                  <ToggleRow
                    label="Start and browse in offline mode"
                    description="Use cached library data and only launch games marked offline-ready"
                    checked={settings.offlineModeEnabled}
                    onCheckedChange={(next) => updateSettings({ offlineModeEnabled: next })}
                  />
                  <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-foreground">Offline cache status</p>
                      <p className="text-[10px] text-muted/50">
                        Last refreshed: {offlineCacheUpdated}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                          settings.offlineCacheStatus === "ready" &&
                            "border-green/30 bg-green/10 text-green",
                          settings.offlineCacheStatus === "syncing" &&
                            "border-cyan/30 bg-cyan/10 text-cyan",
                          settings.offlineCacheStatus === "needs-attention" &&
                            "border-red/30 bg-red/10 text-red",
                        )}
                      >
                        <WifiOff className="h-3 w-3" />
                        {settings.offlineCacheStatus.replace("-", " ")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          updateSettings({
                            offlineCacheStatus: "syncing",
                            offlineCacheUpdatedAt: new Date().toISOString(),
                          });
                          toast.success("Offline cache refresh queued");
                          window.setTimeout(() => {
                            updateSettings({
                              offlineCacheStatus: "ready",
                              offlineCacheUpdatedAt: new Date().toISOString(),
                            });
                          }, 900);
                        }}
                        className="rounded-md border border-separator bg-card-active px-3 py-1.5 text-[11px] font-medium text-foreground/80 hover:bg-card-hover"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Window & Layout</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1 divide-y divide-separator/50">
                  <ToggleRow
                    label="Close window to system tray"
                    description="Keep launcher active in background when clicking close button"
                    checked={settings.closeToTray}
                    onCheckedChange={(next) => updateSettings({ closeToTray: next })}
                  />
                  <ToggleRow
                    label="Enable hardware acceleration"
                    description="Requires launcher restart to apply changes"
                    checked={settings.hardwareAcceleration}
                    onCheckedChange={(next) => updateSettings({ hardwareAcceleration: next })}
                  />
                  <ToggleRow
                    label="Use compact side navigation mode"
                    description="Minimize sidebar visual space"
                    checked={settings.compactMode}
                    onCheckedChange={(next) => updateSettings({ compactMode: next })}
                  />
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Color Theme</h2>
                <div className="rounded-xl border border-separator bg-card px-2 py-1.5 flex gap-2">
                  {(["dark", "light", "system"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-[11px] font-medium capitalize transition-all",
                        mode === m ? "bg-card-active text-foreground border border-separator" : "text-muted/65 hover:text-foreground/80"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* In-Game HUD Tab */}
          {activeTab === "ingame" && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Overlay Settings</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1">
                  <ToggleRow
                    label="Enable In-Game Overlay"
                    description="Access chat, guides and overlay widgets while playing"
                    checked={settings.inGameOverlay}
                    onCheckedChange={(next) => updateSettings({ inGameOverlay: next })}
                  />
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">FPS Counter</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-muted/70 uppercase tracking-wider mb-1.5 font-medium">Screen Corner Position</label>
                    <select
                      value={settings.fpsCounter}
                      onChange={(e) => updateSettings({ fpsCounter: e.target.value as FpsCounterLocation })}
                      className="w-full rounded-lg border border-separator bg-input px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-muted/50"
                    >
                      <option value="off">Off</option>
                      <option value="top-left">Top-Left Corner</option>
                      <option value="top-right">Top-Right Corner</option>
                      <option value="bottom-left">Bottom-Left Corner</option>
                      <option value="bottom-right">Bottom-Right Corner</option>
                    </select>
                  </div>
                  <div className="rounded-xl border border-separator bg-card px-4 py-1">
                    <ToggleRow
                      label="High Contrast Color"
                      description="Use bright green/neon font color for better visibility"
                      checked={settings.fpsHighContrast}
                      onCheckedChange={(next) => updateSettings({ fpsHighContrast: next })}
                      disabled={settings.fpsCounter === "off"}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Screenshots</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-separator bg-card-active/10">
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">Screenshot Shortcut Key</p>
                      <p className="text-[10px] text-muted/50">Press current key or bind a new shortcut</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customKeyBinding ? "PRESS KEY..." : settings.screenshotKey}
                        readOnly
                        onClick={() => {
                          setCustomKeyBinding(true);
                          toast.info("Press any key to assign");
                        }}
                        className="w-20 rounded-md border border-separator bg-input px-2.5 py-1 text-center text-[12px] text-foreground font-semibold cursor-pointer uppercase focus:border-acid"
                      />
                      <button
                        onClick={() => updateSettings({ screenshotKey: "F12" })}
                        className="rounded-md border border-separator bg-card px-3 py-1 text-[11px] text-muted hover:bg-card-active hover:text-foreground"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-separator bg-card px-4 py-1">
                    <ToggleRow
                      label="Play sound on screenshot"
                      description="Fires a camera shutter notification sound"
                      checked={settings.screenshotSound}
                      onCheckedChange={(next) => updateSettings({ screenshotSound: next })}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Downloads & Storage Tab */}
          {activeTab === "downloads" && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Bandwidth Throttling</h2>
                <label className="block text-[11px] text-muted/70 uppercase tracking-wider mb-1.5 font-medium">Limit download speed</label>
                <select
                  value={settings.downloadLimit}
                  onChange={(e) => updateSettings({ downloadLimit: e.target.value as DownloadLimitOption })}
                  className="w-full rounded-lg border border-separator bg-input px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-muted/50"
                >
                  <option value="unlimited">Unlimited (No Limit)</option>
                  <option value="10">10 MB/s</option>
                  <option value="25">25 MB/s</option>
                  <option value="50">50 MB/s</option>
                  <option value="100">100 MB/s</option>
                </select>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Download Region</h2>
                <label className="block text-[11px] text-muted/70 uppercase tracking-wider mb-1.5 font-medium">Choose nearest server</label>
                <div className="flex gap-2 items-center w-full rounded-lg border border-separator bg-input px-3 py-2 text-[12px] text-foreground">
                  <Globe className="h-4 w-4 text-muted/60 shrink-0" />
                  <select
                    value={settings.downloadRegion}
                    onChange={(e) => updateSettings({ downloadRegion: e.target.value })}
                    className="w-full bg-transparent text-foreground focus:outline-none"
                  >
                    <option value="US East (New York)">US East (New York)</option>
                    <option value="US West (San Jose)">US West (San Jose)</option>
                    <option value="Europe West (Frankfurt)">Europe West (Frankfurt)</option>
                    <option value="Asia East (Tokyo)">Asia East (Tokyo)</option>
                    <option value="South America (São Paulo)">South America (São Paulo)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Default Installation Path</h2>
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2 items-center rounded-lg border border-separator bg-input px-3 py-2 text-[12px] text-foreground">
                    <Folder className="h-4 w-4 text-muted/60" />
                    <input
                      type="text"
                      value={settings.installPath}
                      onChange={(e) => updateSettings({ installPath: e.target.value })}
                      className="w-full bg-transparent focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleBrowseFolder}
                    className="rounded-lg border border-separator bg-card px-4 py-2 text-[11px] text-muted hover:bg-card-active hover:text-foreground"
                  >
                    Browse
                  </button>
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Background Activities</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1 divide-y divide-separator/50">
                  <ToggleRow
                    label="Allow downloads during gameplay"
                    description="Downloading games in background can degrade game ping/performance"
                    checked={settings.allowDownloadsDuringGameplay}
                    onCheckedChange={(next) => updateSettings({ allowDownloadsDuringGameplay: next })}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Cloud Saves Tab */}
          {activeTab === "cloud" && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Dreamworks Cloud</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1">
                  <ToggleRow
                    label="Enable cloud synchronization"
                    description="Keep your game saves, achievements and settings in sync across all devices"
                    checked={settings.cloudSavesEnabled}
                    onCheckedChange={(next) => updateSettings({ cloudSavesEnabled: next })}
                  />
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Cloud Storage Allocations</h2>
                <div className="rounded-xl border border-separator bg-card p-4 space-y-4">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="font-semibold text-foreground">Usage Summary</span>
                    <span className="text-muted/60">3.4 GB of 15.0 GB used</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-input h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan to-acid h-full rounded-full transition-all duration-300"
                      style={{ width: `${(3.4 / 15.0) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-muted/50 leading-relaxed">
                    <span>Active sync: Connected</span>
                    <span>Last synced: Just now</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Delivery Preferences</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1 divide-y divide-separator/50">
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
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">In-App Alert Subscriptions</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1 divide-y divide-separator/50">
                  {NOTIFICATION_ROWS.map((row) => (
                    <ToggleRow
                      key={row.kind}
                      label={row.label}
                      description={row.description}
                      checked={notificationPrefs[row.kind] !== false}
                      onCheckedChange={(next) => setNotificationPref(row.kind, next)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Voice & Chat Tab */}
          {activeTab === "chat" && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Chat Preferences</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1 divide-y divide-separator/50">
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
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Friend Status Notifications</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1 divide-y divide-separator/50">
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
                </div>
              </div>
            </motion.div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Telemetry</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1 divide-y divide-separator/50">
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
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Scan History</h2>
                <label className="block text-[11px] text-muted/70 uppercase tracking-wider mb-1.5 font-medium">
                  Keep local launcher scan history
                </label>
                <div className="flex gap-2 items-center w-full rounded-lg border border-separator bg-input px-3 py-2 text-[12px] text-foreground">
                  <Database className="h-4 w-4 text-muted/60 shrink-0" />
                  <select
                    value={settings.scanHistoryRetentionDays}
                    onChange={(e) =>
                      updateSettings({
                        scanHistoryRetentionDays: Number(e.target.value) as 0 | 30 | 90 | 365,
                      })
                    }
                    className="w-full bg-transparent text-foreground focus:outline-none"
                  >
                    <option value={0}>Do not keep scan history</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Your Data</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-separator bg-card-active/20 p-4">
                    <div className="flex items-center gap-2 text-foreground">
                      <Download className="h-4 w-4 text-cyan" />
                      <p className="text-[12px] font-semibold">Export personal data</p>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted/60">
                      Includes account profile, library metadata, settings, and retained scan records.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="mt-4 rounded-md border border-separator bg-card px-3 py-2 text-[11px] font-medium text-foreground/80 hover:bg-card-active"
                    >
                      {settings.privacyDataExportStatus === "ready"
                        ? "Download export"
                        : settings.privacyDataExportStatus === "preparing"
                          ? "Preparing..."
                          : "Request export"}
                    </button>
                  </div>
                  <div className="rounded-xl border border-red/25 bg-red/5 p-4">
                    <div className="flex items-center gap-2 text-foreground">
                      <Trash2 className="h-4 w-4 text-red" />
                      <p className="text-[12px] font-semibold">Delete account data</p>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted/60">
                      Schedules deletion for profile data, telemetry, scan history, and cloud preferences.
                    </p>
                    <button
                      type="button"
                      onClick={handleDeleteData}
                      className="mt-4 rounded-md border border-red/30 bg-red/10 px-3 py-2 text-[11px] font-medium text-red hover:bg-red/15"
                    >
                      {settings.privacyDeleteRequestStatus === "scheduled"
                        ? "Deletion scheduled"
                        : "Request deletion"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Controller Tab */}
          {activeTab === "controller" && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Handheld Mode</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1 divide-y divide-separator/50">
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
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div className="rounded-xl border border-separator bg-card-active/20 p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Smartphone className="h-4 w-4 text-cyan" />
                  <p className="text-[12px] font-semibold">
                    {settings.handheldMode ? "Handheld controls active" : "Desktop controls active"}
                  </p>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted/60">
                  Focus targets are {settings.largerFocusTargets ? "expanded" : "standard"} and controller hints are{" "}
                  {settings.controllerHints ? "visible" : "hidden"}.
                </p>
              </div>
            </motion.div>
          )}

          {/* Family Sharing Tab */}
          {activeTab === "family" && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Family Library Sharing</h2>
                <div className="rounded-xl border border-separator bg-card px-4 py-1">
                  <ToggleRow
                    label="Authorize library sharing on this device"
                    description="Allows authorized family members access to your installed games"
                    checked={settings.librarySharingEnabled}
                    onCheckedChange={(next) => updateSettings({ librarySharingEnabled: next })}
                  />
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Authorized Family Members</h2>
                {settings.librarySharingEnabled ? (
                  <div className="rounded-xl border border-separator bg-card p-4 space-y-4">
                    <p className="text-[11px] text-muted/60">Select family members to share your collection with:</p>
                    <div className="divide-y divide-separator/50">
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className="text-[12px] font-semibold text-foreground">Sarah (Sister)</p>
                          <p className="text-[10px] text-muted/50">Last active 2 hours ago</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded bg-green/10 px-2 py-0.5 text-[10px] font-medium text-green">
                          <Check className="h-3 w-3" /> Authorized
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className="text-[12px] font-semibold text-foreground">Leo (Brother)</p>
                          <p className="text-[10px] text-muted/50">Last active 3 days ago</p>
                        </div>
                        <button className="rounded bg-card-active px-2 py-1 text-[10px] text-foreground hover:bg-card-hover border border-separator">
                          Authorize
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 border border-dashed border-separator rounded-xl bg-card-active/5">
                    <Shield className="h-8 w-8 text-muted/30 mx-auto mb-2" />
                    <p className="text-[12px] text-muted/60">Library sharing is disabled. Turn it on above to manage family members access.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">About Dreamworks</h2>
                <div className="rounded-xl border border-separator bg-card p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[13px] font-bold text-foreground">Dreamworks Launcher</p>
                      <p className="text-[11px] text-muted/60">Version 0.1.0-alpha · Running on {isDesktop ? `Desktop (${os})` : "Web"}</p>
                    </div>
                    <button
                      onClick={handleCheckForUpdates}
                      disabled={isCheckingUpdates}
                      className="inline-flex items-center gap-1.5 rounded-md border border-separator bg-card px-4 py-2 text-[11px] text-muted hover:bg-card-active hover:text-foreground disabled:opacity-50 transition-all font-medium"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isCheckingUpdates && "animate-spin")} />
                      {isCheckingUpdates ? "Checking..." : "Check for updates"}
                    </button>
                  </div>

                  <div className="border-t border-separator my-3" />

                  <p className="text-[11px] text-muted/60 leading-relaxed">
                    Dreamworks is a dual-target, unified Steam storefront and database analytics client, powered by Tauri, React 19, and Tailwind 4. Designed with maximum responsiveness and modern glassmorphic aesthetics.
                  </p>
                </div>
              </div>

              <div className="border-t border-separator my-6" />

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/60 mb-3">Legal notices</h2>
                <p className="text-[11px] text-muted/50 leading-relaxed">
                  © 2026 Dreamworks Interactive. All rights reserved. Valve, Steam, SteamDB, Epic, GOG, and their respective logos are trademarks or registered trademarks of their owners. Software is provided "as is" without warranties.
                </p>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </motion.div>
  );
}
