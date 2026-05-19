"use client";

import { useInterfaceSettings } from "@/hooks/useInterfaceSettings";
import type { SettingsLanguage } from "@/lib/settings-preferences";

export type LocalizedText = {
  en: string;
  mn: string;
};

export function getLocalizedText(
  language: SettingsLanguage,
  text: LocalizedText
) {
  return language === "mn" ? text.mn : text.en;
}

export function useAppLanguage() {
  const { settings, updateSettings } = useInterfaceSettings();
  const language = settings.language;
  const isMn = language === "mn";

  function t(text: LocalizedText) {
    return getLocalizedText(language, text);
  }

  function updateLanguage(nextLanguage?: SettingsLanguage) {
    const languageToApply = nextLanguage ?? (isMn ? "en" : "mn");

    return updateSettings({
      ...settings,
      language: languageToApply,
    });
  }

  return {
    interfaceSettings: settings,
    isMn,
    language,
    t,
    updateLanguage,
  };
}
