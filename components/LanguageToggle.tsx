import { useRouter } from "next/router";

export default function LanguageToggle() {
  const router = useRouter();
  const { locale } = router;

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "pt-BR" : "en";
    router.push(router.asPath, router.asPath, { locale: newLocale });
  };

  return (
    <button
      id="language-toggle"
      type="button"
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-900/40 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/60 transition-all duration-200 shadow-sm"
      aria-label="Toggle language"
    >
      <span>{locale === "en" ? "🇺🇸" : "🇧🇷"}</span>
      <span>{locale === "en" ? "EN" : "PT"}</span>
    </button>
  );
}
