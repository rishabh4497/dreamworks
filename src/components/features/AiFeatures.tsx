import { useState } from "react";
import {
  Brain,
  Cpu,
  FileText,
  ImageUp,
  Loader2,
  MessageSquarePlus,
  Mic,
  Send,
  Settings,
  Store,
  Video,
  Wrench,
} from "lucide-react";
import {
  useAIAction,
  useAIStoreCurator,
  useAIStuckAssistant,
  useAIHardwareOptimizer,
  useAIModConflict,
} from "@/hooks/use-ai";
import type {
  HardwareOptimizerPayload,
  ReviewSummarizerPayload,
  DynamicPatchNotesPayload,
} from "@/lib/ai/payload-types";

// ── 1. Stuck Assistant ──────────────────────────────────────────────────────

interface AiStuckAssistantProps {
  gameName?: string;
  currentObjective?: string;
}

export function AiStuckAssistant({
  gameName = "Current Game",
  currentObjective,
}: AiStuckAssistantProps) {
  const ask = useAIStuckAssistant();
  const onEnable = () =>
    ask.mutate({
      gameName,
      currentObjective,
      playerQuestion: "I'm stuck — give me a spoiler-free nudge.",
    });

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan/10 text-cyan">
          <Brain className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">AI "Stuck" Assistant</h3>
          <p className="text-xs text-muted/60 mt-0.5">
            Contextual, spoiler-free hints if you pause for &gt;5 mins.
          </p>
          {ask.data && (
            <p className="text-[11px] text-foreground/80 mt-1.5">{ask.data.hint}</p>
          )}
        </div>
      </div>
      <button
        onClick={onEnable}
        disabled={ask.isPending}
        className="px-3 py-1.5 rounded-lg bg-card-active border border-separator text-xs font-medium hover:bg-card-hover disabled:opacity-50 flex items-center gap-1.5"
      >
        {ask.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        {ask.isPending ? "Thinking…" : ask.data ? "Ask Again" : "Enable"}
      </button>
    </div>
  );
}

// ── 2. Voice Translation — OUT OF LLM SCOPE ─────────────────────────────────
// Real-time audio-in / audio-out — needs Gemini Live API + WebRTC plumbing.
// Phase 2. For now this is a placeholder card.

export function AiVoiceTranslation() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
          <Mic className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Voice-to-Text Translation</h3>
          <p className="text-xs text-muted/60 mt-0.5">
            Real-time live translation of incoming voice chat.
          </p>
        </div>
      </div>
      <button
        disabled
        title="Coming soon: needs Gemini Live API + WebRTC."
        className="px-3 py-1.5 rounded-lg bg-card-active border border-separator text-xs font-medium opacity-50 cursor-not-allowed"
      >
        Coming soon
      </button>
    </div>
  );
}

// ── 3. Highlight Reel — OUT OF LLM SCOPE ────────────────────────────────────
// Video editing — Gemini can identify highlight timestamps but cutting clips
// needs ffmpeg. Phase 2.

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
        Automatically clips your best kills or funniest deaths and edits them into 30-second
        Shorts/TikToks. <span className="text-muted/50">(Coming soon.)</span>
      </p>
    </div>
  );
}

// ── 4. Store Curator (chat) ─────────────────────────────────────────────────

interface StoreCuratorProps {
  candidateGames?: {
    id: string;
    name: string;
    genres: string[];
    tags: string[];
    shortDesc: string;
  }[];
}

const DEFAULT_CANDIDATES = [
  {
    id: "stardew-valley",
    name: "Stardew Valley",
    genres: ["Sim"],
    tags: ["Farming", "Relaxing", "Pixel"],
    shortDesc: "Cozy farming life sim.",
  },
  {
    id: "no-mans-sky",
    name: "No Man's Sky",
    genres: ["Sandbox"],
    tags: ["Space", "Exploration", "Survival"],
    shortDesc: "Open-universe explorer.",
  },
  {
    id: "satisfactory",
    name: "Satisfactory",
    genres: ["Sim"],
    tags: ["Factory", "First-Person"],
    shortDesc: "Build a factory on an alien world.",
  },
];

export function AiStoreCurator({ candidateGames = DEFAULT_CANDIDATES }: StoreCuratorProps) {
  const [input, setInput] = useState("");
  const curator = useAIStoreCurator();

  const onAsk = () => {
    if (!input.trim()) return;
    curator.mutate({ userMessage: input, candidateGames });
  };

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
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAsk()}
          placeholder="Tell AI what you want to play..."
          className="bg-transparent flex-1 text-xs px-2 focus:outline-none"
        />
        <button
          onClick={onAsk}
          disabled={curator.isPending || !input.trim()}
          className="bg-card-active rounded px-3 py-1 text-xs hover:bg-card-hover border border-separator disabled:opacity-50 flex items-center gap-1"
        >
          {curator.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          Ask
        </button>
      </div>
      {curator.data && (
        <div className="mt-3 rounded-lg bg-acid/5 border border-acid/20 p-3 text-[12px] text-foreground/80">
          <p>{curator.data.reply}</p>
          {curator.data.suggestedGameIds.length > 0 && (
            <p className="mt-1.5 text-[11px] text-muted">
              Picks: {curator.data.suggestedGameIds.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── 5. Mod Conflict Resolver ────────────────────────────────────────────────

interface ModConflictProps {
  gameName?: string;
  installedMods?: { id: string; name: string; version: string; loadOrder: number }[];
  crashLogTail?: string;
}

const DEMO_MODS = [
  { id: "skse64", name: "SKSE64", version: "2.2.6", loadOrder: 0 },
  { id: "smim", name: "Static Mesh Improvement", version: "2.08", loadOrder: 12 },
  { id: "frostfall", name: "Frostfall", version: "3.4.1", loadOrder: 37 },
];
const DEMO_CRASH =
  "Skyrim crash report\nUnhandled exception at 0x00007ff7...\nframe 5: SKSE64.dll!ResolveAddress()\nframe 6: Frostfall.esp callback...";

export function AiModConflictResolver({
  gameName = "Skyrim",
  installedMods = DEMO_MODS,
  crashLogTail = DEMO_CRASH,
}: ModConflictProps) {
  const resolve = useAIModConflict();

  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-red/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red/10 text-red">
            <Wrench className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">AI Mod Conflict Resolver</h3>
        </div>
        <button
          onClick={() => resolve.mutate({ gameName, installedMods, crashLogTail })}
          disabled={resolve.isPending}
          className="text-xs px-3 py-1 rounded-lg bg-card-active border border-separator hover:bg-card-hover disabled:opacity-50 flex items-center gap-1"
        >
          {resolve.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {resolve.isPending ? "Analyzing…" : "Analyze"}
        </button>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Analyzes crash logs instantly and automatically toggles off the specific mod causing the
        error.
      </p>
      {resolve.data && (
        <div className="mt-3 rounded-lg bg-red/5 border border-red/20 p-3 space-y-1.5">
          {resolve.data.culprits.map((c) => (
            <div key={c.modId} className="text-[11px] text-foreground/80">
              <strong>{c.modName}</strong> ({c.confidencePct}%): {c.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 6. Review Summarizer ────────────────────────────────────────────────────

interface ReviewSummarizerProps {
  gameName?: string;
  reviewExcerpts?: string[];
}

const DEMO_REVIEWS = [
  "Combat is the best in years.",
  "Side quests are repetitive but the main story rules.",
  "Stuttering in crowded areas, otherwise polished.",
];

export function AiReviewSummarizer({
  gameName = "Sample Title",
  reviewExcerpts = DEMO_REVIEWS,
}: ReviewSummarizerProps) {
  const mutation = useAIAction<"review-summarizer", ReviewSummarizerPayload>(
    "review-summarizer",
  );
  const tldr =
    mutation.data?.tldr ??
    "Based on 10,000 reviews: Players love the combat mechanics but are frustrated by repetitive side quests and minor stuttering in crowded areas.";

  return (
    <div className="rounded-xl border border-separator bg-card p-4 flex items-start gap-4">
      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            AI Review Summary
          </h3>
          <button
            onClick={() => mutation.mutate({ gameName, reviewExcerpts })}
            disabled={mutation.isPending}
            className="text-[10px] px-2 py-1 rounded border border-separator bg-card-active hover:bg-card-hover disabled:opacity-50 flex items-center gap-1"
          >
            {mutation.isPending && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
            {mutation.isPending ? "…" : "Refresh"}
          </button>
        </div>
        <p className="text-xs text-muted/80 leading-relaxed">{tldr}</p>
      </div>
    </div>
  );
}

// ── 7. Dynamic Patch Notes ──────────────────────────────────────────────────

interface PatchNotesProps {
  gameName?: string;
  patchVersion?: string;
  rawNotes?: string;
}

const DEMO_RAW_PATCH =
  "[ENGINE] Bumped DXR pipeline to feature level 12_2.\n[FIX] Memory leak in TextureManager::LoadZone() on transition.\n[BAL] Reduced AoE radius for Desert Boss from 14m to 9m.";

export function AiDynamicPatchNotes({
  gameName = "Sample Title",
  patchVersion = "1.2.3",
  rawNotes = DEMO_RAW_PATCH,
}: PatchNotesProps) {
  const mutation = useAIAction<"dynamic-patch-notes", DynamicPatchNotesPayload>(
    "dynamic-patch-notes",
  );

  return (
    <div className="rounded-xl border border-separator bg-card p-5 hover:border-green/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green/10 text-green">
            <Settings className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">AI Dynamic Patch Notes</h3>
        </div>
        <button
          onClick={() => mutation.mutate({ gameName, patchVersion, rawNotes })}
          disabled={mutation.isPending}
          className="text-xs px-3 py-1 rounded-lg bg-card-active border border-separator hover:bg-card-hover disabled:opacity-50 flex items-center gap-1"
        >
          {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {mutation.isPending ? "Translating…" : "Translate"}
        </button>
      </div>
      <p className="text-xs text-muted/70 leading-relaxed">
        Translates highly technical developer patch notes into plain-English summaries.
      </p>
      {mutation.data && (
        <div className="mt-3 rounded-lg bg-green/5 border border-green/20 p-3">
          <p className="text-[12px] text-foreground/85 mb-2">{mutation.data.summary}</p>
          {mutation.data.sections.map((s, i) => (
            <div key={i} className="text-[11px] text-foreground/75 mb-1">
              <strong>{s.heading}:</strong>
              <ul className="list-disc pl-4 mt-0.5">
                {s.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 8. Hardware Optimizer ───────────────────────────────────────────────────

interface HardwareProps {
  gameName?: string;
  cpuModel?: string;
  gpuModel?: string;
  ramGB?: number;
  targetFps?: number;
  resolution?: string;
}

export function AiHardwareOptimizer({
  gameName = "Current Game",
  cpuModel = "Ryzen 7 5800X",
  gpuModel = "RTX 4070",
  ramGB = 32,
  targetFps = 60,
  resolution = "1920x1080",
}: HardwareProps) {
  const optimize = useAIHardwareOptimizer();
  const onOptimize = () => {
    const payload: HardwareOptimizerPayload = {
      gameName,
      cpuModel,
      gpuModel,
      ramGB,
      targetFps,
      resolution,
    };
    optimize.mutate(payload);
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
          <Cpu className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">AI Hardware Optimizer</h3>
          <p className="text-xs text-muted/60 mt-0.5">
            Auto-tweaks .ini settings to guarantee {targetFps}fps.
          </p>
          {optimize.data && (
            <p className="text-[11px] text-foreground/75 mt-1.5">
              {optimize.data.iniTweaks.length} tweak(s) suggested · est. avg{" "}
              {optimize.data.estimatedAvgFps} fps
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onOptimize}
        disabled={optimize.isPending}
        className="px-3 py-1.5 rounded-lg bg-card-active border border-separator text-xs font-medium hover:bg-card-hover disabled:opacity-50 flex items-center gap-1"
      >
        {optimize.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        {optimize.isPending ? "Optimizing…" : "Optimize"}
      </button>
    </div>
  );
}

// ── 9. Texture Upscaler — OUT OF LLM SCOPE ──────────────────────────────────
// Image super-resolution — not an LLM task. Real-ESRGAN integration is Phase 2.

export function AiTextureUpscaler() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-separator bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
          <ImageUp className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Texture Upscaler</h3>
          <p className="text-xs text-muted/60 mt-0.5">
            Built-in AI upscaling injector for older titles.
          </p>
        </div>
      </div>
      <button
        disabled
        title="Coming soon: needs Real-ESRGAN/DLSS-style image pipeline."
        className="px-3 py-1.5 rounded-lg bg-card-active border border-separator text-xs font-medium opacity-50 cursor-not-allowed"
      >
        Coming soon
      </button>
    </div>
  );
}

// ── 10. NPC Voice Mimic — OUT OF LLM SCOPE ─────────────────────────────────
// Voice cloning — Gemini doesn't do TTS standalone. ElevenLabs/Coqui Phase 2.

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
        Generate new, context-aware dialogue using the AI voice profiles of existing game
        characters. <span className="text-muted/50">(Coming soon.)</span>
      </p>
    </div>
  );
}
