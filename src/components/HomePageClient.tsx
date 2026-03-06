'use client';

import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/Header';
import type { GameConfig } from '@/features/games/registry/types';
import type { Locale } from '@/i18n/routing';
import { HeroBannerEnhanced } from '@/components/HeroBannerEnhanced';
import { GameCarouselEnhanced } from '@/components/GameCarouselEnhanced';
import { 
  ScrollReveal, 
  StaggerContainer, 
  StaggerItem,
  AnimatedButton,
  ScrollProgress,
  FloatingElement,
  GradientOrbs
} from '@/components/animations';

interface HomePageClientProps {
  locale: Locale;
  translations: {
    appName: string;
    games: string;
    homeTitle: string;
    homeSubtitle: string;
    playNow: string;
    play: string;
    featuredGames: string;
    categories: string;
    readyToPlay: string;
    readyToPlayDesc: string;
    seeAllGames: string;
  };
  allGames: GameConfig[];
}

export function HomePageClient({ locale, translations, allGames }: HomePageClientProps) {
  // Hero banner slides
  const heroSlides = [
    {
      id: 'welcome',
      title: translations.homeTitle,
      subtitle: translations.homeSubtitle,
      emoji: '🎮',
      bgColor: '#6cbe45',
      link: '/games',
      buttonText: translations.playNow,
    },
    {
      id: 'tetris',
      title: locale === 'he' ? 'טטריס' : 'Tetris',
      subtitle: locale === 'he' ? 'סדרו את הבלוקים!' : 'Stack the blocks!',
      emoji: '🧱',
      bgColor: '#a855f7',
      link: '/games/tetris',
      buttonText: translations.play,
    },
    {
      id: 'chicken-invaders',
      title: locale === 'he' ? 'פולשי התרנגולות' : 'Chicken Invaders',
      subtitle: locale === 'he' ? 'הגנו על כדור הארץ!' : 'Defend Earth from chickens!',
      emoji: '🐔',
      bgColor: '#e53935',
      link: '/games/chicken-invaders',
      buttonText: translations.play,
    },
    {
      id: 'flappy-bird',
      title: locale === 'he' ? 'ציפור מעופפת' : 'Flappy Bird',
      subtitle: locale === 'he' ? 'עופו בין הצינורות!' : 'Fly through the pipes!',
      emoji: '🐤',
      bgColor: '#f7941d',
      link: '/games/flappy-bird',
      buttonText: translations.play,
    },
    {
      id: 'color-match',
      title: locale === 'he' ? 'התאמת צבעים' : 'Color Match',
      subtitle: locale === 'he' ? 'גררו צבעים למקום הנכון!' : 'Drag colors to the right place!',
      emoji: '🎨',
      bgColor: '#00a4e4',
      link: '/games/color-match',
      buttonText: translations.play,
    },
    {
      id: 'memory-cards',
      title: locale === 'he' ? 'קלפי זיכרון' : 'Memory Cards',
      subtitle: locale === 'he' ? 'מצאו את הזוגות התואמים!' : 'Find the matching pairs!',
      emoji: '🃏',
      bgColor: '#ec4399',
      link: '/games/memory-cards',
      buttonText: translations.play,
    },
    {
      id: 'snake',
      title: locale === 'he' ? 'נחש' : 'Snake',
      subtitle: locale === 'he' ? 'אכלו פירות וגדלו!' : 'Eat fruits and grow!',
      emoji: '🐍',
      bgColor: '#22c55e',
      link: '/games/snake',
      buttonText: translations.play,
    },
    {
      id: 'brick-breaker',
      title: locale === 'he' ? 'שובר לבנים' : 'Brick Breaker',
      subtitle: locale === 'he' ? 'שברו את הלבנים!' : 'Break all the bricks!',
      emoji: '🧱',
      bgColor: '#3b82f6',
      link: '/games/brick-breaker',
      buttonText: translations.play,
    },
    {
      id: 'dino-run',
      title: locale === 'he' ? 'דינו רץ' : 'Dino Run',
      subtitle: locale === 'he' ? 'קפצו מעל מכשולים!' : 'Jump over obstacles!',
      emoji: '🦖',
      bgColor: '#84cc16',
      link: '/games/dino-run',
      buttonText: translations.play,
    },
    {
      id: 'whack-a-mole',
      title: locale === 'he' ? 'הכה את השומה' : 'Whack-a-Mole',
      subtitle: locale === 'he' ? 'הכו שומות!' : 'Whack the moles!',
      emoji: '🐹',
      bgColor: '#8B4513',
      link: '/games/whack-a-mole',
      buttonText: translations.play,
    },
  ];

  const categories = [
    { emoji: '🎨', label: locale === 'he' ? 'צבעים' : 'Colors', color: '#e53935', gradient: 'from-[#e53935] to-[#ef5350]' },
    { emoji: '🧠', label: locale === 'he' ? 'זיכרון' : 'Memory', color: '#9c27b0', gradient: 'from-[#9c27b0] to-[#ba68c8]' },
    { emoji: '🔢', label: locale === 'he' ? 'חשבון' : 'Math', color: '#00a4e4', gradient: 'from-[#00a4e4] to-[#4fc3f7]' },
    { emoji: '⚡', label: locale === 'he' ? 'תגובה' : 'Reaction', color: '#f7941d', gradient: 'from-[#f7941d] to-[#fbbf24]' },
    { emoji: '👶', label: locale === 'he' ? 'גיל 3-5' : 'Ages 3-5', color: '#ec4399', gradient: 'from-[#ec4399] to-[#f472b6]' },
    { emoji: '🧒', label: locale === 'he' ? 'גיל 6-8' : 'Ages 6-8', color: '#26a69a', gradient: 'from-[#26a69a] to-[#4db6ac]' },
  ];

  return (
    <div className="relative bg-gradient-to-b from-[#1e3a5f] via-[#3a7bd5] to-[#6cbe45] min-h-screen overflow-hidden">
      {/* Scroll progress indicator */}
      <ScrollProgress />

      {/* Background animated orbs */}
      <GradientOrbs />

      {/* Floating decorations */}
      <FloatingElement className="absolute top-32 left-8 text-4xl opacity-50 hidden lg:block" duration={4} amplitude={20}>
        🌟
      </FloatingElement>
      <FloatingElement className="absolute top-48 right-12 text-3xl opacity-50 hidden lg:block" duration={5} delay={1} amplitude={15}>
        ✨
      </FloatingElement>
      <FloatingElement className="absolute top-[60%] left-16 text-3xl opacity-40 hidden lg:block" duration={6} delay={2} amplitude={18}>
        🎈
      </FloatingElement>

      {/* Modern Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Banner Carousel */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <HeroBannerEnhanced slides={heroSlides} autoPlayInterval={6000} />
        </section>

        {/* Featured Games Carousel */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto">
            <GameCarouselEnhanced
              games={allGames}
              locale={locale}
              title={translations.featuredGames}
            />
          </div>
        </section>

        {/* Categories Section - Enhanced */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <ScrollReveal>
            <div className="flex items-center gap-4 mb-8">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: 60 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="h-1 bg-gradient-to-r from-[#ec4399] to-[#a855f7] rounded-full"
              />
              <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
                {translations.categories}
              </h2>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="text-3xl"
              >
                🏷️
              </motion.div>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
            {categories.map((cat, index) => (
              <StaggerItem key={cat.label}>
                <Link href="/games">
                  <motion.div
                    whileHover={{ 
                      scale: 1.08, 
                      y: -8,
                      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)'
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="relative bg-white rounded-2xl p-5 text-center cursor-pointer shadow-lg overflow-hidden group"
                  >
                    {/* Background gradient on hover */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                    />

                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100"
                      initial={{ x: '-200%' }}
                      whileHover={{ x: '200%' }}
                      transition={{ duration: 0.6 }}
                    />

                    {/* Content */}
                    <motion.div
                      className="text-4xl md:text-5xl mb-3"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    >
                      {cat.emoji}
                    </motion.div>
                    <div className="font-bold text-slate-800 text-sm relative z-10">
                      {cat.label}
                    </div>

                    {/* Bottom color bar */}
                    <motion.div
                      className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${cat.gradient}`}
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Call to Action - Enhanced */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <ScrollReveal>
            <motion.div 
              className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-[2rem] p-8 md:p-16 overflow-hidden border border-white/20"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              {/* Animated background shapes */}
              <motion.div
                className="absolute top-10 right-10 w-32 h-32 bg-[#ffdd00]/20 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-10 left-10 w-40 h-40 bg-[#ec4399]/20 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              />

              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="inline-block mb-6"
                >
                  <span className="text-6xl md:text-7xl">🚀</span>
                </motion.div>

                <motion.h2 
                  className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  {translations.readyToPlay}
                </motion.h2>

                <motion.p 
                  className="text-xl text-white/80 mb-8 max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  {translations.readyToPlayDesc}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <Link href="/games">
                    <AnimatedButton variant="glow" size="xl" pulse>
                      {translations.seeAllGames} 🎮
                    </AnimatedButton>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </ScrollReveal>
        </section>

        {/* Bottom spacer */}
        <div className="h-12" />
      </main>
    </div>
  );
}
