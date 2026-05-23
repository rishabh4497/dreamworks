import { Copy, ExternalLink, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";
import { openExternal } from "@/lib/platform";
import { useApp } from "@/hooks/use-apps";
import { useMyDeveloper } from "@/hooks/use-developer";
import { useMyPublisher } from "@/hooks/use-publisher";

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  return false;
}

export function PressKitCard({ appId }: { appId: string }) {
  const appQ = useApp(appId);
  const devQ = useMyDeveloper();
  const pubQ = useMyPublisher();

  const app = appQ.data;
  if (!app) {
    return (
      <Card className="p-5">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
          <FileText className="h-4 w-4 text-cyan" /> Press kit
        </h3>
        <p className="mt-2 text-[12px] text-muted/55">Loading press assets…</p>
      </Card>
    );
  }

  const assets: { label: string; url?: string }[] = [
    { label: "Header image", url: app.headerUrl },
    { label: "Capsule art", url: app.capsuleUrl },
    { label: "Cover", url: app.coverUrl },
    { label: "Studio logo", url: devQ.data?.logoUrl },
    { label: "Publisher logo", url: pubQ.data?.logoUrl },
  ].filter((a) => !!a.url);

  const screenshots = app.screenshots ?? [];
  const trailers = app.trailers ?? [];

  const handleCopyAll = async () => {
    const lines = [
      `# Press kit: ${app.gameTitle}`,
      app.shortDescription ? `\n${app.shortDescription}` : "",
      `\n## Studio\n${devQ.data?.name ?? ""}${devQ.data?.websiteUrl ? ` — ${devQ.data.websiteUrl}` : ""}`,
      `\n## Publisher\n${pubQ.data?.name ?? devQ.data?.name ?? ""}`,
      "\n## Key art",
      ...assets.map((a) => `- ${a.label}: ${a.url}`),
      `\n## Screenshots (${screenshots.length})`,
      ...screenshots.map((s, i) => `- Screenshot ${i + 1}: ${s}`),
      `\n## Trailers (${trailers.length})`,
      ...trailers.map((t) => `- ${t.url}`),
    ].join("\n");
    const ok = await copyText(lines);
    if (ok) toast.success("Press kit URLs copied as markdown.");
    else toast.error("Copy failed.");
  };

  return (
    <Card className="p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <FileText className="h-4 w-4 text-cyan" /> Press kit
          </h3>
          <p className="text-[12px] text-muted/60">
            Live bundle assembled from your store page. Share the markdown with press contacts.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleCopyAll}>
          <Copy className="h-3.5 w-3.5" /> Copy as markdown
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Section title="Key art">
          <ul className="space-y-1.5">
            {assets.map((a) => (
              <li key={a.label} className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-foreground/85">{a.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => a.url && void openExternal(a.url)}
                >
                  Open <ExternalLink className="h-3 w-3" />
                </Button>
              </li>
            ))}
            {assets.length === 0 && (
              <li className="text-[12px] text-muted/55">No key art uploaded yet.</li>
            )}
          </ul>
        </Section>
        <Section title={`Screenshots (${screenshots.length})`}>
          <div className="grid grid-cols-3 gap-1.5">
            {screenshots.slice(0, 9).map((url, i) => (
              <button
                key={url}
                onClick={() => void openExternal(url)}
                className="aspect-video overflow-hidden rounded-md border border-separator/60"
              >
                <img loading="lazy" decoding="async" loading="lazy" decoding="async" src={url} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
            {screenshots.length === 0 && (
              <p className="col-span-3 text-[12px] text-muted/55">No screenshots uploaded yet.</p>
            )}
          </div>
        </Section>
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-separator bg-input/30 p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted/55">
        {title}
      </p>
      {children}
    </div>
  );
}
