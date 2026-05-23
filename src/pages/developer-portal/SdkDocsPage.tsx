import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Copy, Download, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SdkIntegrationSnippet } from "@/components/developer-portal/SdkIntegrationSnippet";
import { useApp } from "@/hooks/use-apps";
import { useAchievements } from "@/hooks/use-app-achievements";

export function SdkDocsPage() {
  const { appId = "" } = useParams();
  const { data: app, isLoading } = useApp(appId);
  const { data: achievements } = useAchievements(appId);

  const achievementIds = useMemo(
    () => (achievements ?? []).map((a) => a.id),
    [achievements],
  );

  const manifest = useMemo(
    () =>
      JSON.stringify(
        {
          schemaVersion: 1,
          appId,
          sdkVersion: "0.1.0",
          buildLabel: "0.1.0",
          achievements: achievementIds,
          platforms: app?.platforms ?? ["windows"],
          executable: "YourGame.exe",
        },
        null,
        2,
      ),
    [appId, achievementIds, app?.platforms],
  );

  const [copiedManifest, setCopiedManifest] = useState(false);
  const copyManifest = async () => {
    try {
      await navigator.clipboard.writeText(manifest);
      setCopiedManifest(true);
      setTimeout(() => setCopiedManifest(false), 1600);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const downloadManifest = () => {
    const blob = new Blob([manifest], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dreamworks.manifest.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !app) {
    return <Card className="p-6 text-[13px] text-muted/65">Loading…</Card>;
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2 p-5">
        <header className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-foreground">
            SDK Integration
          </h3>
          <Badge variant="new">
            <ShieldCheck className="mr-1 h-3 w-3" /> required for publish
          </Badge>
        </header>
        <p className="text-[12.5px] leading-relaxed text-foreground/75">
          To unlock achievements through the Dreamworks launcher and pass our
          publish validation, link <code>@dreamworks/sdk</code> into your game
          and ship a manifest alongside your build.
        </p>
      </Card>

      <Card className="space-y-3 p-5">
        <h4 className="text-[14px] font-semibold text-foreground">1. Install</h4>
        <pre className="overflow-x-auto rounded-lg bg-input p-3 text-[12px] text-foreground/90">
          <code>yarn add @dreamworks/sdk</code>
        </pre>
      </Card>

      <Card className="space-y-3 p-5">
        <h4 className="text-[14px] font-semibold text-foreground">2. Initialize the SDK</h4>
        <p className="text-[12.5px] text-foreground/75">
          Call <code>init()</code> once at game startup. The portal scans your
          compiled executable for the SDK marker — calling <code>init()</code>{" "}
          (and not tree-shaking it out) is what proves the SDK is linked.
        </p>
        <SdkIntegrationSnippet appId={appId} achievements={achievementIds} />
      </Card>

      <Card className="space-y-3 p-5">
        <h4 className="text-[14px] font-semibold text-foreground">3. Ship a manifest</h4>
        <p className="text-[12.5px] text-foreground/75">
          Place <code>dreamworks.manifest.json</code> at the root of the .zip
          you upload to <span className="text-foreground">Builds & Branches</span>.
          Below is a manifest pre-filled with your app ID and the achievements
          you've defined.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={copyManifest}>
            {copiedManifest ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy JSON
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={downloadManifest}>
            <Download className="h-3.5 w-3.5" /> Download manifest
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-input p-3 text-[12px] leading-relaxed text-foreground/90">
          <code>{manifest}</code>
        </pre>
      </Card>

      <Card className="space-y-2 p-5">
        <h4 className="text-[14px] font-semibold text-foreground">
          4. What we validate
        </h4>
        <ul className="space-y-1 text-[12.5px] text-foreground/75">
          <li>
            <strong className="text-foreground">Manifest</strong> — the{" "}
            <code>appId</code> matches this app, the SDK version is{" "}
            <code>{">="}0.1.0</code>, and every achievement ID exists in your
            portal.
          </li>
          <li>
            <strong className="text-foreground">Binary</strong> — the SDK marker
            string is present in your executable.
          </li>
          <li>
            <strong className="text-foreground">Runtime handshake</strong> — at
            least one launched copy of the build has phoned home from{" "}
            <code>init()</code>.
          </li>
        </ul>
      </Card>
    </div>
  );
}
