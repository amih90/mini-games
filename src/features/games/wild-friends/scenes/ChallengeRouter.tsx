'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Animal, Difficulty } from '../types';
import { t } from '../data/translations';

// ─── Challenge Wrapper (shared by all scenes) ─────────────

interface ChallengeProps {
  animal: Animal;
  locale: string;
  difficulty: Difficulty;
  onComplete: () => void;
}

// Time limits per difficulty (ms)
const TIME_LIMITS: Record<Difficulty, number> = {
  easy: 30000,
  medium: 20000,
  hard: 12000,
};

// ─── Sound Match ──────────────────────────────────────────
function SoundMatchChallenge({ animal, locale, onComplete }: ChallengeProps) {
  const options = ['🦁', '🐘', '🐍', animal.emoji];
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const handleSelect = useCallback(
    (option: string) => {
      setSelected(option);
      if (option === animal.emoji) {
        setCorrect(true);
        setTimeout(onComplete, 800);
      } else {
        setCorrect(false);
        setTimeout(() => {
          setSelected(null);
          setCorrect(null);
        }, 500);
      }
    },
    [animal.emoji, onComplete]
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
        className="text-5xl"
      >
        🔊
      </motion.div>
      <p className="text-lg font-bold">{t(locale, 'challengeSoundMatch')}</p>
      <div className="grid grid-cols-2 gap-3">
        {options.sort().map((opt, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSelect(opt)}
            className={`text-4xl p-4 rounded-2xl border-2 transition-all touch-manipulation
              ${selected === opt
                ? correct
                  ? 'border-green-500 bg-green-100'
                  : 'border-red-500 bg-red-100 animate-shake'
                : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Size Sort ────────────────────────────────────────────
function SizeSortChallenge({ animal, locale, onComplete }: ChallengeProps) {
  const items = ['🐜', '🐇', animal.emoji];
  const [order, setOrder] = useState<string[]>([]);

  const handleTap = useCallback(
    (item: string) => {
      setOrder((prev) => {
        if (prev.includes(item)) return prev;
        const next = [...prev, item];
        if (next.length === items.length) {
          setTimeout(onComplete, 800);
        }
        return next;
      });
    },
    [items.length, onComplete]
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg font-bold">{t(locale, 'challengeSizeSort')}</p>
      <div className="flex gap-2 min-h-[60px] bg-gray-100 rounded-xl p-2">
        {order.map((item, i) => (
          <span key={i} className="text-4xl">{item}</span>
        ))}
      </div>
      <div className="flex gap-3">
        {items
          .sort(() => Math.random() - 0.5)
          .map((item, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTap(item)}
              disabled={order.includes(item)}
              className={`text-4xl p-3 rounded-xl border-2 touch-manipulation
                ${order.includes(item)
                  ? 'opacity-30 border-gray-200'
                  : 'border-blue-300 bg-white hover:bg-blue-50'
                }`}
            >
              {item}
            </motion.button>
          ))}
      </div>
    </div>
  );
}

// ─── Tap Challenge (for patience, reach, etc.) ────────────
function TapChallenge({ animal, locale, onComplete }: ChallengeProps) {
  const [taps, setTaps] = useState(0);
  const target = 5;

  const handleTap = useCallback(() => {
    setTaps((prev) => {
      const next = prev + 1;
      if (next >= target) setTimeout(onComplete, 500);
      return next;
    });
  }, [onComplete]);

  const challengeKey = `challenge${animal.challengeType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg font-bold">{t(locale, challengeKey)}</p>
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={handleTap}
        className="text-7xl p-4 touch-manipulation"
      >
        {animal.emoji}
      </motion.button>
      <div className="flex gap-1">
        {Array.from({ length: target }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-colors
              ${i < taps ? 'bg-green-400' : 'bg-gray-300'}`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-500">{taps}/{target}</p>
    </div>
  );
}

// ─── Color Match ──────────────────────────────────────────
function ColorMatchChallenge({ animal, locale, onComplete }: ChallengeProps) {
  const colors = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b'];
  const correctIdx = 0; // Green frog
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg font-bold">{t(locale, 'challengeColorMatch')}</p>
      <span className="text-5xl">{animal.emoji}</span>
      <div className="grid grid-cols-2 gap-3">
        {colors.map((color, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setSelected(i);
              if (i === correctIdx) setTimeout(onComplete, 500);
              else setTimeout(() => setSelected(null), 400);
            }}
            className={`w-16 h-16 rounded-full border-4 touch-manipulation
              ${selected === i
                ? i === correctIdx
                  ? 'border-green-500 ring-4 ring-green-200'
                  : 'border-red-500'
                : 'border-gray-200'
              }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Bubble Pop ───────────────────────────────────────────
function BubblePopChallenge({ animal, locale, onComplete }: ChallengeProps) {
  const [popped, setPopped] = useState<number[]>([]);
  const bubbles = [1, 2, 3, 4, 5];

  const handlePop = useCallback(
    (n: number) => {
      const expected = popped.length + 1;
      if (n === expected) {
        const next = [...popped, n];
        setPopped(next);
        if (next.length === bubbles.length) setTimeout(onComplete, 500);
      }
    },
    [popped, bubbles.length, onComplete]
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg font-bold">{t(locale, 'challengeBubblePop')}</p>
      <div className="flex gap-2 flex-wrap justify-center">
        {bubbles.map((n) => (
          <motion.button
            key={n}
            whileTap={{ scale: 0.7 }}
            onClick={() => handlePop(n)}
            className={`w-14 h-14 rounded-full flex items-center justify-center
              text-xl font-bold touch-manipulation
              ${popped.includes(n)
                ? 'bg-gray-200 text-gray-400'
                : 'bg-blue-400 text-white hover:bg-blue-500 shadow-lg'
              }`}
          >
            {popped.includes(n) ? '💨' : n}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Challenge Router ─────────────────────────────────────

export function ChallengeRouter(props: ChallengeProps) {
  const { animal } = props;

  switch (animal.challengeType) {
    case 'sound_match':
      return <SoundMatchChallenge {...props} />;
    case 'size_sort':
    case 'size_compare':
      return <SizeSortChallenge {...props} />;
    case 'color_match':
    case 'hide_and_seek':
    case 'leaf_match':
      return <ColorMatchChallenge {...props} />;
    case 'bubble_pop':
    case 'path_trace':
      return <BubblePopChallenge {...props} />;
    default:
      return <TapChallenge {...props} />;
  }
}
