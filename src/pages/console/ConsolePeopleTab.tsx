import { ConsoleSubTabs, useSubTab } from "@/components/console/ConsoleSubTabs";
import { ConsoleUsersTab } from "./ConsoleUsersTab";
import { ConsoleDevicesTab } from "./ConsoleDevicesTab";

const SUBS = [
  { id: "users", label: "Users" },
  { id: "rigs", label: "Devices & rigs" },
];

export function ConsolePeopleTab() {
  const [sub] = useSubTab("sub", "users");
  return (
    <div className="space-y-6">
      <ConsoleSubTabs tabs={SUBS} />
      {sub === "users" && <ConsoleUsersTab />}
      {sub === "rigs" && <ConsoleDevicesTab />}
    </div>
  );
}
