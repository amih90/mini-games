'use client';

import { motion } from 'framer-motion';

interface AnimalCardProps {
  emoji: string;
  name: string;
  fact: string;
  discovered: boolean;
  onTap?: () => void;
}

export function AnimalCard({ emoji, name, fact, discovered, onTap }: AnimalCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
      className={`flex flex-col items-center p-4 rounded-2xl shadow-md w-full
        transition-colors touch-manipulation
        ${discovered
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
          : 'bg-white/80 border-2 border-dashed border-gray-300'
        }`}
    >
      <motion.span
        animate={discovered ? { rotate: [0, -5, 5, 0] } : { scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
        className="text-5xl"
      >
        {discovered ? emoji : '❓'}
      </motion.span>
      <span className="text-sm font-bold mt-2 text-gray-700">
        {discovered ? name : '???'}
      </span>
      {discovered && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{fact}</p>
      )}
    </motion.button>
  );
}
