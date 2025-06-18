const languageMap = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  nl: "Dutch",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
};

export function resolveLanguageLabel(code) {
  return languageMap[code] || "Unknown";
}
