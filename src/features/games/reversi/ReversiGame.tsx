'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { GameWrapper } from '@/features/games/shared/GameWrapper';
import { WinModal } from '@/features/games/shared/WinModal';
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';
import { useReversiGame, Difficulty } from './useReversiGame';

// ---------------------------------------------------------------------------
// Feynman-style instructions in all 4 supported locales
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ReversiGame() {
  const t = useTranslations('reversi');
  const locale = useLocale();
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const { playMove, playCapture, playWin, playGameOver, playClick } = useRetroSounds();

  const {
    board,
    currentPlayer,
    difficulty,
    setDifficulty,
    gameOver,
    winner,
    validMoves,
    hintMove,
    moveCount,
    score,
    handleCellClick,
    getHint,
    resetGame,
  } = useReversiGame();

  // ---- Instructions modal ------------------------------------------------
  const [showInstructions, setShowInstructions] = useState(true);

  // ---- Win tracking (localStorage) ---------------------------------------
  const [wins, setWins] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('reversi-wins');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // ---- Keyboard navigation cursor ----------------------------------------
  const [cursor, setCursor] = useState<{ row: number; col: number }>({
    row: 3,
    col: 3,
  });

  // ---- Refs for detecting state transitions (sound triggers) --------------
  const prevMoveCountRef = useRef(moveCount);
  const prevGameOverRef = useRef(gameOver);

  // ---- Helpers ------------------------------------------------------------
  const isValidMove = useCallback(
    (row: number, col: number) =>
      validMoves.some((m) => m.row === row && m.col === col),
    [validMoves],
  );

  const isHintMove = useCallback(
    (row: number, col: number) =>
      hintMove?.row === row && hintMove?.col === col,
    [hintMove],
  );

  // ---- Sound: piece placed + capture on every move ------------------------
  useEffect(() => {
    if (moveCount > prevMoveCountRef.current) {
      playMove();
      const timer = setTimeout(() => {
        playCapture();
      }, 150);
      prevMoveCountRef.current = moveCount;
      return () => clearTimeout(timer);
    }
    prevMoveCountRef.current = moveCount;
  }, [moveCount, playMove, playCapture]);

  // ---- Sound: game end (win / lose / tie) + win tracking ------------------
  useEffect(() => {
    if (gameOver && !prevGameOverRef.current) {
      if (winner === 'black') {
        playWin();
        setWins((prev) => {
          const next = prev + 1;
          if (typeof window !== 'undefined') {
            localStorage.setItem('reversi-wins', String(next));
          }
          return next;
        });
      } else {
        playGameOver();
      }
    }
    prevGameOverRef.current = gameOver;
  }, [gameOver, winner, playWin, playGameOver]);

  // ---- Keyboard navigation -----------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showInstructions) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setCursor((p) => ({ ...p, row: Math.max(0, p.row - 1) }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setCursor((p) => ({ ...p, row: Math.min(7, p.row + 1) }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCursor((p) => ({ ...p, col: Math.max(0, p.col - 1) }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCursor((p) => ({ ...p, col: Math.min(7, p.col + 1) }));
          break;
        case 'Enter':
          e.preventDefault();
          handleCellClick(cursor.row, cursor.col);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInstructions, cursor, handleCellClick]);

  // ---- Derived data -------------------------------------------------------

  // ---- Event handlers with playClick for UI buttons -----------------------
  const handleDifficultyChange = useCallback(
    (level: Difficulty) => {
      playClick();
      setDifficulty(level);
      resetGame();
    },
    [playClick, setDifficulty, resetGame],
  );

  const handleHintClick = useCallback(() => {
    playClick();
    getHint();
  }, [playClick, getHint]);

  const handleNewGame = useCallback(() => {
    playClick();
    resetGame();
  }, [playClick, resetGame]);

  const handlePlayAgain = useCallback(() => {
    playClick();
    resetGame();
  }, [playClick, resetGame]);

  // ========================================================================
  // Render
  // ========================================================================
  return (
    <GameWrapper
      title={t('title') || 'Reversi'}
      onInstructionsClick={() => {
        playClick();
        setShowInstructions(true);
      }}
    >
      <div className="flex flex-col items-center gap-6 p-4" dir={direction}>
        {/* ---------- Difficulty Selector ---------- */}
        <div className="flex flex-col items-center gap-2">
          <label className="text-lg font-bold text-gray-800">
            {t('difficulty') || 'Difficulty'}
          </label>
          <div className="flex gap-2 flex-wrap justify-center">
            {(['learn', 'easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                disabled={!gameOver && currentPlayer === 'white'}
                className={`px-4 py-2 rounded-lg font-semibold transition-all min-h-[48px] min-w-[48px] ${
                  difficulty === level
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {t(`difficulty_${level}`) || level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          {difficulty === 'learn' && (
            <p className="text-sm text-gray-600 text-center max-w-md">
              {t('learn_mode_hint') ||
                'In Learn mode, you play without an opponent. Use hints to learn the rules!'}
            </p>
          )}
        </div>

        {/* ---------- Game Info ---------- */}
        <div className="flex gap-8 items-center flex-wrap justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-600">
              {t('your_pieces') || 'Your Pieces (Black)'}
            </div>
            <div className="text-2xl font-bold text-gray-800">{score.black}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">{t('moves') || 'Moves'}</div>
            <div className="text-2xl font-bold text-gray-800">{moveCount}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">
              {t('opponent_pieces') || 'Opponent (White)'}
            </div>
            <div className="text-2xl font-bold text-gray-500">{score.white}</div>
          </div>
          <div className="text-center" title="Wins">
            <div className="text-sm text-gray-600" aria-label="Wins">🏆</div>
            <div className="text-2xl font-bold text-yellow-600">{wins}</div>
          </div>
        </div>

        {/* ---------- Current Player ---------- */}
        {!gameOver && (
          <div
            className={`text-lg font-semibold ${
              currentPlayer === 'black' ? 'text-gray-800' : 'text-gray-500'
            }`}
          >
            {currentPlayer === 'black'
              ? t('your_turn') || 'Your Turn!'
              : t('opponent_turn') || "Opponent's Turn..."}
          </div>
        )}

        {/* ---------- Hint Button ---------- */}
        {currentPlayer === 'black' && !gameOver && validMoves.length > 0 && (
          <button
            onClick={handleHintClick}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105 min-h-[48px]"
          >
            💡 {t('hint') || 'Show Hint'}
          </button>
        )}

        {validMoves.length === 0 && !gameOver && currentPlayer === 'black' && (
          <div className="text-red-600 font-semibold">
            {t('no_moves') || 'No valid moves! Turn passed.'}
          </div>
        )}

        {/* ---------- Game Over Banner (loss / tie) ---------- */}
        {gameOver && winner !== 'black' && (
          <div className="text-center p-6 rounded-2xl bg-gray-100 shadow-inner space-y-3">
            <div className="text-3xl font-bold">
              {winner === 'tie'
                ? t('tie') || 'Tie Game!'
                : t('you_lose') || 'You Lose!'}
            </div>
            <div className="text-lg text-gray-600">
              {t('final_score') || 'Final Score'}:{' '}
              {t('black') || 'Black'} {score.black} –{' '}
              {t('white') || 'White'} {score.white}
            </div>
            <button
              onClick={handlePlayAgain}
              className="mt-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105 min-h-[48px]"
            >
              {t('new_game') || 'New Game'}
            </button>
          </div>
        )}

        {/* ---------- Reversi Board ---------- */}
        <div
          className="inline-block bg-gray-800 p-2 rounded-lg shadow-2xl"
          role="grid"
          aria-label="Reversi board"
        >
          <div className="grid grid-cols-8 gap-0">
            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const valid = isValidMove(rowIndex, colIndex);
                const hint = isHintMove(rowIndex, colIndex);
                const isCursor =
                  cursor.row === rowIndex && cursor.col === colIndex;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    role="gridcell"
                    tabIndex={isCursor ? 0 : -1}
                    aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}${
                      piece ? `, ${piece} piece` : ''
                    }${valid ? ', valid move' : ''}`}
                    className={`
                      w-12 h-12 md:w-16 md:h-16 flex items-center justify-center cursor-pointer
                      transition-all duration-200 bg-green-700 border border-green-800
                      ${valid ? 'ring-2 ring-inset ring-green-400 hover:bg-green-600' : ''}
                      ${hint ? 'ring-4 ring-yellow-400 ring-inset animate-pulse' : ''}
                      ${isCursor ? 'outline outline-3 outline-blue-400 z-10' : ''}
                    `}
                  >
                    {piece && (
                      <div
                        className={`
                          w-10 h-10 md:w-12 md:h-12 rounded-full
                          shadow-lg border-2 transition-all
                          ${
                            piece === 'black'
                              ? 'bg-gray-900 border-gray-700'
                              : 'bg-white border-gray-300'
                          }
                        `}
                      />
                    )}
                    {valid && !piece && (
                      <div className="w-3 h-3 rounded-full bg-green-400 opacity-50" />
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* ---------- New Game Button ---------- */}
        <button
          onClick={handleNewGame}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105 min-h-[48px]"
        >
          {t('new_game') || 'New Game'}
        </button>
      </div>

      {/* ---------- Win Modal (player wins only) ---------- */}
      <WinModal
        isOpen={gameOver && winner === 'black'}
        score={score.black}
        moves={moveCount}
        onPlayAgain={handlePlayAgain}
      />

      {/* ---------- Instructions Modal ---------- */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={t('title') || 'Reversi'}
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
            { icon: t('controls.control3Icon'), description: t('controls.control3Desc') }
          ]}
        tip={t('tip')}
        locale={locale}
      />
    </GameWrapper>
  );
}
