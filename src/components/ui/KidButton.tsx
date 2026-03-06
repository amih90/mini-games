'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type KidButtonVariant = 'primary' | 'secondary' | 'success' | 'warning';
export type KidButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface KidButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: KidButtonVariant;
  size?: KidButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<KidButtonVariant, string> = {
  primary: 'bg-[#ec4399] text-white hover:bg-[#d63384] focus:ring-[#ec4399]/50 shadow-lg',
  secondary: 'bg-white text-slate-800 hover:bg-slate-50 focus:ring-white/50 shadow-lg border-2 border-slate-200',
  success: 'bg-[#6cbe45] text-white hover:bg-[#5aa83a] focus:ring-[#6cbe45]/50 shadow-lg',
  warning: 'bg-[#ffdd00] text-slate-800 hover:bg-[#e6c700] focus:ring-[#ffdd00]/50 shadow-lg',
};

const sizeStyles: Record<KidButtonSize, string> = {
  sm: 'px-4 py-2 text-base min-h-[40px] rounded-xl',
  md: 'px-6 py-3 text-lg min-h-[48px] rounded-2xl',
  lg: 'px-8 py-4 text-xl min-h-[56px] rounded-2xl',
  xl: 'px-10 py-5 text-2xl min-h-[64px] rounded-3xl',
};

export const KidButton = forwardRef<HTMLButtonElement, KidButtonProps>(
  ({ variant = 'primary', size = 'lg', className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={cn(
          // Base styles
          'font-bold shadow-lg transition-colors',
          'focus:outline-none focus:ring-4 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

KidButton.displayName = 'KidButton';
