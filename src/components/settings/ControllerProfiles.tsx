import { Gamepad2, Download, Star } from "lucide-react";

export function ControllerProfiles() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6 mt-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-2"><Gamepad2 className="h-5 w-5 text-indigo-400" /> Community Controller Profiles</h3>
      <p className="text-[13px] text-muted/80 mb-6">Download community-created controller mapping layouts for your games with one click.</p>
      
      <div className="bg-input rounded-xl border border-separator/50 overflow-hidden">
        <div className="p-3 border-b border-separator flex items-center justify-between bg-card-active/50">
          <span className="text-[12px] font-bold text-foreground">Top Profiles for: <span className="text-indigo-400">Cyber Strike</span></span>
        </div>
        <div className="divide-y divide-separator/50">
          {[
            { name: "Competitive FPS Layout (Scuf/Elite)", author: "ProSnipe", dl: "45.2k", rating: 4.9 },
            { name: "Chill Story Mode", author: "CasualGamer", dl: "12.1k", rating: 4.5 },
            { name: "Bumper Jumper Tactical", author: "HaloVet", dl: "8.4k", rating: 4.8 },
          ].map((profile, i) => (
            <div key={i} className="p-3 flex items-center justify-between hover:bg-card-hover transition-colors group">
              <div>
                <p className="text-[13px] font-bold text-foreground">{profile.name}</p>
                <p className="text-[11px] text-muted">by {profile.author} • {profile.dl} downloads</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-[11px] font-bold text-yellow">
                  <Star className="h-3.5 w-3.5 fill-yellow" /> {profile.rating}
                </div>
                <button className="p-2 rounded-lg bg-card border border-separator hover:bg-acid/10 hover:text-acid hover:border-acid/30 transition-colors opacity-0 group-hover:opacity-100">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
