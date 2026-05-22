import { Megaphone, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function InGameNews() {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-orange" /> Direct In-Game News
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">Beam patch notes and announcements directly to the game's main menu via API.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-separator bg-card-active p-4">
          <input 
            type="text" 
            placeholder="Announcement Title (e.g. Patch 1.2 is Live!)" 
            className="w-full bg-transparent text-[14px] font-bold text-foreground outline-none placeholder:text-muted/40 mb-2 border-b border-separator/40 pb-2"
          />
          <textarea 
            placeholder="Write your news here... It will instantly appear in the game's main menu for all connected players."
            className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted/40 resize-none h-20"
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" className="bg-orange text-white hover:bg-orange/80">
              <Send className="mr-2 h-3.5 w-3.5" /> Broadcast to All Players
            </Button>
          </div>
        </div>
        
        <div className="text-[11px] text-muted/60">
          <span className="font-semibold text-foreground/80">API Key:</span> `dw_live_news_abc123xyz`
        </div>
      </div>
    </Card>
  );
}
