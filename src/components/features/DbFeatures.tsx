import { Skull, Twitch, TrendingUp, History, Globe, PieChart, Activity, Gauge, ArrowDownCircle, Blocks } from "lucide-react";

export function DeadGamePredictor() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-red/10 text-red">
          <Skull className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">"Dead Game" Predictor</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed mb-4">
        Analyzes player retention slopes to predict when a multiplayer game will fall below sustainable populations.
      </p>
      <div className="h-2 w-full bg-input rounded-full overflow-hidden">
        <div className="h-full bg-red w-[85%]" />
      </div>
      <p className="text-[10px] text-muted/50 mt-2 text-right">Est. death: 2 months</p>
    </div>
  );
}

export function TwitchImpactOverlay() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
          <Twitch className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Twitch Impact Overlay</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Correlates real-time streamer viewership spikes directly with sales and wishlist spikes.
      </p>
    </div>
  );
}

export function DiscountEfficiencyMatrix() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-green/10 text-green">
          <TrendingUp className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Discount Efficiency Matrix</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Scatter plot showing publishers the exact discount percentage yielding the highest revenue vs volume.
      </p>
    </div>
  );
}

export function HistoricalPlayerCountReplays() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
          <History className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Historical Player Replays</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Timeline scrubber to playback how player counts reacted to major updates or controversies in real-time.
      </p>
    </div>
  );
}

export function RegionalPopularityGlobe() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-cyan/10 text-cyan">
          <Globe className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Regional Popularity Globe</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        A 3D interactive, spinning globe showing exactly where in the world a game is currently trending.
      </p>
    </div>
  );
}

export function RefundReasonAnalytics() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
          <PieChart className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Refund Reason Analytics</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Aggregated pie charts showing exactly why users are refunding specific games (e.g. Performance).
      </p>
    </div>
  );
}

export function CompletionRateVsLength() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
          <Activity className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Completion Rate vs. Length</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Maps average playtime against the percentage of players hitting the "Credits" achievement.
      </p>
    </div>
  );
}

export function GenreSaturationIndex() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
          <Gauge className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Genre Saturation Index</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Warns developers with a "heat gauge" if a specific sub-genre is over-saturated.
      </p>
    </div>
  );
}

export function LowestPricePredictor() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-acid/10 text-acid">
          <ArrowDownCircle className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Lowest Price Predictor</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Alerts users when a game hits its historical low, with algorithmic predictions for the next sale.
      </p>
    </div>
  );
}

export function DlcAttachRateTracker() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
          <Blocks className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">DLC Attach Rate Tracker</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Detailed analytics showing what percentage of base-game owners go on to purchase specific DLCs.
      </p>
    </div>
  );
}
