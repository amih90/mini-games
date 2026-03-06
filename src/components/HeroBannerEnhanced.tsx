'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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

export function HeroBannerEnhanced({ slides, autoPlayInterval = 5000 }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const skyY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const cloudsY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const hillsY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  // Pre-computed stars for consistent rendering
  const stars = useMemo(() => 
    Array.from({ length: 20 }).map((_, i) => ({
      left: `${5 + (i * 5) % 90}%`,
      top: `${5 + (i * 3) % 30}%`,
      opacity: 0.3 + (i % 5) * 0.1,
      duration: 2 + (i % 4) * 0.5,
      delay: (i % 8) * 0.25,
    })), []
  );

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
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.85,
      rotateY: direction > 0 ? 25 : -25,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.85,
      rotateY: direction < 0 ? 25 : -25,
    }),
  };

  const currentSlide = slides[currentIndex];

  // Animated creatures
  const creatures = [
    { emoji: '🦋', x: '10%', y: '25%', delay: 0 },
    { emoji: '🐝', x: '85%', y: '35%', delay: 0.5 },
    { emoji: '🐦', x: '75%', y: '15%', delay: 1 },
    { emoji: '🌸', x: '20%', y: '70%', delay: 1.5 },
    { emoji: '✨', x: '90%', y: '65%', delay: 2 },
    { emoji: '🌟', x: '5%', y: '50%', delay: 2.5 },
  ];

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-[2.5rem] min-h-[450px] md:min-h-[550px] shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.3), inset 0 0 0 4px rgba(255,255,255,0.1)',
      }}
    >
      {/* Multi-layered Parallax Background */}
      <div className="absolute inset-0">
        {/* Sky layer with gradient animation */}
        <motion.div 
          style={{ y: skyY }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#1e3a5f] via-[#3a7bd5] to-[#7DD3FC]" />
          
          {/* Stars (visible at top) */}
          {stars.map((star, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: star.left,
                top: star.top,
                opacity: star.opacity,
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
              }}
            />
          ))}
        </motion.div>

        {/* Sun with glow */}
        <motion.div
          className="absolute top-8 right-12 md:right-24"
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute -inset-8 bg-gradient-radial from-[#ffdd00]/50 to-transparent rounded-full blur-2xl" />
            {/* Sun body */}
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-[#fff7ad] via-[#ffdd00] to-[#f7941d]" 
              style={{ boxShadow: '0 0 60px 20px rgba(255,221,0,0.4)' }}
            />
            {/* Sun rays */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 md:w-1.5 h-8 md:h-12 origin-bottom"
                style={{
                  transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                  background: 'linear-gradient(to top, #ffdd00, transparent)',
                  borderRadius: '4px',
                }}
                animate={{ 
                  height: ['2rem', '3rem', '2rem'],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </motion.div>
        
        {/* Animated Clouds with parallax */}
        <motion.div style={{ y: cloudsY }} className="absolute inset-0">
          {/* Cloud 1 */}
          <motion.div 
            animate={{ x: [-20, 40, -20] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[10%] left-[5%]"
          >
            <Cloud size="lg" />
          </motion.div>
          
          {/* Cloud 2 */}
          <motion.div 
            animate={{ x: [30, -30, 30] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[15%] right-[20%]"
          >
            <Cloud size="md" />
          </motion.div>
          
          {/* Cloud 3 */}
          <motion.div 
            animate={{ x: [0, 25, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[8%] left-[40%]"
          >
            <Cloud size="sm" />
          </motion.div>

          {/* Cloud 4 */}
          <motion.div 
            animate={{ x: [-15, 35, -15] }}
            transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[20%] left-[65%]"
          >
            <Cloud size="md" />
          </motion.div>
        </motion.div>

        {/* Mountains far background */}
        <motion.div style={{ y: hillsY }} className="absolute bottom-0 left-0 right-0 h-[60%]">
          <svg viewBox="0 0 1440 400" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
            {/* Far mountains - purple tint */}
            <motion.path
              d="M0,250 L200,150 L350,200 L500,100 L700,180 L900,80 L1100,160 L1300,120 L1440,180 L1440,400 L0,400 Z"
              fill="url(#mountainGradient1)"
              initial={{ y: 50, opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
            />
            
            {/* Mid mountains - teal */}
            <motion.path
              d="M0,280 L150,200 L300,250 L450,170 L600,230 L800,140 L1000,210 L1200,160 L1440,220 L1440,400 L0,400 Z"
              fill="url(#mountainGradient2)"
              initial={{ y: 30, opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.1 }}
            />
            
            <defs>
              <linearGradient id="mountainGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
              <linearGradient id="mountainGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Rolling Hills - Foreground */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%]">
          <svg viewBox="0 0 1440 300" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
            {/* Back hill */}
            <motion.path
              d="M0,120 Q180,50 360,100 Q540,150 720,80 Q900,10 1080,70 Q1260,130 1440,80 L1440,300 L0,300 Z"
              fill="#86EFAC"
              animate={{
                d: [
                  "M0,120 Q180,50 360,100 Q540,150 720,80 Q900,10 1080,70 Q1260,130 1440,80 L1440,300 L0,300 Z",
                  "M0,100 Q180,70 360,120 Q540,130 720,60 Q900,30 1080,90 Q1260,110 1440,100 L1440,300 L0,300 Z",
                  "M0,120 Q180,50 360,100 Q540,150 720,80 Q900,10 1080,70 Q1260,130 1440,80 L1440,300 L0,300 Z",
                ],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Middle hill */}
            <motion.path
              d="M0,160 Q240,80 480,140 Q720,200 960,120 Q1200,40 1440,120 L1440,300 L0,300 Z"
              fill="#4ADE80"
              animate={{
                d: [
                  "M0,160 Q240,80 480,140 Q720,200 960,120 Q1200,40 1440,120 L1440,300 L0,300 Z",
                  "M0,140 Q240,100 480,160 Q720,180 960,100 Q1200,60 1440,140 L1440,300 L0,300 Z",
                  "M0,160 Q240,80 480,140 Q720,200 960,120 Q1200,40 1440,120 L1440,300 L0,300 Z",
                ],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
            {/* Front hill */}
            <motion.path
              d="M0,220 Q360,140 720,200 Q1080,260 1440,180 L1440,300 L0,300 Z"
              fill="#22C55E"
              animate={{
                d: [
                  "M0,220 Q360,140 720,200 Q1080,260 1440,180 L1440,300 L0,300 Z",
                  "M0,200 Q360,160 720,220 Q1080,240 1440,200 L1440,300 L0,300 Z",
                  "M0,220 Q360,140 720,200 Q1080,260 1440,180 L1440,300 L0,300 Z",
                ],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </svg>

          {/* Grass texture overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#16a34a] to-transparent" />
        </div>

        {/* Trees */}
        <div className="absolute bottom-[14%] left-[3%] hidden lg:block">
          <Tree />
        </div>
        <div className="absolute bottom-[16%] right-[5%] hidden lg:block scale-75">
          <Tree variant="pine" />
        </div>

        {/* Mushrooms and flowers */}
        <div className="absolute bottom-[10%] left-[15%] hidden md:block">
          <motion.div
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-3xl"
          >
            🍄
          </motion.div>
        </div>
        <div className="absolute bottom-[8%] right-[25%] hidden md:block">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
          >
            🌷
          </motion.div>
        </div>
      </div>

      {/* Floating animated creatures */}
      {creatures.map((creature, index) => (
        <motion.div
          key={index}
          className="absolute z-10 text-2xl md:text-3xl pointer-events-none"
          style={{ left: creature.x, top: creature.y }}
          animate={{
            y: [0, -12, 0],
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 3 + index * 0.5,
            delay: creature.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {creature.emoji}
        </motion.div>
      ))}

      {/* Particle effects */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${10 + (i * 8) % 80}%`,
              top: `${30 + (i * 7) % 40}%`,
              background: ['#ffdd00', '#ec4399', '#00a4e4', '#6cbe45', '#a855f7'][i % 5],
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Navigation Arrows - Enhanced with glow */}
      <motion.button
        onClick={goPrev}
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 md:w-14 md:h-14 bg-white/90 hover:bg-[#ffdd00] rounded-full shadow-xl flex items-center justify-center group"
        whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(255,221,0,0.5)' }}
        whileTap={{ scale: 0.95 }}
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7 text-[#1a1a2e] group-hover:text-[#1a1a2e]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </motion.button>
      <motion.button
        onClick={goNext}
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 md:w-14 md:h-14 bg-white/90 hover:bg-[#ffdd00] rounded-full shadow-xl flex items-center justify-center group"
        whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(255,221,0,0.5)' }}
        whileTap={{ scale: 0.95 }}
        aria-label="Next slide"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7 text-[#1a1a2e] group-hover:text-[#1a1a2e]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
        </svg>
      </motion.button>

      {/* Main Content Card */}
      <div className="relative z-20 min-h-[450px] md:min-h-[550px] flex items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-md md:max-w-xl lg:max-w-2xl"
            style={{ perspective: 1200 }}
          >
            {/* Floating Tablet Card */}
            <motion.div 
              className="relative"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {/* Card glow effect */}
              <motion.div
                className="absolute -inset-4 rounded-[36px] opacity-60 blur-2xl"
                style={{ background: currentSlide.bgColor }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              {/* Card Shadow */}
              <div className="absolute inset-0 bg-black/30 rounded-[32px] blur-2xl transform translate-y-8 scale-95" />
              
              {/* Main Card */}
              <motion.div 
                className="relative bg-white/95 backdrop-blur-sm rounded-[32px] overflow-hidden"
                style={{ 
                  boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.8)'
                }}
              >
                {/* Card border gradient */}
                <div className="absolute inset-0 rounded-[32px] p-[3px] bg-gradient-to-br from-white/60 via-white/20 to-white/60 pointer-events-none" />

                {/* Card Content */}
                <div 
                  className="relative p-8 md:p-12 min-h-[280px] md:min-h-[320px] flex flex-col items-center justify-center text-center"
                  style={{ 
                    background: `linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)`
                  }}
                >
                  {/* Animated pattern overlay */}
                  <motion.div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(circle at 25% 25%, ${currentSlide.bgColor}50 2px, transparent 2px)`,
                      backgroundSize: '28px 28px'
                    }}
                    animate={{ 
                      backgroundPosition: ['0px 0px', '28px 28px'],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  />
                  
                  {/* Game Emoji with effects */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
                    className="relative mb-4"
                  >
                    {/* Emoji glow */}
                    <motion.div
                      className="absolute inset-0 blur-xl opacity-50"
                      style={{ fontSize: '5rem' }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {currentSlide.emoji}
                    </motion.div>
                    
                    <motion.span
                      className="relative text-6xl md:text-8xl drop-shadow-lg block"
                      animate={{ 
                        y: [0, -8, 0],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {currentSlide.emoji}
                    </motion.span>
                  </motion.div>

                  {/* Game Title */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative mb-3"
                  >
                    <h2 
                      className="text-2xl md:text-4xl font-black tracking-tight"
                      style={{ 
                        color: currentSlide.bgColor,
                        textShadow: '3px 3px 0 rgba(255,255,255,0.9), 4px 4px 0 rgba(0,0,0,0.08)'
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
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-5 md:bottom-8 left-0 right-0 z-30">
        <div className="flex flex-col items-center gap-4">
          {/* Enhanced Play Button */}
          <Link href={currentSlide.link}>
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                y: -3,
                boxShadow: '0 10px 40px rgba(26,26,46,0.4), 0 0 30px rgba(255,221,0,0.3)'
              }}
              whileTap={{ scale: 0.95, y: 0 }}
              className="relative px-16 md:px-24 py-4 md:py-5 bg-[#1a1a2e] text-white text-lg md:text-xl font-bold rounded-full uppercase tracking-widest overflow-hidden group"
              style={{
                boxShadow: '0 8px 0 #0d0d17, 0 15px 30px rgba(0,0,0,0.3)'
              }}
            >
              {/* Button shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                initial={{ x: '-200%' }}
                whileHover={{ x: '200%' }}
                transition={{ duration: 0.8 }}
              />
              
              <span className="relative z-10 flex items-center gap-2">
                PLAY
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ▶
                </motion.span>
              </span>
            </motion.button>
          </Link>

          {/* Enhanced Modern Dot Indicators with Progress */}
          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-full px-5 py-3 shadow-lg border border-white/30">
            {slides.map((slide, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                className="relative group"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to slide ${index + 1}`}
              >
                {/* Background ring for all dots */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-white shadow-lg' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}>
                  {/* Inner content - emoji for active, dot for inactive */}
                  {index === currentIndex ? (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-lg"
                    >
                      {slide.emoji}
                    </motion.span>
                  ) : (
                    <div 
                      className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: slides[index].bgColor }}
                    />
                  )}
                </div>
                
                {/* Progress ring for active indicator */}
                {index === currentIndex && !isPaused && (
                  <svg 
                    className="absolute inset-0 w-10 h-10 -rotate-90"
                    viewBox="0 0 40 40"
                  >
                    <motion.circle
                      cx="20"
                      cy="20"
                      r="18"
                      fill="none"
                      stroke={currentSlide.bgColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ 
                        duration: autoPlayInterval / 1000, 
                        ease: 'linear',
                        repeat: Infinity,
                      }}
                      style={{
                        filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.3))'
                      }}
                    />
                  </svg>
                )}

                {/* Tooltip on hover */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  whileHover={{ opacity: 1, y: -8, scale: 1 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#1a1a2e] text-white text-xs font-bold rounded-lg whitespace-nowrap pointer-events-none shadow-xl"
                >
                  {slide.title}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#1a1a2e]" />
                </motion.div>
              </motion.button>
            ))}
            
            {/* Slide counter */}
            <div className="ml-2 pl-3 border-l border-white/30">
              <span className="text-white font-bold text-sm">
                {currentIndex + 1}
                <span className="text-white/60 mx-0.5">/</span>
                <span className="text-white/60">{slides.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cloud({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { width: 80, height: 40 },
    md: { width: 120, height: 60 },
    lg: { width: 160, height: 80 },
  };

  const { width, height } = sizes[size];

  return (
    <div className="relative" style={{ width, height }}>
      <div 
        className="absolute rounded-full bg-white/95 shadow-lg"
        style={{
          width: width * 0.5,
          height: height * 0.8,
          left: 0,
          top: height * 0.2,
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        }}
      />
      <div 
        className="absolute rounded-full bg-white/95 shadow-lg"
        style={{
          width: width * 0.6,
          height: height,
          left: width * 0.25,
          top: 0,
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        }}
      />
      <div 
        className="absolute rounded-full bg-white/95 shadow-lg"
        style={{
          width: width * 0.5,
          height: height * 0.8,
          right: 0,
          top: height * 0.2,
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        }}
      />
    </div>
  );
}

function Tree({ variant = 'round' }: { variant?: 'round' | 'pine' }) {
  if (variant === 'pine') {
    return (
      <div className="relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-16 bg-[#78350f] rounded-sm" />
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[35px] border-r-[35px] border-b-[50px] border-l-transparent border-r-transparent border-b-[#15803D]" />
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[28px] border-r-[28px] border-b-[40px] border-l-transparent border-r-transparent border-b-[#16A34A]" />
        <div className="absolute bottom-26 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-r-[20px] border-b-[30px] border-l-transparent border-r-transparent border-b-[#22C55E]" />
      </div>
    );
  }

  return (
    <motion.div 
      className="relative"
      animate={{ rotate: [-1, 1, -1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-20 bg-[#78350f] rounded-t-lg" />
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#15803D] rounded-full shadow-lg" />
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#16A34A] rounded-full" />
      <div className="absolute bottom-30 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#22C55E] rounded-full" />
    </motion.div>
  );
}
