import type { LauncherAccount, LauncherSource } from "../types";
import { scanLaunchersNative } from "../native-launcher";
import { wait } from "./_delay";

const STORAGE_KEY = "dreamworks-launcher-accounts";

export const SUPPORTED_LAUNCHER_SOURCES: LauncherSource[] = [
  "steam",
  "epic",
  "gog",
  "xbox-pc",
  "ea-app",
  "ubisoft",
  "battlenet",
  "rockstar",
  "amazon",
];

function defaultAccount(source: LauncherSource): LauncherAccount {
  return {
    id: `launcher:${source}`,
    source,
    displayName: launcherLabel(source),
    status: source === "steam" || source === "epic" ? "scan-only" : "unsupported",
    connectedAt: null,
    lastSyncedAt: null,
    importedGameCount: 0,
    privacyMode: "local-scan",
  };
}

function readStored(): LauncherAccount[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LauncherAccount[]) : [];
  } catch {
    return [];
  }
}

function writeStored(accounts: LauncherAccount[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function launcherLabel(source: LauncherSource): string {
  const labels: Record<LauncherSource, string> = {
    dreamworks: "Dreamworks",
    manual: "Manual",
    steam: "Steam",
    epic: "Epic Games",
    gog: "GOG Galaxy",
    ubisoft: "Ubisoft Connect",
    "ea-app": "EA App",
    "xbox-pc": "Xbox PC",
    rockstar: "Rockstar Games",
    battlenet: "Battle.net",
    amazon: "Amazon Games",
  };
  return labels[source];
}

export async function listLauncherAccounts(): Promise<LauncherAccount[]> {
  await wait();
  const stored = readStored();
  const bySource = new Map(stored.map((account) => [account.source, account] as const));
  return SUPPORTED_LAUNCHER_SOURCES.map((source) => bySource.get(source) ?? defaultAccount(source));
}

export async function markLauncherSynced(input: {
  source: LauncherSource;
  importedGameCount: number;
}): Promise<LauncherAccount> {
  const accounts = await listLauncherAccounts();
  const next = accounts.map((account) =>
    account.source === input.source
      ? {
          ...account,
          status: "connected" as const,
          connectedAt: account.connectedAt ?? new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          importedGameCount: input.importedGameCount,
          errorMessage: undefined,
        }
      : account,
  );
  writeStored(next);
  return next.find((account) => account.source === input.source)!;
}

export async function scanConnectedLaunchers(consentGranted: boolean) {
  return scanLaunchersNative(consentGranted);
}
