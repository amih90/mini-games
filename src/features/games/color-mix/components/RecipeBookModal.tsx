'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RECIPES, COLOR_BY_ID, RESULTS } from '../data/colors';
import { COLOR_NAMES, LESSONS, UI, type Locale } from '../data/strings';

interface RecipeBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  discovered: Set<string>;
  locale: Locale;
  reduceMotion?: boolean;
}

export function RecipeBookModal({ isOpen, onClose, discovered, locale, reduceMotion }: RecipeBookModalProps) {
  const ui = UI[locale];
  const colorNames = COLOR_NAMES[locale];
  const lessons = LESSONS[locale];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={reduceMotion ? false : { y: 30, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { y: 30, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="bg-amber-50 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[88vh] overflow-y-auto border-4 border-amber-700/40"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-amber-700 to-amber-500 p-4 sm:p-6 border-b-4 border-amber-900/30 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl">📖</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow">
                    {ui.recipeBook}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90">
                    {discovered.size}/{RECIPES.length} {ui.discoveredColors}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/25 hover:bg-white/40 transition flex items-center justify-center text-white text-xl"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Sticker grid */}
            <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {RECIPES.map(recipe => {
                const result = RESULTS[recipe.result];
                const isFound = discovered.has(recipe.result);
                return (
                  <motion.div
                    key={recipe.id}
                    initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={reduceMotion ? undefined : { y: -3, rotate: -1 }}
                    className={`relative p-3 rounded-2xl border-2 ${isFound
                      ? 'bg-white border-amber-300 shadow-md'
                      : 'bg-amber-100/50 border-dashed border-amber-400/60'
                      }`}
                  >
                    {/* Result swatch */}
                    <div className="flex flex-col items-center gap-2">
                      {isFound ? (
                        <div
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-inner flex items-center justify-center text-2xl"
                          style={{ backgroundColor: result.hex }}
                        >
                          {result.emoji}
                        </div>
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-200/70 border-4 border-amber-300/50 flex items-center justify-center text-3xl text-amber-700/60">
                          ?
                        </div>
                      )}
                      <span className="text-xs sm:text-sm font-bold text-gray-800 text-center min-h-[1.5em]">
                        {isFound ? colorNames[recipe.result] : '???'}
                      </span>
                    </div>

                    {/* Formula */}
                    {isFound && (
                      <div className="mt-2 pt-2 border-t border-amber-200">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {Object.entries(recipe.parts).map(([id, n], i, arr) => {
                            const c = COLOR_BY_ID[id];
                            return (
                              <span key={id} className="flex items-center gap-0.5">
                                {i > 0 && <span className="text-gray-400 text-xs">+</span>}
                                <span
                                  className="inline-block w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: c?.hex ?? '#888' }}
                                  title={colorNames[id]}
                                />
                                {n > 1 && <span className="text-[10px] font-bold text-gray-700">×{n}</span>}
                                {i === arr.length - 1 && <span className="text-gray-400 text-xs ms-1">=</span>}
                              </span>
                            );
                          })}
                        </div>
                        <p className="mt-1.5 text-[10px] sm:text-xs text-gray-600 italic text-center leading-tight">
                          {lessons[recipe.lesson]}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
