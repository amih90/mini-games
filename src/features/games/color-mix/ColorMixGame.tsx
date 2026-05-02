'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';

import { GameWrapper } from '../shared/GameWrapper';
import { InstructionsModal } from '../shared/InstructionsModal';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';

import { BASE_COLORS, UNLOCKABLE_COLORS, COLOR_BY_ID, RESULTS, RECIPE_BY_ID, findRecipeByPour, totalParts, blendHex } from './data/colors';
import type { Recipe, PaintColor } from './data/colors';
import { LEVELS, LEVEL_BY_ID, TOTAL_LEVELS, type Level } from './data/levels';
import { COLOR_NAMES, INSTRUCTIONS_DATA, REAL_WORLD, UI, getLocale } from './data/strings';

import { useColorMixProgress } from './hooks/useColorMixProgress';
import { PaintTube } from './components/PaintTube';
import { Bowl } from './components/Bowl';
import { MapScreen } from './components/MapScreen';
import { RecipeBookModal } from './components/RecipeBookModal';
import { LevelIntro, LevelComplete, PauseModal, SettingsModal } from './components/Overlays';
import { LessonCard, WrongFeedback, HintCard, CorrectBurst } from './components/Feedback';

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

type Phase = 'map' | 'levelIntro' | 'playing' | 'levelComplete' | 'won' | 'freePlay';

const MAX_PARTS_PER_TUBE = 3;
const MAX_TOTAL_PARTS = 6;

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export function ColorMixGame() {
  const localeRaw = useLocale();
  const locale = getLocale(localeRaw);
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const ui = UI[locale];
  const colorNames = COLOR_NAMES[locale];

  const { playClick, playSuccess, playDrop, playLevelUp, playWin, playPowerUp, playHit, playWhoosh, isMuted, toggleMute } = useRetroSounds();
  const {
    progress, hydrated, totalStars, discoveredSet,
    isLevelUnlocked, isLevelComplete,
    recordLevelStars, discoverColor, addScore, setSetting,
  } = useColorMixProgress();

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>('map');
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [pour, setPour] = useState<Record<string, number>>({});
  const [resultRecipe, setResultRecipe] = useState<Recipe | null>(null);
  const [resultHex, setResultHex] = useState<string | null>(null);
  const [stirring, setStirring] = useState(false);
  const [showCorrectBurst, setShowCorrectBurst] = useState(false);
  const [showLesson, setShowLesson] = useState(false);
  const [lessonRecipe, setLessonRecipe] = useState<Recipe | null>(null);
  const [showWrong, setShowWrong] = useState(false);
  const [wrongActualRecipe, setWrongActualRecipe] = useState<Recipe | null>(null);
  const [streak, setStreak] = useState(0);
  const [wrongInLevel, setWrongInLevel] = useState(0);
  const [wrongOnChallenge, setWrongOnChallenge] = useState(0);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [scoreInLevel, setScoreInLevel] = useState(0);
  const [bossHadWrong, setBossHadWrong] = useState(false);

  // UI overlays
  const [showInstructions, setShowInstructions] = useState(false);
  const [showRecipeBook, setShowRecipeBook] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showNewTubeBanner, setShowNewTubeBanner] = useState<string | null>(null);

  const cbAssist = progress.settings.cbAssist;
  const reduceMotion = progress.settings.reduceMotion;

  // ── Derived ──
  const activeLevel: Level | null = activeLevelId ? LEVEL_BY_ID[activeLevelId] : null;
  const currentChallenge = activeLevel ? activeLevel.challenges[challengeIndex] : null;
  const targetRecipe = currentChallenge ? RECIPE_BY_ID[currentChallenge.recipeId] : null;
  const isFreePlay = phase === 'freePlay';
  const freePlayUnlocked = isLevelComplete(TOTAL_LEVELS);

  // Available tubes
  const availableTubes: PaintColor[] = useMemo(() => {
    const base = [...BASE_COLORS];
    if (isFreePlay) return [...base, ...UNLOCKABLE_COLORS];
    if (!activeLevel) return base;
    if (!activeLevel.unlocksTubes) return base;
    const extras = activeLevel.unlocksTubes
      .map(id => UNLOCKABLE_COLORS.find(c => c.id === id))
      .filter(Boolean) as PaintColor[];
    return [...base, ...extras];
  }, [activeLevel, isFreePlay]);

  const totalPour = useMemo(() => totalParts(pour), [pour]);
  const formulaIds = useMemo(() => Object.keys(pour).filter(id => pour[id] > 0), [pour]);

  const previewHex = useMemo(() => blendHex(pour), [pour]);

  // ─────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────

  const resetMixState = useCallback(() => {
    setPour({});
    setResultRecipe(null);
    setResultHex(null);
    setShowWrong(false);
    setWrongActualRecipe(null);
    setShowLesson(false);
    setLessonRecipe(null);
    setHintLevel(0);
    setShowCorrectBurst(false);
  }, []);

  const startLevel = useCallback((level: Level) => {
    playClick();
    setActiveLevelId(level.id);
    setChallengeIndex(0);
    setStreak(0);
    setWrongInLevel(0);
    setWrongOnChallenge(0);
    setBossHadWrong(false);
    setScoreInLevel(0);
    resetMixState();
    setPhase('levelIntro');
  }, [playClick, resetMixState]);

  const startFreePlay = useCallback(() => {
    if (!freePlayUnlocked) return;
    playClick();
    setActiveLevelId(null);
    resetMixState();
    setPhase('freePlay');
  }, [playClick, resetMixState, freePlayUnlocked]);

  const goToMap = useCallback(() => {
    playClick();
    resetMixState();
    setShowPause(false);
    setActiveLevelId(null);
    setPhase('map');
  }, [playClick, resetMixState]);

  const beginPlaying = useCallback(() => {
    playClick();
    setPhase('playing');
  }, [playClick]);

  const pourTube = useCallback((colorId: string) => {
    if (stirring || resultRecipe || showWrong) return;
    setPour(prev => {
      const current = prev[colorId] ?? 0;
      if (current >= MAX_PARTS_PER_TUBE) return prev;
      const total = totalParts(prev);
      if (total >= MAX_TOTAL_PARTS) return prev;
      return { ...prev, [colorId]: current + 1 };
    });
    playDrop();
  }, [stirring, resultRecipe, showWrong, playDrop]);

  const clearBowl = useCallback(() => {
    if (stirring) return;
    playClick();
    resetMixState();
  }, [stirring, playClick, resetMixState]);

  const advanceChallenge = useCallback(() => {
    if (!activeLevel) return;
    const nextIndex = challengeIndex + 1;
    if (nextIndex < activeLevel.challenges.length) {
      setChallengeIndex(nextIndex);
      setWrongOnChallenge(0);
      setHintLevel(0);
      resetMixState();
      return;
    }

    // Level complete — calculate stars
    let stars = 3;
    if (wrongInLevel >= 1) stars = 2;
    if (wrongInLevel >= 3) stars = 1;
    const bossBonus = activeLevel.challenges.some(c => c.boss) && !bossHadWrong;
    if (bossBonus) stars = Math.min(3, stars + 1);

    recordLevelStars(activeLevel.id, stars);
    addScore(scoreInLevel + (bossBonus ? 200 : 0));
    playLevelUp();
    if (activeLevel.id === TOTAL_LEVELS) {
      setTimeout(() => playWin(), 400);
      setPhase('won');
    } else {
      setPhase('levelComplete');
    }
  }, [activeLevel, challengeIndex, wrongInLevel, bossHadWrong, scoreInLevel, recordLevelStars, addScore, playLevelUp, playWin, resetMixState]);

  const goNextLevel = useCallback(() => {
    if (!activeLevel) return;
    const next = LEVELS.find(l => l.id === activeLevel.id + 1);
    if (next) {
      startLevel(next);
    } else {
      goToMap();
    }
  }, [activeLevel, startLevel, goToMap]);

  // ── Stir & resolve ──
  const stir = useCallback(() => {
    if (totalPour < 2 || stirring || resultRecipe || showWrong) return;
    playWhoosh();
    setStirring(true);

    // Animate the stir for ~700ms then reveal result
    setTimeout(() => {
      const recipe = findRecipeByPour(pour);
      const finalHex = recipe ? RESULTS[recipe.result].hex : previewHex;
      setResultHex(finalHex);
      setResultRecipe(recipe);
      setStirring(false);

      // Free Play: just record discovery, no win/lose
      if (isFreePlay) {
        if (recipe) {
          discoverColor(recipe.result);
          setLessonRecipe(recipe);
          setShowLesson(true);
          playSuccess();
          setShowCorrectBurst(true);
          setTimeout(() => {
            setShowCorrectBurst(false);
          }, 900);
          // Auto-clear after a moment
          setTimeout(() => {
            setShowLesson(false);
            resetMixState();
          }, 2400);
        } else {
          // Unknown mix — gentle clear
          setTimeout(() => resetMixState(), 1200);
        }
        return;
      }

      // Story mode: check correctness
      const isCorrect = !!targetRecipe && recipe?.id === targetRecipe.id;
      if (isCorrect) {
        playSuccess();
        setShowCorrectBurst(true);

        // Discovery
        const isNew = !discoveredSet.has(recipe!.result);
        discoverColor(recipe!.result);

        // Score
        const base = 100;
        const newStreak = streak + 1;
        setStreak(newStreak);
        const streakBonus = newStreak >= 3 ? Math.min(newStreak, 5) * 25 : 0;
        const noviceBonus = isNew ? 50 : 0;
        const earned = base + streakBonus + noviceBonus;
        setScoreInLevel(s => s + earned);

        // Lesson card
        setLessonRecipe(recipe!);
        setShowLesson(true);

        if (isNew) {
          setTimeout(() => playPowerUp(), 250);
        }

        setTimeout(() => setShowCorrectBurst(false), 900);
        setTimeout(() => {
          setShowLesson(false);
          advanceChallenge();
        }, 2400);
      } else {
        // Wrong
        playHit();
        setWrongInLevel(w => w + 1);
        setWrongOnChallenge(w => w + 1);
        setStreak(0);
        if (currentChallenge?.boss) setBossHadWrong(true);
        setWrongActualRecipe(recipe);
        setShowWrong(true);

        // Hint ladder advance
        setHintLevel(() => {
          const next = Math.min(3, wrongOnChallenge + 1);
          return next as 0 | 1 | 2 | 3;
        });

        setTimeout(() => {
          setShowWrong(false);
          setResultRecipe(null);
          setResultHex(null);
          setWrongActualRecipe(null);
          setPour({});
        }, 2200);
      }
    }, 750);
  }, [totalPour, stirring, resultRecipe, showWrong, pour, previewHex, isFreePlay, targetRecipe, currentChallenge, streak, wrongOnChallenge, discoveredSet,
      playWhoosh, playSuccess, playHit, playPowerUp,
      discoverColor, advanceChallenge, resetMixState]);

  // Ask for hint manually (jumps the ladder by 1)
  const askHint = useCallback(() => {
    playClick();
    setHintLevel(h => Math.min(3, h + 1) as 0 | 1 | 2 | 3);
  }, [playClick]);

  // ── New-tube banner when entering a level that unlocks tubes ──
  const lastLevelIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== 'playing' || !activeLevel) return;
    if (lastLevelIdRef.current === activeLevel.id) return;
    lastLevelIdRef.current = activeLevel.id;
    if (activeLevel.unlocksTubes && activeLevel.unlocksTubes.length > 0) {
      setShowNewTubeBanner('🔓');
      setTimeout(() => setShowNewTubeBanner(null), 1800);
    }
  }, [phase, activeLevel]);

  // ── Keyboard handlers ──
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'freePlay') return;
    const handler = (e: KeyboardEvent) => {
      if (showPause || showRecipeBook || showSettings || showInstructions) {
        if (e.key === 'Escape') {
          setShowPause(false);
          setShowRecipeBook(false);
          setShowSettings(false);
          setShowInstructions(false);
        }
        return;
      }
      if (e.key === 'Enter') { stir(); return; }
      if (e.key === 'Backspace') { clearBowl(); return; }
      if (e.key === 'Escape') { setShowPause(true); return; }
      if (e.key.toLowerCase() === 'r') { setShowRecipeBook(true); return; }
      if (e.key.toLowerCase() === 'h') { askHint(); return; }
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= availableTubes.length) {
        pourTube(availableTubes[n - 1].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, showPause, showRecipeBook, showSettings, showInstructions, availableTubes, stir, clearBowl, pourTube, askHint]);

  // Don't render until hydrated to avoid SSR/CSR mismatch on persisted state
  if (!hydrated) {
    return (
      <GameWrapper title={ui.title}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="text-5xl animate-pulse">🧪</span>
        </div>
      </GameWrapper>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  const instrData = INSTRUCTIONS_DATA[locale];

  // ── MAP ──
  if (phase === 'map') {
    return (
      <GameWrapper title={ui.title} onInstructionsClick={() => setShowInstructions(true)}>
        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          title={ui.title}
          instructions={instrData.instructions}
          controls={instrData.controls}
          tip={instrData.tip}
          locale={locale}
        />
        <RecipeBookModal
          isOpen={showRecipeBook}
          onClose={() => setShowRecipeBook(false)}
          discovered={discoveredSet}
          locale={locale}
          reduceMotion={reduceMotion}
        />
        <SettingsModal
          isOpen={showSettings}
          locale={locale}
          cbAssist={cbAssist}
          reduceMotion={reduceMotion}
          isMuted={isMuted}
          onToggleCb={v => setSetting('cbAssist', v)}
          onToggleMotion={v => setSetting('reduceMotion', v)}
          onToggleMute={() => toggleMute()}
          onClose={() => setShowSettings(false)}
        />
        <MapScreen
          locale={locale}
          totalStars={totalStars}
          starsByLevel={progress.stars}
          isLevelUnlocked={isLevelUnlocked}
          isLevelComplete={isLevelComplete}
          discovered={discoveredSet}
          freePlayUnlocked={freePlayUnlocked}
          onLevelStart={startLevel}
          onFreePlay={startFreePlay}
          onOpenRecipeBook={() => setShowRecipeBook(true)}
          onOpenSettings={() => setShowSettings(true)}
          reduceMotion={reduceMotion}
          isRtl={isRtl}
        />
      </GameWrapper>
    );
  }

  // ── WON ──
  if (phase === 'won') {
    return (
      <GameWrapper title={ui.title}>
        <LevelComplete
          isOpen
          stars={3}
          bossBonus={false}
          scoreEarned={scoreInLevel}
          totalStars={totalStars}
          isLastLevel
          locale={locale}
          onNext={goToMap}
          onMap={goToMap}
          reduceMotion={reduceMotion}
        />
      </GameWrapper>
    );
  }

  // ── PLAYING / FREE PLAY ──
  const target = targetRecipe;
  const targetResult = target ? RESULTS[target.result] : null;
  const targetAnchor = target ? REAL_WORLD[locale][target.result] : null;

  return (
    <GameWrapper
      title={ui.title}
      showBackButton={false}
      onInstructionsClick={() => setShowInstructions(true)}
    >
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={ui.title}
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />
      <RecipeBookModal
        isOpen={showRecipeBook}
        onClose={() => setShowRecipeBook(false)}
        discovered={discoveredSet}
        locale={locale}
        reduceMotion={reduceMotion}
      />
      <SettingsModal
        isOpen={showSettings}
        locale={locale}
        cbAssist={cbAssist}
        reduceMotion={reduceMotion}
        isMuted={isMuted}
        onToggleCb={v => setSetting('cbAssist', v)}
        onToggleMotion={v => setSetting('reduceMotion', v)}
        onToggleMute={() => toggleMute()}
        onClose={() => setShowSettings(false)}
      />
      <PauseModal
        isOpen={showPause}
        locale={locale}
        onResume={() => setShowPause(false)}
        onMap={goToMap}
      />
      <LevelIntro
        isOpen={phase === 'levelIntro'}
        level={activeLevel}
        locale={locale}
        onStart={beginPlaying}
        reduceMotion={reduceMotion}
      />
      <LevelComplete
        isOpen={phase === 'levelComplete'}
        stars={(() => {
          let s = 3;
          if (wrongInLevel >= 1) s = 2;
          if (wrongInLevel >= 3) s = 1;
          if (activeLevel?.challenges.some(c => c.boss) && !bossHadWrong) s = Math.min(3, s + 1);
          return s;
        })()}
        bossBonus={!!activeLevel?.challenges.some(c => c.boss) && !bossHadWrong}
        scoreEarned={scoreInLevel}
        totalStars={totalStars}
        isLastLevel={activeLevel?.id === TOTAL_LEVELS}
        locale={locale}
        onNext={goNextLevel}
        onMap={goToMap}
        reduceMotion={reduceMotion}
      />

      <LessonCard isOpen={showLesson} recipe={lessonRecipe} locale={locale} reduceMotion={reduceMotion} />
      <WrongFeedback isOpen={showWrong} actualRecipe={wrongActualRecipe} targetRecipe={target} locale={locale} />
      <CorrectBurst isVisible={showCorrectBurst} color={lessonRecipe ? RESULTS[lessonRecipe.result]?.hex : '#FBBF24'} reduceMotion={reduceMotion} />

      {/* New-tube banner */}
      <AnimatePresence>
        {showNewTubeBanner && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-full shadow-xl font-bold text-sm sm:text-base"
          >
            🔓 {ui.newTube}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-2 sm:gap-4 p-2 sm:p-4 pb-6 min-h-[80vh] w-full max-w-3xl mx-auto" dir={direction}>
        {/* HUD */}
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowPause(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 shadow flex items-center justify-center text-lg hover:scale-110 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
              aria-label={ui.pause}
            >
              ⏸️
            </button>
            {!isFreePlay && activeLevel && (
              <div className="px-2 sm:px-3 py-1 sm:py-2 bg-white/90 rounded-full shadow font-bold text-gray-800 text-xs sm:text-sm whitespace-nowrap">
                {ui.level} {activeLevel.id}/{TOTAL_LEVELS} · {challengeIndex + 1}/{activeLevel.challenges.length}
              </div>
            )}
            {isFreePlay && (
              <div className="px-2 sm:px-3 py-1 sm:py-2 bg-fuchsia-300 rounded-full shadow font-bold text-gray-800 text-xs sm:text-sm">
                🎨 {ui.freePlay}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowRecipeBook(true)}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-amber-200 rounded-full shadow font-bold text-gray-800 text-xs sm:text-sm hover:scale-105 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
              aria-label={ui.recipeBook}
            >
              📖 {discoveredSet.size}
            </button>
            {!isFreePlay && (
              <div className="px-2 sm:px-3 py-1 sm:py-2 bg-yellow-300 rounded-full shadow font-bold text-gray-800 text-xs sm:text-sm whitespace-nowrap">
                ⭐ {scoreInLevel}
              </div>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 shadow flex items-center justify-center text-base hover:scale-110 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
              aria-label={ui.settings}
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Streak indicator */}
        {streak >= 2 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`px-3 py-1 rounded-full shadow font-extrabold text-white text-sm flex items-center gap-1 ${streak >= 5 ? 'bg-red-500' : streak >= 3 ? 'bg-orange-500' : 'bg-yellow-500'
              }`}
          >
            {streak >= 5 ? '🔥🔥' : streak >= 3 ? '🔥' : '✨'} {streak} {ui.streak}!
          </motion.div>
        )}

        {/* Target color (story mode only) */}
        {!isFreePlay && target && targetResult && (
          <motion.div
            key={`target-${challengeIndex}`}
            initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 px-3 sm:px-5 py-2 sm:py-3 bg-white/90 rounded-2xl shadow-lg backdrop-blur-sm"
          >
            <span className="text-xs sm:text-sm font-bold text-gray-600">{ui.make}:</span>
            <motion.div
              animate={reduceMotion ? undefined : { scale: [1, 1.07, 1] }}
              transition={reduceMotion ? undefined : { repeat: Infinity, duration: 2.5 }}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-xl flex items-center justify-center relative"
              style={{ backgroundColor: targetResult.hex }}
            >
              <span className="text-xl sm:text-2xl">{targetResult.emoji}</span>
              {cbAssist && (
                <span className="absolute -bottom-1 -end-1 px-1.5 py-0.5 rounded-full bg-white text-[10px] font-extrabold text-gray-800 border border-gray-300 shadow">
                  {target.result.slice(0, 3).toUpperCase()}
                </span>
              )}
            </motion.div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
                {colorNames[target.result]}
              </span>
              {targetAnchor && (
                <span className="text-xs sm:text-sm text-gray-600 leading-tight">
                  {ui.like} {targetAnchor.emoji} {targetAnchor.text}
                </span>
              )}
              {currentChallenge?.boss && (
                <span className="text-xs font-extrabold text-purple-700 mt-0.5">👑 {ui.bossChallenge}</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Free play heading */}
        {isFreePlay && (
          <div className="text-center">
            <p className="text-sm sm:text-base text-white/90 font-bold drop-shadow">
              🎨 {ui.freePlayDesc}
            </p>
          </div>
        )}

        {/* Bowl + formula */}
        <div className="relative flex flex-col items-center gap-2">
          <Bowl pour={pour} resultHex={resultHex} stirring={stirring} reduceMotion={reduceMotion} />

          {/* Formula display */}
          {totalPour > 0 && (
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap text-xs sm:text-sm font-bold text-gray-800 px-3 py-1.5 bg-white/90 rounded-full shadow">
              {formulaIds.map((id, i) => {
                const c = COLOR_BY_ID[id];
                const n = pour[id];
                return (
                  <span key={id} className="flex items-center gap-1">
                    {i > 0 && <span className="text-gray-400">+</span>}
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: c?.hex }} />
                    {n > 1 && <span className="text-[11px] font-extrabold">×{n}</span>}
                  </span>
                );
              })}
              {resultRecipe && (
                <>
                  <span className="text-gray-400">=</span>
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: RESULTS[resultRecipe.result].hex }} />
                  <span className="text-[11px]">{colorNames[resultRecipe.result]}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Hint card */}
        {!isFreePlay && hintLevel > 0 && (
          <HintCard level={hintLevel} recipe={target} locale={locale} />
        )}

        {/* Color palette (with auto-wrap) */}
        <div className="flex justify-center gap-1 sm:gap-2 flex-wrap max-w-2xl">
          {availableTubes.map((color, i) => (
            <PaintTube
              key={color.id}
              color={color}
              label={colorNames[color.id]}
              parts={pour[color.id] ?? 0}
              onPour={() => pourTube(color.id)}
              disabled={stirring || !!resultRecipe || showWrong}
              cbAssist={cbAssist}
              reduceMotion={reduceMotion}
              hintGlow={hintLevel >= 2 && !!target?.parts[color.id]}
              newlyUnlocked={!color.base}
              shortcut={i + 1 <= 9 ? i + 1 : undefined}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3 mt-1">
          <button
            onClick={clearBowl}
            disabled={totalPour === 0 || stirring}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-gray-700 rounded-2xl font-bold shadow hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 text-sm sm:text-base"
            aria-label={ui.clear}
          >
            🗑️ {ui.clear}
          </button>
          <motion.button
            onClick={stir}
            disabled={totalPour < 2 || stirring || !!resultRecipe || showWrong}
            whileHover={totalPour >= 2 && !stirring && !reduceMotion ? { scale: 1.05 } : undefined}
            whileTap={totalPour >= 2 && !stirring && !reduceMotion ? { scale: 0.95 } : undefined}
            className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white text-base sm:text-lg font-extrabold rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
          >
            🥄 {ui.mixButton}
          </motion.button>
          {!isFreePlay && target && (
            <button
              onClick={askHint}
              disabled={hintLevel >= 3 || stirring}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-yellow-200 text-yellow-900 rounded-2xl font-bold shadow hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 text-sm sm:text-base"
              aria-label={ui.hintTitle}
            >
              💡 {ui.hintTitle}
            </button>
          )}
        </div>

        {/* Helper text */}
        {totalPour === 0 && !showWrong && (
          <p className="text-white/85 text-center font-medium text-sm sm:text-base px-3">
            {ui.pickColors}
          </p>
        )}
      </div>
    </GameWrapper>
  );
}
