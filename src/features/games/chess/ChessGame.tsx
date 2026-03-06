'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { GameWrapper } from '@/features/games/shared/GameWrapper';
import { WinModal } from '@/features/games/shared/WinModal';
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useChessGame, Difficulty, Piece, PieceColor } from './useChessGame';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const pieceSymbols: Record<string, string> = {
  'white-king': '♔',
  'white-queen': '♕',
  'white-rook': '♖',
  'white-bishop': '♗',
  'white-knight': '♘',
  'white-pawn': '♙',
  'black-king': '♚',
  'black-queen': '♛',
  'black-rook': '♜',
  'black-bishop': '♝',
  'black-knight': '♞',
  'black-pawn': '♟',
};

/* ------------------------------------------------------------------ */
/*  Feynman-style instructions — all 4 locales                        */
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
        icon: '♚',
        title: 'The Goal',
        description:
          'Trap the opponent\'s King so it can\'t escape — that\'s called "checkmate"! Think of it like a game of tag where the King can\'t run away.',
      },
      {
        icon: '♟',
        title: 'Your Army',
        description:
          'You have 16 pieces. Pawns march forward one step (two on first move). Rooks slide straight. Knights jump in an "L" over others! Bishops slide diagonally. The Queen goes anywhere — she\'s the strongest. The King moves one step any direction.',
      },
      {
        icon: '⚔️',
        title: 'Capturing',
        description:
          'Land on a square with an opponent\'s piece to capture it and remove it from the board. Be careful — they can capture yours too!',
      },
      {
        icon: '🏆',
        title: 'Winning',
        description:
          'When you attack the King and it has no way to escape, block, or capture the attacker — that\'s checkmate! You win!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Click a piece to select it, then click where to move' },
      { icon: '⌨️', description: 'Arrow keys to move cursor, Enter to select/place' },
      { icon: '⇥', description: 'Tab to jump between your pieces' },
      { icon: '💡', description: 'Click "Show Hint" for help' },
    ],
    tip: 'Control the center of the board! Pieces in the middle can reach more squares.',
  },
  he: {
    instructions: [
      {
        icon: '♚',
        title: 'המטרה',
        description:
          'לכוד את המלך של היריב כך שלא יוכל לברוח — זה נקרא "מט"! חשוב על זה כמו משחק תפיסה שבו המלך לא יכול לברוח.',
      },
      {
        icon: '♟',
        title: 'הצבא שלך',
        description:
          'יש לך 16 כלים. רגלים צועדים קדימה צעד אחד (שניים בתור הראשון). צריחים מחליקים ישר. פרשים קופצים ב-"L" מעל אחרים! רצים מחליקים באלכסון. המלכה הולכת לכל מקום — היא הכי חזקה. המלך זז צעד אחד בכל כיוון.',
      },
      {
        icon: '⚔️',
        title: 'לכידה',
        description:
          'נחת על משבצת עם כלי של היריב כדי ללכוד אותו ולהוציא אותו מהלוח. אבל היזהר — גם הם יכולים ללכוד את שלך!',
      },
      {
        icon: '🏆',
        title: 'ניצחון',
        description:
          'כשאתה תוקף את המלך ואין לו דרך לברוח, לחסום, או ללכוד את התוקף — זה מט! ניצחת!',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'לחץ על כלי לבחירה, ואז לחץ לאן להזיז' },
      { icon: '⌨️', description: 'מקשי חצים להזזת הסמן, Enter לבחירה/הנחה' },
      { icon: '⇥', description: 'Tab לדילוג בין הכלים שלך' },
      { icon: '💡', description: 'לחץ "הצג רמז" לעזרה' },
    ],
    tip: 'שלוט במרכז הלוח! כלים במרכז יכולים להגיע ליותר משבצות.',
  },
  zh: {
    instructions: [
      {
        icon: '♚',
        title: '目标',
        description:
          '困住对手的国王让它无处可逃——这叫"将杀"！把它想象成一个抓人游戏，国王无法逃跑。',
      },
      {
        icon: '♟',
        title: '你的军队',
        description:
          '你有16个棋子。兵向前走一步（第一步可走两步）。车沿直线走。马跳"L"形可越子！象沿对角线走。后可以去任何方向——她最强。王每次走一步。',
      },
      {
        icon: '⚔️',
        title: '吃子',
        description:
          '走到对手棋子的格子上就能吃掉它。但小心——对手也能吃你的棋子！',
      },
      {
        icon: '🏆',
        title: '获胜',
        description:
          '当你攻击国王且它无法逃脱、阻挡或吃掉攻击者——这就是将杀！你赢了！',
      },
    ],
    controls: [
      { icon: '🖱️', description: '点击棋子选择，再点击目标位置移动' },
      { icon: '⌨️', description: '方向键移动光标，回车选择/放置' },
      { icon: '⇥', description: 'Tab在你的棋子间切换' },
      { icon: '💡', description: '点击"显示提示"获取帮助' },
    ],
    tip: '控制棋盘中心！中间的棋子能到达更多格子。',
  },
  es: {
    instructions: [
      {
        icon: '♚',
        title: 'El Objetivo',
        description:
          'Atrapa al Rey del oponente para que no pueda escapar — eso se llama "jaque mate". Piénsalo como un juego donde el Rey no puede huir.',
      },
      {
        icon: '♟',
        title: 'Tu Ejército',
        description:
          'Tienes 16 piezas. Peones avanzan un paso (dos en el primero). Torres van recto. Caballos saltan en "L" sobre otros. Alfiles van diagonal. La Reina va a cualquier lado — es la más fuerte. El Rey se mueve un paso.',
      },
      {
        icon: '⚔️',
        title: 'Capturar',
        description:
          'Aterriza en una casilla con pieza del oponente para capturarla. Pero cuidado — ellos pueden capturar las tuyas.',
      },
      {
        icon: '🏆',
        title: 'Ganar',
        description:
          'Cuando atacas al Rey y no puede escapar, bloquear o capturar al atacante — eso es jaque mate. Ganas.',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Clic en pieza para seleccionar, luego clic donde mover' },
      { icon: '⌨️', description: 'Flechas para mover cursor, Enter para seleccionar/colocar' },
      { icon: '⇥', description: 'Tab para saltar entre tus piezas' },
      { icon: '💡', description: 'Clic en "Mostrar pista" para ayuda' },
    ],
    tip: 'Controla el centro del tablero. Las piezas en el medio alcanzan más casillas.',
  },
};

/* ------------------------------------------------------------------ */
/*  Check detection utility                                            */
/* ------------------------------------------------------------------ */

function isKingInCheck(
  board: (Piece | null)[][],
  kingColor: PieceColor,
): boolean {
  let kingRow = -1;
  let kingCol = -1;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.color === kingColor) {
        kingRow = r;
        kingCol = c;
      }
    }
  }
  if (kingRow === -1) return false;

  const opponent: PieceColor = kingColor === 'white' ? 'black' : 'white';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== opponent) continue;

      switch (p.type) {
        case 'pawn': {
          const dir = p.color === 'white' ? -1 : 1;
          if (r + dir === kingRow && (c - 1 === kingCol || c + 1 === kingCol))
            return true;
          break;
        }
        case 'knight': {
          for (const [dr, dc] of [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2],
          ]) {
            if (r + dr === kingRow && c + dc === kingCol) return true;
          }
          break;
        }
        case 'bishop': {
          for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            for (let i = 1; i < 8; i++) {
              const nr = r + dr * i;
              const nc = c + dc * i;
              if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
              if (nr === kingRow && nc === kingCol) return true;
              if (board[nr][nc]) break;
            }
          }
          break;
        }
        case 'rook': {
          for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            for (let i = 1; i < 8; i++) {
              const nr = r + dr * i;
              const nc = c + dc * i;
              if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
              if (nr === kingRow && nc === kingCol) return true;
              if (board[nr][nc]) break;
            }
          }
          break;
        }
        case 'queen': {
          for (const [dr, dc] of [
            [0, 1], [0, -1], [1, 0], [-1, 0],
            [1, 1], [1, -1], [-1, 1], [-1, -1],
          ]) {
            for (let i = 1; i < 8; i++) {
              const nr = r + dr * i;
              const nc = c + dc * i;
              if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
              if (nr === kingRow && nc === kingCol) return true;
              if (board[nr][nc]) break;
            }
          }
          break;
        }
        case 'king': {
          if (Math.abs(r - kingRow) <= 1 && Math.abs(c - kingCol) <= 1)
            return true;
          break;
        }
      }
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Translated labels not in messages/*.json                           */
/* ------------------------------------------------------------------ */

const checkLabels: Record<string, string> = {
  en: '⚠️ Check!',
  he: '⚠️ !שח',
  zh: '⚠️ 将军！',
  es: '⚠️ ¡Jaque!',
};

const lossLabels: Record<
  string,
  { youLose: string; stalemate: string; playAgain: string }
> = {
  en: { youLose: 'You Lose!', stalemate: 'Stalemate!', playAgain: 'Play Again' },
  he: { youLose: '!הפסדת', stalemate: '!תיקו', playAgain: 'שחק שוב' },
  zh: { youLose: '你输了！', stalemate: '和棋！', playAgain: '再玩一次' },
  es: { youLose: '¡Perdiste!', stalemate: '¡Tablas!', playAgain: 'Jugar de nuevo' },
};

const winsLabel: Record<string, string> = {
  en: 'Wins',
  he: 'נצחונות',
  zh: '胜利',
  es: 'Victorias',
};

/* ================================================================== */
/*  ChessGame Component                                                */
/* ================================================================== */

export function ChessGame() {
  const t = useTranslations('chess');
  const locale = useLocale();
  const isRtl = locale === 'he';

  /* ---- game hook ------------------------------------------------- */
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
    capturedPieces,
    handleCellClick,
    getHint,
    resetGame,
  } = useChessGame();

  /* ---- retro sounds ---------------------------------------------- */
  const {
    playClick,
    playSuccess,
    playGameOver,
    playWin,
    playMove,
    playCapture,
  } = useRetroSounds();

  /* ---- local state ----------------------------------------------- */
  const [showInstructions, setShowInstructions] = useState(true);
  const [cursorPos, setCursorPos] = useState({ row: 7, col: 4 });
  const [keyboardActive, setKeyboardActive] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Win-count persistence
  const [wins, setWins] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chess-wins');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  /* ---- track previous state for reactive sound effects ----------- */
  const prevStateRef = useRef({
    moveCount: 0,
    whiteCapturedCount: 0,
    blackCapturedCount: 0,
    gameOver: false,
  });

  useEffect(() => {
    const prev = prevStateRef.current;

    // Detect AI (black) move — currentPlayer is already the NEXT player
    if (moveCount > prev.moveCount) {
      const wasAIMove = currentPlayer === 'white'; // black just finished
      if (wasAIMove) {
        if (capturedPieces.white.length > prev.whiteCapturedCount) {
          playCapture();
        } else {
          playMove();
        }
      }

      // Check detection (non-checkmate)
      if (!gameOver && isKingInCheck(board, currentPlayer)) {
        setTimeout(() => playSuccess(), 150);
      }
    }

    // Game-over detection
    if (gameOver && !prev.gameOver) {
      if (winner === 'white') {
        playWin();
        setWins((w) => {
          const next = w + 1;
          localStorage.setItem('chess-wins', String(next));
          return next;
        });
      } else {
        playGameOver();
      }
    }

    prevStateRef.current = {
      moveCount,
      whiteCapturedCount: capturedPieces.white.length,
      blackCapturedCount: capturedPieces.black.length,
      gameOver,
    };
  }, [
    moveCount,
    capturedPieces,
    currentPlayer,
    board,
    gameOver,
    winner,
    playCapture,
    playMove,
    playSuccess,
    playWin,
    playGameOver,
  ]);

  /* ---- helpers --------------------------------------------------- */
  const isValidMoveAt = (row: number, col: number) =>
    validMoves.some((m) => m.row === row && m.col === col);

  const isHintTarget = (row: number, col: number) =>
    hintMove?.to.row === row && hintMove?.to.col === col;

  const isHintSource = (row: number, col: number) =>
    hintMove?.from.row === row && hintMove?.from.col === col;

  const getPieceSymbol = (piece: Piece | null) => {
    if (!piece) return null;
    return pieceSymbols[`${piece.color}-${piece.type}`];
  };

  /* ---- click handler with sound ---------------------------------- */
  const handleCellClickWithSound = useCallback(
    (row: number, col: number) => {
      if (gameOver || currentPlayer !== 'white') return;

      const targetPiece = board[row][col];

      // Selecting own piece
      if (targetPiece && targetPiece.color === 'white') {
        playClick();
        handleCellClick(row, col);
        return;
      }

      // Attempting to move to a valid square
      if (selectedPiece) {
        const valid = validMoves.some((m) => m.row === row && m.col === col);
        if (valid) {
          if (targetPiece && targetPiece.color === 'black') {
            playCapture();
          } else {
            playMove();
          }
        }
      }

      handleCellClick(row, col);
    },
    [
      board,
      selectedPiece,
      validMoves,
      currentPlayer,
      gameOver,
      handleCellClick,
      playClick,
      playMove,
      playCapture,
    ],
  );

  /* ---- reset wrapper --------------------------------------------- */
  const handleReset = useCallback(() => {
    playClick();
    resetGame();
    setCursorPos({ row: 7, col: 4 });
  }, [resetGame, playClick]);

  /* ---- keyboard navigation --------------------------------------- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Activate keyboard cursor on any relevant key
      setKeyboardActive(true);

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
        case ' ':
          e.preventDefault();
          handleCellClickWithSound(cursorPos.row, cursorPos.col);
          break;
        case 'Tab': {
          e.preventDefault();
          // Collect all white-piece positions in reading order
          const whites: { row: number; col: number }[] = [];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (board[r][c]?.color === 'white') whites.push({ row: r, col: c });
            }
          }
          if (whites.length === 0) break;
          const idx = whites.findIndex(
            (p) => p.row === cursorPos.row && p.col === cursorPos.col,
          );
          if (e.shiftKey) {
            const prev = (idx - 1 + whites.length) % whites.length;
            setCursorPos(whites[prev]);
          } else {
            const next = (idx + 1) % whites.length;
            setCursorPos(whites[next]);
          }
          break;
        }
        default:
          break;
      }
    },
    [cursorPos, handleCellClickWithSound, board],
  );

  const handleBoardMouseDown = useCallback(() => {
    setKeyboardActive(false);
  }, []);

  /* ---- derived data ---------------------------------------------- */
  const instrData = instructionsData[locale] || instructionsData.en;
  const lossLabel = lossLabels[locale] || lossLabels.en;
  const inCheck =
    !gameOver && isKingInCheck(board, currentPlayer)
      ? (checkLabels[locale] || checkLabels.en)
      : '';

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <GameWrapper
      title={t('title') || 'Chess'}
      onInstructionsClick={() => {
        playClick();
        setShowInstructions(true);
      }}
    >
      <div className="flex flex-col items-center gap-6 p-4">
        {/* ---------- Difficulty selector ---------- */}
        <div className="flex flex-col items-center gap-2">
          <label className="text-lg font-bold text-gray-800">
            {t('difficulty') || 'Difficulty'}
          </label>
          <div className="flex gap-2 flex-wrap justify-center">
            {(['learn', 'easy', 'medium', 'hard'] as Difficulty[]).map(
              (level) => (
                <button
                  key={level}
                  onClick={() => {
                    playClick();
                    setDifficulty(level);
                    resetGame();
                    setCursorPos({ row: 7, col: 4 });
                  }}
                  disabled={!gameOver && currentPlayer === 'black'}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all min-h-[48px] min-w-[48px] ${
                    difficulty === level
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
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

        {/* ---------- Game info bar ---------- */}
        <div className="flex gap-6 items-center flex-wrap justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-600">
              {t('captured_by_you') || 'Captured by You'}
            </div>
            <div className="text-2xl min-h-[2rem]">
              {capturedPieces.black.map((piece, i) => (
                <span key={i}>{getPieceSymbol(piece)}</span>
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">
              {t('moves') || 'Moves'}
            </div>
            <div className="text-2xl font-bold text-gray-800">{moveCount}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">
              {winsLabel[locale] || 'Wins'}
            </div>
            <div className="text-2xl font-bold text-green-600">{wins}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">
              {t('captured_by_opponent') || 'Captured by Opponent'}
            </div>
            <div className="text-2xl min-h-[2rem]">
              {capturedPieces.white.map((piece, i) => (
                <span key={i}>{getPieceSymbol(piece)}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- Current player / check indicator ---------- */}
        {!gameOver && (
          <div
            className={`text-lg font-semibold ${
              currentPlayer === 'white' ? 'text-gray-800' : 'text-gray-600'
            }`}
          >
            {currentPlayer === 'white'
              ? t('your_turn') || 'Your Turn (White)'
              : t('opponent_turn') || "Opponent's Turn (Black)..."}
            {inCheck ? ` ${inCheck}` : ''}
          </div>
        )}

        {/* ---------- Hint button ---------- */}
        {currentPlayer === 'white' && !gameOver && (
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

        {/* ---------- Chess board ---------- */}
        <div
          ref={boardRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseDown={handleBoardMouseDown}
          className="inline-block bg-gray-800 p-2 rounded-lg shadow-2xl focus:outline-none focus:ring-4 focus:ring-cyan-400/50"
          role="grid"
          aria-label="Chess board"
        >
          {/* Row numbers + grid */}
          <div className="flex">
            {/* Row labels */}
            <div className="flex flex-col justify-around pr-1 text-xs text-gray-400">
              {[8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                <span key={n} className="h-12 md:h-16 flex items-center justify-center">
                  {n}
                </span>
              ))}
            </div>

            {/* Board squares */}
            <div className="grid grid-cols-8 gap-0">
              {board.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                  const isLightSquare = (rowIndex + colIndex) % 2 === 0;
                  const isSelected =
                    selectedPiece?.row === rowIndex &&
                    selectedPiece?.col === colIndex;
                  const isValid = isValidMoveAt(rowIndex, colIndex);
                  const isHint = isHintTarget(rowIndex, colIndex);
                  const isHintSrc = isHintSource(rowIndex, colIndex);
                  const isCursor =
                    keyboardActive &&
                    cursorPos.row === rowIndex &&
                    cursorPos.col === colIndex;

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() =>
                        handleCellClickWithSound(rowIndex, colIndex)
                      }
                      role="gridcell"
                      aria-label={`${String.fromCharCode(97 + colIndex)}${
                        8 - rowIndex
                      }${
                        piece ? ` ${piece.color} ${piece.type}` : ''
                      }`}
                      className={`
                        w-12 h-12 md:w-16 md:h-16 flex items-center justify-center cursor-pointer
                        transition-all duration-200 text-4xl md:text-5xl relative
                        ${isLightSquare ? 'bg-amber-200' : 'bg-amber-700'}
                        ${isSelected ? 'ring-4 ring-blue-400 ring-inset' : ''}
                        ${isValid ? 'ring-4 ring-green-400 ring-inset' : ''}
                        ${isHint ? 'ring-4 ring-yellow-400 ring-inset animate-pulse' : ''}
                        ${isHintSrc ? 'ring-4 ring-yellow-300 ring-inset' : ''}
                        ${
                          !gameOver &&
                          currentPlayer === 'white' &&
                          piece?.color === 'white'
                            ? 'hover:brightness-110'
                            : ''
                        }
                      `}
                    >
                      {piece && (
                        <span
                          className={
                            piece.color === 'white'
                              ? 'text-white filter drop-shadow-lg'
                              : 'text-gray-900'
                          }
                        >
                          {getPieceSymbol(piece)}
                        </span>
                      )}

                      {/* Green dot for empty valid-move squares */}
                      {isValid && !piece && (
                        <span className="absolute w-3 h-3 bg-green-400/60 rounded-full" />
                      )}

                      {/* Keyboard cursor indicator */}
                      {isCursor && (
                        <span className="absolute inset-0 border-3 border-dashed border-cyan-400 pointer-events-none" />
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>

          {/* Column labels */}
          <div
            className={`flex justify-around mt-1 text-xs text-gray-400 ${
              isRtl ? 'mr-5' : 'ml-5'
            }`}
          >
            <span>a</span>
            <span>b</span>
            <span>c</span>
            <span>d</span>
            <span>e</span>
            <span>f</span>
            <span>g</span>
            <span>h</span>
          </div>
        </div>

        {/* ---------- New Game button ---------- */}
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105 min-h-[48px]"
        >
          {t('new_game') || 'New Game'}
        </button>
      </div>

      {/* ---------- Win Modal (player victory only) ---------- */}
      <WinModal
        isOpen={gameOver && winner === 'white'}
        moves={moveCount}
        onPlayAgain={handleReset}
      />

      {/* ---------- Loss / Stalemate overlay ---------- */}
      {gameOver && winner !== 'white' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-8xl mb-4">😔</div>
            <h2 className="text-4xl font-bold text-slate-800 mb-2">
              {winner === 'black'
                ? t('you_lose') || lossLabel.youLose
                : lossLabel.stalemate}
            </h2>
            <button
              onClick={handleReset}
              className="mt-6 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform min-h-[48px]"
            >
              {lossLabel.playAgain} 🎮
            </button>
          </div>
        </div>
      )}

      {/* ---------- Instructions Modal ---------- */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={t('title') || 'Chess'}
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />
    </GameWrapper>
  );
}
