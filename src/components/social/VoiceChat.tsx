import { useState } from "react";
import { Mic, MicOff, Headphones, PhoneMissed, ScreenShare, ChevronUp, Video } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export function VoiceChat() {
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-2 w-64 rounded-xl border border-separator bg-card/95 backdrop-blur-md shadow-2xl p-3"
          >
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted/70">
              LFG Squad (Helldivers 2)
            </div>
            <div className="space-y-2">
              {[
                { name: "rishav", speaking: true, me: true },
                { name: "Alex_Tryhard", speaking: false, me: false },
                { name: "Sarah", speaking: true, me: false },
              ].map(u => (
                <div key={u.name} className="flex items-center gap-2 rounded-lg bg-card-active p-1.5">
                  <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px]", u.speaking ? "ring-2 ring-green bg-green/20" : "bg-input")}>
                    {u.name[0].toUpperCase()}
                  </div>
                  <span className={cn("text-[12px]", u.me ? "font-bold text-foreground" : "text-muted")}>{u.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-separator/50 pt-3">
              <button className="flex items-center justify-center gap-2 rounded-lg bg-input py-1.5 text-[11px] hover:bg-card-hover transition-colors">
                <ScreenShare className="h-3 w-3" /> Share
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg bg-input py-1.5 text-[11px] hover:bg-card-hover transition-colors">
                <Video className="h-3 w-3" /> Cam
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-12 items-center gap-1 rounded-full border border-green/30 bg-green/10 pr-2 pl-4 backdrop-blur-md shadow-lg shadow-green/5">
        <div 
          className="flex cursor-pointer items-center gap-3 pr-2"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green"></span>
          </div>
          <span className="text-[13px] font-bold text-green">Voice Connected</span>
          <ChevronUp className={cn("h-4 w-4 text-green transition-transform", expanded && "rotate-180")} />
        </div>

        <div className="h-6 w-[1px] bg-green/20 mx-1" />

        <button 
          onClick={() => setMuted(!muted)}
          className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", muted ? "bg-red/20 text-red hover:bg-red/30" : "text-green hover:bg-green/20")}
        >
          {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button 
          onClick={() => setDeafened(!deafened)}
          className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", deafened ? "bg-red/20 text-red hover:bg-red/30" : "text-green hover:bg-green/20")}
        >
          {deafened ? <PhoneMissed className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
