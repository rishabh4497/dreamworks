import { useState } from "react";
import { Briefcase, Building, Mail, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { inviteCreator, lookupUserByEmail } from "@/lib/api/admin";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

type Kind = "developer" | "publisher";

interface LookupResult {
  uid: string | null;
  email: string;
  displayName?: string;
  hasMfa?: boolean;
  lastSignInAt?: string | null;
}

export function InviteCreatorPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<Kind>("developer");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [brand, setBrand] = useState({
    name: "",
    brandColor: "#66c0f4",
    logoUrl: "",
    bannerUrl: "",
    tagline: "",
    about: "",
    websiteUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    mode: "direct" | "invite";
    magicLink?: string;
    entityId?: string;
  } | null>(null);

  async function doLookup() {
    if (!email) return;
    setLookupBusy(true);
    try {
      const res = await lookupUserByEmail(email);
      setLookup(res);
      setStep(2);
    } catch (err) {
      toast.error((err as Error).message ?? "Lookup failed");
    } finally {
      setLookupBusy(false);
    }
  }

  async function submit() {
    if (!brand.name || !brand.logoUrl || !brand.tagline) {
      toast.error("Name, logo, tagline are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await inviteCreator({
        email,
        kind,
        brand,
      });
      setResult({
        mode: res.mode,
        magicLink: "magicLink" in res ? res.magicLink : undefined,
        entityId: "entityId" in res ? res.entityId : undefined,
      });
      setStep(3);
      toast.success(res.mode === "direct" ? "Creator added" : "Invite sent");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to invite");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/50">
          <Mail className="h-3 w-3" />
          Invite creator
        </p>
        <h2 className="text-[18px] font-semibold text-foreground">Onboard developer or publisher</h2>
        <p className="mt-1 max-w-2xl text-[12.5px] text-muted/65">
          Enter a target email, choose what kind of creator they should be, fill in
          their brand details. If they already have an account, the entity is
          created and their role flips immediately. Otherwise, a magic-link
          invite is generated and emailed.
        </p>
      </header>

      <Stepper step={step} />

      {step === 1 && (
        <Card className="p-5">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <KindToggle kind={kind} onChange={setKind} />
            </div>
            <label className="block">
              <span className="mb-1 block text-[10.5px] uppercase tracking-widest text-muted/55">
                Recipient email
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@example.com"
                  className="flex-1 rounded-md bg-input px-3 py-2 text-[12.5px] text-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={doLookup}
                  disabled={lookupBusy || !email}
                  className="rounded-md bg-acid px-3 py-2 text-[12px] font-semibold text-background hover:bg-acid/80 disabled:opacity-50"
                >
                  <Search className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
                  {lookupBusy ? "Searching…" : "Continue"}
                </button>
              </div>
            </label>
          </div>
        </Card>
      )}

      {step === 2 && lookup && (
        <Card className="p-5 space-y-4">
          <div className="rounded-lg border border-separator bg-input p-3">
            {lookup.uid ? (
              <>
                <p className="text-[10.5px] uppercase tracking-widest text-muted/55">Found user</p>
                <p className="mt-1 text-[13px] font-medium text-foreground/85">
                  {lookup.displayName ?? lookup.email}
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted/60">
                  {lookup.email}
                  {lookup.hasMfa && <span className="ml-2 text-green/85">2FA enrolled</span>}
                </p>
                <p className="mt-1 text-[11px] text-muted/55">
                  Submit will create the entity and flip their role to <strong>{kind}</strong> immediately.
                </p>
              </>
            ) : (
              <>
                <p className="text-[10.5px] uppercase tracking-widest text-muted/55">No account yet</p>
                <p className="mt-1 text-[13px] font-medium text-foreground/85">{email}</p>
                <p className="mt-1 text-[11px] text-muted/55">
                  A magic-link invite will be generated. The recipient signs up via
                  the link, which auto-claims the invite and flips their role.
                </p>
              </>
            )}
          </div>
          <BrandForm brand={brand} onChange={setBrand} kind={kind} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md px-3 py-1.5 text-[12px] text-muted/75 hover:bg-card-hover"
            >
              Back
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded-md bg-acid px-3 py-1.5 text-[12.5px] font-semibold text-background hover:bg-acid/80 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : lookup.uid ? "Grant role" : "Send invite"}
            </button>
          </div>
        </Card>
      )}

      {step === 3 && result && (
        <Card className="p-5 space-y-3">
          <p className="text-[14px] font-semibold text-green">
            {result.mode === "direct" ? "Creator added" : "Invite issued"}
          </p>
          {result.entityId && (
            <p className="text-[12.5px] text-muted/65">
              Entity slug: <span className="font-mono text-foreground/85">{result.entityId}</span>
            </p>
          )}
          {result.magicLink && (
            <div className="rounded-md bg-input p-2.5 text-[11px]">
              <p className="mb-1 text-muted/55">Magic link (copy if email delivery fails):</p>
              <p className="break-all font-mono text-foreground/85">{result.magicLink}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setEmail("");
              setLookup(null);
              setBrand({ ...brand, name: "", logoUrl: "", tagline: "" });
              setResult(null);
            }}
            className="rounded-md bg-acid px-3 py-1.5 text-[12px] font-semibold text-background hover:bg-acid/80"
          >
            Invite another
          </button>
        </Card>
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ["Recipient", "Brand details", "Done"];
  return (
    <ol className="flex items-center gap-3 text-[11.5px]">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-semibold",
              step > i + 1
                ? "bg-green/20 text-green"
                : step === i + 1
                  ? "bg-acid text-background"
                  : "bg-input text-muted/55",
            )}
          >
            {i + 1}
          </span>
          <span className={step === i + 1 ? "text-foreground/85" : "text-muted/55"}>{label}</span>
          {i < steps.length - 1 && <span className="text-muted/30">→</span>}
        </li>
      ))}
    </ol>
  );
}

function KindToggle({ kind, onChange }: { kind: Kind; onChange: (k: Kind) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-input p-1">
      <button
        type="button"
        onClick={() => onChange("developer")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium",
          kind === "developer" ? "bg-card-active text-foreground" : "text-muted/65",
        )}
      >
        <Building className="h-3.5 w-3.5" />
        Developer (Studio)
      </button>
      <button
        type="button"
        onClick={() => onChange("publisher")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium",
          kind === "publisher" ? "bg-card-active text-foreground" : "text-muted/65",
        )}
      >
        <Briefcase className="h-3.5 w-3.5" />
        Publisher
      </button>
    </div>
  );
}

interface BrandFormProps {
  brand: {
    name: string;
    brandColor: string;
    logoUrl: string;
    bannerUrl: string;
    tagline: string;
    about: string;
    websiteUrl: string;
  };
  onChange: (b: BrandFormProps["brand"]) => void;
  kind: Kind;
}

function BrandForm({ brand, onChange, kind }: BrandFormProps) {
  function patch<K extends keyof BrandFormProps["brand"]>(key: K, value: BrandFormProps["brand"][K]) {
    onChange({ ...brand, [key]: value });
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <span className="mb-1 block text-[10.5px] uppercase tracking-widest text-muted/55">
          {kind === "developer" ? "Studio name" : "Publisher name"}
        </span>
        <input
          value={brand.name}
          onChange={(e) => patch("name", e.target.value)}
          className="w-full rounded-md bg-input px-3 py-2 text-[12.5px] text-foreground outline-none"
        />
      </div>
      <label>
        <span className="mb-1 block text-[10.5px] uppercase tracking-widest text-muted/55">Brand color</span>
        <input
          type="color"
          value={brand.brandColor}
          onChange={(e) => patch("brandColor", e.target.value)}
          className="h-10 w-full rounded-md bg-input"
        />
      </label>
      <label>
        <span className="mb-1 block text-[10.5px] uppercase tracking-widest text-muted/55">Logo URL</span>
        <input
          value={brand.logoUrl}
          onChange={(e) => patch("logoUrl", e.target.value)}
          className="w-full rounded-md bg-input px-3 py-2 text-[12.5px] text-foreground outline-none"
        />
      </label>
      <label className="md:col-span-2">
        <span className="mb-1 block text-[10.5px] uppercase tracking-widest text-muted/55">Banner URL (optional)</span>
        <input
          value={brand.bannerUrl}
          onChange={(e) => patch("bannerUrl", e.target.value)}
          className="w-full rounded-md bg-input px-3 py-2 text-[12.5px] text-foreground outline-none"
        />
      </label>
      <label className="md:col-span-2">
        <span className="mb-1 block text-[10.5px] uppercase tracking-widest text-muted/55">Tagline</span>
        <input
          value={brand.tagline}
          onChange={(e) => patch("tagline", e.target.value)}
          className="w-full rounded-md bg-input px-3 py-2 text-[12.5px] text-foreground outline-none"
        />
      </label>
      <label className="md:col-span-2">
        <span className="mb-1 block text-[10.5px] uppercase tracking-widest text-muted/55">About</span>
        <textarea
          value={brand.about}
          onChange={(e) => patch("about", e.target.value)}
          rows={3}
          className="w-full rounded-md bg-input px-3 py-2 text-[12.5px] text-foreground outline-none"
        />
      </label>
      <label className="md:col-span-2">
        <span className="mb-1 block text-[10.5px] uppercase tracking-widest text-muted/55">Website (optional)</span>
        <input
          value={brand.websiteUrl}
          onChange={(e) => patch("websiteUrl", e.target.value)}
          className="w-full rounded-md bg-input px-3 py-2 text-[12.5px] text-foreground outline-none"
        />
      </label>
    </div>
  );
}
