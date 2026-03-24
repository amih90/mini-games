'use client';

import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';

interface LevelDisplayProps {
  level: number;
}

const levelLabels: Record<string, string> = {
  en: 'Level',
  he: 'שלב',
  zh: '关卡',
  es: 'Nivel',
};

/**
 * Visual display for current game level
 */
export function LevelDisplay({ level }: LevelDisplayProps) {
  const locale = useLocale();
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg"
    >
      <span className="text-2xl" aria-hidden="true">⭐</span>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-white/80 leading-none">
          {levelLabels[locale] || levelLabels.en}
        </span>
        <span className="text-xl font-bold text-white leading-none">
          {level}
        </span>
      </div>
    </motion.div>
  );
}
