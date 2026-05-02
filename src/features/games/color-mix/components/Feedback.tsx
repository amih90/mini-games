'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Recipe } from '../data/colors';
import { COLOR_BY_ID, RESULTS } from '../data/colors';
import { COLOR_NAMES, FAMILY_HINT, LESSONS, REAL_WORLD, UI, type Locale } from '../data/strings';

// ── Lesson card after a correct mix ─────────────────────────────────

interface LessonCardProps {
  isOpen: boolean;
  recipe: Recipe | null;
  locale: Locale;
  reduceMotion?: boolean;
}

export function LessonCard({ isOpen, recipe, locale, reduceMotion }: LessonCardProps) {
  if (!recipe) return null;
  const result = RESULTS[recipe.result];
  const colorName = COLOR_NAMES[locale][recipe.result];
  const lesson = LESSONS[locale][recipe.lesson];
  const anchor = REAL_WORLD[locale][recipe.result];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={reduceMotion ? false : { y: 30, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { y: -20, opacity: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-30 max-w-md w-[92%] sm:w-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-yellow-300 p-3 sm:p-4 flex items-center gap-3">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-2xl sm:text-3xl shrink-0"
              style={{ backgroundColor: result.hex }}
            >
              {result.emoji}
            </div>
            <div className="flex-1 min-w-0 text-start">
              <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                {colorName}{anchor && (
                  <span className="ms-1 text-gray-600 font-normal">
                    ({anchor.emoji} {anchor.text})
                  </span>
                )}
              </p>
              <p className="text-xs sm:text-sm text-gray-700 leading-tight mt-0.5">
                {lesson}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Smart wrong-mix feedback ────────────────────────────────────────

interface WrongFeedbackProps {
  isOpen: boolean;
  /** What the child actually produced. */
  actualRecipe: Recipe | null;
  /** What was the target. */
  targetRecipe: Recipe | null;
  locale: Locale;
}

export function WrongFeedback({ isOpen, actualRecipe, targetRecipe, locale }: WrongFeedbackProps) {
  const ui = UI[locale];
  const colorNames = COLOR_NAMES[locale];
  const familyHints = FAMILY_HINT[locale];

  return (
    <AnimatePresence>
      {isOpen && targetRecipe && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 max-w-sm w-[92%]"
        >
          <div className="bg-red-50 border-4 border-red-300 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">🤔</span>
            <div className="flex-1 text-start">
              {actualRecipe ? (
                <p className="text-sm sm:text-base text-red-900 font-bold leading-tight">
                  {ui.youMade}{' '}
                  <span style={{ color: COLOR_BY_ID[actualRecipe.result]?.hex }}>
                    {colorNames[actualRecipe.result]}
                  </span>
                  {' '}—{' '}{ui.butWeWanted}{' '}
                  <span style={{ color: COLOR_BY_ID[targetRecipe.result]?.hex }}>
                    {colorNames[targetRecipe.result]}
                  </span>!
                </p>
              ) : (
                <p className="text-sm sm:text-base text-red-900 font-bold leading-tight">
                  {ui.tryAgain}
                </p>
              )}
              <p className="text-xs sm:text-sm text-red-700 mt-1">
                💡 {familyHints[targetRecipe.family]}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Hint ladder card ────────────────────────────────────────────────

interface HintCardProps {
  level: 0 | 1 | 2 | 3;
  recipe: Recipe | null;
  locale: Locale;
}

export function HintCard({ level, recipe, locale }: HintCardProps) {
  const ui = UI[locale];
  const colorNames = COLOR_NAMES[locale];
  if (level === 0 || !recipe) return null;

  const partsCount = Object.values(recipe.parts).reduce((s, n) => s + n, 0);

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="px-3 py-2 bg-yellow-100 border-2 border-yellow-300 rounded-2xl shadow-md text-center max-w-sm"
    >
      <p className="text-xs sm:text-sm font-bold text-yellow-900">
        💡 {ui.hintTitle}
      </p>
      {level >= 1 && (
        <p className="text-xs sm:text-sm text-yellow-800">
          {ui.hintParts.replace('{n}', String(partsCount))}
        </p>
      )}
      {level >= 3 && (
        <div className="mt-1.5 flex items-center justify-center gap-1 flex-wrap">
          <span className="text-xs">{ui.hintRecipe}</span>
          {Object.entries(recipe.parts).map(([id, n], i) => {
            const c = COLOR_BY_ID[id];
            return (
              <span key={id} className="flex items-center gap-0.5">
                {i > 0 && <span className="text-gray-500">+</span>}
                <span
                  className="inline-block w-4 h-4 rounded-full border border-white"
                  style={{ backgroundColor: c?.hex }}
                  title={colorNames[id]}
                />
                {n > 1 && <span className="text-[10px] font-bold">×{n}</span>}
              </span>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ── Centered correct ✓ celebration ──────────────────────────────────

interface CorrectBurstProps {
  isVisible: boolean;
  color?: string;
  reduceMotion?: boolean;
}

export function CorrectBurst({ isVisible, color = '#FBBF24', reduceMotion }: CorrectBurstProps) {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    angle: (i / 14) * Math.PI * 2,
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="text-7xl sm:text-8xl drop-shadow-lg">✨</div>
            {!reduceMotion && particles.map(p => (
              <motion.span
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(p.angle) * 120,
                  y: Math.sin(p.angle) * 120,
                  scale: 1,
                  opacity: 0,
                }}
                transition={{ duration: 0.9 }}
                className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
