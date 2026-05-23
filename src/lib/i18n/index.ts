import { useCallback } from "react";
import { useUiStore } from "@/stores/ui-store";
import { dictionaries, LANG_NAME_TO_CODE, type LangCode } from "./dictionaries";

export type { LangCode } from "./dictionaries";

export function langNameToCode(name: string | undefined | null): LangCode {
  if (!name) return "en";
  return LANG_NAME_TO_CODE[name] ?? "en";
}

type TranslateVars = Record<string, string | number>;

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : `{${k}}`,
  );
}

/**
 * UI chrome translator. The English source string IS the lookup key — missing
 * translations fall back through English to the raw key, so it's always safe
 * to call `t("Some new string")` even before that string is added to a
 * non-English dictionary.
 */
export function useTranslation() {
  const language = useUiStore((s) => s.settings.language);
  const langCode = langNameToCode(language);

  const t = useCallback(
    (key: string, vars?: TranslateVars): string => {
      const localized = dictionaries[langCode]?.[key];
      if (localized) return interpolate(localized, vars);
      const englishFallback = dictionaries.en[key];
      if (englishFallback) return interpolate(englishFallback, vars);
      return interpolate(key, vars);
    },
    [langCode],
  );

  return { t, langCode, language };
}
