import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import en from "./en.json";
import ptBR from "./pt-BR.json";

export type Locale = "en" | "pt-BR";

type Translations = typeof en;

const dictionaries: Record<Locale, Translations> = {
  en: en,
  "pt-BR": ptBR,
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

function detectLocale(): Locale {
  // Check localStorage first
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("locale");
    if (saved === "en" || saved === "pt-BR") return saved;

    // Auto-detect from browser
    const browserLang = navigator.language;
    if (browserLang === "pt-BR" || browserLang.startsWith("pt")) return "pt-BR";
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  useEffect(() => {
    // Update the <html lang> attribute client-side
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = (key: keyof Translations): string => {
    return dictionaries[locale][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
