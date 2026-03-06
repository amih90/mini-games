'use client';

import { motion } from 'framer-motion';
import type { Card } from '../useMemoryGame';

interface MemoryCardProps {
  card: Card;
  onClick: () => void;
  disabled: boolean;
  isFocused: boolean;
}

export function MemoryCard({ card, onClick, disabled, isFocused }: MemoryCardProps) {
  const isRevealed = card.isFlipped || card.isMatched;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      className={`
        aspect-square rounded-2xl
        flex items-center justify-center
        text-5xl sm:text-6xl
        transition-shadow duration-200
        focus:outline-none
        ${isFocused ? 'ring-4 ring-lavender-dream ring-offset-2' : ''}
        ${disabled && !card.isMatched ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{ perspective: '1000px' }}
      aria-label={isRevealed ? card.emoji : 'Hidden card'}
      aria-pressed={isRevealed}
    >
      <motion.div
        className="w-full h-full relative"
        initial={false}
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Card Back */}
        <div
          className={`
            absolute inset-0 rounded-2xl
            flex items-center justify-center
            bg-gradient-to-br from-sky-bubble to-lavender-dream
            shadow-lg
            ${card.isMatched ? 'opacity-0' : ''}
          `}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-4xl text-white/80">❓</span>
        </div>

        {/* Card Front */}
        <div
          className={`
            absolute inset-0 rounded-2xl
            flex items-center justify-center
            bg-white shadow-lg
            ${card.isMatched ? 'bg-mint-fresh-light border-4 border-mint-fresh' : ''}
          `}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: isRevealed ? 1 : 0 }}
            transition={{ delay: 0.1 }}
          >
            {card.emoji}
          </motion.span>
        </div>
      </motion.div>
    </motion.button>
  );
}
