'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Difficulty,
  GamePhase,
  GameState,
  PotionId,
  CreatureId,
} from './types';
import {
  DIFFICULTY_SETTINGS,
  LEVELS,
  matchRecipe,
  pickFailCreature,
  getLevelsForDifficulty,
} from './recipes';

// ─── Initial state ───────────────────────────────────────────

function createInitialState(): GameState {
  return {
    phase: 'menu',
    difficulty: 'easy',
    level: 1,
    targetCreature: 'slime',
    cauldronPotions: [],
    heatLevel: 0.5,
    stirCount: 0,
    brewProgress: 0,
    resultCreature: null,
    stars: 0,
    score: 0,
    highScore: 0,
    unlockedPotions: new Set<PotionId>(['green', 'blue', 'red', 'yellow', 'purple', 'pink']),
    creatureCollection: new Set<CreatureId>(),
    timeRemaining: null,
    showHints: true,
    currentLevel: null,
  };
}

// ─── Hook ────────────────────────────────────────────────────

export function usePotionCraftGame() {
  const [state, setState] = useState<GameState>(createInitialState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const brewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Start game ──────────────────────────────────────────
  const startGame = useCallback((difficulty: Difficulty) => {
    const levels = getLevelsForDifficulty(difficulty);
    const firstLevel = levels[0] || LEVELS[0];
    const settings = DIFFICULTY_SETTINGS[difficulty];

    setState(prev => ({
      ...prev,
      phase: 'playing',
      difficulty,
      level: 1,
      targetCreature: firstLevel.recipe.creature,
      cauldronPotions: [],
      heatLevel: 0.5,
      stirCount: 0,
      brewProgress: 0,
      resultCreature: null,
      stars: 0,
      timeRemaining: firstLevel.timeLimitSeconds,
      showHints: settings.showHints || firstLevel.showHints,
      currentLevel: firstLevel,
      unlockedPotions: new Set(firstLevel.availablePotions),
    }));

    // Start timer if level has time limit
    if (firstLevel.timeLimitSeconds) {
      startTimer(firstLevel.timeLimitSeconds);
    }
  }, []);

  // ─── Timer management ────────────────────────────────────
  const startTimer = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.timeRemaining === null || prev.phase !== 'playing') {
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        }
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Time's up — auto-brew with whatever is in the cauldron
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ─── Add potion ──────────────────────────────────────────
  const addPotion = useCallback((potionId: PotionId) => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      if (!prev.currentLevel) return prev;

      const maxIngredients = prev.currentLevel.recipe.ingredients.length;
      if (prev.cauldronPotions.length >= maxIngredients) return prev;

      return {
        ...prev,
        cauldronPotions: [...prev.cauldronPotions, potionId],
      };
    });
  }, []);

  // ─── Remove last potion ──────────────────────────────────
  const undoPotion = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      if (prev.cauldronPotions.length === 0) return prev;
      return {
        ...prev,
        cauldronPotions: prev.cauldronPotions.slice(0, -1),
      };
    });
  }, []);

  // ─── Set heat ────────────────────────────────────────────
  const setHeatLevel = useCallback((level: number) => {
    setState(prev => ({
      ...prev,
      heatLevel: Math.max(0, Math.min(1, level)),
    }));
  }, []);

  // ─── Stir ────────────────────────────────────────────────
  const stir = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      return { ...prev, stirCount: prev.stirCount + 1 };
    });
  }, []);

  // ─── Brew ────────────────────────────────────────────────
  const brew = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      if (prev.cauldronPotions.length === 0) return prev;
      return { ...prev, phase: 'brewing', brewProgress: 0 };
    });

    stopTimer();

    // Animate brewing over 3 seconds
    let progress = 0;
    if (brewTimerRef.current) clearInterval(brewTimerRef.current);
    brewTimerRef.current = setInterval(() => {
      progress += 0.02; // ~50ms interval, 50 steps = ~2.5s
      if (progress >= 1) {
        if (brewTimerRef.current) clearInterval(brewTimerRef.current);
        // Evaluate recipe
        setState(prev => {
          const result = matchRecipe(
            prev.cauldronPotions,
            prev.heatLevel,
            prev.stirCount,
            prev.difficulty,
          );

          let creature: CreatureId;
          let stars: number;

          if (result) {
            creature = result.recipe.creature;
            stars = result.stars;
          } else {
            creature = pickFailCreature();
            stars = 0;
          }

          const scoreGain = stars * 100 * DIFFICULTY_SETTINGS[prev.difficulty].scoreMultiplier;
          const newScore = prev.score + scoreGain;
          const newCollection = new Set(prev.creatureCollection);
          if (stars > 0) newCollection.add(creature);

          return {
            ...prev,
            phase: 'result',
            brewProgress: 1,
            resultCreature: creature,
            stars,
            score: newScore,
            highScore: Math.max(prev.highScore, newScore),
            creatureCollection: newCollection,
          };
        });
      } else {
        setState(prev => ({ ...prev, brewProgress: progress }));
      }
    }, 50);
  }, [stopTimer]);

  // ─── Next level ──────────────────────────────────────────
  const nextLevel = useCallback(() => {
    setState(prev => {
      const levels = getLevelsForDifficulty(prev.difficulty);
      const nextLevelIdx = prev.level; // 0-indexed next
      if (nextLevelIdx >= levels.length) {
        // All levels complete!
        return { ...prev, phase: 'menu' };
      }

      const lvl = levels[nextLevelIdx];
      const settings = DIFFICULTY_SETTINGS[prev.difficulty];

      if (lvl.timeLimitSeconds) {
        startTimer(lvl.timeLimitSeconds);
      }

      return {
        ...prev,
        phase: 'playing',
        level: prev.level + 1,
        targetCreature: lvl.recipe.creature,
        cauldronPotions: [],
        heatLevel: 0.5,
        stirCount: 0,
        brewProgress: 0,
        resultCreature: null,
        stars: 0,
        timeRemaining: lvl.timeLimitSeconds,
        showHints: settings.showHints || lvl.showHints,
        currentLevel: lvl,
        unlockedPotions: new Set(lvl.availablePotions),
      };
    });
  }, [startTimer]);

  // ─── Retry level ─────────────────────────────────────────
  const retryLevel = useCallback(() => {
    setState(prev => {
      if (!prev.currentLevel) return { ...prev, phase: 'menu' };

      const lvl = prev.currentLevel;
      if (lvl.timeLimitSeconds) {
        startTimer(lvl.timeLimitSeconds);
      }

      return {
        ...prev,
        phase: 'playing',
        cauldronPotions: [],
        heatLevel: 0.5,
        stirCount: 0,
        brewProgress: 0,
        resultCreature: null,
        stars: 0,
        timeRemaining: lvl.timeLimitSeconds,
      };
    });
  }, [startTimer]);

  // ─── Pause / Resume ──────────────────────────────────────
  const pause = useCallback(() => {
    stopTimer();
    setState(prev => ({ ...prev, phase: 'paused' }));
  }, [stopTimer]);

  const resume = useCallback(() => {
    setState(prev => {
      if (prev.timeRemaining && prev.timeRemaining > 0) {
        startTimer(prev.timeRemaining);
      }
      return { ...prev, phase: 'playing' };
    });
  }, [startTimer]);

  // ─── Back to menu ────────────────────────────────────────
  const backToMenu = useCallback(() => {
    stopTimer();
    if (brewTimerRef.current) clearInterval(brewTimerRef.current);
    setState(createInitialState());
  }, [stopTimer]);

  return {
    state,
    startGame,
    addPotion,
    undoPotion,
    setHeatLevel,
    stir,
    brew,
    nextLevel,
    retryLevel,
    pause,
    resume,
    backToMenu,
  };
}
