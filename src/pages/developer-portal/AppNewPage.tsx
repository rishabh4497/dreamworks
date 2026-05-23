import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/routes";
import { useCreateApp } from "@/hooks/use-apps";
import { useMyDeveloper, useSaveDeveloper } from "@/hooks/use-developer";
import { useMyPublisher, useSavePublisher } from "@/hooks/use-publisher";
import { toast } from "@/stores/toast-store";
import { slugify } from "@/lib/utils";

export function AppNewPage() {
  const navigate = useNavigate();
  const { data: myDev } = useMyDeveloper();
  const { data: myPub } = useMyPublisher();
  const createApp = useCreateApp();
  const saveDeveloper = useSaveDeveloper();
  const savePublisher = useSavePublisher();

  const [title, setTitle] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [publisherName, setPublisherName] = useState("");
  const [selfPublish, setSelfPublish] = useState(true);

  const effectiveDeveloperName = developerName || myDev?.name || "";
  const effectivePublisherName = selfPublish
    ? effectiveDeveloperName
    : publisherName || myPub?.name || "";

  const canSubmit =
    title.trim().length > 0 &&
    effectiveDeveloperName.trim().length > 0 &&
    effectivePublisherName.trim().length > 0 &&
    !createApp.isPending;

  const handleCreate = async () => {
    const devName = effectiveDeveloperName.trim();
    const pubName = effectivePublisherName.trim();
    const devId = slugify(devName);
    const pubId = slugify(pubName);

    try {
      // Ensure the developer and publisher entities exist before linking the app.
      if (!myDev || myDev.id !== devId) {
        await saveDeveloper.mutateAsync({
          id: devId,
          name: devName,
          brandColor: myDev?.brandColor ?? "#66c0f4",
          logoUrl: myDev?.logoUrl ?? "",
          tagline: myDev?.tagline ?? `${devName} catalog`,
        });
      }
      if (!myPub || myPub.id !== pubId) {
        await savePublisher.mutateAsync({
          id: pubId,
          name: pubName,
          brandColor: myPub?.brandColor ?? "#66c0f4",
          logoUrl: myPub?.logoUrl ?? "",
          tagline: myPub?.tagline ?? `Published by ${pubName}`,
        });
      }
      const created = await createApp.mutateAsync({
        title: title.trim(),
        developerId: devId,
        publisherId: pubId,
      });
      toast.success(`Created ${created.gameTitle}`);
      navigate(ROUTES.devAppStorePage(created.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create app.";
      toast.error(msg);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl p-6">
      <h2 className="text-[18px] font-semibold text-foreground">Create a new app</h2>
      <p className="mt-1 text-[13px] text-muted/65">
        Each app gets its own store page, builds, achievements, and pricing.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Game title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Moonlit Express"
          />
        </Field>

        <Field label="Developer (studio name)">
          <Input
            value={developerName || myDev?.name || ""}
            onChange={(e) => setDeveloperName(e.target.value)}
            placeholder={myDev?.name || "Signal Bloom Studio"}
          />
          <p className="mt-1 text-[11px] text-muted/55">
            This becomes a slug at <code className="text-muted/70">/developer/{slugify(effectiveDeveloperName) || "your-studio"}</code>.
          </p>
        </Field>

        <label className="flex items-center gap-2 rounded-xl bg-card-active/45 p-3 text-[13px] text-foreground">
          <input
            type="checkbox"
            checked={selfPublish}
            onChange={(e) => setSelfPublish(e.target.checked)}
            className="h-4 w-4 accent-acid"
          />
          Self-publish (use my studio as the publisher)
        </label>

        {!selfPublish && (
          <Field label="Publisher">
            <Input
              value={publisherName || myPub?.name || ""}
              onChange={(e) => setPublisherName(e.target.value)}
              placeholder={myPub?.name || "Signal Bloom Publishing"}
            />
            <p className="mt-1 text-[11px] text-muted/55">
              Public homepage at <code className="text-muted/70">/publisher/{slugify(effectivePublisherName) || "your-publisher"}</code>.
            </p>
          </Field>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => navigate(ROUTES.devApps)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canSubmit}>
            <Plus className="h-4 w-4" />
            {createApp.isPending ? "Creating…" : "Create app"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted/50">
        {label}
      </span>
      {children}
    </label>
  );
}
