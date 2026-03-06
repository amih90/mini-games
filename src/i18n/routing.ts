import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'he', 'zh', 'es'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});

// RTL locales
export const rtlLocales: Locale[] = ['he'];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
