import { SplitSquareHorizontal, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ABTesting() {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <SplitSquareHorizontal className="h-5 w-5 text-blue" /> Storefront A/B Testing
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">Test different capsule images and trailers to maximize conversion.</p>
        </div>
        <Button size="sm">New Experiment</Button>
      </div>

      <div className="rounded-xl border border-blue/30 bg-blue/5 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue">Active Test: Capsule Image</span>
          <span className="text-[11px] font-medium text-foreground">42,109 Impressions</span>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-foreground flex justify-between">Variant A (Control) <span className="text-muted">50% Traffic</span></p>
            <div className="aspect-[460/215] bg-input rounded-lg flex items-center justify-center border border-separator shadow-inner relative overflow-hidden">
               <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=460&h=215" alt="A" className="object-cover w-full h-full opacity-60" />
            </div>
            <div className="flex justify-between items-center bg-card-active rounded-md p-2">
              <span className="text-[11px] text-muted/70">Conversion Rate</span>
              <span className="text-[13px] font-bold text-foreground">2.4%</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-foreground flex justify-between text-green">Variant B (New Logo) <span className="text-muted">50% Traffic</span></p>
            <div className="aspect-[460/215] bg-input rounded-lg flex items-center justify-center border-2 border-green shadow-[0_0_15px_rgba(var(--color-green-rgb),0.2)] relative overflow-hidden">
               <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=460&h=215" alt="B" className="object-cover w-full h-full opacity-80" />
               <div className="absolute top-2 right-2 bg-green text-black text-[10px] font-bold px-2 py-0.5 rounded-sm">WINNING</div>
            </div>
            <div className="flex justify-between items-center bg-green/10 rounded-md p-2 border border-green/20">
              <span className="text-[11px] text-green">Conversion Rate</span>
              <span className="text-[13px] font-bold text-green flex items-center gap-1"><TrendingUp className="h-3 w-3" /> 3.8%</span>
            </div>
          </div>
        </div>
        
        <div className="mt-5 flex justify-end">
          <Button className="bg-blue hover:bg-blue/80 text-white">Deploy Variant B to 100% Traffic</Button>
        </div>
      </div>
    </Card>
  );
}
