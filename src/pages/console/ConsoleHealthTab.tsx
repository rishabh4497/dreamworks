import { ConsoleSubTabs, useSubTab } from "@/components/console/ConsoleSubTabs";
import { ConsolePerformanceTab } from "./ConsolePerformanceTab";
import { ConsoleErrorsTab } from "./ConsoleErrorsTab";
import { ConsoleQualityTab } from "./ConsoleQualityTab";
import { ConsoleFeaturesTab } from "./ConsoleFeaturesTab";

const SUBS = [
  { id: "performance", label: "Performance" },
  { id: "errors", label: "Errors" },
  { id: "friction", label: "Friction" },
  { id: "usage", label: "Usage" },
];

export function ConsoleHealthTab() {
  const [sub] = useSubTab("sub", "performance");
  return (
    <div className="space-y-6">
      <ConsoleSubTabs tabs={SUBS} />
      {sub === "performance" && <ConsolePerformanceTab />}
      {sub === "errors" && <ConsoleErrorsTab />}
      {sub === "friction" && <ConsoleQualityTab />}
      {sub === "usage" && <ConsoleFeaturesTab />}
    </div>
  );
}
