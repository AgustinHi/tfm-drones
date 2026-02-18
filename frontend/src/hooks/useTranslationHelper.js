import { useTranslation } from "react-i18next";

export function useTranslationHelper() {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language || "es").startsWith("en");

  const tv = (key, es, en, opts = {}) =>
    t(key, { defaultValue: isEn ? en : es, ...opts });

  return { t, tv, isEn, i18n };
}
