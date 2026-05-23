import { ArrowRight, Bug, Loader2 } from "lucide-react";
import { useAIAction } from "@/hooks/use-ai";
import type { BugTriagePayload } from "@/lib/ai/payload-types";

interface Props {
  gameName?: string;
  buildVersion?: string;
  crashDumps?: { signature: string; occurrences: number; sampleStack: string }[];
}

const DEMO_DUMPS = [
  {
    signature: "TextureManager::LoadZone@0x4f12",
    occurrences: 4200,
    sampleStack:
      "at TextureManager::LoadZone (rendering.cpp:1247)\nat ZoneLoader::OnTransition (loader.cpp:88)\nat GameLoop::Tick (main.cpp:412)",
  },
  {
    signature: "Net::PacketHandler::Decode@0x2af8",
    occurrences: 820,
    sampleStack:
      "at Net::PacketHandler::Decode (net.cpp:512)\nat MatchClient::OnRecv (match.cpp:144)",
  },
];

const PRIORITY_STYLES: Record<
  "critical" | "high" | "medium" | "low",
  { bg: string; text: string; border: string }
> = {
  critical: { bg: "bg-red/10", text: "text-red", border: "border-red/20" },
  high: { bg: "bg-red/5", text: "text-red", border: "border-red/20" },
  medium: { bg: "bg-amber-500/5", text: "text-amber-500", border: "border-amber-500/20" },
  low: { bg: "bg-card-active", text: "text-muted", border: "border-separator" },
};

export function AIBugTriage({
  gameName = "Sample Title",
  buildVersion = "1.2.3",
  crashDumps = DEMO_DUMPS,
}: Props) {
  const mutation = useAIAction<"bug-triage", BugTriagePayload>("bug-triage");
  const clusters = mutation.data?.clusters ?? [
    {
      rank: 1,
      title: "Memory Leak in Rendering Pipeline",
      affectedUsers: 4200,
      priority: "high" as const,
      rootCauseHypothesis:
        "92% of these crashes occur when transitioning from 'Level_04' to 'Level_05' on machines with less than 16GB RAM. The issue appears to stem from un-garbage-collected textures in `TextureManager::LoadZone()`.",
      suggestedFix: "Investigate texture release ordering.",
    },
  ];

  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[16px] font-bold flex items-center gap-2">
          <Bug className="h-5 w-5 text-red" /> AI Bug Triage System
        </h3>
        <button
          onClick={() => mutation.mutate({ gameName, buildVersion, crashDumps })}
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-separator bg-card-active px-3 py-1.5 text-[12px] font-medium hover:bg-card-hover disabled:opacity-50"
        >
          {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {mutation.isPending ? "Triaging…" : mutation.data ? "Refresh" : "Run AI"}
        </button>
      </div>
      <p className="text-[13px] text-muted/80 mb-6">
        Aggregates thousands of automated crash dumps using NLP to find the root cause.
      </p>

      <div className="space-y-3">
        {clusters.map((c) => {
          const styles = PRIORITY_STYLES[c.priority];
          return (
            <div
              key={c.rank}
              className={`${styles.bg} border ${styles.border} rounded-xl p-4`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`bg-red/10 ${styles.text} px-3 py-1 rounded-md text-[14px] font-black`}
                >
                  #{c.rank}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-foreground">{c.title}</h4>
                  <p className="text-[11px] text-muted mt-1 mb-3">
                    Affecting ~{c.affectedUsers.toLocaleString()} users · {c.priority} priority
                  </p>

                  <div className="bg-card rounded p-3 border border-red/10">
                    <p className="text-[10px] uppercase font-bold text-red/80 mb-1">
                      AI Root Cause:
                    </p>
                    <p className="text-[11px] text-foreground/80 leading-relaxed">
                      {c.rootCauseHypothesis}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-red/80 mt-2 mb-1">
                      Suggested Fix:
                    </p>
                    <p className="text-[11px] text-foreground/80 leading-relaxed">
                      {c.suggestedFix}
                    </p>
                  </div>

                  <button className="mt-3 text-[11px] font-bold text-red bg-red/10 hover:bg-red/20 border border-red/20 px-3 py-1.5 rounded transition-colors flex items-center gap-1">
                    Create Jira Ticket <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {mutation.error && (
        <p className="mt-2 text-[11px] text-red">{mutation.error.message}</p>
      )}
    </div>
  );
}
