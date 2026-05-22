import { useState, useEffect } from "react";
import { Gamepad2, Trophy, Maximize2 } from "lucide-react";
import { motion } from "motion/react";

export function WaitingMiniGames() {
  const [score, setScore] = useState(0);
  
  // Fake game loop simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setScore(s => s + Math.floor(Math.random() * 5));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 rounded-2xl border border-separator/50 bg-card shadow-inner overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between p-3 border-b border-separator/30 bg-card-active/50">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-[#a052ff]" />
          <span className="text-[12px] font-bold text-foreground">Launcher Pong</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/80 text-[10px] font-bold text-yellow">
            <Trophy className="h-3 w-3" /> Highscore: {score + 142}
          </div>
          <Maximize2 className="h-3.5 w-3.5 text-muted hover:text-foreground cursor-pointer" />
        </div>
      </div>
      
      <div className="h-32 bg-[#0f0f15] relative overflow-hidden flex items-center justify-center cursor-crosshair">
        {/* Fake game rendering */}
        <div className="absolute top-4 bottom-4 left-4 w-2 bg-white rounded-full" />
        <div className="absolute top-10 bottom-10 right-4 w-2 bg-white rounded-full" />
        <motion.div 
          animate={{ x: [0, 150, -150, 0], y: [0, -30, 40, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="h-3 w-3 rounded-full bg-white shadow-[0_0_10px_white]" 
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[1px] h-full border-r border-dashed border-white/20" />
        </div>
        
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-12 text-white/40 text-[24px] font-black font-mono">
          <span>{score}</span>
          <span>{Math.floor(score * 0.8)}</span>
        </div>
      </div>
    </div>
  );
}
