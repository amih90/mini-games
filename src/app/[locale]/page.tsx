import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getAllGames } from '@/features/games/registry';
import { routing, type Locale } from '@/i18n/routing';
import { HomePageClient } from '@/components/HomePageClient';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent locale={locale as Locale} />;
}

function HomeContent({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const allGames = getAllGames();

  const translations = {
    appName: t('common.appName'),
    games: t('common.games'),
    homeTitle: t('home.title'),
    homeSubtitle: t('home.subtitle'),
    playNow: t('home.playNow'),
    play: t('common.play'),
    featuredGames: t('home.featuredGames'),
    categories: locale === 'he' ? 'קטגוריות' : 'Categories',
    readyToPlay: locale === 'he' ? 'מוכנים לשחק?' : 'Ready to Play?',
    readyToPlayDesc: locale === 'he' 
      ? 'בחרו משחק והתחילו ליהנות! כל המשחקים בטוחים וחינוכיים לילדים.'
      : 'Choose a game and start having fun! All games are safe and educational for kids.',
    seeAllGames: locale === 'he' ? 'לכל המשחקים' : 'See All Games',
  };

  return (
    <HomePageClient 
      locale={locale} 
      translations={translations} 
      allGames={allGames} 
    />
  );
}
