import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  appId: string;
  achievements?: string[];
  className?: string;
}

export function SdkIntegrationSnippet({ appId, achievements = [], className }: Props) {
  const [copied, setCopied] = useState(false);

  const example = achievements[0] ?? "ach_first_steps";
  const snippet = [
    `import { DreamworksAPI } from "@dreamworks/sdk";`,
    ``,
    `DreamworksAPI.init({`,
    `  appId: "${appId}",`,
    `  buildLabel: "0.1.0",`,
    `});`,
    ``,
    `// Unlock when the player earns it:`,
    `DreamworksAPI.unlockAchievement("${example}");`,
    `DreamworksAPI.runCallbacks();`,
  ].join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be unavailable; no-op */
    }
  };

  return (
    <Card className={cn("space-y-2 p-4", className)}>
      <header className="flex items-center justify-between gap-2">
        <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted/60">
          Drop-in snippet
        </h4>
        <Button variant="ghost" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </Button>
      </header>
      <pre className="overflow-x-auto rounded-lg bg-input p-3 text-[12px] leading-relaxed text-foreground/90">
        <code>{snippet}</code>
      </pre>
    </Card>
  );
}
