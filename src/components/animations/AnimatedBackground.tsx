'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function AnimatedBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const y3 = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <div ref={ref} className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#98D8AA] to-[#6cbe45]" />
      
      {/* Animated sun */}
      <motion.div
        className="absolute top-20 right-20 w-32 h-32"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#ffdd00] to-[#f7941d] shadow-lg shadow-[#ffdd00]/50" />
        {/* Sun rays */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-16 bg-gradient-to-t from-[#ffdd00] to-transparent rounded-full origin-bottom"
            style={{
              transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>

      {/* Parallax clouds */}
      <motion.div style={{ y: y1 }} className="absolute top-[5%] left-[10%]">
        <Cloud size="lg" />
      </motion.div>
      <motion.div style={{ y: y2 }} className="absolute top-[15%] right-[15%]">
        <Cloud size="md" />
      </motion.div>
      <motion.div style={{ y: y3 }} className="absolute top-[10%] left-[50%]">
        <Cloud size="sm" />
      </motion.div>
      <motion.div style={{ y: y1 }} className="absolute top-[20%] left-[75%]">
        <Cloud size="md" />
      </motion.div>

      {/* Rolling hills */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%]">
        <svg viewBox="0 0 1440 400" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
          <motion.path
            d="M0,200 Q180,100 360,180 Q540,260 720,160 Q900,60 1080,140 Q1260,220 1440,120 L1440,400 L0,400 Z"
            fill="#86EFAC"
            initial={{ d: "M0,200 Q180,100 360,180 Q540,260 720,160 Q900,60 1080,140 Q1260,220 1440,120 L1440,400 L0,400 Z" }}
            animate={{
              d: [
                "M0,200 Q180,100 360,180 Q540,260 720,160 Q900,60 1080,140 Q1260,220 1440,120 L1440,400 L0,400 Z",
                "M0,180 Q180,120 360,200 Q540,240 720,140 Q900,80 1080,160 Q1260,200 1440,140 L1440,400 L0,400 Z",
                "M0,200 Q180,100 360,180 Q540,260 720,160 Q900,60 1080,140 Q1260,220 1440,120 L1440,400 L0,400 Z",
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M0,250 Q240,150 480,220 Q720,290 960,200 Q1200,110 1440,180 L1440,400 L0,400 Z"
            fill="#4ADE80"
            animate={{
              d: [
                "M0,250 Q240,150 480,220 Q720,290 960,200 Q1200,110 1440,180 L1440,400 L0,400 Z",
                "M0,230 Q240,170 480,240 Q720,270 960,180 Q1200,130 1440,200 L1440,400 L0,400 Z",
                "M0,250 Q240,150 480,220 Q720,290 960,200 Q1200,110 1440,180 L1440,400 L0,400 Z",
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <motion.path
            d="M0,300 Q360,220 720,280 Q1080,340 1440,260 L1440,400 L0,400 Z"
            fill="#22C55E"
            animate={{
              d: [
                "M0,300 Q360,220 720,280 Q1080,340 1440,260 L1440,400 L0,400 Z",
                "M0,280 Q360,240 720,300 Q1080,320 1440,280 L1440,400 L0,400 Z",
                "M0,300 Q360,220 720,280 Q1080,340 1440,260 L1440,400 L0,400 Z",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </svg>
      </div>

      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${5 + (i * 7) % 90}%`,
            top: `${20 + (i * 13) % 60}%`,
            background: ['#ffdd00', '#ec4399', '#00a4e4', '#6cbe45'][i % 4],
            opacity: 0.6,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function Cloud({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { width: 80, height: 40, duration: 10 },
    md: { width: 120, height: 60, duration: 12 },
    lg: { width: 180, height: 90, duration: 14 },
  };

  const { width, height, duration } = sizes[size];

  return (
    <motion.div
      className="relative"
      style={{ width, height }}
      animate={{
        x: [0, 20, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <div 
        className="absolute rounded-full bg-white/90 shadow-lg"
        style={{
          width: width * 0.5,
          height: height * 0.8,
          left: 0,
          top: height * 0.2,
        }}
      />
      <div 
        className="absolute rounded-full bg-white/90 shadow-lg"
        style={{
          width: width * 0.6,
          height: height,
          left: width * 0.25,
          top: 0,
        }}
      />
      <div 
        className="absolute rounded-full bg-white/90 shadow-lg"
        style={{
          width: width * 0.5,
          height: height * 0.8,
          right: 0,
          top: height * 0.2,
        }}
      />
    </motion.div>
  );
}

export function Particles() {
  // Pre-compute particle positions deterministically
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    left: `${(i * 3.33) % 100}%`,
    top: `${(i * 3.33 + 10) % 100}%`,
    duration: 3 + (i % 5) * 0.4,
    delay: (i % 10) * 0.3,
  }));

  return (
    <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none">
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: [0, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export function GradientOrbs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#6cbe45]/30 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#00a4e4]/30 blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-[#ec4399]/20 blur-3xl"
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
    </div>
  );
}
