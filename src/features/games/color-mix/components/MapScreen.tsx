'use client';

import { motion } from 'framer-motion';
import { ACTS, ACT_BY_ID, LEVELS_BY_ACT, type ActId, type Level } from '../data/levels';
import { ACT_TITLES, UI, type Locale } from '../data/strings';
import { ColorWheel } from './ColorWheel';

interface MapScreenProps {
  locale: Locale;
  totalStars: number;
  starsByLevel: Record<number, number>;
  isLevelUnlocked: (id: number) => boolean;
  isLevelComplete: (id: number) => boolean;
  discovered: Set<string>;
  freePlayUnlocked: boolean;
  onLevelStart: (level: Level) => void;
  onFreePlay: () => void;
  onOpenRecipeBook: () => void;
  onOpenSettings: () => void;
  reduceMotion?: boolean;
  isRtl?: boolean;
}

export function MapScreen({
  locale, totalStars, starsByLevel, isLevelUnlocked, isLevelComplete,
  discovered, freePlayUnlocked, onLevelStart, onFreePlay, onOpenRecipeBook,
  onOpenSettings, reduceMotion, isRtl,
}: MapScreenProps) {
  const ui = UI[locale];
  const actTitles = ACT_TITLES[locale];

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-3 sm:p-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <motion.div
        initial={reduceMotion ? false : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <span className="text-5xl sm:text-6xl">🧪</span>
          <div className="text-start">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-lg">
              {ui.title}
            </h1>
            <p className="text-sm sm:text-base text-white/90">{ui.map}</p>
          </div>
        </div>
      </motion.div>

      {/* Top bar: stars + recipe book + settings */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-300 rounded-full shadow font-extrabold text-gray-800 text-sm sm:text-base flex items-center gap-1">
          ⭐ {totalStars}
        </div>
        <button
          onClick={onOpenRecipeBook}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/95 rounded-full shadow font-bold text-gray-800 text-sm sm:text-base hover:scale-105 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
        >
          📖 {ui.recipeBook}
        </button>
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 shadow text-xl flex items-center justify-center hover:scale-105 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
          aria-label={ui.settings}
        >
          ⚙️
        </button>
      </div>

      {/* Color wheel trophy */}
      <ColorWheel discovered={discovered} size={160} reduceMotion={reduceMotion} />

      {/* Acts */}
      <div className="w-full max-w-3xl flex flex-col gap-4">
        {ACTS.map(act => (
          <ActPath
            key={act.id}
            actId={act.id}
            title={actTitles[act.id]}
            ui={ui}
            levels={LEVELS_BY_ACT[act.id]}
            starsByLevel={starsByLevel}
            isLevelUnlocked={isLevelUnlocked}
            isLevelComplete={isLevelComplete}
            onLevelStart={onLevelStart}
            reduceMotion={reduceMotion}
          />
        ))}

        {/* Free Play */}
        <motion.button
          initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={freePlayUnlocked && !reduceMotion ? { scale: 1.02 } : undefined}
          whileTap={freePlayUnlocked && !reduceMotion ? { scale: 0.98 } : undefined}
          onClick={freePlayUnlocked ? onFreePlay : undefined}
          disabled={!freePlayUnlocked}
          className={`w-full p-4 rounded-2xl shadow-xl text-start flex items-center gap-3 ${freePlayUnlocked
            ? 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 text-white cursor-pointer'
            : 'bg-gray-300/60 text-gray-500 cursor-not-allowed'
            }`}
        >
          <span className="text-4xl">🎨</span>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-extrabold">{ui.freePlay}</h3>
            <p className="text-xs sm:text-sm opacity-90">
              {freePlayUnlocked ? ui.freePlayDesc : ui.freePlayLocked}
            </p>
          </div>
          <span className="text-2xl">{freePlayUnlocked ? '✨' : '🔒'}</span>
        </motion.button>
      </div>
    </div>
  );
}

function ActPath({
  actId, title, ui, levels, starsByLevel, isLevelUnlocked, isLevelComplete, onLevelStart, reduceMotion,
}: {
  actId: ActId;
  title: string;
  ui: Record<string, string>;
  levels: Level[];
  starsByLevel: Record<number, number>;
  isLevelUnlocked: (id: number) => boolean;
  isLevelComplete: (id: number) => boolean;
  onLevelStart: (level: Level) => void;
  reduceMotion?: boolean;
}) {
  const act = ACT_BY_ID[actId];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      className={`p-3 sm:p-4 rounded-2xl bg-gradient-to-r ${act.bgClass} shadow-lg`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl sm:text-3xl">{act.emoji}</span>
        <div>
          <p className="text-xs sm:text-sm font-bold text-white/90 drop-shadow">{ui.actChapter} {actId}</p>
          <h3 className="text-lg sm:text-xl font-extrabold text-white drop-shadow">{title}</h3>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {levels.map(level => {
          const stars = starsByLevel[level.id] ?? 0;
          const unlocked = isLevelUnlocked(level.id);
          const completed = isLevelComplete(level.id);
          return (
            <motion.button
              key={level.id}
              whileHover={unlocked && !reduceMotion ? { scale: 1.08, y: -2 } : undefined}
              whileTap={unlocked && !reduceMotion ? { scale: 0.95 } : undefined}
              onClick={unlocked ? () => onLevelStart(level) : undefined}
              disabled={!unlocked}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center shadow-md font-extrabold text-lg ${unlocked
                ? completed
                  ? 'bg-white text-gray-800 cursor-pointer'
                  : 'bg-yellow-200 text-gray-900 cursor-pointer ring-4 ring-yellow-400 animate-pulse'
                : 'bg-gray-400/70 text-white/60 cursor-not-allowed'
                }`}
              aria-label={`${ui.level} ${level.id}`}
            >
              {!unlocked && <span className="absolute text-2xl">🔒</span>}
              {unlocked && (
                <>
                  <span>{level.id}</span>
                  {completed && (
                    <div className="absolute -bottom-2 flex items-center text-xs">
                      {[1, 2, 3].map(i => (
                        <span key={i} className={i <= stars ? 'text-yellow-500' : 'text-gray-300'}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
