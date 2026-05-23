import { Gamepad2, Download, Star } from "lucide-react";
import { useControllerLayouts } from "@/hooks/use-controller-layouts";
import { compactNumber } from "@/lib/utils";
import type { GameId } from "@/lib/types";

interface Props {
  gameId?: GameId;
  gameName?: string;
}

export function ControllerProfiles({ gameId = "cyber-strike", gameName = "Cyber Strike" }: Props) {
  const { data: profiles = [], isLoading } = useControllerLayouts(gameId);

  return (
    <div className="rounded-xl border border-separator bg-card p-6 mt-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-2"><Gamepad2 className="h-5 w-5 text-indigo-400" /> Community Controller Profiles</h3>
      <p className="text-[13px] text-muted/80 mb-6">Download community-created controller mapping layouts for your games with one click.</p>

      <div className="bg-input rounded-xl border border-separator/50 overflow-hidden">
        <div className="p-3 border-b border-separator flex items-center justify-between bg-card-active/50">
          <span className="text-[12px] font-bold text-foreground">Top Profiles for: <span className="text-indigo-400">{gameName}</span></span>
        </div>
        {isLoading ? (
          <div className="p-4 text-[12px] text-muted">Loading profiles…</div>
        ) : profiles.length === 0 ? (
          <div className="p-4 text-[12px] text-muted">No community profiles for this game yet.</div>
        ) : (
          <div className="divide-y divide-separator/50">
            {profiles.map((profile) => (
              <div key={profile.id} className="p-3 flex items-center justify-between hover:bg-card-hover transition-colors group">
                <div>
                  <p className="text-[13px] font-bold text-foreground">{profile.name}</p>
                  <p className="text-[11px] text-muted">by {profile.creator} • {compactNumber(profile.downloads)} downloads</p>
                </div>
                <div className="flex items-center gap-4">
                  {typeof profile.rating === "number" && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-yellow">
                      <Star className="h-3.5 w-3.5 fill-yellow" /> {profile.rating}
                    </div>
                  )}
                  <button className="p-2 rounded-lg bg-card border border-separator hover:bg-acid/10 hover:text-acid hover:border-acid/30 transition-colors opacity-0 group-hover:opacity-100">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
