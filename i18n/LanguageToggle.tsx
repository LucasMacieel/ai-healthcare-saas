import { useLanguage } from './LanguageContext';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      id="language-toggle"
      type="button"
      onClick={() => setLocale(locale === 'en' ? 'pt-BR' : 'en')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
      aria-label="Toggle language"
    >
      <span>{locale === 'en' ? '🇺🇸' : '🇧🇷'}</span>
      <span>{locale === 'en' ? 'EN' : 'PT'}</span>
    </button>
  );
}
