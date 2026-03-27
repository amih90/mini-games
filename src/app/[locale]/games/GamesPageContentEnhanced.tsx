'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { getAllGames, getAllCategories, getGamesByCategory, type GameCategory } from '@/features/games/registry';
import type { Locale } from '@/i18n/routing';
import { ScrollReveal, GradientOrbs } from '@/components/animations';
import { trackGameCardClick } from '@/lib/gtag';

export function GamesPageContent() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const categories = getAllCategories();
  const categoryParam = searchParams.get('category');
  const selectedCategory: GameCategory | null =
    categoryParam && categories.includes(categoryParam as GameCategory)
      ? (categoryParam as GameCategory)
      : null;

  const setSelectedCategory = useCallback(
    (category: GameCategory | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category) {
        params.set('category', category);
      } else {
        params.delete('category');
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const games = useMemo(() => {
    if (selectedCategory) {
      return getGamesByCategory(selectedCategory);
    }
    return getAllGames();
  }, [selectedCategory]);

  const categoryData: Record<string, { emoji: string; color: string; gradient: string }> = {
    colors: { emoji: '🎨', color: '#e53935', gradient: 'from-red-500 to-orange-500' },
    memory: { emoji: '🧠', color: '#9c27b0', gradient: 'from-purple-500 to-pink-500' },
    math: { emoji: '🔢', color: '#00a4e4', gradient: 'from-blue-500 to-cyan-500' },
    reaction: { emoji: '⚡', color: '#f7941d', gradient: 'from-yellow-500 to-amber-500' },
    shapes: { emoji: '🔷', color: '#f59e0b', gradient: 'from-amber-500 to-yellow-500' },
    patterns: { emoji: '🔮', color: '#8b5cf6', gradient: 'from-violet-500 to-indigo-500' },
    language: { emoji: '📖', color: '#10b981', gradient: 'from-green-500 to-emerald-500' },
    science: { emoji: '🔬', color: '#06b6d4', gradient: 'from-cyan-500 to-sky-500' },
    'ages-3-5': { emoji: '👶', color: '#ec4399', gradient: 'from-pink-500 to-rose-500' },
    'ages-6-8': { emoji: '🧒', color: '#26a69a', gradient: 'from-teal-500 to-emerald-500' },
    arcade: { emoji: '👾', color: '#7c3aed', gradient: 'from-violet-500 to-purple-500' },
    puzzle: { emoji: '🧩', color: '#059669', gradient: 'from-emerald-500 to-green-500' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      {/* Background effects */}
      <GradientOrbs />

      {/* Header */}
      <Header variant="solid" />

      <div className="flex">
        {/* Sidebar - Desktop */}
        <motion.aside
          initial={false}
          animate={{ width: isSidebarCollapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden lg:flex flex-col sticky top-20 h-[calc(100vh-5rem)] bg-[#1a1a2e]/50 backdrop-blur-xl border-r border-white/10"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold text-white"
              >
                {locale === 'he' ? 'קטגוריות' : 'Categories'}
              </motion.h2>
            )}
            <motion.button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ rotate: isSidebarCollapsed ? 180 : 0 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </motion.svg>
            </motion.button>
          </div>

          {/* Category List */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
            {/* All Games */}
            <SidebarItem
              isCollapsed={isSidebarCollapsed}
              isActive={selectedCategory === null}
              emoji="🎮"
              label={locale === 'he' ? 'כל המשחקים' : 'All Games'}
              count={getAllGames().length}
              gradient="from-[#6cbe45] to-[#4ade80]"
              onClick={() => setSelectedCategory(null)}
            />

            {/* Divider */}
            <div className="h-px bg-white/10 my-3" />

            {/* Categories */}
            {categories.map((category) => {
              const data = categoryData[category] || { emoji: '📁', color: '#666', gradient: 'from-gray-500 to-gray-600' };
              const count = getGamesByCategory(category).length;

              return (
                <SidebarItem
                  key={category}
                  isCollapsed={isSidebarCollapsed}
                  isActive={selectedCategory === category}
                  emoji={data.emoji}
                  label={t(`categories.${category}`)}
                  count={count}
                  gradient={data.gradient}
                  onClick={() => setSelectedCategory(category)}
                />
              );
            })}
          </div>

          {/* Sidebar Footer */}
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 border-t border-white/10"
            >
              <div className="bg-gradient-to-r from-[#6cbe45]/20 to-[#00a4e4]/20 rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-sm">
                  {locale === 'he' ? 'משחקים זמינים' : 'Games available'}
                </p>
                <p className="text-2xl font-bold text-white">{games.length}</p>
              </div>
            </motion.div>
          )}
        </motion.aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-[#1a1a2e] z-50 flex flex-col"
              >
                {/* Mobile Sidebar Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">
                    {locale === 'he' ? 'קטגוריות' : 'Categories'}
                  </h2>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Mobile Category List */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
                  <SidebarItem
                    isCollapsed={false}
                    isActive={selectedCategory === null}
                    emoji="🎮"
                    label={locale === 'he' ? 'כל המשחקים' : 'All Games'}
                    count={getAllGames().length}
                    gradient="from-[#6cbe45] to-[#4ade80]"
                    onClick={() => { setSelectedCategory(null); setIsMobileSidebarOpen(false); }}
                  />

                  <div className="h-px bg-white/10 my-3" />

                  {categories.map((category) => {
                    const data = categoryData[category] || { emoji: '📁', color: '#666', gradient: 'from-gray-500 to-gray-600' };
                    const count = getGamesByCategory(category).length;

                    return (
                      <SidebarItem
                        key={category}
                        isCollapsed={false}
                        isActive={selectedCategory === category}
                        emoji={data.emoji}
                        label={t(`categories.${category}`)}
                        count={count}
                        gradient={data.gradient}
                        onClick={() => { setSelectedCategory(category); setIsMobileSidebarOpen(false); }}
                      />
                    );
                  })}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-5rem)]">
          <div className="p-4 md:p-6 lg:p-8">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              {/* Mobile filter button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span>{locale === 'he' ? 'סינון' : 'Filter'}</span>
                </button>

                {/* Title */}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {selectedCategory 
                      ? t(`categories.${selectedCategory}`)
                      : t('gamesPage.title')
                    }
                  </h1>
                  <p className="text-white/60 text-sm mt-1">
                    {games.length} {locale === 'he' ? 'משחקים' : 'games'}
                    {selectedCategory && (
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="ml-2 text-[#ffdd00] hover:underline"
                      >
                        {locale === 'he' ? 'נקה סינון' : 'Clear filter'}
                      </button>
                    )}
                  </p>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-[#ffdd00] text-[#1a1a2e]' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-[#ffdd00] text-[#1a1a2e]' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Games Grid/List */}
            {games.length === 0 ? (
              <ScrollReveal>
                <div className="text-center py-20">
                  <span className="text-6xl mb-4 block">🎮</span>
                  <p className="text-xl text-white/60">{t('gamesPage.noGamesFound')}</p>
                </div>
              </ScrollReveal>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {games.map((game, index) => (
                  <GameCard
                    key={game.slug}
                    game={game}
                    locale={locale}
                    index={index}
                    t={t}
                    categoryData={categoryData}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {games.map((game, index) => (
                  <GameListItem
                    key={game.slug}
                    game={game}
                    locale={locale}
                    index={index}
                    t={t}
                    categoryData={categoryData}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Sidebar Item Component
interface SidebarItemProps {
  isCollapsed: boolean;
  isActive: boolean;
  emoji: string;
  label: string;
  count: number;
  gradient: string;
  onClick: () => void;
}

function SidebarItem({ isCollapsed, isActive, emoji, label, count, gradient, onClick }: SidebarItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${
        isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
      } ${
        isActive
          ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
      whileHover={{ x: isActive ? 0 : 4 }}
      whileTap={{ scale: 0.98 }}
      title={isCollapsed ? label : undefined}
    >
      <span className="text-xl flex-shrink-0">{emoji}</span>
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left font-medium truncate">{label}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isActive ? 'bg-white/30' : 'bg-white/10'
          }`}>
            {count}
          </span>
        </>
      )}
    </motion.button>
  );
}

// Game Card Component
interface GameCardProps {
  game: ReturnType<typeof getAllGames>[0];
  locale: Locale;
  index: number;
  t: ReturnType<typeof useTranslations>;
  categoryData: Record<string, { emoji: string; color: string; gradient: string }>;
}

function GameCard({ game, locale, index, t, categoryData }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link href={`/games/${game.slug}`} onClick={() => trackGameCardClick(game.slug)}>
        <motion.div
          className="relative group bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#ffdd00]/50 transition-all duration-300"
          animate={{
            y: isHovered ? -8 : 0,
            boxShadow: isHovered 
              ? '0 25px 50px -12px rgba(255, 221, 0, 0.25)' 
              : '0 10px 40px -15px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Game Preview Area */}
          <div className="relative h-44 bg-gradient-to-br from-white/5 to-white/10 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }} />
            </div>

            {/* Thumbnail / Icon fallback */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? [0, -5, 5, 0] : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              {!thumbnailError ? (
                <img
                  src={game.thumbnail}
                  alt={game.title[locale]}
                  className="w-full h-full object-cover"
                  onError={() => setThumbnailError(true)}
                />
              ) : (
                <span className="text-7xl drop-shadow-lg">{game.icon}</span>
              )}
            </motion.div>

            {/* Play overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent to-transparent flex items-end justify-center pb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
            >
              <motion.div
                className="flex items-center gap-2 px-6 py-2.5 bg-[#ffdd00] rounded-full text-[#1a1a2e] font-bold shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
              >
                <span>▶</span>
                <span>{t('common.play')}</span>
              </motion.div>
            </motion.div>

            {/* Age badge */}
            <div className="absolute top-3 right-3 px-3 py-1 bg-[#ec4399] text-white text-xs font-bold rounded-full shadow-lg">
              {game.ageRange.min}-{game.ageRange.max}+
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#ffdd00] transition-colors">
              {game.title[locale]}
            </h3>
            <p className="text-white/60 text-sm line-clamp-2 mb-4 h-10">
              {game.description[locale]}
            </p>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {game.categories.slice(0, 2).map((cat) => {
                const data = categoryData[cat] || { emoji: '📁', gradient: 'from-gray-500 to-gray-600' };
                return (
                  <span
                    key={cat}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r ${data.gradient} text-white text-xs font-medium rounded-full`}
                  >
                    <span>{data.emoji}</span>
                    <span>{t(`categories.${cat}`)}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Bottom gradient line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6cbe45] via-[#ffdd00] to-[#ec4399]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Game List Item Component
function GameListItem({ game, locale, index, t, categoryData }: GameCardProps) {
  const [thumbnailError, setThumbnailError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/games/${game.slug}`} onClick={() => trackGameCardClick(game.slug)}>
        <motion.div
          className="group flex items-center gap-4 md:gap-6 p-4 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-[#ffdd00]/50 transition-all duration-300"
          whileHover={{ x: 8, boxShadow: '0 10px 40px -15px rgba(255, 221, 0, 0.2)' }}
        >
          {/* Thumbnail / Icon fallback */}
          <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
            {!thumbnailError ? (
              <img
                src={game.thumbnail}
                alt={game.title[locale]}
                className="w-full h-full object-cover rounded-xl"
                onError={() => setThumbnailError(true)}
              />
            ) : (
              <span className="text-4xl md:text-5xl">{game.icon}</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#ffdd00] transition-colors truncate">
              {game.title[locale]}
            </h3>
            <p className="text-white/60 text-sm line-clamp-1 mb-2">
              {game.description[locale]}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 bg-[#ec4399] text-white text-xs font-bold rounded-full">
                {game.ageRange.min}-{game.ageRange.max}+
              </span>
              {game.categories.slice(0, 2).map((cat) => {
                const data = categoryData[cat] || { emoji: '📁', gradient: 'from-gray-500 to-gray-600' };
                return (
                  <span
                    key={cat}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r ${data.gradient} text-white text-xs font-medium rounded-full`}
                  >
                    <span>{data.emoji}</span>
                    <span className="hidden sm:inline">{t(`categories.${cat}`)}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Play button */}
          <motion.div
            className="flex-shrink-0 w-12 h-12 bg-[#ffdd00] rounded-xl flex items-center justify-center text-[#1a1a2e] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            whileHover={{ scale: 1.1 }}
          >
            ▶
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
