import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building, ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { toast } from "@/stores/toast-store";
import { useMyDeveloper, useSaveDeveloper } from "@/hooks/use-developer";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";
import type { CreatorSocialLinks } from "@/lib/types";

export function StudioProfileEditor() {
  const { data: dev, isLoading } = useMyDeveloper();
  const saveDev = useSaveDeveloper();

  const [name, setName] = useState("");
  const [brandColor, setBrandColor] = useState("#66c0f4");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [social, setSocial] = useState<CreatorSocialLinks>({});

  useEffect(() => {
    if (!dev) return;
    setName(dev.name ?? "");
    setBrandColor(dev.brandColor ?? "#66c0f4");
    setLogoUrl(dev.logoUrl ?? "");
    setBannerUrl(dev.bannerUrl ?? "");
    setTagline(dev.tagline ?? "");
    setAbout(dev.about ?? "");
    setWebsiteUrl(dev.websiteUrl ?? "");
    setSocial(dev.socialLinks ?? {});
  }, [dev]);

  if (isLoading) {
    return <Card className="p-6 text-[13px] text-muted/65">Loading studio…</Card>;
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Studio name is required.");
      return;
    }
    try {
      await saveDev.mutateAsync({
        id: dev?.id ?? slugify(name),
        name: name.trim(),
        brandColor,
        logoUrl,
        bannerUrl: bannerUrl || undefined,
        tagline,
        about: about || undefined,
        websiteUrl: websiteUrl || undefined,
        socialLinks: social,
      });
      toast.success("Studio profile saved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed.";
      toast.error(msg);
    }
  };

  const publicSlug = dev?.id ?? slugify(name);
  const logoPath = publicSlug ? `dw_developers/${publicSlug}/logo` : undefined;
  const bannerPath = publicSlug ? `dw_developers/${publicSlug}/banner` : undefined;

  return (
    <Card className="mx-auto max-w-3xl space-y-5 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-[18px] font-semibold text-foreground">
            <Building className="h-4 w-4 text-muted/60" /> Studio profile
          </h2>
          <p className="mt-1 text-[12px] text-muted/65">
            This is the developer/studio identity. Each game you own can reference it. Edits show on
            your public Creator Homepage.
          </p>
        </div>
        {publicSlug && (
          <Link
            to={ROUTES.developer(publicSlug)}
            className="inline-flex items-center gap-1 text-[12px] text-acid hover:underline"
          >
            View public page <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Studio name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Brand color">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border border-separator bg-transparent"
            />
            <Input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="font-mono"
            />
          </div>
        </Field>
        <Field label="Tagline" className="md:col-span-2">
          <Input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Cozy, hand-tooled simulations crafted in Hyderabad."
          />
        </Field>
        <Field label="About" className="md:col-span-2">
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="min-h-24 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
          />
        </Field>
        <ImageDropzone
          label="Studio logo"
          value={logoUrl}
          onChange={setLogoUrl}
          storagePath={logoPath}
        />
        <ImageDropzone
          label="Banner"
          value={bannerUrl}
          onChange={setBannerUrl}
          storagePath={bannerPath}
        />
        <Field label="Website" className="md:col-span-2">
          <Input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://signalbloom.studio"
          />
        </Field>
        <Field label="Twitter / X">
          <Input
            value={social.twitter ?? ""}
            onChange={(e) => setSocial({ ...social, twitter: e.target.value })}
            placeholder="@studio"
          />
        </Field>
        <Field label="Discord">
          <Input
            value={social.discord ?? ""}
            onChange={(e) => setSocial({ ...social, discord: e.target.value })}
            placeholder="discord.gg/…"
          />
        </Field>
        <Field label="YouTube">
          <Input
            value={social.youtube ?? ""}
            onChange={(e) => setSocial({ ...social, youtube: e.target.value })}
          />
        </Field>
        <Field label="Twitch">
          <Input
            value={social.twitch ?? ""}
            onChange={(e) => setSocial({ ...social, twitch: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-muted/55">
          Public URL: <code className="text-muted/75">/developer/{publicSlug || "your-studio"}</code>
        </p>
        <Button onClick={handleSave} disabled={saveDev.isPending}>
          <Save className="h-4 w-4" /> {saveDev.isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </Card>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted/50">
        {label}
      </span>
      {children}
    </label>
  );
}
