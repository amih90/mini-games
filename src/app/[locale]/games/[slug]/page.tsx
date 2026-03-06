import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getGameBySlug, getAllGameSlugs } from '@/features/games/registry';
import { GameLoader } from '@/features/games/shared/GameLoader';

// Generate static params for all games and locales
export function generateStaticParams() {
  const slugs = getAllGameSlugs();
  const params: { locale: string; slug: string }[] = [];

  for (const locale of routing.locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }

  return params;
}

interface GamePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const gameConfig = getGameBySlug(slug);

  if (!gameConfig) {
    notFound();
  }

  return <GameLoader slug={slug} />;
}
