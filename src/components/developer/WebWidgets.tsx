import { Code, Star } from "lucide-react";
export function WebWidgets() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Code className="h-5 w-5 text-yellow" /> Web Widgets API</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Pull your live Dreamworks rating to dynamically display on your external studio website.</p>
      <div className="bg-background rounded-lg border border-separator p-4 font-mono text-[11px] text-muted/80 overflow-x-auto">
        {`<iframe src="https://dreamworks.app/embed/widget/game_123" width="300" height="150" />`}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[12px] font-bold">Live Preview:</span>
        <div className="bg-card-active border border-separator px-3 py-1.5 rounded-lg flex items-center gap-2">
           <Star className="h-4 w-4 text-yellow fill-yellow" /> <span className="text-[13px] font-bold">Overwhelmingly Positive (98%)</span>
        </div>
      </div>
    </div>
  );
}
