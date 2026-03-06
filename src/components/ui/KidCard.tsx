'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface KidCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: React.ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
}

export const KidCard = forwardRef<HTMLDivElement, KidCardProps>(
  ({ className, children, hoverable = false, clickable = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverable || clickable ? { scale: 1.03, y: -4 } : undefined}
        whileTap={clickable ? { scale: 0.98 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={cn(
          'bg-white rounded-3xl shadow-lg p-6',
          'border-4 border-white/50',
          clickable && 'cursor-pointer',
          'focus:outline-none focus:ring-4 focus:ring-lavender-dream/50',
          className
        )}
        tabIndex={clickable ? 0 : undefined}
        role={clickable ? 'button' : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

KidCard.displayName = 'KidCard';
