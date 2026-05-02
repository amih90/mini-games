'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Level } from '../data/levels';
import { ACT_BY_ID, ACT_INTROS } from '../data/levels';
import { ACT_TITLES, UI, type Locale } from '../data/strings';

interface LevelIntroProps {
  isOpen: boolean;
  level: Level | null;
  locale: Locale;
  onStart: () => void;
  reduceMotion?: boolean;
}

export function LevelIntro({ isOpen, level, locale, onStart, reduceMotion }: LevelIntroProps) {
  if (!level) return null;
  const ui = UI[locale];
  const act = ACT_BY_ID[level.act];
  const actTitle = ACT_TITLES[locale][level.act];
  const intro = ACT_INTROS[locale][level.act];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={reduceMotion ? false : { scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { scale: 0.85, y: 30 }}
            className={`bg-gradient-to-br ${act.bgClass} rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-white text-center border-4 border-white/40`}
          >
            <span className="text-6xl sm:text-7xl block mb-3">{act.emoji}</span>
            <p className="text-sm font-bold uppercase tracking-wide opacity-90">
              {ui.actChapter} {level.act} · {ui.level} {level.id}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold drop-shadow-lg mt-1 mb-3">
              {actTitle}
            </h2>
            <p className="text-base sm:text-lg leading-snug bg-white/15 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              {intro}
            </p>
            <button
              onClick={onStart}
              className="mt-5 px-8 py-3 bg-white text-gray-900 rounded-2xl font-extrabold text-lg shadow-lg hover:scale-105 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
            >
              {ui.play} →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface LevelCompleteProps {
  isOpen: boolean;
  stars: number;
  bossBonus: boolean;
  scoreEarned: number;
  totalStars: number;
  isLastLevel: boolean;
  locale: Locale;
  onNext: () => void;
  onMap: () => void;
  reduceMotion?: boolean;
}

export function LevelComplete({
  isOpen, stars, bossBonus, scoreEarned, totalStars, isLastLevel, locale, onNext, onMap, reduceMotion,
}: LevelCompleteProps) {
  const ui = UI[locale];
  const messages = [ui.oneStar, ui.twoStars, ui.perfectStars];
  const message = messages[Math.max(0, Math.min(2, stars - 1))];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={reduceMotion ? false : { scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-400 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-white text-center border-4 border-white"
          >
            <span className="text-6xl sm:text-7xl block mb-2">🎉</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold drop-shadow mb-2">
              {isLastLevel ? ui.journeyComplete : ui.levelComplete}
            </h2>
            <p className="text-base sm:text-lg font-bold drop-shadow mb-4">{message}</p>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 mb-3 text-4xl sm:text-5xl">
              {[1, 2, 3].map(i => (
                <motion.span
                  key={i}
                  initial={reduceMotion ? false : { scale: 0, rotate: -180 }}
                  animate={{ scale: i <= stars ? 1 : 0.7, rotate: 0 }}
                  transition={{ delay: 0.2 + i * 0.15, type: 'spring' }}
                  className={i <= stars ? 'text-yellow-300 drop-shadow-lg' : 'text-white/30'}
                >
                  ⭐
                </motion.span>
              ))}
            </div>

            {bossBonus && (
              <div className="inline-block px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold mb-3">
                👑 {ui.bossBonus}
              </div>
            )}

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mb-4">
              <p className="text-sm">{ui.starsEarned}: <strong>+{stars}</strong></p>
              <p className="text-sm">{ui.totalStars}: <strong>{totalStars}</strong></p>
              <p className="text-sm">{ui.score}: <strong>+{scoreEarned}</strong></p>
            </div>

            {isLastLevel && (
              <p className="text-base font-bold mb-3 drop-shadow">{ui.youAreAMaster}</p>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={onMap}
                className="px-5 py-2.5 bg-white/30 backdrop-blur-sm border-2 border-white text-white rounded-xl font-bold hover:bg-white/40 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
              >
                🗺️ {ui.backToMap}
              </button>
              {!isLastLevel && (
                <button
                  onClick={onNext}
                  className="px-5 py-2.5 bg-white text-gray-900 rounded-xl font-extrabold shadow-lg hover:scale-105 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
                >
                  {ui.nextChallenge} →
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface PauseModalProps {
  isOpen: boolean;
  locale: Locale;
  onResume: () => void;
  onMap: () => void;
}

export function PauseModal({ isOpen, locale, onResume, onMap }: PauseModalProps) {
  const ui = UI[locale];
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center max-w-sm w-full"
          >
            <span className="text-5xl block mb-3">⏸️</span>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-5">{ui.pause}</h2>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={onResume}
                className="w-full px-5 py-3 bg-green-500 text-white rounded-xl font-bold shadow-md hover:bg-green-600 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
              >
                ▶️ {ui.resume}
              </button>
              <button
                onClick={onMap}
                className="w-full px-5 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
              >
                🗺️ {ui.backToMap}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SettingsModalProps {
  isOpen: boolean;
  locale: Locale;
  cbAssist: boolean;
  reduceMotion: boolean;
  isMuted: boolean;
  onToggleCb: (v: boolean) => void;
  onToggleMotion: (v: boolean) => void;
  onToggleMute: () => void;
  onClose: () => void;
}

export function SettingsModal({
  isOpen, locale, cbAssist, reduceMotion, isMuted,
  onToggleCb, onToggleMotion, onToggleMute, onClose,
}: SettingsModalProps) {
  const ui = UI[locale];
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-gray-800">⚙️ {ui.settings}</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <Toggle label={`🔠 ${ui.cbAssist}`} value={cbAssist} onChange={onToggleCb} ui={ui} />
              <Toggle label={`🌀 ${ui.reduceMotion}`} value={reduceMotion} onChange={onToggleMotion} ui={ui} />
              <Toggle label={`🔊 ${ui.sound}`} value={!isMuted} onChange={() => onToggleMute()} ui={ui} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toggle({ label, value, onChange, ui }: { label: string; value: boolean; onChange: (v: boolean) => void; ui: Record<string, string> }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
    >
      <span className="font-bold text-gray-800 text-sm sm:text-base text-start">{label}</span>
      <span
        className={`px-3 py-1 rounded-full text-xs font-extrabold transition ${value
          ? 'bg-green-500 text-white'
          : 'bg-gray-300 text-gray-700'
          }`}
      >
        {value ? ui.on : ui.off}
      </span>
    </button>
  );
}
