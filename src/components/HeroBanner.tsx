'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';

interface HeroBannerSlide {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  bgColor: string;
  link: string;
  buttonText: string;
  cardBg?: string;
}

interface HeroBannerProps {
  slides: HeroBannerSlide[];
  autoPlayInterval?: number;
}

export function HeroBanner({ slides, autoPlayInterval = 5000 }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(goNext, autoPlayInterval);
    return () => clearInterval(timer);
  }, [goNext, autoPlayInterval, isPaused, slides.length]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 400 : -400,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 400 : -400,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 15 : -15,
    }),
  };

  const currentSlide = slides[currentIndex];

  // Decorative floating characters
  const characters = ['🦊', '🐱', '🐶', '🐰', '🐻'];

  return (
    <div 
      className="relative overflow-hidden rounded-3xl min-h-[400px] md:min-h-[500px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Scenic Background - PBS Kids style landscape */}
      <div className="absolute inset-0">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#7DD3FC] via-[#BAE6FD] to-[#A7F3D0] h-full" />
        
        {/* Animated Clouds */}
        <motion.div 
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[8%] left-[5%] w-28 h-14 bg-white/90 rounded-full shadow-sm"
          style={{ filter: 'blur(1px)' }}
        />
        <motion.div 
          animate={{ x: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[12%] right-[10%] w-36 h-16 bg-white/80 rounded-full shadow-sm"
          style={{ filter: 'blur(1px)' }}
        />
        <motion.div 
          animate={{ x: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] left-[45%] w-24 h-12 bg-white/70 rounded-full shadow-sm"
          style={{ filter: 'blur(1px)' }}
        />
        
        {/* Rolling Hills with gradient greens */}
        <div className="absolute bottom-0 left-0 right-0 h-[55%]">
          <svg viewBox="0 0 1200 300" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
            {/* Back hill - lightest */}
            <path d="M0,120 Q150,60 300,100 Q450,140 600,80 Q750,20 900,90 Q1050,160 1200,100 L1200,300 L0,300 Z" fill="#86EFAC" />
            {/* Middle hill */}
            <path d="M0,160 Q200,80 400,140 Q600,200 800,120 Q1000,40 1200,120 L1200,300 L0,300 Z" fill="#4ADE80" />
            {/* Front hill - darkest */}
            <path d="M0,220 Q300,150 600,200 Q900,250 1200,180 L1200,300 L0,300 Z" fill="#22C55E" />
          </svg>
        </div>

        {/* Decorative Tree on left */}
        <div className="absolute bottom-[18%] left-[3%] hidden lg:block">
          {/* Tree trunk */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-24 bg-[#92400E] rounded-t-lg" />
          {/* Tree foliage layers */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-36 h-36 bg-[#15803D] rounded-full" />
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-28 h-28 bg-[#16A34A] rounded-full" />
          <div className="absolute bottom-34 left-1/2 -translate-x-1/2 w-20 h-20 bg-[#22C55E] rounded-full" />
        </div>

        {/* Small bush on right */}
        <div className="absolute bottom-[12%] right-[8%] hidden md:block">
          <div className="w-16 h-12 bg-[#15803D] rounded-full" />
          <div className="absolute -top-2 left-4 w-12 h-10 bg-[#16A34A] rounded-full" />
        </div>
      </div>

      {/* Floating Characters on sides - like PBS Kids */}
      <div className="absolute left-4 md:left-12 bottom-[18%] z-10 hidden md:block">
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl lg:text-7xl drop-shadow-lg"
        >
          {characters[currentIndex % characters.length]}
        </motion.div>
      </div>
      <div className="absolute right-4 md:right-12 bottom-[22%] z-10 hidden md:block">
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [5, -5, 5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="text-5xl lg:text-6xl drop-shadow-lg"
        >
          {characters[(currentIndex + 2) % characters.length]}
        </motion.div>
      </div>

      {/* Navigation Arrows - PBS Kids style circular white buttons */}
      <button
        onClick={goPrev}
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-14 md:h-14 bg-white hover:bg-[#ffdd00] rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7 text-[#1a1a2e]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>
      <button
        onClick={goNext}
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-14 md:h-14 bg-white hover:bg-[#ffdd00] rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
        aria-label="Next slide"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7 text-[#1a1a2e]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
        </svg>
      </button>

      {/* Main Content - Floating Card/Tablet like PBS Kids */}
      <div className="relative z-20 min-h-[400px] md:min-h-[500px] flex items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-md md:max-w-xl lg:max-w-2xl"
            style={{ perspective: 1000 }}
          >
            {/* Floating Tablet/Card Container */}
            <div className="relative">
              {/* Card Shadow */}
              <div className="absolute inset-0 bg-black/20 rounded-[28px] blur-xl transform translate-y-6 scale-95" />
              
              {/* Main Card - resembling a tablet/device */}
              <div 
                className="relative bg-white rounded-[28px] overflow-hidden"
                style={{ 
                  boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), inset 0 0 0 4px rgba(255,255,255,0.9)'
                }}
              >
                {/* Card Header Bar - like a device frame */}
                <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#6366f1] rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-sm">🏠</span>
                  </div>
                </div>

                {/* Decorative camera dot - like iPad */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-slate-300 rounded-full" />

                {/* Card Content Area */}
                <div 
                  className="p-8 md:p-12 min-h-[260px] md:min-h-[300px] flex flex-col items-center justify-center text-center"
                  style={{ 
                    background: `linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)`
                  }}
                >
                  {/* Pattern overlay */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `radial-gradient(circle at 25% 25%, ${currentSlide.bgColor}30 2px, transparent 2px)`,
                      backgroundSize: '24px 24px'
                    }}
                  />
                  
                  {/* Game Emoji/Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                    className="relative text-6xl md:text-8xl mb-4 drop-shadow-lg"
                  >
                    {currentSlide.emoji}
                  </motion.div>

                  {/* Game Title - Fun bubble style like PBS Kids */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative mb-2"
                  >
                    <h2 
                      className="text-2xl md:text-4xl font-black tracking-tight relative"
                      style={{ 
                        color: currentSlide.bgColor,
                        textShadow: '3px 3px 0 rgba(255,255,255,0.8), 4px 4px 0 rgba(0,0,0,0.1)'
                      }}
                    >
                      {currentSlide.title}
                    </h2>
                  </motion.div>

                  {/* Subtitle */}
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative text-sm md:text-base text-slate-600 max-w-sm font-medium"
                  >
                    {currentSlide.subtitle}
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Section with Dots and Play Button */}
      <div className="absolute bottom-5 md:bottom-8 left-0 right-0 z-30">
        <div className="flex flex-col items-center gap-4">
          {/* Dot Indicators - PBS Kids style filled circles */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full border-2 border-[#1a1a2e]/30 ${
                  index === currentIndex
                    ? 'w-4 h-4 bg-[#1a1a2e]'
                    : 'w-3 h-3 bg-white/80 hover:bg-[#1a1a2e]/40'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Big PLAY Button - PBS Kids signature dark rounded button */}
          <Link href={currentSlide.link}>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: 2 }}
              className="px-14 md:px-20 py-3.5 md:py-4 bg-[#1a1a2e] hover:bg-[#2d2d4a] text-white text-lg md:text-xl font-bold rounded-full transition-colors uppercase tracking-widest"
              style={{
                boxShadow: '0 6px 0 #0d0d17, 0 10px 20px rgba(0,0,0,0.25)'
              }}
            >
              PLAY
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
}
