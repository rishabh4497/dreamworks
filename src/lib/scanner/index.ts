import type { LauncherSource } from "@/lib/types";
import { scanLaunchersNative } from "@/lib/native-launcher";
import { scanEpic } from "./epic";
import { matchToCatalog } from "./match";
import { scanSteam } from "./steam";
import {
  scanAmazon,
  scanBattleNet,
  scanEa,
  scanGog,
  scanRockstar,
  scanUbisoft,
  scanXbox,
} from "./stubs";
import type { DetectedGame, ScanError, ScanResult } from "./types";

export type { DetectedGame, ScanError, ScanResult } from "./types";

interface ScannerEntry {
  launcher: LauncherSource;
  run: () => Promise<DetectedGame[]>;
}

const SCANNERS: ScannerEntry[] = [
  { launcher: "steam", run: scanSteam },
  { launcher: "epic", run: scanEpic },
  { launcher: "gog", run: scanGog },
  { launcher: "ea-app", run: scanEa },
  { launcher: "ubisoft", run: scanUbisoft },
  { launcher: "xbox-pc", run: scanXbox },
  { launcher: "rockstar", run: scanRockstar },
  { launcher: "battlenet", run: scanBattleNet },
  { launcher: "amazon", run: scanAmazon },
];

const NATIVE_SCANNED = new Set<LauncherSource>(["steam", "epic"]);

/** The complete list of launchers the orchestrator will probe, in order. */
export const SCANNER_LAUNCHERS: LauncherSource[] = SCANNERS.map(
  (s) => s.launcher,
);

/**
 * Runs every launcher scanner in parallel via `Promise.allSettled` so one
 * failure can't abort the rest. Concatenates results, matches them against
 * the catalog, and reports per-launcher errors separately.
 */
export async function scanAllLaunchers(): Promise<ScanResult> {
  const started = performance.now();

  const detected: DetectedGame[] = [];
  const errors: ScanError[] = [];
  let pathsRead: string[] | undefined;
  let scanners = SCANNERS;

  const native = await scanLaunchersNative(true);
  if (native.ok) {
    pathsRead = native.data.pathsRead;
    detected.push(
      ...native.data.detected.map((game) => ({
        launcher: game.launcher,
        externalId: game.externalId,
        name: game.name,
        installPath: game.installPath,
        sizeBytes: game.sizeBytes,
        matchConfidence: "unmatched" as const,
      })),
    );
    scanners = SCANNERS.filter((scanner) => !NATIVE_SCANNED.has(scanner.launcher));
  } else if (native.error.code !== "not_desktop") {
    errors.push({ launcher: "dreamworks", message: native.error.message });
  }

  const settled = await Promise.allSettled(scanners.map((s) => s.run()));

  settled.forEach((result, index) => {
    const launcher = scanners[index].launcher;
    if (result.status === "fulfilled") {
      for (const game of result.value) {
        detected.push({ ...game, launcher });
      }
    } else {
      errors.push({
        launcher,
        message:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason ?? "Unknown error"),
      });
    }
  });

  const matched = matchToCatalog(detected);
  const durationMs = Math.round(performance.now() - started);

  return { detected: matched, errors, durationMs, pathsRead };
}
