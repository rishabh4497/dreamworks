import { useState } from "react";
import { motion } from "motion/react";
import { X, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";
import type { Game } from "@/lib/types";

interface ReviewPollModalProps {
  game: Game;
  open: boolean;
  onClose: () => void;
}

export function ReviewPollModal({ game, open, onClose }: ReviewPollModalProps) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);

  if (!open) return null;

  const handleSubmit = () => {
    toast.success("Thank you for your feedback!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-separator bg-card shadow-2xl"
      >
        <div className="relative h-24 w-full">
          <img src={game.headerUrl} alt="" className="h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          <button onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 bg-black/40 text-white hover:bg-black/60">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="p-5 text-center -mt-8 relative z-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-acid text-background shadow-lg shadow-acid/20 mb-3">
            <Star className="h-6 w-6" />
          </div>
          <h2 className="text-[18px] font-semibold text-foreground">How was {game.name}?</h2>
          <p className="mt-1 text-[13px] text-muted/80">
            You just finished a session. Would you recommend this game to others?
          </p>
          
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setRating("up")}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all hover:bg-card-active w-24 h-24 ${
                rating === "up" ? "border-positive bg-positive/10 text-positive" : "border-separator text-muted"
              }`}
            >
              <ThumbsUp className="h-8 w-8" />
              <span className="text-[12px] font-semibold">Yes</span>
            </button>
            <button
              onClick={() => setRating("down")}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all hover:bg-card-active w-24 h-24 ${
                rating === "down" ? "border-red bg-red/10 text-red" : "border-separator text-muted"
              }`}
            >
              <ThumbsDown className="h-8 w-8" />
              <span className="text-[12px] font-semibold">No</span>
            </button>
          </div>
          
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Skip</Button>
            <Button variant="primary" className="flex-1" disabled={!rating} onClick={handleSubmit}>Submit</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
