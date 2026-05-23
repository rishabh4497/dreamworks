import { Users, Lock, Gamepad2, Shield } from "lucide-react";

export function FamilyTimeProfiles() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-indigo-400" /> Family Time Profiles
          </h3>
          <p className="text-[13px] text-muted/80">Curated, PIN-locked sub-profiles with restricted access to your library.</p>
        </div>
        <button className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg text-[12px] font-bold hover:bg-indigo-500/20 transition-colors">
          Add Profile
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-input rounded-xl border border-separator p-4 relative overflow-hidden group cursor-pointer hover:border-indigo-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <img loading="lazy" decoding="async" src="https://api.dicebear.com/7.x/bottts/svg?seed=Timmy" alt="Timmy" className="h-10 w-10 rounded-full bg-card border border-separator" />
            <div>
              <p className="text-[14px] font-bold text-foreground">Timmy's Account</p>
              <p className="text-[11px] text-muted flex items-center gap-1"><Shield className="h-3 w-3" /> E for Everyone</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-separator/50 pt-3 text-[11px] text-muted/80 font-medium">
            <span>12 Games Allowed</span>
            <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-indigo-400" /> Locked</span>
          </div>
        </div>

        <div className="bg-card-active border-2 border-dashed border-separator rounded-xl p-4 flex flex-col items-center justify-center text-muted hover:text-foreground hover:border-separator/80 transition-colors cursor-pointer">
          <Gamepad2 className="h-6 w-6 mb-2" />
          <p className="text-[12px] font-bold">Create Guest Profile</p>
        </div>
      </div>
    </div>
  );
}
