import { useState } from "react";
import { Copy, KeyRound, Plus, Trash2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/stores/toast-store";
import {
  useDeleteKey,
  useIssueKeys,
  usePromoKeysByApp,
  useRevokeKey,
} from "@/hooks/use-promo-keys";
import type { PromoKey } from "@/lib/types";

const STATUS_STYLES: Record<PromoKey["status"], string> = {
  issued: "bg-cyan/10 text-cyan",
  redeemed: "bg-green/10 text-green",
  revoked: "bg-red/10 text-red",
};

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

export function PromoKeysCard({ appId }: { appId: string }) {
  const list = usePromoKeysByApp(appId);
  const issue = useIssueKeys();
  const revoke = useRevokeKey(appId);
  const del = useDeleteKey(appId);

  const [count, setCount] = useState(5);
  const [recipientsCsv, setRecipientsCsv] = useState("");
  const [note, setNote] = useState("");

  const handleIssue = async () => {
    try {
      const recipients = recipientsCsv
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const result = await issue.mutateAsync({
        appId,
        count,
        recipients: recipients.length ? recipients : undefined,
        note: note || undefined,
      });
      toast.success(`Issued ${result.length} keys.`);
      setRecipientsCsv("");
      setNote("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Issue failed.");
    }
  };

  const handleCopyAll = async () => {
    const keys = (list.data ?? []).map((k) => k.id).join("\n");
    if (!keys) {
      toast.info("No keys to copy.");
      return;
    }
    const ok = await copyText(keys);
    if (ok) toast.success("Keys copied.");
    else toast.error("Copy failed.");
  };

  const handleCopyOne = async (id: string) => {
    const ok = await copyText(id);
    if (ok) toast.success("Key copied.");
  };

  return (
    <Card className="p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <KeyRound className="h-4 w-4 text-orange" /> Reviewer / partner keys
          </h3>
          <p className="text-[12px] text-muted/60">
            Issue revocable access keys for press, content creators, or QA partners.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleCopyAll}>
          <Copy className="h-3.5 w-3.5" /> Copy all
        </Button>
      </header>

      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Input
          type="number"
          min={1}
          max={200}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          placeholder="How many"
        />
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (e.g. 'IGN review batch')"
          className="md:col-span-3"
        />
        <textarea
          value={recipientsCsv}
          onChange={(e) => setRecipientsCsv(e.target.value)}
          placeholder="Optional: recipients, one per line or comma-separated"
          className="md:col-span-3 min-h-16 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[12px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
        />
        <div className="flex items-end justify-end">
          <Button onClick={handleIssue} disabled={issue.isPending}>
            <Plus className="h-4 w-4" /> {issue.isPending ? "Issuing…" : "Issue keys"}
          </Button>
        </div>
      </div>

      <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
        {list.isLoading && <p className="text-[12px] text-muted/55">Loading…</p>}
        {!list.isLoading && (list.data ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-separator p-4 text-center text-[12px] text-muted/55">
            No keys issued yet.
          </p>
        )}
        {(list.data ?? []).map((k) => (
          <div
            key={k.id}
            className="flex items-center gap-2 rounded-lg border border-separator/60 bg-input/40 px-3 py-2"
          >
            <code className="flex-1 font-mono text-[12px] text-foreground/85">{k.id}</code>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[k.status]}`}
            >
              {k.status}
            </span>
            {k.recipient && (
              <span className="hidden text-[11px] text-muted/65 md:inline">{k.recipient}</span>
            )}
            <Button variant="ghost" size="icon" onClick={() => handleCopyOne(k.id)} aria-label="Copy key">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            {k.status === "issued" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => revoke.mutate(k.id)}
                aria-label="Revoke"
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => del.mutate(k.id)}
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
