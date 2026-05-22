import { PieChart, AlertCircle } from "lucide-react";

export function RefundSurveyAnalytics() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
        <PieChart className="h-5 w-5 text-orange-500" /> Post-Refund Exit Surveys
      </h3>
      <p className="text-[13px] text-muted/80 mb-6">Aggregated results from the mandatory 1-question survey when users refund.</p>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className="text-foreground">Performance / Bugs</span>
            <span className="text-muted">45%</span>
          </div>
          <div className="h-2 w-full bg-input rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 w-[45%]" />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className="text-foreground">Too Difficult</span>
            <span className="text-muted">30%</span>
          </div>
          <div className="h-2 w-full bg-input rounded-full overflow-hidden">
            <div className="h-full bg-yellow w-[30%]" />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className="text-foreground">Not what I expected</span>
            <span className="text-muted">15%</span>
          </div>
          <div className="h-2 w-full bg-input rounded-full overflow-hidden">
            <div className="h-full bg-cyan w-[15%]" />
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex gap-2">
        <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
        <p className="text-[11px] text-orange-500/90 leading-relaxed">
          <strong>AI Insight:</strong> A large portion of refunds cite performance. Consider releasing a hotfix focusing on GPU optimization for lower-end hardware to reduce refund rates by an estimated 12%.
        </p>
      </div>
    </div>
  );
}
