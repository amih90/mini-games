'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { locales, type Locale } from '@/i18n/routing';

const localeNames: Record<Locale, string> = {
  en: 'English',
  he: 'עברית',
  zh: '中文',
  es: 'Español',
};

const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  he: '🇮🇱',
  zh: '🇨🇳',
  es: '🇪🇸',
};

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex gap-2" role="group" aria-label="Language switcher">
      {locales.map((loc) => (
        <motion.button
          key={loc}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleLocaleChange(loc)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-lg font-medium transition-colors',
            'min-h-[48px] min-w-[48px]',
            'focus:outline-none focus:ring-4 focus:ring-white/50',
            locale === loc
              ? 'bg-[#ffdd00] text-slate-800 shadow-md'
              : 'bg-white/90 text-slate-700 hover:bg-white'
          )}
          aria-pressed={locale === loc}
          aria-label={`Switch to ${localeNames[loc]}`}
        >
          <span className="text-2xl" aria-hidden="true">
            {localeFlags[loc]}
          </span>
          <span className="hidden sm:inline">{localeNames[loc]}</span>
        </motion.button>
      ))}
    </div>
  );
}
