import { useState } from "react";
import { CheckCircle2, Globe, Loader2, Wand2 } from "lucide-react";
import { useAILocalize } from "@/hooks/use-ai";

interface Props {
  sourceText?: string;
  sourceLanguage?: string;
  targetLanguages?: string[];
  context?: string;
}

const DEFAULT_TARGETS = [
  "fr",
  "de",
  "es",
  "pt-BR",
  "ja",
  "ko",
  "zh-CN",
  "ru",
  "it",
  "tr",
  "pl",
  "nl",
  "ar",
  "vi",
  "id",
];

export function AILocalization({
  sourceText = "Welcome to the storefront. Browse, wishlist, and play thousands of games.",
  sourceLanguage = "en",
  targetLanguages = DEFAULT_TARGETS,
  context = "Store page header",
}: Props) {
  const localize = useAILocalize();
  const [showAll, setShowAll] = useState(false);

  const onRun = () => {
    localize.mutate({ sourceLanguage, sourceText, targetLanguages, context });
  };

  const translations = localize.data?.translations ?? {};
  const entries = Object.entries(translations);

  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2">
        <Globe className="h-5 w-5 text-cyan" /> AI Localization Pipeline
      </h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">
        Instantly draft translations for your store page and basic UI strings into{" "}
        {targetLanguages.length} languages.
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={onRun}
          disabled={localize.isPending}
          className="bg-cyan/20 text-cyan px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-2 hover:bg-cyan/30 disabled:opacity-50 cursor-pointer"
        >
          {localize.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}{" "}
          {localize.isPending ? "Translating…" : "Generate Translations"}
        </button>
        <span className="text-[12px] text-muted flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-positive" /> {sourceLanguage.toUpperCase()} base
          language
        </span>
      </div>
      {entries.length > 0 && (
        <div className="mt-4 space-y-2">
          {(showAll ? entries : entries.slice(0, 5)).map(([lang, text]) => (
            <div
              key={lang}
              className="rounded-lg border border-separator bg-card-active p-3 text-[12px]"
            >
              <span className="font-bold text-cyan uppercase mr-2">{lang}</span>
              <span className="text-foreground/80">{text}</span>
            </div>
          ))}
          {entries.length > 5 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-[11px] text-acid hover:underline"
            >
              {showAll ? "Hide" : `Show all ${entries.length}`}
            </button>
          )}
        </div>
      )}
      {localize.error && (
        <p className="mt-2 text-[11px] text-red">{localize.error.message}</p>
      )}
    </div>
  );
}
