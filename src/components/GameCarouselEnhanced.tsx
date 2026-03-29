'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import type { GameConfig } from '@/features/games/registry/types';
import type { Locale } from '@/i18n/routing';
import { ScrollReveal } from '@/components/animations';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface GameCarouselProps {
  games: GameConfig[];
  locale: Locale;
  title: string;
}

export function GameCarouselEnhanced({ games, locale, title }: GameCarouselProps) {
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
    const scrollAmount = 340;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const gameGradients: Record<string, string> = {
    'color-match': 'from-[#00a4e4] to-[#4fc3f7]',
    'memory-cards': 'from-[#ec4399] to-[#f472b6]',
    'flappy-bird': 'from-[#f7941d] to-[#fbbf24]',
    'chicken-invaders': 'from-[#e53935] to-[#ef5350]',
    'tetris': 'from-[#a855f7] to-[#c084fc]',
    'shape-builder': 'from-[#f59e0b] to-[#fbbf24]',
    'pattern-maker': 'from-[#8b5cf6] to-[#a78bfa]',
    'number-muncher': 'from-[#10b981] to-[#34d399]',
    'rhyme-time': 'from-[#ec4899] to-[#f472b6]',
    'letter-soup': 'from-[#f97316] to-[#fb923c]',
    'size-sorter': 'from-[#6366f1] to-[#818cf8]',
    'weather-dress-up': 'from-[#0ea5e9] to-[#38bdf8]',
    'plant-grower': 'from-[#22c55e] to-[#4ade80]',
    'fraction-pizza': 'from-[#ef4444] to-[#f87171]',
    'mirror-draw': 'from-[#14b8a6] to-[#2dd4bf]',
    'match-pairs': 'from-[#8b5cf6] to-[#a78bfa]',
  };

  return (
    <ScrollReveal className="relative">
      {/* Section Title with decoration */}
      <div className="flex items-center gap-4 mb-8 px-4">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: 60 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="h-1 bg-gradient-to-r from-[#ffdd00] to-[#f7941d] rounded-full"
        />
        <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
          {title}
        </h2>
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="text-3xl"
        >
          ✨
        </motion.div>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow - Enhanced */}
        <motion.button
          onClick={() => scroll('left')}
          className={`absolute -left-2 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Scroll left"
        >
          <div className="w-14 h-14 rounded-full bg-white/95 shadow-2xl flex items-center justify-center backdrop-blur-sm border-2 border-[#ffdd00]/30 hover:border-[#ffdd00] hover:bg-[#ffdd00] transition-colors group">
            <svg className="w-7 h-7 text-slate-700 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </div>
        </motion.button>

        {/* Games Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto scrollbar-hide px-4 py-6 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {games.map((game, index) => (
            <GameCardEnhanced
              key={game.slug}
              game={game}
              locale={locale}
              gradient={gameGradients[game.slug] || 'from-[#6cbe45] to-[#4ade80]'}
              index={index}
            />
          ))}
        </div>

        {/* Right Arrow - Enhanced */}
        <motion.button
          onClick={() => scroll('right')}
          className={`absolute -right-2 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          whileHover={{ scale: 1.1, x: 3 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Scroll right"
        >
          <div className="w-14 h-14 rounded-full bg-white/95 shadow-2xl flex items-center justify-center backdrop-blur-sm border-2 border-[#ffdd00]/30 hover:border-[#ffdd00] hover:bg-[#ffdd00] transition-colors group">
            <svg className="w-7 h-7 text-slate-700 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </div>
        </motion.button>
      </div>
    </ScrollReveal>
  );
}

interface GameCardEnhancedProps {
  game: GameConfig;
  locale: Locale;
  gradient: string;
  index: number;
}

function GameCardEnhanced({ game, locale, gradient, index }: GameCardEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <Link href={`/games/${game.slug}`}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouse}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onFocus={() => setIsHovered(true)}
        onBlur={handleMouseLeave}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        style={{
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
          transformStyle: 'preserve-3d',
          perspective: 1000,
        }}
        className="relative flex-shrink-0 w-[300px] cursor-pointer focus:outline-none"
        tabIndex={0}
        role="button"
        aria-label={`Play ${game.title[locale]}`}
      >
        {/* Card glow effect */}
        <motion.div
          className={`absolute -inset-3 rounded-[2rem] bg-gradient-to-r ${gradient} opacity-0 blur-xl transition-opacity duration-500`}
          animate={{ opacity: isHovered ? 0.5 : 0 }}
        />

        {/* Main Card */}
        <motion.div
          animate={{
            y: isHovered ? -8 : 0,
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`relative bg-white rounded-[1.5rem] overflow-hidden transition-all duration-300 ${
            isHovered 
              ? 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] ring-4 ring-[#ffdd00]' 
              : 'shadow-xl'
          }`}
        >
          {/* Image/Emoji Area */}
          <div className={`relative h-[200px] bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
            {/* Animated background pattern */}
            <motion.div 
              className="absolute inset-0 opacity-30"
              animate={{
                backgroundPosition: isHovered ? ['0% 0%', '100% 100%'] : '0% 0%',
              }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              style={{
                backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Floating shapes */}
            <motion.div
              className="absolute top-4 left-4 w-16 h-16 bg-white/20 rounded-full"
              animate={{
                y: isHovered ? [-5, 5, -5] : 0,
                scale: isHovered ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-8 right-8 w-12 h-12 bg-white/20 rounded-lg"
              animate={{
                rotate: isHovered ? [0, 15, -15, 0] : 0,
                scale: isHovered ? [1, 1.15, 1] : 1,
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute top-1/2 right-4 w-8 h-8 bg-white/20 rounded-full"
              animate={{
                x: isHovered ? [-3, 3, -3] : 0,
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Thumbnail / Icon fallback */}
            <motion.div
              animate={{
                scale: isHovered ? 1.15 : 1,
                rotate: isHovered ? [0, -5, 5, 0] : 0,
                y: isHovered ? -5 : 0,
              }}
              transition={{ duration: 0.4 }}
              className="relative z-10 w-full h-full flex items-center justify-center"
            >
              {!thumbnailError ? (
                <img
                  src={`${basePath}${game.thumbnail}`}
                  alt={game.title[locale]}
                  className="w-full h-full object-cover"
                  onError={() => setThumbnailError(true)}
                />
              ) : (
                <>
                  <motion.span
                    className="absolute inset-0 blur-lg opacity-50 flex items-center justify-center"
                    style={{ fontSize: '4.5rem' }}
                  >
                    {game.icon}
                  </motion.span>
                  <span className="text-7xl drop-shadow-2xl relative">
                    {game.icon}
                  </span>
                </>
              )}
            </motion.div>

            {/* Play Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-6"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ 
                  y: isHovered ? 0 : 20, 
                  opacity: isHovered ? 1 : 0 
                }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                className="flex items-center gap-2 px-6 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
              >
                <span className="text-lg">▶</span>
                <span className="font-bold text-slate-800">Play Now</span>
              </motion.div>
            </motion.div>

            {/* Sparkle effects on hover */}
            {isHovered && (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    initial={{ 
                      opacity: 0, 
                      scale: 0,
                      x: '50%',
                      y: '50%',
                    }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      x: `${20 + i * 20}%`,
                      y: `${15 + i * 15}%`,
                    }}
                    transition={{ 
                      duration: 0.8,
                      delay: i * 0.15,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                  />
                ))}
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <motion.h3 
              className="text-xl font-bold text-slate-800 mb-2 truncate"
              animate={{ x: isHovered ? 3 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {game.title[locale]}
            </motion.h3>
            <p className="text-sm text-slate-500 line-clamp-2 h-10 mb-4">
              {game.description[locale]}
            </p>

            {/* Tags with animation */}
            <motion.div 
              className="flex gap-2 flex-wrap"
              animate={{ y: isHovered ? -2 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="px-3 py-1.5 bg-gradient-to-r from-[#ec4399] to-[#f472b6] text-white rounded-full text-xs font-bold shadow-md">
                Ages {game.ageRange.min}-{game.ageRange.max}
              </span>
              {game.categories[0] && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-[#6cbe45] to-[#4ade80] text-white rounded-full text-xs font-bold capitalize shadow-md">
                  {game.categories[0]}
                </span>
              )}
            </motion.div>
          </div>

          {/* Bottom shine effect */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffdd00] to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ 
              scaleX: isHovered ? 1 : 0,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </motion.div>
    </Link>
  );
}
