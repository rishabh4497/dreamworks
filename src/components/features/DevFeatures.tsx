import { ShieldAlert, Ghost, ShieldBan, RotateCcw, Split, FileWarning, CloudOff, MessageSquareWarning, GitPullRequest, FileArchive } from "lucide-react";

export function AutomatedModerationQueue() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-red/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-red/10 text-red">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI Moderation Queue</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        AI flags highly inappropriate content and queues it in a rapid swipe-left/swipe-right interface for human review.
      </p>
    </div>
  );
}

export function ShadowBanSandbox() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-purple-500/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
          <Ghost className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Shadow-Ban Sandbox</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Automatically routes detected cheaters into a hidden, isolated matchmaking pool against other cheaters.
      </p>
    </div>
  );
}

export function ReviewBombingMitigation() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-blue-500/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
          <ShieldBan className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Review Bombing Mitigation</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Detects coordinated review attacks and quarantines them for manual approval before they tank the public score.
      </p>
    </div>
  );
}

export function EmergencyRollback() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-orange-500/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
          <RotateCcw className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">One-Click Emergency Rollback</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Hit a massive red button to seamlessly revert all players to the previous stable build if a hotfix breaks the game.
      </p>
    </div>
  );
}

export function AbTestingStorefronts() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-green/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-green/10 text-green">
          <Split className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">A/B Testing Storefronts</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Serve two different cover arts or trailers to users and track which yields higher conversion and wishlist rates.
      </p>
    </div>
  );
}

export function CrashDumpAggregator() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-pink-500/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
          <FileWarning className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Crash Dump Aggregator</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Groups identical crash logs and highlights the specific line of code causing the most frequent crashes.
      </p>
    </div>
  );
}

export function CloudSaveConflictDashboard() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-cyan/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-cyan/10 text-cyan">
          <CloudOff className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Cloud Save Conflict Dashboard</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        See how often cloud saves fail for players and push override rules to resolve them automatically.
      </p>
    </div>
  );
}

export function ToxicityReports() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-red/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-red/10 text-red">
          <MessageSquareWarning className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Automated Toxicity Reports</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Generates weekly reports highlighting the most toxic players, frequent harassment terms, and peak toxicity hours.
      </p>
    </div>
  );
}

export function EarlyAccessMilestones() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-indigo-500/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
          <GitPullRequest className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Early Access Milestone Tracker</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Public-facing roadmap tied directly to Jira/GitHub, automatically updating players on feature progress.
      </p>
    </div>
  );
}

export function PreLoadAnalyzer() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-yellow-500/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
          <FileArchive className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Pre-Load Compression Analyzer</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Test how efficiently a game's file structure will compress and decrypt for pre-loading before a Day 1 launch.
      </p>
    </div>
  );
}
