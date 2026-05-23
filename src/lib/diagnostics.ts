import type {
  CommandResult,
  FpsBreakdown,
  FpsTier,
  HardwareSnapshot,
  LauncherScanReport,
  ResourceMonitorSample,
  SystemRequirementScore,
} from "./types";
import { invokeDesktop, listenEvent, type UnlistenFn } from "./platform";

// ── Rust command wrappers ──────────────────────────────────────────────────

function unwrap<T>(res: CommandResult<T> | null): T | null {
  if (!res) return null;
  if (!res.ok) return null;
  return res.data ?? null;
}

export async function runHardwareSnapshot(): Promise<HardwareSnapshot | null> {
  const res = await invokeDesktop<CommandResult<HardwareSnapshot>>(
    "run_hardware_snapshot",
  );
  return unwrap(res);
}

export async function startResourceMonitor(): Promise<boolean> {
  const res = await invokeDesktop<CommandResult<null>>("start_resource_monitor");
  return Boolean(res?.ok);
}

export async function stopResourceMonitor(): Promise<void> {
  await invokeDesktop<CommandResult<null>>("stop_resource_monitor");
}

export async function onResourceSample(
  cb: (sample: ResourceMonitorSample) => void,
): Promise<UnlistenFn> {
  return listenEvent<ResourceMonitorSample>("resource_monitor:sample", cb);
}

export async function scanLaunchersReport(
  consentGranted: boolean,
): Promise<LauncherScanReport | null> {
  const res = await invokeDesktop<CommandResult<LauncherScanReport>>(
    "scan_launchers_report",
    { request: { consentGranted } },
  );
  return unwrap(res);
}

// ── FPS tier estimate (pure TS, no IPC) ────────────────────────────────────

/**
 * Coarse scoring from a HardwareSnapshot for FPS estimation. Falls back to
 * a synthetic CPU score (cores × base frequency) when no lookup table entry
 * matches the brand string. Replace with a Passmark-derived JSON table once
 * one is bundled; this gets us a plausible v1.
 */
function deriveUserScore(snapshot: HardwareSnapshot): SystemRequirementScore {
  const cpuScore = Math.max(
    1,
    snapshot.cpu.physicalCores * Math.max(1, snapshot.cpu.baseFrequencyMhz) / 1000,
  );
  // Without a GPU brand lookup the best we can do is map vendor to a
  // ballpark integrated/discrete tier.
  let gpuScore = 1;
  const vendor = snapshot.gpus[0]?.vendor.toLowerCase() ?? "";
  if (vendor.includes("nvidia")) gpuScore = 12;
  else if (vendor.includes("amd")) gpuScore = 9;
  else if (vendor.includes("apple")) gpuScore = 8;
  else if (vendor.includes("intel")) gpuScore = 3;
  return {
    cpuScore,
    gpuScore,
    ramGb: snapshot.memory.totalBytes / 1_073_741_824,
  };
}

function tierFromRatio(min: number): FpsTier {
  if (min < 0.5) return "unplayable";
  if (min < 0.8) return "low";
  if (min < 1.2) return "medium";
  if (min < 1.8) return "high";
  return "ultra";
}

export function estimateFpsTier(
  snapshot: HardwareSnapshot,
  recommended: SystemRequirementScore,
): FpsBreakdown {
  const user = deriveUserScore(snapshot);
  const cpuRatio = recommended.cpuScore > 0 ? user.cpuScore / recommended.cpuScore : 1;
  const gpuRatio = recommended.gpuScore > 0 ? user.gpuScore / recommended.gpuScore : 1;
  const ramRatio = recommended.ramGb > 0 ? user.ramGb / recommended.ramGb : 1;
  const min = Math.min(cpuRatio, gpuRatio, ramRatio);
  const bottleneck: FpsBreakdown["bottleneck"] =
    min === cpuRatio ? "cpu" : min === gpuRatio ? "gpu" : "ram";
  return {
    tier: tierFromRatio(min),
    cpuRatio,
    gpuRatio,
    ramRatio,
    bottleneck,
  };
}
