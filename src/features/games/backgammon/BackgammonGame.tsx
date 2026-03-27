'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { GameWrapper } from '@/features/games/shared/GameWrapper';
import { WinModal } from '@/features/games/shared/WinModal';
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';
import { useBackgammonGame, Difficulty } from './useBackgammonGame';

/* ------------------------------------------------------------------ */
/*  Instructions data — Feynman-style, 4 languages                    */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BackgammonGame() {
  const t = useTranslations('backgammon');
  const locale = useLocale();
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;

  const {
    playMove,
    playCapture,
    playDice: playDiceSound,
    playWin,
    playGameOver,
    playClick,
  } = useRetroSounds();

  const {
    board,
    currentPlayer,
    difficulty,
    setDifficulty,
    gameOver,
    winner,
    dice,
    selectedPoint,
    validMoves,
    hintMove,
    moveCount,
    barPieces,
    bornOff,
    handlePointClick,
    getHint,
    startTurn,
    resetGame,
  } = useBackgammonGame();

  /* ---- Instructions modal ---- */
  const [showInstructions, setShowInstructions] = useState(true);

  /* ---- Win tracking (localStorage) ---- */
  const [wins, setWins] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('backgammon-wins');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  /* ---- Keyboard-focused point ---- */
  const [focusedPoint, setFocusedPoint] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  /* ================================================================ */
  /*  Sound-effect watchers                                            */
  /* ================================================================ */
  const prevDiceRef = useRef(dice);
  const prevMoveCountRef = useRef(moveCount);
  const prevBarRef = useRef(barPieces);
  const prevWinnerRef = useRef(winner);

  useEffect(() => {
    // Dice rolled
    if (dice && !prevDiceRef.current) {
      playDiceSound();
    }
    prevDiceRef.current = dice;
  }, [dice, playDiceSound]);

  useEffect(() => {
    // A move was made
    if (moveCount > prevMoveCountRef.current) {
      playMove();
    }
    prevMoveCountRef.current = moveCount;
  }, [moveCount, playMove]);

  useEffect(() => {
    // A piece was hit (bar count increased)
    if (
      barPieces.white > prevBarRef.current.white ||
      barPieces.black > prevBarRef.current.black
    ) {
      playCapture();
    }
    prevBarRef.current = barPieces;
  }, [barPieces, playCapture]);

  useEffect(() => {
    if (winner && winner !== prevWinnerRef.current) {
      if (winner === 'white') {
        playWin();
        // Persist win
        setWins((prev) => {
          const next = prev + 1;
          localStorage.setItem('backgammon-wins', String(next));
          return next;
        });
      } else {
        playGameOver();
      }
    }
    prevWinnerRef.current = winner;
  }, [winner, playWin, playGameOver]);

  /* ================================================================ */
  /*  Keyboard navigation                                              */
  /* ================================================================ */

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Space → roll dice
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (currentPlayer === 'white' && !gameOver && !dice) {
          playClick();
          startTurn();
        }
        return;
      }

      // H → hint
      if (e.key === 'h' || e.key === 'H') {
        if (currentPlayer === 'white' && !gameOver && dice) {
          playClick();
          getHint();
        }
        return;
      }

      // Escape → deselect
      if (e.key === 'Escape') {
        setFocusedPoint(null);
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedPoint((prev) => {
          if (prev === null) return 0;
          const delta = e.key === 'ArrowRight' ? 1 : -1;
          let next = prev + delta;
          if (next < 0) next = 23;
          if (next > 23) next = 0;
          return next;
        });
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedPoint((prev) => {
          if (prev === null) return 12;
          // Jump between top half (12-23) and bottom half (0-11)
          if (prev >= 12) return prev - 12;
          return prev + 12;
        });
        return;
      }

      // Enter → select / confirm
      if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedPoint !== null && currentPlayer === 'white' && !gameOver && dice) {
          playClick();
          handlePointClick(focusedPoint);
        }
        return;
      }

      // Number keys 0-9 for quick point selection (prefix entry)
      if (/^[0-9]$/.test(e.key)) {
        const num = parseInt(e.key, 10);
        setFocusedPoint((prev) => {
          // Build two-digit number if previous was a single digit that can form a valid point
          if (prev !== null && prev < 3 && prev * 10 + num <= 23) {
            const twoDigit = prev * 10 + num;
            // auto-click after forming 2-digit number
            if (currentPlayer === 'white' && !gameOver && dice) {
              setTimeout(() => handlePointClick(twoDigit), 50);
            }
            return twoDigit;
          }
          return num;
        });
        return;
      }
    },
    [currentPlayer, gameOver, dice, focusedPoint, handlePointClick, startTurn, getHint, playClick],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* ================================================================ */
  /*  Helpers                                                          */
  /* ================================================================ */

  const handleDifficultyClick = (level: Difficulty) => {
    playClick();
    setDifficulty(level);
    resetGame();
  };

  const handleRollClick = () => {
    playClick();
    startTurn();
  };

  const handleHintClick = () => {
    playClick();
    getHint();
  };

  const handleResetClick = () => {
    playClick();
    resetGame();
  };

  /* ================================================================ */
  /*  Render                                                            */
  /* ================================================================ */

  const renderPoint = (
    pointIndex: number,
    i: number,
    isTop: boolean,
  ) => {
    const point = board[pointIndex];
    const isSelected = selectedPoint === pointIndex;
    const isFocused = focusedPoint === pointIndex;
    const isValidDestination = validMoves.some((m) => m.to === pointIndex);
    const isHint =
      hintMove?.from === pointIndex || hintMove?.to === pointIndex;

    return (
      <div
        key={pointIndex}
        role="button"
        tabIndex={-1}
        aria-label={`Point ${pointIndex}, ${Math.abs(point.checkers)} ${point.checkers > 0 ? 'white' : point.checkers < 0 ? 'black' : 'empty'}`}
        onClick={() => handlePointClick(pointIndex)}
        className={`
          w-10 h-32 flex flex-col items-center cursor-pointer
          transition-all relative
          ${isTop ? 'justify-start' : 'justify-end'}
          ${i % 2 === 0 ? 'bg-amber-700' : 'bg-amber-600'}
          ${isSelected ? 'ring-4 ring-blue-400' : ''}
          ${isValidDestination ? 'ring-4 ring-green-400' : ''}
          ${isHint ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
          ${isFocused && !isSelected && !isValidDestination ? 'ring-4 ring-cyan-400 ring-offset-1' : ''}
        `}
      >
        <div
          className={`text-xs text-white absolute ${isTop ? 'top-0' : 'bottom-0'}`}
        >
          {pointIndex}
        </div>
        {point.checkers !== 0 && (
          <div
            className={`flex gap-0.5 ${
              isTop ? 'flex-col mt-4' : 'flex-col-reverse mb-4'
            }`}
          >
            {Array.from({
              length: Math.min(Math.abs(point.checkers), 5),
            }).map((_, j) => (
              <div
                key={j}
                className={`w-8 h-8 rounded-full border-2 ${
                  point.checkers > 0
                    ? 'bg-white border-gray-300'
                    : 'bg-gray-900 border-gray-700'
                }`}
              />
            ))}
            {Math.abs(point.checkers) > 5 && (
              <div className="text-xs font-bold text-white bg-red-600 rounded-full w-6 h-6 flex items-center justify-center">
                {Math.abs(point.checkers)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <GameWrapper
        title={t('title') || 'Backgammon'}
        onInstructionsClick={() => {
          playClick();
          setShowInstructions(true);
        }}
      >
        <div
          className={`flex flex-col items-center gap-6 p-4 ${isRtl ? 'direction-rtl' : ''}`}
          ref={boardRef}
        >
          {/* Difficulty Selector */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-lg font-bold text-gray-800">
              {t('difficulty') || 'Difficulty'}
            </label>
            <div className="flex gap-2 flex-wrap justify-center">
              {(['learn', 'easy', 'medium', 'hard'] as Difficulty[]).map(
                (level) => (
                  <button
                    key={level}
                    onClick={() => handleDifficultyClick(level)}
                    disabled={!gameOver && currentPlayer === 'black'}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all min-h-[48px] ${
                      difficulty === level
                        ? 'bg-blue-500 text-white shadow-lg scale-105'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {level === 'learn' && '📖 '}
                    {level === 'easy' && '🟢 '}
                    {level === 'medium' && '🟡 '}
                    {level === 'hard' && '🔴 '}
                    {t(`difficulty_${level}`) ||
                      level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ),
              )}
            </div>
            {difficulty === 'learn' && (
              <p className="text-sm text-gray-600 text-center max-w-md">
                {t('learn_mode_hint') ||
                  'In Learn mode, you play without an opponent. Use hints to learn the rules!'}
              </p>
            )}
          </div>

          {/* Game Info */}
          <div className="flex gap-4 sm:gap-8 items-center flex-wrap justify-center">
            <div className="text-center">
              <div className="text-sm text-gray-600">
                {t('your_pieces') || 'Your Pieces'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800">
                {t('off') || 'Off'}: {bornOff.white} | {t('bar') || 'Bar'}:{' '}
                {barPieces.white}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">
                {t('moves') || 'Moves'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800">
                {moveCount}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">
                {t('opponent_pieces') || 'Opponent'}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-600">
                {t('off') || 'Off'}: {bornOff.black} | {t('bar') || 'Bar'}:{' '}
                {barPieces.black}
              </div>
            </div>
            {/* Win count */}
            <div className="text-center">
              <div className="text-sm text-gray-600">🏆</div>
              <div className="text-xl sm:text-2xl font-bold text-amber-600">
                {wins}
              </div>
            </div>
          </div>

          {/* Dice */}
          {dice && (
            <div className="flex gap-4 items-center flex-wrap justify-center">
              <div className="text-lg font-semibold">
                {t('dice') || 'Dice'}:
              </div>
              <div className="flex gap-2">
                <div className="w-12 h-12 bg-white border-2 border-gray-800 rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg">
                  {dice.die1}
                </div>
                <div className="w-12 h-12 bg-white border-2 border-gray-800 rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg">
                  {dice.die2}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {t('remaining') || 'Remaining'}:{' '}
                {dice.remaining.join(', ')}
              </div>
            </div>
          )}

          {/* Current Player */}
          {!gameOver && (
            <div
              className={`text-lg font-semibold ${
                currentPlayer === 'white' ? 'text-gray-800' : 'text-gray-600'
              }`}
            >
              {currentPlayer === 'white'
                ? dice
                  ? t('your_turn_move') || 'Your Turn - Make your move!'
                  : t('your_turn_roll') || 'Your Turn - Click "Roll Dice"'
                : t('opponent_turn') || "Opponent's Turn..."}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap justify-center">
            {/* Roll Dice Button */}
            {currentPlayer === 'white' && !gameOver && !dice && (
              <button
                onClick={handleRollClick}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105 min-h-[48px]"
              >
                🎲 {t('roll_dice') || 'Roll Dice'}
              </button>
            )}

            {/* Hint Button */}
            {currentPlayer === 'white' && !gameOver && dice && (
              <button
                onClick={handleHintClick}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105 min-h-[48px]"
              >
                💡 {t('hint') || 'Show Hint'}
              </button>
            )}
          </div>

          {/* Keyboard navigation hint */}
          {focusedPoint !== null && (
            <div className="text-sm text-cyan-700 font-medium">
              ⌨️{' '}
              {locale === 'he'
                ? `נקודה מסומנת: ${focusedPoint} — Enter לבחירה`
                : locale === 'zh'
                  ? `聚焦点: ${focusedPoint} — Enter 确认`
                  : locale === 'es'
                    ? `Punto enfocado: ${focusedPoint} — Enter para confirmar`
                    : `Focused: point ${focusedPoint} — Enter to select`}
            </div>
          )}

          {/* Backgammon Board */}
          <div className="flex flex-col gap-4 bg-amber-900 p-4 rounded-lg shadow-2xl max-w-full overflow-x-auto">
            {/* Top half (points 12-23) */}
            <div className="flex gap-1">
              {board.slice(12, 24).map((_, i) => {
                const pointIndex = i + 12;
                return renderPoint(pointIndex, i, true);
              })}
            </div>

            {/* Bar */}
            <div className="h-8 bg-amber-950 flex items-center justify-center gap-4 rounded">
              <div className="text-white text-sm">
                {barPieces.white > 0 && `⚪ × ${barPieces.white}`}
              </div>
              <div className="text-white text-sm">
                {barPieces.black > 0 && `⚫ × ${barPieces.black}`}
              </div>
            </div>

            {/* Bottom half (points 11-0, reversed for display) */}
            <div className="flex gap-1">
              {board
                .slice(0, 12)
                .reverse()
                .map((_, i) => {
                  const pointIndex = 11 - i;
                  return renderPoint(pointIndex, i, false);
                })}
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleResetClick}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105 min-h-[48px]"
          >
            {t('new_game') || 'New Game'}
          </button>
        </div>

        {/* Win Modal */}
        <WinModal
          isOpen={gameOver && winner === 'white'}
          moves={moveCount}
          onPlayAgain={handleResetClick}
        />
      </GameWrapper>

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={t('title') || 'Backgammon'}
        instructions={[
            { icon: t('instructions.step0Icon'), title: t('instructions.step0Title'), description: t('instructions.step0Desc') },
            { icon: t('instructions.step1Icon'), title: t('instructions.step1Title'), description: t('instructions.step1Desc') },
            { icon: t('instructions.step2Icon'), title: t('instructions.step2Title'), description: t('instructions.step2Desc') },
            { icon: t('instructions.step3Icon'), title: t('instructions.step3Title'), description: t('instructions.step3Desc') }
          ]}
        controls={[
            { icon: t('controls.control0Icon'), description: t('controls.control0Desc') },
            { icon: t('controls.control1Icon'), description: t('controls.control1Desc') },
            { icon: t('controls.control2Icon'), description: t('controls.control2Desc') },
            { icon: t('controls.control3Icon'), description: t('controls.control3Desc') },
            { icon: t('controls.control4Icon'), description: t('controls.control4Desc') }
          ]}
        tip={t('tip')}
        locale={locale}
      />
    </>
  );
}
