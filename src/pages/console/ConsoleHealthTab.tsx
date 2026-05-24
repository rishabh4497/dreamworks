import { ConsoleSubTabs, useSubTab } from "@/components/console/ConsoleSubTabs";
import { ConsolePerformanceTab } from "./ConsolePerformanceTab";
import { ConsoleErrorsTab } from "./ConsoleErrorsTab";
import { ConsoleQualityTab } from "./ConsoleQualityTab";
import { ConsoleFeaturesTab } from "./ConsoleFeaturesTab";
import { ConsoleApdexTab } from "./ConsoleApdexTab";
import { ConsoleInstallTab } from "./ConsoleInstallTab";
import { ConsoleLaunchTab } from "./ConsoleLaunchTab";
import { ConsoleVoiceTab } from "./ConsoleVoiceTab";
import { ConsoleCdnTab } from "./ConsoleCdnTab";
import { ConsoleDrmTab } from "./ConsoleDrmTab";
import { ConsoleFraudTab } from "./ConsoleFraudTab";
import { ConsoleAuthAnomalyTab } from "./ConsoleAuthAnomalyTab";
import { ConsoleModerationTab } from "./ConsoleModerationTab";

const SUBS = [
  { id: "performance", label: "Performance" },
  { id: "apdex", label: "Apdex / Resource" },
  { id: "errors", label: "Errors" },
  { id: "friction", label: "Friction" },
  { id: "usage", label: "Usage" },
  { id: "install", label: "Install" },
  { id: "launch", label: "Launch" },
  { id: "voice", label: "Voice" },
  { id: "cdn", label: "CDN" },
  { id: "drm", label: "DRM" },
  { id: "fraud", label: "Fraud" },
  { id: "auth", label: "Auth" },
  { id: "moderation", label: "Moderation" },
];

export function ConsoleHealthTab() {
  const [sub] = useSubTab("sub", "performance");
  return (
    <div className="space-y-6">
      <ConsoleSubTabs tabs={SUBS} />
      {sub === "performance" && <ConsolePerformanceTab />}
      {sub === "apdex" && <ConsoleApdexTab />}
      {sub === "errors" && <ConsoleErrorsTab />}
      {sub === "friction" && <ConsoleQualityTab />}
      {sub === "usage" && <ConsoleFeaturesTab />}
      {sub === "install" && <ConsoleInstallTab />}
      {sub === "launch" && <ConsoleLaunchTab />}
      {sub === "voice" && <ConsoleVoiceTab />}
      {sub === "cdn" && <ConsoleCdnTab />}
      {sub === "drm" && <ConsoleDrmTab />}
      {sub === "fraud" && <ConsoleFraudTab />}
      {sub === "auth" && <ConsoleAuthAnomalyTab />}
      {sub === "moderation" && <ConsoleModerationTab />}
    </div>
  );
}
