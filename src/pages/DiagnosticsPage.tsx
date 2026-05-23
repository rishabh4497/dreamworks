import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Network,
  Pause,
  Play,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn, formatBytes } from "@/lib/utils";
import {
  estimateFpsTier,
  onResourceSample,
  runHardwareSnapshot,
  scanLaunchersReport,
  startResourceMonitor,
  stopResourceMonitor,
} from "@/lib/diagnostics";
import { useAuthStore } from "@/stores/auth-store";
import { useGames } from "@/hooks/use-games";
import { useLibraryStore } from "@/stores/library-store";
import { saveHardwareSnapshot } from "@/lib/api/user-hardware";
import type {
  FpsBreakdown,
  HardwareSnapshot,
  LauncherScanReport,
  ResourceMonitorSample,
} from "@/lib/types";

const CHART_WINDOW = 60; // seconds of history shown in the monitor chart

interface CpuPoint {
  t: number;
  cpu: number;
  memPct: number;
}

export function DiagnosticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6"
    >
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
          System Diagnostics
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Live hardware snapshot, resource monitor, FPS estimates, and launcher
          scan — all queried natively from the desktop runtime.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <HardwareSnapshotCard />
        <ResourceMonitorCard />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <FpsEstimateCard />
        <LauncherScanCard />
      </div>
    </motion.div>
  );
}

// ── Hardware snapshot ──────────────────────────────────────────────────────

function HardwareSnapshotCard() {
  const [snapshot, setSnapshot] = useState<HardwareSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profile = useAuthStore((s) => s.profile);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const result = await runHardwareSnapshot();
    if (!result) {
      setError("Snapshot unavailable — desktop runtime not detected.");
      setLoading(false);
      return;
    }
    setSnapshot(result);
    setLoading(false);
    // Best-effort cache to Firestore so the same hardware shows on other
    // surfaces without re-running the snapshot every time.
    if (profile?.uid) {
      void saveHardwareSnapshot(profile.uid, result).catch(() => {});
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="rounded-xl border border-separator bg-card p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-cyan" />
          <h2 className="text-[14px] font-semibold text-foreground">
            Hardware snapshot
          </h2>
        </div>
        <button
          onClick={() => void refresh()}
          className="flex items-center gap-1.5 rounded-md bg-input px-2.5 py-1 text-[11px] font-semibold text-foreground/80 hover:bg-card-hover transition-colors"
          disabled={loading}
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </header>

      {error && (
        <p className="text-[12px] text-red-400">{error}</p>
      )}

      {snapshot && (
        <div className="grid sm:grid-cols-2 gap-3">
          <SnapshotTile
            icon={<Cpu className="h-3.5 w-3.5" />}
            title="CPU"
            primary={snapshot.cpu.brand || "Unknown"}
            secondary={`${snapshot.cpu.physicalCores}P / ${snapshot.cpu.logicalCores}L cores · ${snapshot.cpu.baseFrequencyMhz} MHz`}
          />
          <SnapshotTile
            icon={<MemoryStick className="h-3.5 w-3.5" />}
            title="Memory"
            primary={`${formatBytes(snapshot.memory.totalBytes)} total`}
            secondary={`${formatBytes(snapshot.memory.usedBytes)} in use · swap ${formatBytes(snapshot.memory.swapUsedBytes)} of ${formatBytes(snapshot.memory.swapTotalBytes)}`}
          />
          <SnapshotTile
            icon={<Zap className="h-3.5 w-3.5" />}
            title="GPU"
            primary={snapshot.gpus[0]?.model || "Unknown"}
            secondary={`${snapshot.gpus[0]?.vendor || "—"} · ${snapshot.gpus[0]?.backend ?? "n/a"}`}
          />
          <SnapshotTile
            icon={<Monitor className="h-3.5 w-3.5" />}
            title="Operating system"
            primary={`${snapshot.os.name} ${snapshot.os.version}`}
            secondary={`${snapshot.os.architecture} · ${snapshot.os.hostname}`}
          />
          <SnapshotTile
            icon={<HardDrive className="h-3.5 w-3.5" />}
            title="Disks"
            primary={`${snapshot.disks.length} mount${snapshot.disks.length === 1 ? "" : "s"}`}
            secondary={snapshot.disks
              .slice(0, 3)
              .map(
                (d) =>
                  `${d.mountPoint} · ${formatBytes(d.availableBytes)} free / ${formatBytes(d.totalBytes)}`,
              )
              .join(" · ")}
          />
          <SnapshotTile
            icon={<Network className="h-3.5 w-3.5" />}
            title="Network"
            primary={`${snapshot.network.filter((n) => !n.isLoopback).length} adapters`}
            secondary={snapshot.network
              .filter((n) => !n.isLoopback)
              .slice(0, 2)
              .map((n) => `${n.interfaceName} (${n.macAddress || "no mac"})`)
              .join(" · ")}
          />
        </div>
      )}

      {snapshot && (
        <p className="mt-3 text-[10px] uppercase tracking-wider text-muted/50">
          Captured {new Date(Number(snapshot.capturedAt)).toLocaleString()} · schema v
          {snapshot.schemaVersion}
        </p>
      )}
    </section>
  );
}

function SnapshotTile({
  icon,
  title,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  title: string;
  primary: string;
  secondary?: string;
}) {
  return (
    <div className="rounded-lg border border-separator/40 bg-input p-3">
      <div className="flex items-center gap-1.5 text-muted">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-wider">{title}</p>
      </div>
      <p className="mt-1 text-[13px] font-semibold text-foreground truncate">
        {primary}
      </p>
      {secondary && (
        <p className="text-[11px] text-muted/70 truncate">{secondary}</p>
      )}
    </div>
  );
}

// ── Live resource monitor ──────────────────────────────────────────────────

function ResourceMonitorCard() {
  const [running, setRunning] = useState(false);
  const [sample, setSample] = useState<ResourceMonitorSample | null>(null);
  const [history, setHistory] = useState<CpuPoint[]>([]);
  const unlistenRef = useRef<(() => void) | null>(null);
  const startedAtRef = useRef<number>(0);

  const handleStart = async () => {
    if (running) return;
    const ok = await startResourceMonitor();
    if (!ok) return;
    startedAtRef.current = Date.now();
    setHistory([]);
    setRunning(true);
    unlistenRef.current = await onResourceSample((s) => {
      setSample(s);
      setHistory((prev) => {
        const t = Math.round((Date.now() - startedAtRef.current) / 1000);
        const memPct = s.memoryTotalBytes
          ? (s.memoryUsedBytes / s.memoryTotalBytes) * 100
          : 0;
        const next = [...prev, { t, cpu: s.cpuGlobalPercent, memPct }];
        return next.slice(-CHART_WINDOW);
      });
    });
  };

  const handleStop = async () => {
    if (!running) return;
    await stopResourceMonitor();
    if (unlistenRef.current) {
      unlistenRef.current();
      unlistenRef.current = null;
    }
    setRunning(false);
  };

  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
      void stopResourceMonitor();
    };
  }, []);

  return (
    <section className="rounded-xl border border-separator bg-card p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-acid" />
          <h2 className="text-[14px] font-semibold text-foreground">
            Live resource monitor
          </h2>
        </div>
        {running ? (
          <button
            onClick={() => void handleStop()}
            className="flex items-center gap-1.5 rounded-md bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/25 transition-colors"
          >
            <Pause className="h-3 w-3" /> Stop
          </button>
        ) : (
          <button
            onClick={() => void handleStart()}
            className="flex items-center gap-1.5 rounded-md bg-acid/15 px-2.5 py-1 text-[11px] font-semibold text-acid hover:bg-acid/25 transition-colors"
          >
            <Play className="h-3 w-3" /> Start
          </button>
        )}
      </header>

      {!sample && !running && (
        <p className="text-[12px] text-muted">
          Press <span className="font-semibold text-foreground">Start</span> to
          stream CPU, memory, and per-process usage at 1 Hz.
        </p>
      )}

      {(sample || running) && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-separator/40 bg-input p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Global CPU
              </p>
              <p className="text-[20px] font-mono font-bold text-acid">
                {sample ? sample.cpuGlobalPercent.toFixed(1) : "—"}%
              </p>
            </div>
            <div className="rounded-lg border border-separator/40 bg-input p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Memory in use
              </p>
              <p className="text-[20px] font-mono font-bold text-cyan">
                {sample
                  ? `${((sample.memoryUsedBytes / sample.memoryTotalBytes) * 100).toFixed(0)}%`
                  : "—"}
              </p>
            </div>
          </div>

          <div className="h-32 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-acid)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--color-acid)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fontSize: 9, fill: "var(--color-muted)" }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: "var(--color-muted)" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-separator)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  labelFormatter={(t) => `t+${t}s`}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="var(--color-acid)"
                  strokeWidth={1.5}
                  fill="url(#cpuGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
              Top processes
            </p>
            <div className="space-y-1">
              {(sample?.topProcesses ?? []).slice(0, 8).map((p) => (
                <div
                  key={p.pid}
                  className="flex items-center justify-between text-[12px]"
                >
                  <span className="truncate text-foreground/80">{p.name || "(unknown)"}</span>
                  <span className="font-mono text-muted">
                    {p.cpuPercent.toFixed(1)}% · {formatBytes(p.memoryBytes)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

// ── FPS estimate ───────────────────────────────────────────────────────────

function FpsEstimateCard() {
  const { data: games = [] } = useGames();
  const library = useLibraryStore((s) => s.entries);
  const [snapshot, setSnapshot] = useState<HardwareSnapshot | null>(null);

  useEffect(() => {
    void runHardwareSnapshot().then(setSnapshot);
  }, []);

  const installedGames = useMemo(() => {
    const installedIds = new Set(library.filter((e) => e.installed).map((e) => e.gameId));
    return games.filter((g) => installedIds.has(g.id)).slice(0, 8);
  }, [games, library]);

  return (
    <section className="rounded-xl border border-separator bg-card p-5">
      <header className="flex items-center gap-2 mb-4">
        <Zap className="h-4 w-4 text-yellow-400" />
        <h2 className="text-[14px] font-semibold text-foreground">
          FPS tier estimate
        </h2>
      </header>

      {!snapshot && (
        <p className="text-[12px] text-muted">
          Loading hardware snapshot…
        </p>
      )}

      {snapshot && installedGames.length === 0 && (
        <p className="text-[12px] text-muted">
          Install a game in your library to see a per-title tier estimate.
        </p>
      )}

      {snapshot && installedGames.length > 0 && (
        <div className="space-y-2">
          {installedGames.map((game) => {
            // Coarse recommended-requirement defaults until per-game specs land
            // on the catalog doc. Tweak as the lookup table fills out.
            const tags = game.tags ?? [];
            const isAaa =
              tags.includes("rpg") || tags.includes("action") || tags.includes("souls-like");
            const isIndie = tags.includes("indie") || tags.includes("pixel-graphics");
            const rec = isAaa
              ? { cpuScore: 16, gpuScore: 10, ramGb: 16 }
              : isIndie
                ? { cpuScore: 4, gpuScore: 3, ramGb: 4 }
                : { cpuScore: 8, gpuScore: 6, ramGb: 8 };
            const breakdown: FpsBreakdown = estimateFpsTier(snapshot, rec);
            return (
              <FpsRow
                key={game.id}
                title={game.name}
                cover={game.capsuleUrl || game.coverUrl}
                breakdown={breakdown}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

const TIER_BADGE: Record<FpsBreakdown["tier"], { label: string; cls: string }> = {
  unplayable: { label: "Unplayable", cls: "bg-red-500/15 text-red-400" },
  low: { label: "Low", cls: "bg-orange-500/15 text-orange-400" },
  medium: { label: "Medium", cls: "bg-yellow-500/15 text-yellow-400" },
  high: { label: "High", cls: "bg-cyan/15 text-cyan" },
  ultra: { label: "Ultra", cls: "bg-acid/15 text-acid" },
};

function FpsRow({
  title,
  cover,
  breakdown,
}: {
  title: string;
  cover?: string;
  breakdown: FpsBreakdown;
}) {
  const badge = TIER_BADGE[breakdown.tier];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-separator/40 bg-input p-2.5">
      {cover && (
        <img
          src={cover}
          alt=""
          className="h-9 w-9 rounded object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground truncate">{title}</p>
        <p className="text-[10px] text-muted/70">
          CPU {breakdown.cpuRatio.toFixed(2)}× · GPU {breakdown.gpuRatio.toFixed(2)}× · RAM{" "}
          {breakdown.ramRatio.toFixed(2)}× · bottleneck {breakdown.bottleneck.toUpperCase()}
        </p>
      </div>
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
          badge.cls,
        )}
      >
        {badge.label}
      </span>
    </div>
  );
}

// ── Launcher scan report ───────────────────────────────────────────────────

function LauncherScanCard() {
  const [report, setReport] = useState<LauncherScanReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    const result = await scanLaunchersReport(true);
    if (!result) {
      setError(
        "Scan unavailable — launcher scan requires the desktop runtime and local-file consent.",
      );
      setLoading(false);
      return;
    }
    setReport(result);
    setLoading(false);
  };

  return (
    <section className="rounded-xl border border-separator bg-card p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-cyan" />
          <h2 className="text-[14px] font-semibold text-foreground">
            Launcher scan report
          </h2>
        </div>
        <button
          onClick={() => void handleScan()}
          className="flex items-center gap-1.5 rounded-md bg-input px-2.5 py-1 text-[11px] font-semibold text-foreground/80 hover:bg-card-hover transition-colors"
          disabled={loading}
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          {loading ? "Scanning" : report ? "Re-scan" : "Run scan"}
        </button>
      </header>

      {error && <p className="text-[12px] text-red-400">{error}</p>}

      {!report && !loading && !error && (
        <p className="text-[12px] text-muted">
          Probe local Steam + Epic libraries and summarize install size, source
          breakdown, and orphaned installs.
        </p>
      )}

      {report && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <ScanStat label="Games found" value={String(report.gamesFound)} />
            <ScanStat label="Steam" value={String(report.byLauncher.steam)} />
            <ScanStat label="Epic" value={String(report.byLauncher.epic)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ScanStat label="Install size" value={formatBytes(report.totalInstallBytes)} />
            <ScanStat
              label="Scan duration"
              value={`${report.scanDurationMs.toLocaleString()} ms`}
            />
          </div>
          {report.orphanedInstalls.length > 0 && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
              <p className="text-[11px] font-semibold text-yellow-400 mb-1.5">
                {report.orphanedInstalls.length} orphan{report.orphanedInstalls.length === 1 ? "" : "s"} detected
              </p>
              <ul className="space-y-0.5 max-h-32 overflow-y-auto">
                {report.orphanedInstalls.slice(0, 8).map((o) => (
                  <li key={o.path} className="text-[11px] text-muted truncate">
                    <span className="text-yellow-400/80 uppercase mr-1">
                      {o.reason.replace("_", " ")}:
                    </span>
                    {o.path}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.pathsRead.length > 0 && (
            <details className="text-[10px] text-muted/60">
              <summary className="cursor-pointer hover:text-foreground/80">
                Paths read ({report.pathsRead.length})
              </summary>
              <ul className="mt-1.5 space-y-0.5 max-h-24 overflow-y-auto">
                {report.pathsRead.slice(0, 30).map((p) => (
                  <li key={p} className="truncate">{p}</li>
                ))}
              </ul>
            </details>
          )}
          <p className="text-[10px] uppercase tracking-wider text-muted/50">
            Generated {new Date(Number(report.generatedAt)).toLocaleString()}
          </p>
        </div>
      )}
    </section>
  );
}

function ScanStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-separator/40 bg-input p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="text-[14px] font-mono font-bold text-foreground">{value}</p>
    </div>
  );
}
