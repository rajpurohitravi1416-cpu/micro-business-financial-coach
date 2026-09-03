import en from "./en";
import hi from "./hi";
import { regional } from "./regional";
import { useEffect, useState } from "react";

export const languages = { en, hi, ...regional } as const;

export const languageOptions = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "hinglish", name: "Hinglish", nativeName: "Hinglish" },
] as const;

export type LanguageCode =
  typeof languageOptions[number]["code"];

const STORAGE_KEY = "bizz-brains-language";

export function getLanguage(): LanguageCode {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (
    languageOptions.some(
      language => language.code === saved
    )
  ) {
    return saved as LanguageCode;
  }

  return "en";
}

export function setLanguage(language: LanguageCode) {
  localStorage.setItem(STORAGE_KEY, language);
  window.dispatchEvent(new Event("languagechange"));
}

export function getTranslations() {
  const language = getLanguage();
  if (language === "en") return en;
  if (language === "hi") return hi;
  const override = (regional as any)[language] || {};
  return {
    ...en,
    ...override,
    common: { ...en.common, ...(override.common || {}) },
    nav: { ...en.nav, ...(override.nav || {}) },
    dashboard: { ...en.dashboard, ...(override.dashboard || {}) },
    actions: { ...en.actions, ...(override.actions || {}) },
    sales: { ...en.sales, ...(override.sales || {}) },
    purchases: { ...en.purchases, ...(override.purchases || {}) },
    products: { ...en.products, ...(override.products || {}) },
    inventory: { ...en.inventory, ...(override.inventory || {}) },
    expenses: { ...en.expenses, ...(override.expenses || {}) },
    udhaar: { ...en.udhaar, ...(override.udhaar || {}) },
    customers: { ...en.customers, ...(override.customers || {}) },
    coach: { ...en.coach, ...(override.coach || {}) },
    settings: { ...en.settings, ...(override.settings || {}) },
  };
}

export function useLanguage() {
  const [language, setCurrent] = useState<LanguageCode>(getLanguage());
  useEffect(() => {
    const onChange = () => setCurrent(getLanguage());
    window.addEventListener("languagechange", onChange);
    return () => window.removeEventListener("languagechange", onChange);
  }, []);
  return language;
}
