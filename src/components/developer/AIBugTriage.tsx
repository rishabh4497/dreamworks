import { Bug, ArrowRight } from "lucide-react";

export function AIBugTriage() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
        <Bug className="h-5 w-5 text-red" /> AI Bug Triage System
      </h3>
      <p className="text-[13px] text-muted/80 mb-6">Aggregates thousands of automated crash dumps using NLP to find the root cause.</p>

      <div className="bg-red/5 border border-red/20 rounded-xl p-4">
        <div className="flex items-start gap-4">
          <div className="bg-red/10 text-red px-3 py-1 rounded-md text-[14px] font-black">
            #1
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-foreground">Memory Leak in Rendering Pipeline</h4>
            <p className="text-[11px] text-muted mt-1 mb-3">Affecting ~4,200 users • High Priority</p>
            
            <div className="bg-card rounded p-3 border border-red/10">
              <p className="text-[10px] uppercase font-bold text-red/80 mb-1">AI Root Cause Analysis:</p>
              <p className="text-[11px] text-foreground/80 leading-relaxed">
                92% of these crashes occur when transitioning from 'Level_04' to 'Level_05' on machines with less than 16GB RAM. The issue appears to stem from un-garbage-collected textures in `TextureManager::LoadZone()`.
              </p>
            </div>
            
            <button className="mt-3 text-[11px] font-bold text-red bg-red/10 hover:bg-red/20 border border-red/20 px-3 py-1.5 rounded transition-colors flex items-center gap-1">
              Create Jira Ticket <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
