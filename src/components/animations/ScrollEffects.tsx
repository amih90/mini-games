'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface SmoothScrollProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProps) {
  return (
    <div className="relative">
      {children}
    </div>
  );
}

interface ScrollProgressProps {
  color?: string;
  height?: number;
}

export function ScrollProgress({ 
  color = '#6cbe45',
  height = 4 
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[100] origin-left"
      style={{
        height,
        background: `linear-gradient(90deg, ${color}, #ffdd00, #00a4e4)`,
        scaleX: scrollYProgress,
      }}
    />
  );
}

interface ScrollSnapContainerProps {
  children: ReactNode;
  className?: string;
}

export function ScrollSnapContainer({ children, className }: ScrollSnapContainerProps) {
  return (
    <div className={`snap-y snap-mandatory h-screen overflow-y-scroll ${className}`}>
      {children}
    </div>
  );
}

interface ScrollSnapSectionProps {
  children: ReactNode;
  className?: string;
}

export function ScrollSnapSection({ children, className }: ScrollSnapSectionProps) {
  return (
    <section className={`snap-start min-h-screen ${className}`}>
      {children}
    </section>
  );
}

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export function HorizontalScroll({ children, className }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']);

  return (
    <div ref={containerRef} className={`relative h-[300vh] ${className}`}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-8">
          {children}
        </motion.div>
      </div>
    </div>
  );
}

interface ScrollFadeProps {
  children: ReactNode;
  className?: string;
}

export function ScrollFade({ children, className }: ScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.8, 1, 1, 0.8]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface TextRevealProps {
  text: string;
  className?: string;
}

export function TextReveal({ text, className }: TextRevealProps) {
  const words = text.split(' ');

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-2"
          variants={{
            hidden: { opacity: 0, y: 50 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                delay: i * 0.1,
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              },
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}

interface CountUpProps {
  end: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({ 
  end, 
  prefix = '', 
  suffix = '',
  className 
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const count = useTransform(scrollYProgress, [0, 0.5], [0, end]);

  return (
    <motion.span ref={ref} className={className}>
      {prefix}
      <motion.span>
        {count.get().toFixed(0)}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

export function ScrollIndicator() {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <span className="text-white/70 text-sm">Scroll</span>
      <motion.div
        className="w-6 h-10 rounded-full border-2 border-white/50 flex justify-center pt-2"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <motion.div
          className="w-1.5 h-3 bg-white/70 rounded-full"
          animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  );
}
