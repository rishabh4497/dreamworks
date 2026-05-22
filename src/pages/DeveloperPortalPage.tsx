import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  FileText,
  Package,
  Save,
  Send,
  Tags,
  BarChart3,
  Megaphone,
  Globe2
} from "lucide-react";
import {
  formatPrice,
  getPrimaryReleaseDraft,
  saveDeveloperReleaseDraft,
  submitDeveloperReleaseDraft,
  type DeveloperReleaseDraft,
  type DeveloperReleaseDraftInput,
  type ReleaseWindow,
} from "@/lib/api/developer-portal";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { DropOffHeatmaps } from "@/components/developer/DropOffHeatmaps";
import { ABTesting } from "@/components/developer/ABTesting";
import { SentimentAnalysis } from "@/components/developer/SentimentAnalysis";
import { PlaytestDeploy } from "@/components/developer/PlaytestDeploy";
import { RegionalPricingAI } from "@/components/developer/RegionalPricingAI";
import { BountyBoard } from "@/components/developer/BountyBoard";
import { RefundPredictor } from "@/components/developer/RefundPredictor";
import { PromoEngine } from "@/components/developer/PromoEngine";
import { InGameNews } from "@/components/developer/InGameNews";
import { ModdingSandbox } from "@/components/developer/ModdingSandbox";
import { AILocalization } from "@/components/developer/AILocalization";
import { KeyRevocation } from "@/components/developer/KeyRevocation";
import { HypeFunnel } from "@/components/developer/HypeFunnel";
import { CrossPromoBuilder } from "@/components/developer/CrossPromoBuilder";
import { WebWidgets } from "@/components/developer/WebWidgets";
import { CrashVisualizer } from "@/components/developer/CrashVisualizer";
import { DeveloperAMAs } from "@/components/developer/DeveloperAMAs";
import { CloudSaveMigration } from "@/components/developer/CloudSaveMigration";
import { MTXSimulator } from "@/components/developer/MTXSimulator";
import { DRMToggles } from "@/components/developer/DRMToggles";
import { DynamicBackgrounds } from "@/components/developer/DynamicBackgrounds";
import { InfluencerDiscovery } from "@/components/developer/InfluencerDiscovery";
import { BundlePricing } from "@/components/developer/BundlePricing";
import { ReviewExtractor } from "@/components/developer/ReviewExtractor";
import { CapsuleABTesting } from "@/components/developer/CapsuleABTesting";
import { AntiCheatML } from "@/components/developer/AntiCheatML";
import { SubtitleSync } from "@/components/developer/SubtitleSync";
import { ServerAutoScaler } from "@/components/developer/ServerAutoScaler";
import { TelemetryHeatmaps } from "@/components/developer/TelemetryHeatmaps";
import { PortEstimator } from "@/components/developer/PortEstimator";
import { LocalizationHeatmaps } from "@/components/developer/LocalizationHeatmaps";
import { PressKitGenerator } from "@/components/developer/PressKitGenerator";
import { RefundSurveyAnalytics } from "@/components/developer/RefundSurveyAnalytics";
import { InteractiveWidgets } from "@/components/developer/InteractiveWidgets";
import { PriceHarmonization } from "@/components/developer/PriceHarmonization";
import { PreLoadOptimizer } from "@/components/developer/PreLoadOptimizer";
import { AIBugTriage } from "@/components/developer/AIBugTriage";
import { CrossSaveAPI } from "@/components/developer/CrossSaveAPI";
import { SilentHotfixDeployer } from "@/components/developer/SilentHotfixDeployer";
import { MatchmakingSandbox } from "@/components/developer/MatchmakingSandbox";
import {
  AutomatedModerationQueue,
  ShadowBanSandbox,
  ReviewBombingMitigation,
  EmergencyRollback,
  AbTestingStorefronts,
  CrashDumpAggregator,
  CloudSaveConflictDashboard,
  ToxicityReports,
  EarlyAccessMilestones,
  PreLoadAnalyzer,
} from "@/components/features/DevFeatures";
import { AiNpcVoiceMimic } from "@/components/features/AiFeatures";

const RELEASE_WINDOWS: { value: ReleaseWindow; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "midnight", label: "Midnight" },
];

const CHECKLIST_LABELS: Record<keyof DeveloperReleaseDraft["checklist"], string> = {
  achievements: "Achievement set attached",
  newsPost: "Launch news post ready",
  capsuleArt: "Store capsule art approved",
  controllerSupport: "Controller support verified",
  cloudSaves: "Cloud save schema checked",
};

type TabId = "release" | "analytics" | "marketing" | "ops";

const TABS = [
  { id: "release", label: "Release Draft", icon: Package },
  { id: "analytics", label: "Analytics & Data", icon: BarChart3 },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "ops", label: "Live Ops & Community", icon: Globe2 },
] as const;

export function DeveloperPortalPage() {
  const [activeTab, setActiveTab] = useState<TabId>("release");
  const [draft, setDraft] = useState<DeveloperReleaseDraft | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "submitted">("idle");

  useEffect(() => {
    let mounted = true;
    getPrimaryReleaseDraft().then((next) => {
      if (mounted) setDraft(next);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const checklistTotal = draft ? Object.keys(draft.checklist).length : 0;
  const checklistDone = draft
    ? Object.values(draft.checklist).filter(Boolean).length
    : 0;
  const launchPrice = useMemo(() => {
    if (!draft) return "$0.00";
    const discounted = Math.round(draft.basePriceCents * (1 - draft.launchDiscountPct / 100));
    return formatPrice(discounted);
  }, [draft]);

  if (!draft) {
    return (
      <Card className="p-6 text-[13px] text-muted/65">
        Loading developer portal...
      </Card>
    );
  }

  const updateDraft = <Key extends keyof DeveloperReleaseDraft>(
    key: Key,
    value: DeveloperReleaseDraft[Key],
  ) => {
    setDraft((current) => (current ? { ...current, [key]: value, stage: "draft" } : current));
    setSaveState("idle");
  };

  const updateChecklist = (key: keyof DeveloperReleaseDraft["checklist"], value: boolean) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            stage: "draft",
            checklist: { ...current.checklist, [key]: value },
          }
        : current,
    );
    setSaveState("idle");
  };

  const toInput = (): DeveloperReleaseDraftInput => ({
    ...draft,
    stage: draft.stage,
  });

  const saveDraft = async () => {
    setSaveState("saving");
    const saved = await saveDeveloperReleaseDraft(toInput());
    setDraft(saved);
    setSaveState("saved");
  };

  const submitForReview = async () => {
    setSaveState("saving");
    const submitted = await submitDeveloperReleaseDraft(toInput());
    setDraft(submitted);
    setSaveState("submitted");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/50">
            <Package className="h-3 w-3" />
            Developer Portal
          </p>
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
            {activeTab === "release" ? "Stage a Release" : "Partner Tools & Analytics"}
          </h1>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted/65">
            {activeTab === "release" 
              ? "Prepare store metadata, build notes, pricing, release timing, and launch assets before submitting the package for review."
              : "Leverage AI-driven analytics, storefront testing, and live ops tooling to maximize your game's reach and retention."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "release" && (
            <>
              <Badge variant={draft.stage === "submitted" ? "free" : "soon"}>
                {draft.stage === "submitted" ? "Submitted" : "Draft"}
              </Badge>
              <Button variant="secondary" onClick={saveDraft} disabled={saveState === "saving"}>
                <Save className="h-4 w-4" />
                {saveState === "saving" ? "Saving" : "Save Draft"}
              </Button>
              <Button onClick={submitForReview} disabled={saveState === "saving"}>
                <Send className="h-4 w-4" />
                Submit
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-separator mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-t-lg transition-colors border-b-2",
              activeTab === tab.id
                ? "border-acid text-acid bg-card"
                : "border-transparent text-muted/70 hover:text-foreground hover:bg-card-hover"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "release" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <section className="grid gap-3 md:grid-cols-3">
            <Metric icon={CalendarClock} label="Release" value={`${draft.releaseDate} / ${draft.releaseWindow}`} />
            <Metric icon={Tags} label="Launch Price" value={launchPrice} />
            <Metric icon={CheckCircle2} label="Checklist" value={`${checklistDone}/${checklistTotal} ready`} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Card className="p-4">
                <SectionTitle icon={FileText} title="Store Metadata" />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Field label="Game title">
                    <Input value={draft.gameTitle} onChange={(event) => updateDraft("gameTitle", event.target.value)} />
                  </Field>
                  <Field label="Developer">
                    <Input
                      value={draft.developerName}
                      onChange={(event) => updateDraft("developerName", event.target.value)}
                    />
                  </Field>
                  <Field label="Genre">
                    <Input value={draft.genre} onChange={(event) => updateDraft("genre", event.target.value)} />
                  </Field>
                  <Field label="Content rating">
                    <Input
                      value={draft.contentRating}
                      onChange={(event) => updateDraft("contentRating", event.target.value)}
                    />
                  </Field>
                  <Field label="Short description" className="md:col-span-2">
                    <textarea
                      value={draft.shortDescription}
                      onChange={(event) => updateDraft("shortDescription", event.target.value)}
                      className="min-h-20 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
                    />
                  </Field>
                </div>
              </Card>

              <Card className="p-4">
                <SectionTitle icon={Package} title="Build Upload Placeholder" />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Field label="Build label">
                    <Input value={draft.buildLabel} onChange={(event) => updateDraft("buildLabel", event.target.value)} />
                  </Field>
                  <div className="rounded-xl border border-dashed border-separator bg-card-active/35 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted/50">Upload Slot</p>
                    <p className="mt-2 text-[13px] text-foreground">Depot package placeholder</p>
                    <p className="mt-1 text-[11px] text-muted/60">Final binary upload will attach here.</p>
                  </div>
                  <Field label="Build notes" className="md:col-span-2">
                    <textarea
                      value={draft.buildNotes}
                      onChange={(event) => updateDraft("buildNotes", event.target.value)}
                      className="min-h-20 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
                    />
                  </Field>
                </div>
              </Card>

              <Card className="p-4">
                <SectionTitle icon={CalendarClock} title="Release Window and Price Controls" />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Field label="Release date">
                    <Input
                      type="date"
                      value={draft.releaseDate}
                      onChange={(event) => updateDraft("releaseDate", event.target.value)}
                    />
                  </Field>
                  <Field label="Release window">
                    <select
                      value={draft.releaseWindow}
                      onChange={(event) => updateDraft("releaseWindow", event.target.value as ReleaseWindow)}
                      className="h-10 w-full rounded-xl border border-separator bg-input px-3.5 text-[13px] text-foreground focus:outline-none"
                    >
                      {RELEASE_WINDOWS.map((window) => (
                        <option key={window.value} value={window.value}>
                          {window.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Base price, cents">
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={draft.basePriceCents}
                      onChange={(event) => updateDraft("basePriceCents", Number(event.target.value))}
                    />
                  </Field>
                  <Field label="Launch discount %">
                    <Input
                      type="number"
                      min={0}
                      max={90}
                      value={draft.launchDiscountPct}
                      onChange={(event) => updateDraft("launchDiscountPct", Number(event.target.value))}
                    />
                  </Field>
                  <label className="flex items-center gap-2 rounded-xl bg-card-active/45 p-3 text-[13px] text-foreground md:col-span-2">
                    <input
                      type="checkbox"
                      checked={draft.regionalPricing}
                      onChange={(event) => updateDraft("regionalPricing", event.target.checked)}
                      className="h-4 w-4 accent-acid"
                    />
                    Regional pricing follows recommended purchasing-power bands
                  </label>
                </div>
              </Card>
            </div>

            <aside className="space-y-4">
              <Card className="p-4">
                <SectionTitle icon={BadgeCheck} title="Release Checklist" />
                <div className="mt-4 space-y-2">
                  {(Object.keys(CHECKLIST_LABELS) as Array<keyof DeveloperReleaseDraft["checklist"]>).map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 rounded-lg bg-card-active/45 p-2.5 text-[12px] text-foreground/80"
                    >
                      <input
                        type="checkbox"
                        checked={draft.checklist[key]}
                        onChange={(event) => updateChecklist(key, event.target.checked)}
                        className="h-4 w-4 accent-acid"
                      />
                      {CHECKLIST_LABELS[key]}
                    </label>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <SectionTitle icon={FileText} title="Store Preview Copy" />
                <div className="mt-4 space-y-3">
                  <Field label="Headline">
                    <Input
                      value={draft.previewHeadline}
                      onChange={(event) => updateDraft("previewHeadline", event.target.value)}
                    />
                  </Field>
                  <Field label="Body">
                    <textarea
                      value={draft.previewBody}
                      onChange={(event) => updateDraft("previewBody", event.target.value)}
                      className="min-h-28 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
                    />
                  </Field>
                  <div className="rounded-xl bg-card-active/45 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted/50">Preview</p>
                    <h2 className="mt-2 text-[17px] font-semibold text-foreground">{draft.previewHeadline}</h2>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted/70">{draft.previewBody}</p>
                    <p className="mt-3 text-[12px] font-semibold text-price">{launchPrice}</p>
                  </div>
                </div>
              </Card>

              <p className="text-[11px] text-muted/55">
                {saveState === "saved" && "Draft saved locally."}
                {saveState === "submitted" && `Submitted for review at ${draft.submittedAt ?? draft.updatedAt}.`}
                {saveState === "idle" && `Last updated ${draft.updatedAt}.`}
              </p>
            </aside>
          </section>
        </motion.div>
      )}

      {activeTab === "analytics" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <CrashDumpAggregator />
            <ToxicityReports />
            <LocalizationHeatmaps />
            <RefundSurveyAnalytics />
            <ReviewExtractor />
            <TelemetryHeatmaps />
          </div>
          <div className="space-y-6">
            <HypeFunnel />
            <CrashVisualizer />
            <RefundPredictor />
            <SentimentAnalysis />
            <DropOffHeatmaps />
          </div>
        </motion.div>
      )}

      {activeTab === "marketing" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <AbTestingStorefronts />
            <EarlyAccessMilestones />
            <PressKitGenerator />
            <InteractiveWidgets />
            <DynamicBackgrounds />
            <InfluencerDiscovery />
            <BundlePricing />
          </div>
          <div className="space-y-6">
            <CapsuleABTesting />
            <CrossPromoBuilder />
            <WebWidgets />
            <MTXSimulator />
            <ABTesting />
            <PromoEngine />
            <BountyBoard />
          </div>
        </motion.div>
      )}

      {activeTab === "ops" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <EmergencyRollback />
            <AutomatedModerationQueue />
            <CloudSaveConflictDashboard />
            <PreLoadAnalyzer />
            <AiNpcVoiceMimic />
            <SilentHotfixDeployer />
            <CrossSaveAPI />
            <PreLoadOptimizer />
            <AIBugTriage />
            <AntiCheatML />
            <SubtitleSync />
            <ServerAutoScaler />
          </div>
          <div className="space-y-6">
            <ShadowBanSandbox />
            <ReviewBombingMitigation />
            <AILocalization />
            <DeveloperAMAs />
            <CloudSaveMigration />
            <PlaytestDeploy />
            <InGameNews />
            <PriceHarmonization />
            <MatchmakingSandbox />
            <PortEstimator />
            <KeyRevocation />
            <DRMToggles />
            <RegionalPricingAI />
            <ModdingSandbox />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted/50">
        {label}
      </span>
      {children}
    </label>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted/55">{label}</p>
          <p className="mt-1 truncate text-[15px] font-semibold text-foreground">{value}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-acid/10 text-acid">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof FileText; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
      <Icon className="h-4 w-4 text-muted/60" />
      {title}
    </h2>
  );
}
