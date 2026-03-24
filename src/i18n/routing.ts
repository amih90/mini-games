import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'he', 'zh', 'es'] as const;
export type Locale = (typeof locales)[number];

export enum TextDirection {
  LTR = 'ltr',
  RTL = 'rtl',
}

export const localeDirection: Record<Locale, TextDirection> = {
  en: TextDirection.LTR,
  he: TextDirection.RTL,
  zh: TextDirection.LTR,
  es: TextDirection.LTR,
};

export function getLocaleDirection(locale: Locale): TextDirection {
  return localeDirection[locale] ?? TextDirection.LTR;
}

export function isRtlLocale(locale: Locale): boolean {
  return getLocaleDirection(locale) === TextDirection.RTL;
}

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});
