import { motion } from "motion/react";

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

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-6 md:grid-cols-2"
    >
      {children}
    </motion.div>
  );
}

export function AnalyticsPanel() {
  return (
    <Panel>
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
    </Panel>
  );
}

export function MarketingPanel() {
  return (
    <Panel>
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
    </Panel>
  );
}

export function OpsPanel() {
  return (
    <Panel>
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
    </Panel>
  );
}
