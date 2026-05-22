import { Twitch, Youtube, Search } from "lucide-react";
export function InfluencerDiscovery() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Search className="h-5 w-5 text-pink-500" /> Influencer Discovery Engine</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">AI searches Twitch and YouTube for creators who play similar games.</p>
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-input p-3 rounded-lg border border-separator">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#6441a5] flex items-center justify-center text-white"><Twitch className="h-4 w-4" /></div>
            <div>
              <p className="text-[12px] font-bold text-foreground">FPS_God_99</p>
              <p className="text-[10px] text-muted">Averages 12k CCV • Plays Action/Sci-Fi</p>
            </div>
          </div>
          <button className="text-[11px] font-bold bg-pink-500 text-white px-3 py-1.5 rounded-md hover:bg-pink-600 transition-colors">Send Key</button>
        </div>
        <div className="flex items-center justify-between bg-input p-3 rounded-lg border border-separator">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#ff0000] flex items-center justify-center text-white"><Youtube className="h-4 w-4" /></div>
            <div>
              <p className="text-[12px] font-bold text-foreground">CyberReviews</p>
              <p className="text-[10px] text-muted">2.4M Subs • Reviewed similar games</p>
            </div>
          </div>
          <button className="text-[11px] font-bold bg-pink-500 text-white px-3 py-1.5 rounded-md hover:bg-pink-600 transition-colors">Send Key</button>
        </div>
      </div>
    </div>
  );
}
