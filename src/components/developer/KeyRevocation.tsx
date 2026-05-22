import { Key, ShieldAlert } from "lucide-react";
export function KeyRevocation() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Key className="h-5 w-5 text-red" /> Press Key Revocation</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Track which journalists or YouTubers redeemed your promo keys and flag grey-market leaks.</p>
      <div className="bg-red/10 border border-red/20 rounded-lg p-3 flex justify-between items-center">
        <div>
          <p className="text-[12px] font-bold text-red flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> 14 Keys flagged on grey-market sites</p>
        </div>
        <button className="bg-red text-white px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer hover:brightness-110">Revoke Flagged</button>
      </div>
    </div>
  );
}
