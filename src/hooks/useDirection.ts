'use client';

import { useLocale } from 'next-intl';
import { getLocaleDirection, TextDirection, type Locale } from '@/i18n/routing';

export function useDirection(): TextDirection {
  const locale = useLocale();
  return getLocaleDirection(locale as Locale);
}
