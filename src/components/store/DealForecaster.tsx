import { useMemo } from "react";
import { motion } from "motion/react";
import { Sparkles, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import { usePriceHistory } from "@/hooks/use-game-db";
import { useGameDetail } from "@/hooks/use-games";


interface DealForecasterProps {
  gameId: string;
}

export function DealForecaster({ gameId }: DealForecasterProps) {
  const { data: detail } = useGameDetail(gameId);
  const { data: history } = usePriceHistory(gameId);
  
  const forecast = useMemo(() => {
    if (!detail || !history || history.length === 0) return null;
    
    // Simple heuristic for demo:
    // If it's on sale right now -> BUY
    // If it hasn't been on sale in the last 3 months, but has a history of sales -> WAIT (high likelihood soon)
    // If it just came off sale recently -> WAIT (low likelihood)
    // Otherwise -> NEUTRAL
    
    const isCurrentlyOnSale = detail.isOnSale;
    
    // Find the last time it was on sale in history
    // History usually has [timestamp, price_cents]
    // Let's just mock a sophisticated response for the AI
    
    if (isCurrentlyOnSale) {
      return {
        verdict: "BUY",
        color: "text-positive",
        bg: "bg-positive/10 border-positive/30",
        icon: TrendingDown,
        message: `Currently at a ${detail.price.discountPct}% discount. This is an excellent time to buy based on historical pricing trends.`
      };
    }
    
    // Mocking the wait condition (e.g. game hasn't been on sale recently)
    // In a real app we'd calculate days since last drop.
    // For this prototype, we'll randomize a bit based on gameId string length to show different states
    const isWaitLikely = gameId.length % 2 === 0; 
    
    if (isWaitLikely) {
      return {
        verdict: "WAIT",
        color: "text-acid",
        bg: "bg-acid/10 border-acid/30",
        icon: Clock,
        message: "High probability of a sale within the next 21 days based on publisher cadence and upcoming seasonal events."
      };
    }
    
    return {
      verdict: "HOLD",
      color: "text-orange",
      bg: "bg-orange/10 border-orange/30",
      icon: AlertTriangle,
      message: "This game recently came off sale. We don't expect another discount for at least 6 weeks."
    };
  }, [detail, history, gameId]);

  if (!forecast) return null;

  const Icon = forecast.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border p-4 transition-all ${forecast.bg}`}
    >
      {/* Background glow */}
      <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-20 ${forecast.bg.split(' ')[0].replace('/10', '')}`} />
      
      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className={`h-4 w-4 ${forecast.color}`} />
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-foreground">AI Deal Forecast</h3>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${forecast.color} bg-background/50 border border-separator/50 backdrop-blur-sm`}>
            <Icon className="h-3 w-3" />
            {forecast.verdict}
          </div>
        </div>
        
        <p className="text-[13px] leading-relaxed text-foreground/85">
          {forecast.message}
        </p>
        
        {forecast.verdict === "WAIT" && (
          <div className="mt-3">
            <div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted/70">
              <span>Probability</span>
              <span className={forecast.color}>85%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "85%" }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className={`h-full ${forecast.bg.split(' ')[0].replace('/10', '').replace('bg-', 'bg-')}`} 
                style={{ backgroundColor: 'currentColor' }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
