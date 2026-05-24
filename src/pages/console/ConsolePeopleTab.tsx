import { ConsoleSubTabs, useSubTab } from "@/components/console/ConsoleSubTabs";
import { ConsoleUsersTab } from "./ConsoleUsersTab";
import { ConsoleDevicesTab } from "./ConsoleDevicesTab";
import { ConsoleCohortsTab } from "./ConsoleCohortsTab";
import { ConsoleOnboardingTab } from "./ConsoleOnboardingTab";
import { ConsoleReplayTab } from "./ConsoleReplayTab";

const SUBS = [
  { id: "users", label: "Users" },
  { id: "rigs", label: "Devices & rigs" },
  { id: "cohorts", label: "Cohorts" },
  { id: "onboarding", label: "Onboarding" },
  { id: "replay", label: "Replay" },
];

export function ConsolePeopleTab() {
  const [sub] = useSubTab("sub", "users");
  return (
    <div className="space-y-6">
      <ConsoleSubTabs tabs={SUBS} />
      {sub === "users" && <ConsoleUsersTab />}
      {sub === "rigs" && <ConsoleDevicesTab />}
      {sub === "cohorts" && <ConsoleCohortsTab />}
      {sub === "onboarding" && <ConsoleOnboardingTab />}
      {sub === "replay" && <ConsoleReplayTab />}
    </div>
  );
}
