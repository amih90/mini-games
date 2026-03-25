import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { GamesPageContent } from './GamesPageContent';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface GamesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function GamesPage({ params }: GamesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense>
      <GamesPageContent />
    </Suspense>
  );
}
