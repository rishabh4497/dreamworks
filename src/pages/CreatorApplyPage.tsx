import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Briefcase, Building, Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { submitCreatorApplication } from "@/lib/api/creator-applications";
import { toast } from "@/stores/toast-store";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Kind = "developer" | "publisher";

export function CreatorApplyPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const [kind, setKind] = useState<Kind>("developer");
  const [brand, setBrand] = useState({
    name: "",
    brandColor: "#66c0f4",
    logoUrl: "",
    tagline: "",
    about: "",
    websiteUrl: "",
  });
  const [pitch, setPitch] = useState("");
  const [links, setLinks] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const alreadyCreator =
    profile?.role === "developer" ||
    profile?.role === "publisher" ||
    profile?.role === "admin" ||
    profile?.role === "owner";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pitch.length < 20) {
      toast.error("Tell us a bit more about why you want to sell on Dreamworks.");
      return;
    }
    setSubmitting(true);
    try {
      const linkList = links
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      await submitCreatorApplication({
        kind,
        brand: { ...brand, bannerUrl: undefined, socialLinks: undefined, about: brand.about || undefined, websiteUrl: brand.websiteUrl || undefined },
        pitch,
        links: linkList,
      });
      setSubmitted(true);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (alreadyCreator) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl py-12"
      >
        <Card className="p-6 text-center space-y-3">
          <Sparkles className="mx-auto h-6 w-6 text-acid" />
          <h2 className="text-[16px] font-semibold text-foreground">
            You're already a creator
          </h2>
          <p className="text-[13px] text-muted/65">
            Your role is <strong>{profile?.role}</strong> — head to the Developer Portal to
            manage your apps.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.developerPortal)}
            className="rounded-md bg-acid px-4 py-2 text-[13px] font-semibold text-background hover:bg-acid/80"
          >
            Open Developer Portal
          </button>
        </Card>
      </motion.div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl py-12"
      >
        <Card className="p-6 text-center space-y-3">
          <Send className="mx-auto h-6 w-6 text-green" />
          <h2 className="text-[16px] font-semibold text-foreground">Application sent</h2>
          <p className="text-[13px] text-muted/65">
            Thanks for applying! An admin will review and reach out to the email on
            file. Most decisions land within 3 business days.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.store)}
            className="rounded-md bg-input px-4 py-2 text-[13px] font-medium text-foreground/85 hover:bg-card-hover"
          >
            Back to store
          </button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      <header>
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/50">
          <Sparkles className="h-3 w-3" />
          Become a creator
        </p>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          Sell on Dreamworks
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] text-muted/65">
          Apply to publish games as a developer (studio) or publisher. Applications
          are reviewed by our team — you'll hear back via email.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <Card className="p-5 space-y-3">
          <div>
            <p className="mb-2 text-[10.5px] uppercase tracking-widest text-muted/55">Apply as</p>
            <div className="inline-flex rounded-lg bg-input p-1">
              <button
                type="button"
                onClick={() => setKind("developer")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium",
                  kind === "developer" ? "bg-card-active text-foreground" : "text-muted/65",
                )}
              >
                <Building className="h-3.5 w-3.5" />
                Developer (Studio)
              </button>
              <button
                type="button"
                onClick={() => setKind("publisher")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium",
                  kind === "publisher" ? "bg-card-active text-foreground" : "text-muted/65",
                )}
              >
                <Briefcase className="h-3.5 w-3.5" />
                Publisher
              </button>
            </div>
          </div>
          <Field label={kind === "developer" ? "Studio name" : "Publisher name"} required>
            <input
              value={brand.name}
              onChange={(e) => setBrand({ ...brand, name: e.target.value })}
              required
              className="w-full rounded-md bg-input px-3 py-2 text-[13px] text-foreground outline-none"
            />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Logo URL" required>
              <input
                value={brand.logoUrl}
                onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })}
                required
                className="w-full rounded-md bg-input px-3 py-2 text-[13px] text-foreground outline-none"
              />
            </Field>
            <Field label="Brand color">
              <input
                type="color"
                value={brand.brandColor}
                onChange={(e) => setBrand({ ...brand, brandColor: e.target.value })}
                className="h-10 w-full rounded-md bg-input"
              />
            </Field>
          </div>
          <Field label="Tagline" required>
            <input
              value={brand.tagline}
              onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
              required
              className="w-full rounded-md bg-input px-3 py-2 text-[13px] text-foreground outline-none"
            />
          </Field>
          <Field label="About">
            <textarea
              value={brand.about}
              onChange={(e) => setBrand({ ...brand, about: e.target.value })}
              rows={3}
              className="w-full rounded-md bg-input px-3 py-2 text-[13px] text-foreground outline-none"
            />
          </Field>
          <Field label="Website (optional)">
            <input
              value={brand.websiteUrl}
              onChange={(e) => setBrand({ ...brand, websiteUrl: e.target.value })}
              className="w-full rounded-md bg-input px-3 py-2 text-[13px] text-foreground outline-none"
            />
          </Field>
        </Card>

        <Card className="p-5 space-y-3">
          <Field label="Tell us about you and what you want to ship" required>
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              rows={5}
              placeholder="Prior releases, what you're working on, why Dreamworks fits…"
              className="w-full rounded-md bg-input px-3 py-2 text-[13px] text-foreground outline-none"
            />
            <p className="mt-1 text-[10.5px] text-muted/45">
              {pitch.length} characters · minimum 20
            </p>
          </Field>
          <Field label="Portfolio links (one per line)">
            <textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              rows={3}
              placeholder="https://yourstudio.com&#10;https://yourprev-game.com"
              className="w-full rounded-md bg-input px-3 py-2 text-[12px] text-foreground outline-none font-mono"
            />
          </Field>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-acid px-4 py-2 text-[13px] font-semibold text-background hover:bg-acid/80 disabled:opacity-50"
          >
            <Send className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] uppercase tracking-widest text-muted/55">
        {label}
        {required && <span className="ml-1 text-red">*</span>}
      </span>
      {children}
    </label>
  );
}
