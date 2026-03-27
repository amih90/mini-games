'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { GameWrapper } from '@/features/games/shared/GameWrapper';
import { WinModal } from '@/features/games/shared/WinModal';
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';
import { useCheckersGame, Difficulty } from './useCheckersGame';

// ---------------------------------------------------------------------------
// Instructions data – Feynman-style, 4 locales
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// CheckersGame component
// ---------------------------------------------------------------------------
export function CheckersGame() {
  const t = useTranslations('checkers');
  const locale = useLocale();
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;

  const {
    board,
    selectedPiece,
    validMoves,
    currentPlayer,
    difficulty,
    setDifficulty,
    gameOver,
    winner,
    hintMove,
    moveCount,
    score,
    handleCellClick,
    getHint,
    resetGame,
  } = useCheckersGame();

  // --- Sound effects -------------------------------------------------------
  const { playMove, playCapture, playWin, playGameOver, playClick, playSuccess } =
    useRetroSounds();

  // --- Instructions modal --------------------------------------------------
  const [showInstructions, setShowInstructions] = useState(true);

  // --- Win tracking --------------------------------------------------------
  const [wins, setWins] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('checkers-wins');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // --- Keyboard navigation -------------------------------------------------
  const [cursorPos, setCursorPos] = useState<{ row: number; col: number }>({
    row: 5,
    col: 1,
  });
  const boardRef = useRef<HTMLDivElement>(null);

  // Keep refs for the latest values so the keydown handler is always current
  const cursorPosRef = useRef(cursorPos);
  cursorPosRef.current = cursorPos;
  const gameOverRef = useRef(gameOver);
  gameOverRef.current = gameOver;
  const currentPlayerRef = useRef(currentPlayer);
  currentPlayerRef.current = currentPlayer;

  // Previous board / game-over state for detecting events (sounds)
  const prevBoardRef = useRef(board);
  const prevGameOverRef = useRef(gameOver);
  const prevScoreRef = useRef(score);

  // Detect moves, captures, king promotions, and game end to trigger sounds
  useEffect(() => {
    const prevBoard = prevBoardRef.current;
    const prevScore = prevScoreRef.current;

    // --- Game just ended ---
    if (gameOver && !prevGameOverRef.current) {
      if (winner === 'red') {
        playWin();
        // Persist win
        setWins((prev) => {
          const next = prev + 1;
          localStorage.setItem('checkers-wins', String(next));
          return next;
        });
      } else {
        playGameOver();
      }
    }

    // --- A move was made (board changed while game not over) ---
    if (!gameOver && prevBoard !== board) {
      // Detect capture: score decreased for either side
      const captured =
        score.red < prevScore.red || score.black < prevScore.black;

      if (captured) {
        playCapture();
      } else {
        playMove();
      }

      // Detect king promotion: a new king appeared that wasn't there before
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const cur = board[r][c];
          const prev = prevBoard[r][c];
          if (
            (cur === 'red-king' && prev !== 'red-king') ||
            (cur === 'black-king' && prev !== 'black-king')
          ) {
            playSuccess();
          }
        }
      }
    }

    prevBoardRef.current = board;
    prevGameOverRef.current = gameOver;
    prevScoreRef.current = score;
  }, [board, gameOver, winner, score, playMove, playCapture, playWin, playGameOver, playSuccess]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keys when instructions modal is open
      if (showInstructions) return;
      if (gameOverRef.current) return;
      if (currentPlayerRef.current !== 'red') return;

      const pos = cursorPosRef.current;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setCursorPos((p) => ({ ...p, row: Math.max(0, p.row - 1) }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setCursorPos((p) => ({ ...p, row: Math.min(7, p.row + 1) }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCursorPos((p) => ({ ...p, col: Math.max(0, p.col - 1) }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCursorPos((p) => ({ ...p, col: Math.min(7, p.col + 1) }));
          break;
        case 'Enter':
          e.preventDefault();
          handleCellClick(pos.row, pos.col);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCellClick, showInstructions]);

  // --- Helpers -------------------------------------------------------------
  const isValidMove = useCallback(
    (row: number, col: number) =>
      validMoves.some((move) => move.row === row && move.col === col),
    [validMoves],
  );

  const isHintMove = useCallback(
    (row: number, col: number) =>
      hintMove?.to.row === row && hintMove?.to.col === col,
    [hintMove],
  );

  const isHintFrom = useCallback(
    (row: number, col: number) =>
      hintMove?.from.row === row && hintMove?.from.col === col,
    [hintMove],
  );

  const isCursor = useCallback(
    (row: number, col: number) =>
      cursorPos.row === row && cursorPos.col === col,
    [cursorPos],
  );

  // Instruction data for the current locale


  // --- Render --------------------------------------------------------------
  return (
    <GameWrapper
      title={t('title') || 'Checkers'}
      onInstructionsClick={() => {
        playClick();
        setShowInstructions(true);
      }}
    >
      <div
        className={`flex flex-col items-center gap-6 p-4 ${isRtl ? 'direction-rtl' : ''}`}
        dir={direction}
      >
        {/* Difficulty Selector */}
        <div className="flex flex-col items-center gap-2">
          <label className="text-lg font-bold text-gray-800">
            {t('difficulty') || 'Difficulty'}
          </label>
          <div className="flex gap-2 flex-wrap justify-center">
            {(['learn', 'easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => {
                  playClick();
                  setDifficulty(level);
                  resetGame();
                }}
                disabled={!gameOver && currentPlayer === 'black'}
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

        {/* Game Info */}
        <div className="flex gap-8 items-center flex-wrap justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-600">{t('your_pieces') || 'Your Pieces'}</div>
            <div className="text-2xl font-bold text-red-600">{score.red}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">{t('moves') || 'Moves'}</div>
            <div className="text-2xl font-bold text-gray-800">{moveCount}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">
              {t('opponent_pieces') || 'Opponent Pieces'}
            </div>
            <div className="text-2xl font-bold text-gray-800">{score.black}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">🏆</div>
            <div className="text-2xl font-bold text-amber-600">{wins}</div>
          </div>
        </div>

        {/* Current Player */}
        {!gameOver && (
          <div
            className={`text-lg font-semibold ${currentPlayer === 'red' ? 'text-red-600' : 'text-gray-800'}`}
          >
            {currentPlayer === 'red'
              ? t('your_turn') || 'Your Turn!'
              : t('opponent_turn') || "Opponent's Turn..."}
          </div>
        )}

        {/* Hint Button */}
        {currentPlayer === 'red' && !gameOver && (
          <button
            onClick={() => {
              playClick();
              getHint();
            }}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105 min-h-[48px]"
          >
            💡 {t('hint') || 'Show Hint'}
          </button>
        )}

        {/* Checkers Board */}
        <div
          ref={boardRef}
          tabIndex={0}
          className="inline-block bg-gray-800 p-2 rounded-lg shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-400"
          aria-label="Checkers board"
        >
          <div className="grid grid-cols-8 gap-0">
            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const isBlackSquare = (rowIndex + colIndex) % 2 === 1;
                const isSelected =
                  selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                const isValid = isValidMove(rowIndex, colIndex);
                const isHint = isHintMove(rowIndex, colIndex);
                const isHintSource = isHintFrom(rowIndex, colIndex);
                const hasCursor = isCursor(rowIndex, colIndex);

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={`
                      w-12 h-12 md:w-16 md:h-16 flex items-center justify-center cursor-pointer
                      transition-all duration-200 relative
                      ${isBlackSquare ? 'bg-amber-900' : 'bg-amber-200'}
                      ${isSelected ? 'ring-4 ring-blue-400 ring-inset' : ''}
                      ${isValid ? 'ring-4 ring-green-400 ring-inset' : ''}
                      ${isHint ? 'ring-4 ring-yellow-400 ring-inset animate-pulse' : ''}
                      ${isHintSource ? 'ring-4 ring-yellow-300 ring-inset' : ''}
                      ${hasCursor ? 'outline outline-3 outline-cyan-400 z-10' : ''}
                      ${
                        !gameOver &&
                        currentPlayer === 'red' &&
                        piece &&
                        (piece === 'red' || piece === 'red-king')
                          ? 'hover:brightness-110'
                          : ''
                      }
                    `}
                    aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}${piece ? `, ${piece}` : ''}${isValid ? ', valid move' : ''}`}
                  >
                    {piece && (
                      <div
                        className={`
                          w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                          shadow-lg border-2 transition-transform
                          ${isSelected ? 'scale-110' : ''}
                          ${
                            piece === 'red' || piece === 'red-king'
                              ? 'bg-red-600 border-red-800'
                              : 'bg-gray-800 border-gray-900'
                          }
                        `}
                      >
                        {(piece === 'red-king' || piece === 'black-king') && (
                          <span className="text-yellow-300 text-2xl font-bold">♔</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            playClick();
            resetGame();
          }}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105 min-h-[48px]"
        >
          {t('new_game') || 'New Game'}
        </button>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={gameOver && winner === 'red'}
        moves={moveCount}
        onPlayAgain={() => {
          playClick();
          resetGame();
        }}
      />

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={t('title')}
        instructions={[
          { icon: t('instructions.step0Icon'), title: t('instructions.step0Title'), description: t('instructions.step0Desc') },
          { icon: t('instructions.step1Icon'), title: t('instructions.step1Title'), description: t('instructions.step1Desc') },
          { icon: t('instructions.step2Icon'), title: t('instructions.step2Title'), description: t('instructions.step2Desc') },
          { icon: t('instructions.step3Icon'), title: t('instructions.step3Title'), description: t('instructions.step3Desc') },
        ]}
        controls={[
          { icon: t('instructions.control0Icon'), description: t('instructions.control0Desc') },
          { icon: t('instructions.control1Icon'), description: t('instructions.control1Desc') },
          { icon: t('instructions.control2Icon'), description: t('instructions.control2Desc') },
          { icon: t('instructions.control3Icon'), description: t('instructions.control3Desc') },
        ]}
        tip={t('instructions.tip')}
        locale={locale}
      />
    </GameWrapper>
  );
}
