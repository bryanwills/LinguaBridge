/**
 * BCP-47 language codes supported by the MVP.
 * Bryan defaults to en-US; Gleny defaults to es-PE.
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en-US", label: "English (US)", nativeLabel: "English (US)" },
  { code: "es-PE", label: "Spanish (Peru)", nativeLabel: "Español (Perú)" },
  { code: "es-ES", label: "Spanish (Spain)", nativeLabel: "Español (España)" },
] as const;

export type SupportedLanguageCode =
  (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const DEFAULT_SOURCE_LANGUAGE: SupportedLanguageCode = "en-US";
export const DEFAULT_TARGET_LANGUAGE: SupportedLanguageCode = "es-PE";

export function isSupportedLanguage(
  code: string,
): code is SupportedLanguageCode {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code);
}

export function languageLabel(code: string): string {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code)?.label ?? code;
}
