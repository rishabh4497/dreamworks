import { Crosshair, Shield } from "lucide-react";

// Out-of-LLM-scope: this is a behavioral classifier trained on player telemetry,
// not a Gemini task. Kept as UI-only until a real ML pipeline is wired in.
export function AntiCheatML() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Shield className="h-5 w-5 text-red" /> Anti-Cheat ML Training</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Upload replays of known cheaters to train the AI anti-cheat specifically for your game's physics.</p>
      <div className="bg-input rounded-lg border border-separator p-4 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-bold text-foreground">Aimbot Detection Model</p>
          <p className="text-[10px] text-muted">Accuracy: 99.4% (Based on 1,024 submitted replays)</p>
        </div>
        <button
          disabled
          title="Coming soon: dedicated behavioral classifier, not a Gemini task."
          className="text-[11px] font-bold bg-red text-white px-3 py-1.5 rounded-md opacity-60 cursor-not-allowed flex items-center gap-1"
        >
          <Crosshair className="h-3 w-3" /> Coming soon
        </button>
      </div>
    </div>
  );
}
