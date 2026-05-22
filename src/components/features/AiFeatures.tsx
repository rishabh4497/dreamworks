import { Brain, Mic, Video, Store, Wrench, FileText, Settings, Cpu, ImageUp, MessageSquarePlus } from "lucide-react";

export function AiStuckAssistant() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan/10 text-cyan">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI "Stuck" Assistant</h3>
          <p className="text-xs text-muted/60 mt-0.5">Contextual, spoiler-free hints if you pause for {">"}5 mins.</p>
        </div>
      </div>
      <button className="px-3 py-1.5 rounded-lg bg-card-active border border-separator text-xs font-medium hover:bg-card-hover">
        Enable
      </button>
    </div>
  );
}

export function AiVoiceTranslation() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
          <Mic className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Voice-to-Text Translation</h3>
          <p className="text-xs text-muted/60 mt-0.5">Real-time live translation of incoming voice chat.</p>
        </div>
      </div>
      <button className="px-3 py-1.5 rounded-lg bg-card-active border border-separator text-xs font-medium hover:bg-card-hover">
        Options
      </button>
    </div>
  );
}

export function AiHighlightReel() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-pink-500/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
          <Video className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI Highlight Reel Generator</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Automatically clips your best kills or funniest deaths and edits them into 30-second Shorts/TikToks.
      </p>
    </div>
  );
}

export function AiStoreCurator() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-acid/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-acid/10 text-acid">
          <Store className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI Store Curator</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed mb-4">
        A conversational bot. Try saying: "I want a relaxing farming game but in space."
      </p>
      <div className="flex bg-input rounded-lg border border-separator p-1">
        <input type="text" placeholder="Tell AI what you want to play..." className="bg-transparent flex-1 text-xs px-2 focus:outline-none" />
        <button className="bg-card-active rounded px-3 py-1 text-xs hover:bg-card-hover border border-separator">Ask</button>
      </div>
    </div>
  );
}

export function AiModConflictResolver() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-red/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-red/10 text-red">
          <Wrench className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI Mod Conflict Resolver</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Analyzes crash logs instantly and automatically toggles off the specific mod causing the error.
      </p>
    </div>
  );
}

export function AiReviewSummarizer() {
  return (
    <div className="rounded-xl border border-separator bg-card p-4 flex items-start gap-4">
      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
        <FileText className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">AI Review Summary</h3>
        <p className="text-xs text-muted/80 leading-relaxed">
          Based on 10,000 reviews: Players love the combat mechanics but are frustrated by repetitive side quests and minor stuttering in crowded areas.
        </p>
      </div>
    </div>
  );
}

export function AiDynamicPatchNotes() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-green/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-green/10 text-green">
          <Settings className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI Dynamic Patch Notes</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Translates highly technical developer patch notes into plain-English summaries.
      </p>
    </div>
  );
}

export function AiHardwareOptimizer() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Hardware Optimizer</h3>
          <p className="text-xs text-muted/60 mt-0.5">Auto-tweaks .ini settings to guarantee 60fps.</p>
        </div>
      </div>
      <button className="px-3 py-1.5 rounded-lg bg-card-active border border-separator text-xs font-medium hover:bg-card-hover">
        Optimize
      </button>
    </div>
  );
}

export function AiTextureUpscaler() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
          <ImageUp className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Texture Upscaler</h3>
          <p className="text-xs text-muted/60 mt-0.5">Built-in AI upscaling injector for older titles.</p>
        </div>
      </div>
      <button className="px-3 py-1.5 rounded-lg bg-card-active border border-separator text-xs font-medium hover:bg-card-hover">
        Enable
      </button>
    </div>
  );
}

export function AiNpcVoiceMimic() {
  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-yellow-500/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
          <MessageSquarePlus className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI NPC Voice Mimic (Mod Tools)</h3>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Generate new, context-aware dialogue using the AI voice profiles of existing game characters.
      </p>
    </div>
  );
}
