'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import type { GameConfig } from '@/features/games/registry/types';
import type { Locale } from '@/i18n/routing';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface GameCarouselProps {
  games: GameConfig[];
  locale: Locale;
  title: string;
}

export function GameCarousel({ games, locale, title }: GameCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      {/* Section Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 drop-shadow-md px-4">
        {title}
      </h2>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-3xl text-slate-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#ffdd00] ${
            canScrollLeft
              ? 'opacity-100 hover:scale-110 hover:bg-[#ffdd00]'
              : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll left"
        >
          ‹
        </button>

        {/* Games Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 overflow-x-auto scrollbar-hide px-4 py-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {games.map((game) => (
            <GameCard
              key={game.slug}
              game={game}
              locale={locale}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-3xl text-slate-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#ffdd00] ${
            canScrollRight
              ? 'opacity-100 hover:scale-110 hover:bg-[#ffdd00]'
              : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll right"
        >
          ›
        </button>
      </div>
    </div>
  );
}

interface GameCardProps {
  game: GameConfig;
  locale: Locale;
}

function GameCard({ game, locale }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  return (
    <Link href={`/games/${game.slug}`}>
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        animate={{
          scale: isHovered ? 1.08 : 1,
          y: isHovered ? -8 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="relative flex-shrink-0 w-[280px] cursor-pointer focus:outline-none"
        tabIndex={0}
        role="button"
        aria-label={`Play ${game.title[locale]}`}
      >
        {/* Card */}
        <div
          className={`relative bg-white rounded-3xl overflow-hidden shadow-lg transition-shadow duration-300 ${
            isHovered ? 'shadow-2xl ring-4 ring-[#ffdd00]' : ''
          }`}
        >
          {/* Image/Thumbnail Area */}
          <div className="relative h-[180px] bg-gradient-to-br from-[#00a4e4] to-[#4fc3f7] flex items-center justify-center overflow-hidden">
            {/* Background Shapes */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-16 h-16 bg-white rounded-full" />
              <div className="absolute bottom-8 right-8 w-12 h-12 bg-white rounded-lg rotate-12" />
              <div className="absolute top-1/2 right-4 w-8 h-8 bg-white rounded-full" />
            </div>

            {/* Thumbnail or Icon Fallback */}
            {!thumbnailError ? (
              <img
                src={`${basePath}${game.thumbnail}`}
                alt={game.title[locale]}
                className="w-full h-full object-cover relative z-10"
                onError={() => setThumbnailError(true)}
              />
            ) : (
              <motion.span
                animate={{
                  scale: isHovered ? 1.2 : 1,
                  rotate: isHovered ? [0, -10, 10, 0] : 0,
                }}
                transition={{ duration: 0.4 }}
                className="text-7xl drop-shadow-lg relative z-10"
              >
                {game.icon}
              </motion.span>
            )}

            {/* Play Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-black/30 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: isHovered ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-[#ffdd00] flex items-center justify-center shadow-lg"
              >
                <span className="text-3xl ml-1">▶</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">
              {game.title[locale]}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2 h-10">
              {game.description[locale]}
            </p>

            {/* Tags */}
            <div className="flex gap-2 mt-3">
              <span className="px-2 py-1 bg-[#ec4399] text-white rounded-full text-xs font-medium">
                Ages {game.ageRange.min}-{game.ageRange.max}
              </span>
              {game.categories[0] && (
                <span className="px-2 py-1 bg-[#6cbe45] text-white rounded-full text-xs font-medium capitalize">
                  {game.categories[0]}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
