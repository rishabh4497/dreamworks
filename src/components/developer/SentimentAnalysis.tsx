import { BrainCircuit } from "lucide-react";
import { Card } from "@/components/ui/card";

export function SentimentAnalysis() {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-purple-400" /> AI Sentiment Analysis
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">AI summary of your last 1,420 user reviews.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-card-active border border-separator p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted/60">Overall Sentiment</p>
          <p className="text-[24px] font-bold text-green mt-1">Positive</p>
          <p className="text-[12px] text-muted/70 mt-1">84% of reviews are favorable.</p>
        </div>
        <div className="rounded-xl bg-card-active border border-separator p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted/60">Most Praised</p>
          <p className="text-[16px] font-bold text-foreground mt-1">Gunplay & Sound Design</p>
          <p className="text-[12px] text-muted/70 mt-1">Mentioned in 412 reviews.</p>
        </div>
        <div className="rounded-xl bg-card-active border border-separator p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted/60">Most Criticized</p>
          <p className="text-[16px] font-bold text-red mt-1">Level 4 Difficulty Spike</p>
          <p className="text-[12px] text-muted/70 mt-1">Mentioned in 184 reviews.</p>
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-foreground mb-3">AI Executive Summary</h3>
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 text-[13px] leading-relaxed text-foreground/80">
          <p>
            Players are thoroughly enjoying the core loop introduced in Patch 1.2. The new <strong>Plasma Rifle</strong> has completely shifted the meta and received overwhelming praise. However, there is a growing frustration regarding the <strong>Desert Biome boss fight</strong>, which many players feel is unbalanced for solo play. It is recommended to investigate the boss's AoE damage numbers.
          </p>
        </div>
      </div>
    </Card>
  );
}
