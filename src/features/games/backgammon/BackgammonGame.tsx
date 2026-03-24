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
const instructionsData: Record<
  string,
  {
    instructions: { icon: string; title: string; description: string }[];
    controls: { icon: string; description: string }[];
    tip: string;
  }
> = {
  en: {
    instructions: [
      {
        icon: '🎯',
        title: 'Goal',
        description:
          'Move all 15 of your pieces (white) around the board and off the other side before your opponent does the same. Think of it like a race!',
      },
      {
        icon: '🎲',
        title: 'Rolling & Moving',
        description:
          'Roll two dice each turn. Each die tells you how many spaces you can move one piece. If you roll doubles, you get four moves instead of two!',
      },
      {
        icon: '💥',
        title: 'Hitting',
        description:
          'If you land on a point with just ONE opponent piece, you "hit" it — it goes to the bar and must re-enter the board before moving again.',
      },
      {
        icon: '🏠',
        title: 'Bearing Off',
        description:
          'Once ALL your pieces are in your home area (the last 6 points), you can start taking them off the board. First to remove all 15 wins!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Click a piece to select, then click destination' },
      { icon: '⬅️➡️', description: 'Arrow keys to navigate points' },
      { icon: '⏎', description: 'Enter to select / confirm move' },
      { icon: '🎲', description: 'Space to roll dice' },
      { icon: '💡', description: 'H for hint' },
    ],
    tip: 'Try to keep your pieces in pairs — a single piece alone can be hit!',
  },
  he: {
    instructions: [
      {
        icon: '🎯',
        title: 'מטרה',
        description:
          'הזיזו את כל 15 הכלים שלכם (לבנים) סביב הלוח והוציאו אותם לפני היריב. זה כמו מירוץ!',
      },
      {
        icon: '🎲',
        title: 'הטלה והזזה',
        description:
          'הטילו שתי קוביות בכל תור. כל קובייה אומרת כמה משבצות אפשר להזיז כלי אחד. דאבל? מקבלים ארבע תנועות!',
      },
      {
        icon: '💥',
        title: 'אכילה',
        description:
          'אם נוחתים על נקודה עם כלי יריב בודד — הוא עף לבר וצריך לחזור ללוח לפני שממשיך.',
      },
      {
        icon: '🏠',
        title: 'הוצאה',
        description:
          'כשכל הכלים שלכם בבית (6 הנקודות האחרונות) אפשר להתחיל להוציא אותם. הראשון שמוציא 15 — מנצח!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'לחצו על כלי לבחירה, ואז לחצו על היעד' },
      { icon: '⬅️➡️', description: 'חצים לניווט בין נקודות' },
      { icon: '⏎', description: 'Enter לבחירה / אישור' },
      { icon: '🎲', description: 'רווח להטלת קוביות' },
      { icon: '💡', description: 'H לרמז' },
    ],
    tip: 'נסו לשמור על הכלים בזוגות — כלי בודד יכול להיאכל!',
  },
  zh: {
    instructions: [
      {
        icon: '🎯',
        title: '目标',
        description:
          '将你的15颗棋子（白色）绕棋盘移动并移出，要比对手更快。就像一场赛跑！',
      },
      {
        icon: '🎲',
        title: '掷骰与移动',
        description:
          '每回合掷两个骰子。每个骰子的点数决定你能移动一颗棋子多少格。掷出双数？你有四次移动机会！',
      },
      {
        icon: '💥',
        title: '击打',
        description:
          '如果你落在只有一颗对手棋子的位置上，就能"击打"它——它会被放到中间栏，必须重新进入棋盘。',
      },
      {
        icon: '🏠',
        title: '离场',
        description:
          '当你所有的棋子都在内场（最后6个位置），就可以开始将它们移出棋盘。先移出全部15颗的玩家获胜！',
      },
    ],
    controls: [
      { icon: '🖱️', description: '点击棋子选择，然后点击目标位置' },
      { icon: '⬅️➡️', description: '方向键导航各点' },
      { icon: '⏎', description: 'Enter 选择 / 确认移动' },
      { icon: '🎲', description: '空格键掷骰子' },
      { icon: '💡', description: 'H 键提示' },
    ],
    tip: '尽量让棋子成对——落单的棋子容易被击打！',
  },
  es: {
    instructions: [
      {
        icon: '🎯',
        title: 'Objetivo',
        description:
          'Mueve tus 15 fichas (blancas) alrededor del tablero y sácalas antes que tu oponente. ¡Es como una carrera!',
      },
      {
        icon: '🎲',
        title: 'Lanzar y mover',
        description:
          'Lanza dos dados en cada turno. Cada dado indica cuántas casillas puedes mover una ficha. ¡Si sacas dobles, tienes cuatro movimientos!',
      },
      {
        icon: '💥',
        title: 'Golpear',
        description:
          'Si caes en una casilla con solo UNA ficha del rival, la "golpeas" — va a la barra y debe volver a entrar antes de moverse.',
      },
      {
        icon: '🏠',
        title: 'Retirar fichas',
        description:
          'Cuando TODAS tus fichas estén en tu zona final (los últimos 6 puntos), puedes empezar a sacarlas. ¡El primero en sacar las 15 gana!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Haz clic en una ficha para seleccionar, luego clic en el destino' },
      { icon: '⬅️➡️', description: 'Flechas para navegar entre puntos' },
      { icon: '⏎', description: 'Enter para seleccionar / confirmar' },
      { icon: '🎲', description: 'Espacio para lanzar dados' },
      { icon: '💡', description: 'H para pista' },
    ],
    tip: '¡Intenta mantener tus fichas en parejas — una ficha sola puede ser golpeada!',
  },
};

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
  const instrData = instructionsData[locale] || instructionsData.en;

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
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />
    </>
  );
}
