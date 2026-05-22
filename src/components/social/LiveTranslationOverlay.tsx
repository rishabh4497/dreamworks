import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Settings, Mic, MessageSquare } from "lucide-react";

export function LiveTranslationOverlay() {
  const [active, setActive] = useState(false);

  return (
    <div className="fixed top-6 right-6 z-50">
      <button 
        onClick={() => setActive(!active)}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-md border shadow-lg transition-all cursor-pointer ${
          active ? "bg-cyan/20 border-cyan/40 text-cyan" : "bg-card/80 border-separator text-muted hover:text-foreground"
        }`}
      >
        <Globe className="h-4 w-4" />
        <span className="text-[11px] font-bold">{active ? "Translating (EN)" : "Translation Off"}</span>
      </button>

      <AnimatePresence>
        {active && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-10 right-0 mt-2 w-64 rounded-2xl border border-separator bg-card/95 backdrop-blur-xl shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-4 border-b border-separator/50 pb-2">
              <span className="text-[12px] font-bold text-foreground">Live Translation AI</span>
              <Settings className="h-4 w-4 text-muted hover:text-foreground cursor-pointer" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] text-foreground">
                  <Mic className="h-3.5 w-3.5 text-cyan" /> Voice to Text
                </div>
                <div className="h-4 w-8 rounded-full bg-cyan/20 relative cursor-pointer">
                  <div className="absolute right-1 top-0.5 h-3 w-3 rounded-full bg-cyan shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] text-foreground">
                  <MessageSquare className="h-3.5 w-3.5 text-cyan" /> Chat Auto-Translate
                </div>
                <div className="h-4 w-8 rounded-full bg-cyan/20 relative cursor-pointer">
                  <div className="absolute right-1 top-0.5 h-3 w-3 rounded-full bg-cyan shadow-sm" />
                </div>
              </div>
            </div>
            
            <div className="mt-4 rounded-xl bg-card-active p-3">
              <p className="text-[10px] text-muted/60 uppercase tracking-wider mb-1">Target Language</p>
              <select className="w-full bg-transparent text-[12px] font-bold text-foreground focus:outline-none">
                <option>English (US)</option>
                <option>Spanish (ES)</option>
                <option>Japanese (JP)</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
