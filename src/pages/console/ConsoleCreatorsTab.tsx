import { ConsoleSubTabs, useSubTab } from "@/components/console/ConsoleSubTabs";
import { ConsoleStudiosTab } from "./ConsoleStudiosTab";
import { ConsolePublishersTab } from "./ConsolePublishersTab";

const SUBS = [
  { id: "studios", label: "Studios" },
  { id: "publishers", label: "Publishers" },
];

export function ConsoleCreatorsTab() {
  const [sub] = useSubTab("sub", "studios");
  return (
    <div className="space-y-6">
      <ConsoleSubTabs tabs={SUBS} />
      {sub === "studios" && <ConsoleStudiosTab />}
      {sub === "publishers" && <ConsolePublishersTab />}
    </div>
  );
}
