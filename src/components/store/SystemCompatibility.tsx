import { CheckCircle2, Cpu, Monitor, ShieldAlert, Sparkles, Triangle } from "lucide-react";
import { useProfileStore } from "@/stores/profile-store";
import { type GameDetail } from "@/lib/types";

type Verdict = "exceeds" | "meets" | "below" | "unknown";

const VERDICT_STYLES: Record<Verdict, { label: string; tone: string }> = {
  exceeds: { label: "Exceeds", tone: "text-positive" },
  meets: { label: "Meets", tone: "text-acid" },
  below: { label: "Below", tone: "text-red" },
  unknown: { label: "Unknown", tone: "text-muted" },
};

const HEADER_STYLES: Record<Verdict, { label: string; tone: string; chipBg: string }> = {
  exceeds: {
    label: "Optimal Performance",
    tone: "text-positive",
    chipBg: "bg-positive/10",
  },
  meets: {
    label: "Playable",
    tone: "text-acid",
    chipBg: "bg-acid/10",
  },
  below: {
    label: "Below Minimum",
    tone: "text-red",
    chipBg: "bg-red/10",
  },
  unknown: {
    label: "Specs Unverified",
    tone: "text-muted",
    chipBg: "bg-card-active",
  },
};

export function SystemCompatibility({ game }: { game: GameDetail }) {
  const systemRig = useProfileStore((s) => s.systemRig);

  const cpuRequired =
    game.systemRequirements?.windows?.cpu ||
    game.systemRequirements?.mac?.cpu ||
    game.systemRequirements?.linux?.cpu ||
    "";
  const gpuRequired =
    game.systemRequirements?.windows?.gpu ||
    game.systemRequirements?.mac?.gpu ||
    game.systemRequirements?.linux?.gpu ||
    "";

  const cpuVerdict = compareCpu(systemRig.cpu, cpuRequired);
  const gpuVerdict = compareGpu(systemRig.gpu, gpuRequired);
  const overallVerdict = worst(cpuVerdict, gpuVerdict);
  const overall = HEADER_STYLES[overallVerdict];
  const HeaderIcon = overallVerdict === "below" ? Triangle : CheckCircle2;

  return (
    <div className="rounded-xl border border-separator bg-card mt-6 overflow-hidden">
      <div className="bg-gradient-to-r from-acid/20 to-transparent p-4 border-b border-separator/50 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-acid" /> AI System Compatibility
          </h3>
          <p className="text-[11px] text-muted mt-0.5 truncate">
            Comparing your rig against {game.name}'s requirements
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 ${overall.chipBg} ${overall.tone} px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0`}
        >
          <HeaderIcon className="h-3.5 w-3.5" /> {overall.label}
        </div>
      </div>

      <div className="p-4 grid gap-4 sm:grid-cols-2">
        <SpecCell
          icon={<Cpu className="h-3 w-3" />}
          label="Processor"
          value={systemRig.cpu}
          required={cpuRequired || "Unknown"}
          verdict={cpuVerdict}
        />
        <SpecCell
          icon={<Monitor className="h-3 w-3" />}
          label="Graphics"
          value={systemRig.gpu}
          required={gpuRequired || "Unknown"}
          verdict={gpuVerdict}
        />
      </div>

      <div className="bg-card-active p-3 border-t border-separator text-[12px] text-muted/90 flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 text-acid shrink-0 mt-0.5" />
        <p>
          <strong className="text-foreground">AI Verdict:</strong>{" "}
          {renderVerdictSentence(overallVerdict, systemRig.gpu)}
        </p>
      </div>
    </div>
  );
}

function SpecCell({
  icon,
  label,
  value,
  required,
  verdict,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  required: string;
  verdict: Verdict;
}) {
  const v = VERDICT_STYLES[verdict];
  return (
    <div className="bg-input rounded-lg border border-separator p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
          {icon} {label}
        </span>
        <span className={`text-[10px] font-bold ${v.tone}`}>{v.label}</span>
      </div>
      <p className="text-[12px] font-bold text-foreground truncate">{value}</p>
      <p className="text-[10px] text-muted mt-1 truncate opacity-70">
        Req: {required}
      </p>
    </div>
  );
}

// ── Verdict logic ──────────────────────────────────────────────────────────
// The detected specs are a free-text string ("Processor (16-Core)", "AMD
// Radeon RX 7900 XT"), so we can't strictly diff vendor+generation. We use
// keyword heuristics that are good enough to flag clearly-undermatched rigs
// without false-positive blocking the user. Pessimistic: when in doubt,
// return "meets" rather than "exceeds".

function compareCpu(have: string, need: string): Verdict {
  if (!need) return "unknown";
  if (looksUnknown(have)) return "unknown";
  // Anything with 8+ cores is treated as exceeding generic "Core i5"-tier
  // requirements; this is rough but matches the qualitative bar the UI cares
  // about.
  const coreMatch = have.match(/(\d+)-Core/i);
  const cores = coreMatch ? parseInt(coreMatch[1], 10) : 0;
  if (cores >= 8) return "exceeds";
  if (cores >= 4) return "meets";
  return "below";
}

function compareGpu(have: string, need: string): Verdict {
  if (!need) return "unknown";
  if (looksUnknown(have)) return "unknown";

  // Pull a tier hint out of the required string ("GTX 1060", "RTX 2070",
  // "RX 580"). We compare numerics to a coarse cutoff.
  const requiredTier = pickTier(need);
  const haveTier = pickTier(have);

  if (requiredTier === null || haveTier === null) {
    // Fall back to keyword matching for Apple Silicon / integrated GPUs
    if (/integrated|intel hd|uhd graphics|iris/i.test(have) && /rtx|gtx|radeon/i.test(need)) {
      return "below";
    }
    return "meets";
  }
  if (haveTier >= requiredTier + 1000) return "exceeds";
  if (haveTier >= requiredTier) return "meets";
  return "below";
}

function pickTier(s: string): number | null {
  // Find the largest 3-4 digit number in the string. Crude proxy for "tier".
  const matches = s.match(/\d{3,4}/g);
  if (!matches) return null;
  return Math.max(...matches.map((m) => parseInt(m, 10)));
}

function looksUnknown(s: string): boolean {
  return !s || /^unknown/i.test(s) || s === "—";
}

const VERDICT_ORDER: Verdict[] = ["below", "unknown", "meets", "exceeds"];

function worst(a: Verdict, b: Verdict): Verdict {
  return VERDICT_ORDER.indexOf(a) < VERDICT_ORDER.indexOf(b) ? a : b;
}

function renderVerdictSentence(verdict: Verdict, gpu: string): React.ReactNode {
  switch (verdict) {
    case "exceeds":
      return (
        <>
          Your <strong className="text-foreground">{gpu}</strong> exceeds the recommended specs.
          Expect <strong className="text-foreground">high frame rates on Ultra settings</strong>.
        </>
      );
    case "meets":
      return (
        <>
          Your rig <strong className="text-foreground">meets</strong> the recommended specs. Plan
          on <strong className="text-foreground">Medium-High at 1080p</strong>.
        </>
      );
    case "below":
      return (
        <>
          Your GPU appears to <strong className="text-red">fall short</strong> of the recommended
          specs. Try Low settings or a lower resolution.
        </>
      );
    default:
      return (
        <>
          We don't have enough detected hardware data to give a strong verdict. Open the desktop
          app to read native specs.
        </>
      );
  }
}
