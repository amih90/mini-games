'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ReactNode, MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}

export function TiltCard({ 
  children, 
  className, 
  intensity = 15,
  glare = true 
}: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]));
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]));
  
  // Glare position based on mouse
  const glareX = useTransform(x, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(y, [-0.5, 0.5], [0, 100]);

  const handleMouse = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={cn('relative', className)}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {glare && (
        <motion.div
          className="absolute inset-0 rounded-inherit pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,0.3) 0%, transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  );
}

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  flipOnHover?: boolean;
}

export function FlipCard({ front, back, className, flipOnHover = true }: FlipCardProps) {
  return (
    <motion.div
      className={cn('relative', className)}
      initial={false}
      whileHover={flipOnHover ? 'flipped' : undefined}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative w-full h-full"
        variants={{
          flipped: { rotateY: 180 },
        }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        
        {/* Back */}
        <div
          className="absolute inset-0"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({ 
  children, 
  className,
  glowColor = '#6cbe45'
}: GlowCardProps) {
  return (
    <motion.div
      className={cn('relative group', className)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
        style={{ background: glowColor }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Card content */}
      <div className="relative bg-white rounded-2xl overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}

interface MorphCardProps {
  children: ReactNode;
  className?: string;
}

export function MorphCard({ children, className }: MorphCardProps) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-3xl',
        'bg-gradient-to-br from-white/80 to-white/40',
        'backdrop-blur-sm border border-white/50',
        className
      )}
      whileHover={{
        borderRadius: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: 'linear-gradient(90deg, #6cbe45, #00a4e4, #ec4399, #ffdd00, #6cbe45)',
          backgroundSize: '400% 100%',
          padding: '2px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

interface BouncyCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function BouncyCard({ children, className, onClick }: BouncyCardProps) {
  return (
    <motion.div
      className={cn(
        'cursor-pointer rounded-2xl overflow-hidden',
        'bg-white shadow-lg',
        className
      )}
      whileHover={{ 
        y: -8,
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
