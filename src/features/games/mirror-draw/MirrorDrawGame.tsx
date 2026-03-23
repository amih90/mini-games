'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'playing' | 'levelComplete' | 'won';

interface DifficultyConfig {
  totalLevels: number;
  challengesPerLevel: number;
  gridSize: number; // grid is gridSize x gridSize per side
  filledCells: number; // how many cells are filled on the left
  colors: string[];
  scoreMultiplier: number;
}

const COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#FACC15', '#A855F7', '#F97316'];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, challengesPerLevel: 5, gridSize: 3, filledCells: 3, colors: COLORS.slice(0, 3), scoreMultiplier: 1 },
  medium: { totalLevels: 4, challengesPerLevel: 6, gridSize: 4, filledCells: 5, colors: COLORS.slice(0, 4), scoreMultiplier: 1.5 },
  hard: { totalLevels: 5, challengesPerLevel: 7, gridSize: 5, filledCells: 8, colors: COLORS, scoreMultiplier: 2 },
};

type CellColor = string | null;

function generatePattern(gridSize: number, filledCells: number, colors: string[]): CellColor[][] {
  const grid: CellColor[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => null)
  );

  // Randomly fill cells
  const positions: [number, number][] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      positions.push([r, c]);
    }
  }

  // Shuffle and pick
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (let i = 0; i < Math.min(filledCells, positions.length); i++) {
    const [r, c] = positions[i];
    grid[r][c] = colors[Math.floor(Math.random() * colors.length)];
  }

  return grid;
}

function mirrorGrid(grid: CellColor[][]): CellColor[][] {
  return grid.map(row => [...row].reverse());
}

export function MirrorDrawGame() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'he';
  const { playClick, playSuccess, playDrop } = useRetroSounds();

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);
  const [playerGrid, setPlayerGrid] = useState<CellColor[][]>([]);

  const config = DIFFICULTY_CONFIG[difficulty];

  const { pattern, solution } = useMemo(() => {
    const p = generatePattern(config.gridSize, config.filledCells, config.colors);
    const s = mirrorGrid(p);
    return { pattern: p, solution: s };
  }, [config, level, challengeIndex, phase]);

  // Initialize player grid
  useMemo(() => {
    setPlayerGrid(
      Array.from({ length: config.gridSize }, () =>
        Array.from({ length: config.gridSize }, () => null)
      )
    );
  }, [config.gridSize, level, challengeIndex, phase]);

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setChallengeIndex(0);
    setStreak(0);
    setSelectedColor(COLORS[0]);
    playClick();
  }, [playClick]);

  const handleCellTap = useCallback((row: number, col: number) => {
    if (feedback) return;
    playClick();
    setPlayerGrid(prev => {
      const next = prev.map(r => [...r]);
      if (next[row][col] === selectedColor) {
        next[row][col] = null; // toggle off
      } else {
        next[row][col] = selectedColor;
      }
      return next;
    });
  }, [feedback, selectedColor, playClick]);

  const handleCheck = useCallback(() => {
    if (feedback) return;

    const isCorrect = solution.every((row, r) =>
      row.every((cell, c) => {
        if (cell === null && playerGrid[r]?.[c] === null) return true;
        return cell === playerGrid[r]?.[c];
      })
    );

    if (isCorrect) {
      setFeedback('correct');
      const streakBonus = streak >= 3 ? 50 : streak >= 2 ? 25 : 0;
      setScore(prev => prev + Math.round((100 + streakBonus) * config.scoreMultiplier));
      setStreak(prev => prev + 1);
      playSuccess();

      setTimeout(() => {
        setFeedback(null);
        if (challengeIndex + 1 >= config.challengesPerLevel) {
          if (level >= config.totalLevels) {
            setPhase('won');
          } else {
            setPhase('levelComplete');
          }
        } else {
          setChallengeIndex(prev => prev + 1);
        }
      }, 1200);
    } else {
      setFeedback('wrong');
      setStreak(0);
      playDrop();
      setTimeout(() => setFeedback(null), 800);
    }
  }, [playerGrid, solution, feedback, streak, config, challengeIndex, level, playSuccess, playDrop]);

  const handleClear = useCallback(() => {
    setPlayerGrid(
      Array.from({ length: config.gridSize }, () =>
        Array.from({ length: config.gridSize }, () => null)
      )
    );
    playDrop();
  }, [config.gridSize, playDrop]);

  const handleNextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setChallengeIndex(0);
    setPhase('playing');
    playClick();
  }, [playClick]);

  const handlePlayAgain = useCallback(() => {
    setPhase('menu');
    setScore(0);
    setLevel(1);
    setChallengeIndex(0);
    setStreak(0);
  }, []);

  usePlayAgainKey(phase === 'won', handlePlayAgain);

  const cellSize = config.gridSize <= 3 ? 'w-10 h-10 sm:w-12 sm:h-12' : config.gridSize <= 4 ? 'w-9 h-9 sm:w-11 sm:h-11' : 'w-8 h-8 sm:w-10 sm:h-10';

  return (
    <GameWrapper title="Mirror Draw" onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-3 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`}>

        {phase === 'playing' && (
          <div className="flex justify-between items-center mb-3 max-w-lg mx-auto">
            <LevelDisplay level={level} isRtl={isRtl} locale={locale} />
            <div className="flex gap-2">
              {streak >= 2 && (
                <span className="bg-violet-100 text-violet-700 px-2 py-1 rounded-full text-xs font-bold">🔥 {streak}</span>
              )}
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm font-bold">⭐ {score}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-12">
              <span className="text-7xl">🪞</span>
              <h2 className="text-3xl font-bold text-purple-800">Mirror Draw</h2>
              <p className="text-purple-600 text-center max-w-xs">Create the mirror image of the pattern!</p>
              <div className="flex flex-col gap-2 w-48">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <motion.button key={d} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleStart(d)}
                    className={`py-2 px-4 rounded-xl font-bold text-white shadow-md ${d === 'easy' ? 'bg-green-400 hover:bg-green-500' : d === 'medium' ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' : 'bg-red-400 hover:bg-red-500'}`}>
                    {d === 'easy' ? '😊 Easy' : d === 'medium' ? '🤔 Medium' : '🔥 Hard'}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
              <p className="text-center text-sm text-purple-600 mb-3">Mirror the left pattern on the right!</p>

              {/* Grids side by side */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {/* Left grid (original) */}
                <div>
                  <p className="text-xs text-purple-500 text-center mb-1">Original</p>
                  <div className="bg-white/80 rounded-xl p-2">
                    {pattern.map((row, r) => (
                      <div key={r} className="flex gap-1">
                        {row.map((cell, c) => (
                          <div
                            key={c}
                            className={`${cellSize} rounded border border-gray-200 ${cell ? '' : 'bg-gray-50'}`}
                            style={cell ? { backgroundColor: cell } : undefined}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mirror line */}
                <div className="w-px h-32 bg-purple-400 border-l border-dashed border-purple-400 mx-1" />

                {/* Right grid (player draws) */}
                <div>
                  <p className="text-xs text-purple-500 text-center mb-1">Mirror</p>
                  <div className="bg-white/80 rounded-xl p-2">
                    {playerGrid.map((row, r) => (
                      <div key={r} className="flex gap-1">
                        {row.map((cell, c) => (
                          <motion.button
                            key={c}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCellTap(r, c)}
                            className={`${cellSize} rounded border-2 transition-all ${
                              cell ? 'border-purple-300' : 'border-dashed border-gray-300 bg-gray-50 hover:bg-purple-50'
                            }`}
                            style={cell ? { backgroundColor: cell } : undefined}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color palette */}
              <div className="bg-white/60 rounded-2xl p-3 mb-4">
                <p className="text-xs text-purple-500 mb-2 text-center">Pick color:</p>
                <div className="flex justify-center gap-2">
                  {config.colors.map(color => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setSelectedColor(color); playClick(); }}
                      className={`w-10 h-10 rounded-full border-3 transition-all ${
                        selectedColor === color ? 'ring-3 ring-purple-500 ring-offset-2 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleClear}
                  className="px-4 py-2 rounded-xl bg-gray-200 text-gray-600 font-bold text-sm">🗑️ Clear</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCheck}
                  disabled={!!feedback} className="px-6 py-2 rounded-xl bg-purple-500 text-white font-bold shadow-md disabled:opacity-50">✅ Check!</motion.button>
              </div>

              <AnimatePresence>
                {feedback && (
                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                    <span className="text-8xl">{feedback === 'correct' ? '🎉' : '❌'}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-center text-xs text-purple-400 mt-3">{challengeIndex + 1} / {config.challengesPerLevel}</p>
            </motion.div>
          )}

          {phase === 'levelComplete' && (
            <motion.div key="levelComplete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 pt-16">
              <span className="text-7xl">🌟</span>
              <h2 className="text-2xl font-bold text-purple-800">Level {level} Complete!</h2>
              <p className="text-purple-600">Score: {score}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNextLevel}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold shadow-md">Next Level →</motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <WinModal isOpen={phase === 'won'} onPlayAgain={handlePlayAgain} score={score} />

        <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)}
          title="Mirror Draw"
          instructions={[
            { icon: '🪞', title: 'Look at the Pattern', description: 'Study the colored pattern on the left side of the grid.' },
            { icon: '🎨', title: 'Pick Colors', description: 'Select a color from the palette below the grids.' },
            { icon: '✏️', title: 'Draw the Mirror', description: 'Tap cells on the right grid to recreate the mirror image!' },
          ]}
          controls={[
            { icon: '🎨', description: 'Tap a color circle to select it' },
            { icon: '✏️', description: 'Tap grid cells to paint or unpaint them' },
            { icon: '✅', description: 'Tap Check when your mirror image is complete' },
          ]}
          tip="Imagine folding the grid along the center line — the right side should match the left!"
          locale={locale} />
      </div>
    </GameWrapper>
  );
}
