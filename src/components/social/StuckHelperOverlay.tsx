import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lightbulb, X, ExternalLink, PlayCircle } from "lucide-react";

export function StuckHelperOverlay() {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
          className="fixed bottom-24 right-6 z-50 w-72 rounded-2xl border border-acid/30 bg-card/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(var(--color-acid-rgb),0.15)] p-4"
        >
          <button onClick={() => setVisible(false)} className="absolute top-3 right-3 text-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-acid/20 text-acid mt-1">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-foreground">Stuck in the Fire Temple?</p>
              <p className="text-[11px] text-muted/80 mt-1 leading-relaxed">
                You've been in this zone for 2 hours. Want to check out the community guide?
              </p>
              
              <div className="mt-3 flex flex-col gap-2">
                <button className="flex items-center gap-2 rounded-lg bg-acid text-background px-3 py-1.5 text-[11px] font-bold hover:brightness-110 transition-all cursor-pointer">
                  <PlayCircle className="h-3.5 w-3.5" /> Watch Walkthrough
                </button>
                <button className="flex items-center gap-2 rounded-lg bg-input text-foreground px-3 py-1.5 text-[11px] font-semibold hover:bg-card-hover transition-all cursor-pointer">
                  <ExternalLink className="h-3 w-3" /> Read Text Guide
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
