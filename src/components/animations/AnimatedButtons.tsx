'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'warning' | 'danger' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  loading?: boolean;
  pulse?: boolean;
}

export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  pulse = false,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const baseStyles = `
    relative overflow-hidden font-bold rounded-full
    transition-all duration-300 ease-out
    flex items-center justify-center gap-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-[#6cbe45] to-[#5aa838]
      text-white shadow-lg shadow-[#6cbe45]/30
      hover:shadow-xl hover:shadow-[#6cbe45]/40
      border-b-4 border-[#4a9030]
      active:border-b-2 active:translate-y-[2px]
    `,
    secondary: `
      bg-gradient-to-r from-[#00a4e4] to-[#0088cc]
      text-white shadow-lg shadow-[#00a4e4]/30
      hover:shadow-xl hover:shadow-[#00a4e4]/40
      border-b-4 border-[#0077b3]
      active:border-b-2 active:translate-y-[2px]
    `,
    warning: `
      bg-gradient-to-r from-[#ffdd00] to-[#f7c600]
      text-slate-800 shadow-lg shadow-[#ffdd00]/30
      hover:shadow-xl hover:shadow-[#ffdd00]/40
      border-b-4 border-[#d4a800]
      active:border-b-2 active:translate-y-[2px]
    `,
    danger: `
      bg-gradient-to-r from-[#ec4399] to-[#d63384]
      text-white shadow-lg shadow-[#ec4399]/30
      hover:shadow-xl hover:shadow-[#ec4399]/40
      border-b-4 border-[#b52870]
      active:border-b-2 active:translate-y-[2px]
    `,
    ghost: `
      bg-white/10 backdrop-blur-sm
      text-white border-2 border-white/30
      hover:bg-white/20 hover:border-white/50
    `,
    glow: `
      bg-gradient-to-r from-[#a855f7] via-[#ec4399] to-[#f97316]
      text-white shadow-lg
      border-b-4 border-[#7c3aed]
      active:border-b-2 active:translate-y-[2px]
    `,
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-12 py-5 text-xl',
  };

  return (
    <motion.button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
        initial={{ x: '-200%' }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />

      {/* Pulse ring */}
      {pulse && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-current"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Glow effect for glow variant */}
      {variant === 'glow' && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-[#a855f7] via-[#ec4399] to-[#f97316] blur-xl opacity-50"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ zIndex: -1 }}
        />
      )}

      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Icon */}
      {icon && !loading && <span>{icon}</span>}

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
}

export function MagneticButton({ children, className }: MagneticButtonProps) {
  return (
    <motion.div
      className={cn('relative', className)}
      whileHover="hover"
    >
      <motion.div
        variants={{
          hover: {
            scale: 1.1,
          },
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

interface RippleButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function RippleButton({ children, className, onClick }: RippleButtonProps) {
  return (
    <motion.button
      className={cn(
        'relative overflow-hidden px-6 py-3 rounded-full font-bold',
        'bg-gradient-to-r from-[#6cbe45] to-[#00a4e4] text-white',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <motion.span
        className="absolute inset-0 bg-white"
        initial={{ scale: 0, opacity: 0.5 }}
        whileTap={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{ borderRadius: '50%', transformOrigin: 'center' }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({ 
  icon, 
  onClick, 
  className,
  variant = 'default',
  size = 'md'
}: IconButtonProps) {
  const variants = {
    default: 'bg-white/90 hover:bg-white text-slate-700 shadow-lg',
    ghost: 'bg-transparent hover:bg-white/20 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg',
  };

  const sizes = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <motion.button
      className={cn(
        'rounded-full flex items-center justify-center',
        'transition-colors duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
    >
      {icon}
    </motion.button>
  );
}
