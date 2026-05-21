import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useGames } from "@/hooks/use-games";
import { usePlatform } from "@/hooks/use-platform";
import { useScanner } from "@/hooks/use-scanner";
import { useLibraryStore } from "@/stores/library-store";
import { toast } from "@/stores/toast-store";
import { getOS, homeDirSafe } from "@/lib/platform";
import { SCANNER_LAUNCHERS } from "@/lib/scanner";
import type { DetectedGame, ScanResult } from "@/lib/scanner";
import type { LauncherSource } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AutoScanModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "consent" | "scanning" | "results";

const LAUNCHER_LABEL: Record<LauncherSource, string> = {
  dreamworks: "Dreamworks",
  manual: "Manual",
  steam: "Steam",
  epic: "Epic Games",
  gog: "GOG Galaxy",
  ubisoft: "Ubisoft Connect",
  "ea-app": "EA App",
  "xbox-pc": "Xbox PC",
  rockstar: "Rockstar Launcher",
  battlenet: "Battle.net",
  amazon: "Amazon Games",
};

// Launcher orders supported by the v1 scanner. The rest render as
// "Detection coming soon" rows.
const ACTIVE_LAUNCHERS = new Set<LauncherSource>(["steam", "epic"]);

export function AutoScanModal({ open, onClose }: AutoScanModalProps) {
  const [step, setStep] = useState<Step>("consent");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [paths, setPaths] = useState<string[]>([]);

  const scanner = useScanner();
  const { isDesktop } = usePlatform();
  const { data: games } = useGames();
  const entries = useLibraryStore((s) => s.entries);
  const ownedIds = useMemo(
    () => new Set(entries.map((e) => e.gameId)),
    [entries],
  );

  // Resolve the OS-specific manifest paths once the modal opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const home = await homeDirSafe();
      const os = getOS();
      const list: string[] = [];
      if (os === "mac") {
        list.push(`${home}/Library/Application Support/Steam/config/libraryfolders.vdf`);
        list.push(`${home}/Library/Application Support/Steam/steamapps/appmanifest_*.acf`);
        list.push("/Users/Shared/Epic/EpicGamesLauncher/Data/Manifests/*.item");
      } else if (os === "linux") {
        list.push(`${home}/.steam/steam/config/libraryfolders.vdf`);
        list.push(`${home}/.local/share/Steam/config/libraryfolders.vdf`);
      } else if (os === "windows") {
        list.push("C:/Program Files (x86)/Steam/config/libraryfolders.vdf");
        list.push("C:/Program Files (x86)/Steam/steamapps/appmanifest_*.acf");
        list.push("C:/ProgramData/Epic/EpicGamesLauncher/Data/Manifests/*.item");
      } else {
        list.push("(no manifest paths on this platform)");
      }
      if (!cancelled) setPaths(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Reset whenever the modal closes.
  const scannerReset = scanner.reset;
  useEffect(() => {
    if (open) return;
    setStep("consent");
    setSelected(new Set());
    scannerReset();
  }, [open, scannerReset]);

  // When a scan succeeds, default-check exact/fuzzy matches that aren't
  // already in the library.
  useEffect(() => {
    if (!scanner.data) return;
    const next = new Set<string>();
    for (const d of scanner.data.detected) {
      if (!d.matchedGameId) continue;
      if (ownedIds.has(d.matchedGameId)) continue;
      if (d.matchConfidence === "exact" || d.matchConfidence === "fuzzy") {
        next.add(detectionKey(d));
      }
    }
    setSelected(next);
    setStep("results");
  }, [scanner.data, ownedIds]);

  const startScan = () => {
    if (!isDesktop) {
      toast.error("Scanning is only available in the desktop app");
      return;
    }
    setStep("scanning");
    scanner.mutate();
  };

  const importSelected = () => {
    if (!scanner.data) return;
    const store = useLibraryStore.getState();
    let imported = 0;
    for (const d of scanner.data.detected) {
      if (!selected.has(detectionKey(d))) continue;
      if (!d.matchedGameId) continue;
      if (ownedIds.has(d.matchedGameId)) continue;
      store.addExternal(d.matchedGameId, d.launcher, {
        installed: true,
        sizeBytes: d.sizeBytes ?? 0,
        externalId: d.externalId,
        installPath: d.installPath,
        launchCommand:
          d.launcher === "steam"
            ? `steam://rungameid/${d.externalId}`
            : d.installPath,
      });
      imported += 1;
    }
    if (imported > 0) {
      toast.success(`Imported ${imported} game${imported === 1 ? "" : "s"}`);
    } else {
      toast.info("No games selected for import");
    }
    onClose();
  };

  const grouped = useMemo(
    () => groupByLauncher(scanner.data?.detected ?? []),
    [scanner.data],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Auto-add from launchers"
      maxWidth="max-w-2xl"
    >
      {step === "consent" && (
        <ConsentStep
          paths={paths}
          onCancel={onClose}
          onScan={startScan}
          canScan={isDesktop}
        />
      )}
      {step === "scanning" && <ScanningStep scanner={scanner} />}
      {step === "results" && scanner.data && (
        <ResultsStep
          result={scanner.data}
          grouped={grouped}
          selected={selected}
          setSelected={setSelected}
          ownedIds={ownedIds}
          games={games}
          onCancel={onClose}
          onImport={importSelected}
        />
      )}
    </Modal>
  );
}

function detectionKey(d: DetectedGame): string {
  return `${d.launcher}:${d.externalId}`;
}

function groupByLauncher(detected: DetectedGame[]): Map<LauncherSource, DetectedGame[]> {
  const map = new Map<LauncherSource, DetectedGame[]>();
  for (const d of detected) {
    const arr = map.get(d.launcher) ?? [];
    arr.push(d);
    map.set(d.launcher, arr);
  }
  return map;
}

// ── Consent ─────────────────────────────────────────────────────────────────

interface ConsentStepProps {
  paths: string[];
  onCancel: () => void;
  onScan: () => void;
  canScan: boolean;
}

function ConsentStep({ paths, onCancel, onScan, canScan }: ConsentStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 text-[12px] text-foreground/80">
        <p>
          Dreamworks will read the following launcher manifest files on this
          device to detect your installed games. Nothing leaves your machine.
        </p>
        <ul className="rounded-lg border border-separator bg-card p-3 text-[11px] text-muted/80 font-mono space-y-1 max-h-40 overflow-auto">
          {paths.length === 0 ? (
            <li>(resolving…)</li>
          ) : (
            paths.map((p) => <li key={p}>{p}</li>)
          )}
        </ul>
        <p className="text-[11px] text-muted/60">
          No executables are launched. No telemetry is sent. Scans for Steam
          and Epic are supported today; other launchers will appear as
          &ldquo;detection coming soon&rdquo;.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={onScan} disabled={!canScan}>
          Scan now
        </Button>
      </div>
    </div>
  );
}

// ── Scanning ────────────────────────────────────────────────────────────────

interface ScannerLike {
  data: ScanResult | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
}

function ScanningStep({ scanner }: { scanner: ScannerLike }) {
  // While `useMutation` is pending we don't yet have per-launcher progress
  // (scanners run in `Promise.allSettled` and resolve at once). We render a
  // spinner per launcher and resolve them all when the mutation settles.
  const data = scanner.data;
  return (
    <div className="space-y-3">
      <p className="text-[12px] text-muted/70">Scanning installed launchers…</p>
      <ul className="space-y-1">
        {SCANNER_LAUNCHERS.map((launcher) => {
          const count = data?.detected.filter((d) => d.launcher === launcher).length ?? 0;
          const error = data?.errors.find((e) => e.launcher === launcher);
          const supported = ACTIVE_LAUNCHERS.has(launcher);
          return (
            <li
              key={launcher}
              className="flex items-center justify-between rounded-lg border border-separator bg-card px-3 py-2 text-[12px]"
            >
              <span className="font-semibold text-foreground">
                {LAUNCHER_LABEL[launcher]}
              </span>
              <span className="flex items-center gap-2 text-muted/70">
                {!data && supported && (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    scanning…
                  </>
                )}
                {!data && !supported && <span className="text-muted/50">queued</span>}
                {data && error && (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-red" />
                    error
                  </>
                )}
                {data && !error && supported && (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green" />
                    {count} detected
                  </>
                )}
                {data && !error && !supported && (
                  <span className="text-muted/50">detection coming soon</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Results ─────────────────────────────────────────────────────────────────

interface ResultsStepProps {
  result: ScanResult;
  grouped: Map<LauncherSource, DetectedGame[]>;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  ownedIds: Set<string>;
  games: ReturnType<typeof useGames>["data"];
  onCancel: () => void;
  onImport: () => void;
}

function ResultsStep({
  result,
  grouped,
  selected,
  setSelected,
  ownedIds,
  games,
  onCancel,
  onImport,
}: ResultsStepProps) {
  const totalDetected = result.detected.length;
  const importCount = selected.size;

  const toggle = (d: DetectedGame, on: boolean) => {
    const key = detectionKey(d);
    const next = new Set(selected);
    if (on) next.add(key);
    else next.delete(key);
    setSelected(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[12px] text-muted/70">
        <span>
          Detected {totalDetected} title{totalDetected === 1 ? "" : "s"} in {result.durationMs}ms
        </span>
        {result.errors.length > 0 && (
          <span className="text-red">{result.errors.length} launcher error(s)</span>
        )}
      </div>
      {result.pathsRead && result.pathsRead.length > 0 && (
        <details className="rounded-lg border border-separator bg-card px-3 py-2 text-[11px] text-muted/70">
          <summary className="cursor-pointer font-semibold text-foreground/70">
            Scan audit · {result.pathsRead.length} file{result.pathsRead.length === 1 ? "" : "s"} read
          </summary>
          <ul className="mt-2 max-h-24 space-y-1 overflow-auto font-mono text-[10px] text-muted/60">
            {result.pathsRead.map((path) => (
              <li key={path} className="truncate" title={path}>
                {path}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="max-h-[420px] overflow-auto space-y-4 pr-1">
        {totalDetected === 0 && (
          <p className="rounded-lg border border-separator bg-card p-4 text-center text-[12px] text-muted/70">
            No installed games detected. Make sure Steam or Epic is installed
            on this machine and that the games you expect to find are actually
            on disk.
          </p>
        )}

        {[...grouped.entries()].map(([launcher, rows]) => (
          <div key={launcher} className="space-y-2">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted/70">
              {LAUNCHER_LABEL[launcher]} · {rows.length}
            </h3>
            <ul className="space-y-1">
              {rows.map((d) => {
                const game = d.matchedGameId
                  ? games?.find((g) => g.id === d.matchedGameId)
                  : undefined;
                const alreadyOwned = d.matchedGameId
                  ? ownedIds.has(d.matchedGameId)
                  : false;
                const unmatched = d.matchConfidence === "unmatched";
                const disabled = alreadyOwned || unmatched;
                const checked = selected.has(detectionKey(d)) && !disabled;
                return (
                  <li
                    key={detectionKey(d)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-separator bg-card p-2",
                      disabled && "opacity-70",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggle(d, e.target.checked)}
                      disabled={disabled}
                      className="h-4 w-4 accent-acid"
                    />
                    {game ? (
                      <img
                        src={game.capsuleUrl}
                        alt=""
                        className="h-10 w-24 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-24 rounded-md bg-input" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {game?.name ?? d.name}
                      </p>
                      <p className="truncate text-[11px] text-muted/60">
                        {launcherIdLabel(d)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ConfidenceBadge confidence={d.matchConfidence} />
                      {alreadyOwned && (
                        <span className="text-[11px] text-muted/60">Already in library</span>
                      )}
                      {unmatched && !alreadyOwned && (
                        <span className="text-[11px] text-muted/60">Catalog match needed</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <Button variant="ghost" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onImport}
          disabled={importCount === 0}
        >
          Import {importCount} selected
        </Button>
      </div>
    </div>
  );
}

function launcherIdLabel(d: DetectedGame): string {
  if (d.launcher === "steam") return `Steam ID ${d.externalId}`;
  if (d.launcher === "epic") return `Epic App ${d.externalId}`;
  return `${LAUNCHER_LABEL[d.launcher]} · ${d.externalId}`;
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: DetectedGame["matchConfidence"];
}) {
  if (confidence === "exact") {
    return <Badge variant="free">Exact</Badge>;
  }
  if (confidence === "fuzzy") {
    return <Badge variant="soon">Fuzzy</Badge>;
  }
  return <Badge variant="warn">Unmatched</Badge>;
}
