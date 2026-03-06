'use client';

import { useState, useCallback, useEffect } from 'react';

export type Difficulty = 'learn' | 'easy' | 'medium' | 'hard';

type PieceType = 'red' | 'black' | 'red-king' | 'black-king' | null;
type Board = PieceType[][];

interface Position {
  row: number;
  col: number;
}

interface Move {
  from: Position;
  to: Position;
  captures?: Position[];
}

export function useCheckersGame() {
  const [board, setBoard] = useState<Board>(() => initializeBoard());
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'black'>('red');
  const [difficulty, setDifficulty] = useState<Difficulty>('learn');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'red' | 'black' | null>(null);
  const [hintMove, setHintMove] = useState<Move | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [score, setScore] = useState({ red: 12, black: 12 });

  function initializeBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place black pieces (top)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = 'black';
        }
      }
    }
    
    // Place red pieces (bottom)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = 'red';
        }
      }
    }
    
    return board;
  }

  const getValidMoves = useCallback((board: Board, pos: Position): Move[] => {
    const piece = board[pos.row][pos.col];
    if (!piece) return [];

    const moves: Move[] = [];
    const isRed = piece === 'red' || piece === 'red-king';
    const isKing = piece === 'red-king' || piece === 'black-king';

    // Direction vectors for movement
    const directions = isKing 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] // Kings move in all diagonal directions
      : isRed 
        ? [[-1, -1], [-1, 1]] // Red moves up
        : [[1, -1], [1, 1]]; // Black moves down

    // Check for capture moves (mandatory if available)
    const captureMoves: Move[] = [];
    for (const [dr, dc] of directions) {
      const jumpRow = pos.row + 2 * dr;
      const jumpCol = pos.col + 2 * dc;
      const midRow = pos.row + dr;
      const midCol = pos.col + dc;

      if (
        jumpRow >= 0 && jumpRow < 8 &&
        jumpCol >= 0 && jumpCol < 8 &&
        !board[jumpRow][jumpCol] &&
        board[midRow][midCol] &&
        ((isRed && (board[midRow][midCol] === 'black' || board[midRow][midCol] === 'black-king')) ||
         (!isRed && (board[midRow][midCol] === 'red' || board[midRow][midCol] === 'red-king')))
      ) {
        captureMoves.push({
          from: pos,
          to: { row: jumpRow, col: jumpCol },
          captures: [{ row: midRow, col: midCol }],
        });
      }
    }

    if (captureMoves.length > 0) {
      return captureMoves;
    }

    // Regular moves (only if no captures available)
    for (const [dr, dc] of directions) {
      const newRow = pos.row + dr;
      const newCol = pos.col + dc;

      if (
        newRow >= 0 && newRow < 8 &&
        newCol >= 0 && newCol < 8 &&
        !board[newRow][newCol]
      ) {
        moves.push({
          from: pos,
          to: { row: newRow, col: newCol },
        });
      }
    }

    return moves;
  }, []);

  const getAllValidMoves = useCallback((board: Board, player: 'red' | 'black'): Move[] => {
    const allMoves: Move[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && ((player === 'red' && (piece === 'red' || piece === 'red-king')) ||
                      (player === 'black' && (piece === 'black' || piece === 'black-king')))) {
          const moves = getValidMoves(board, { row, col });
          allMoves.push(...moves);
        }
      }
    }

    // Prioritize capture moves
    const captureMoves = allMoves.filter(m => m.captures && m.captures.length > 0);
    return captureMoves.length > 0 ? captureMoves : allMoves;
  }, [getValidMoves]);

  const makeMove = useCallback((move: Move) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[move.from.row][move.from.col];
    
    // Move the piece
    newBoard[move.to.row][move.to.col] = piece;
    newBoard[move.from.row][move.from.col] = null;

    // Handle captures
    if (move.captures) {
      move.captures.forEach(cap => {
        newBoard[cap.row][cap.col] = null;
      });
    }

    // Promote to king if reached opposite end
    if (piece === 'red' && move.to.row === 0) {
      newBoard[move.to.row][move.to.col] = 'red-king';
    } else if (piece === 'black' && move.to.row === 7) {
      newBoard[move.to.row][move.to.col] = 'black-king';
    }

    setBoard(newBoard);
    setMoveCount(prev => prev + 1);

    // Update score
    const newScore = { ...score };
    if (move.captures) {
      if (currentPlayer === 'red') {
        newScore.black -= move.captures.length;
      } else {
        newScore.red -= move.captures.length;
      }
      setScore(newScore);
    }

    // Check for win condition
    if (newScore.red === 0) {
      setWinner('black');
      setGameOver(true);
      return;
    } else if (newScore.black === 0) {
      setWinner('red');
      setGameOver(true);
      return;
    }

    // Switch player
    const nextPlayer = currentPlayer === 'red' ? 'black' : 'red';
    setCurrentPlayer(nextPlayer);
    setSelectedPiece(null);
    setValidMoves([]);
    setHintMove(null);

    // Check if next player has any moves
    const nextPlayerMoves = getAllValidMoves(newBoard, nextPlayer);
    if (nextPlayerMoves.length === 0) {
      setWinner(currentPlayer);
      setGameOver(true);
    }
  }, [board, currentPlayer, score, getAllValidMoves]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameOver || currentPlayer !== 'red') return;

    const piece = board[row][col];

    // If clicking on own piece, select it
    if (piece && (piece === 'red' || piece === 'red-king')) {
      const moves = getValidMoves(board, { row, col });
      setSelectedPiece({ row, col });
      setValidMoves(moves.map(m => m.to));
      setHintMove(null);
      return;
    }

    // If a piece is selected and clicking on valid move
    if (selectedPiece) {
      const moves = getValidMoves(board, selectedPiece);
      const targetMove = moves.find(m => m.to.row === row && m.to.col === col);
      
      if (targetMove) {
        makeMove(targetMove);
      }
    }
  }, [board, selectedPiece, currentPlayer, gameOver, getValidMoves, makeMove]);

  const getHint = useCallback(() => {
    if (gameOver || currentPlayer !== 'red') return;

    const allMoves = getAllValidMoves(board, 'red');
    if (allMoves.length === 0) return;

    // Prioritize capture moves
    const captureMoves = allMoves.filter(m => m.captures && m.captures.length > 0);
    const movesToConsider = captureMoves.length > 0 ? captureMoves : allMoves;

    // In learn mode, show the best move
    // In other modes, show random move with some strategy
    let selectedMove: Move;
    
    if (difficulty === 'learn') {
      // Show the first capture move or first available move
      selectedMove = movesToConsider[0];
    } else {
      // Random move from valid moves
      selectedMove = movesToConsider[Math.floor(Math.random() * movesToConsider.length)];
    }

    setHintMove(selectedMove);
    setSelectedPiece(selectedMove.from);
    setValidMoves([selectedMove.to]);
  }, [board, currentPlayer, gameOver, difficulty, getAllValidMoves]);

  // AI move for computer
  useEffect(() => {
    if (currentPlayer === 'black' && !gameOver && difficulty !== 'learn') {
      const timeoutId = setTimeout(() => {
        const allMoves = getAllValidMoves(board, 'black');
        if (allMoves.length === 0) {
          setWinner('red');
          setGameOver(true);
          return;
        }

        let selectedMove: Move;
        const captureMoves = allMoves.filter(m => m.captures && m.captures.length > 0);
        const movesToConsider = captureMoves.length > 0 ? captureMoves : allMoves;

        if (difficulty === 'easy') {
          // Random move
          selectedMove = movesToConsider[Math.floor(Math.random() * movesToConsider.length)];
        } else if (difficulty === 'medium') {
          // Prefer captures, some strategy
          if (captureMoves.length > 0) {
            selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
          } else {
            selectedMove = movesToConsider[Math.floor(Math.random() * movesToConsider.length)];
          }
        } else {
          // Hard: always prefer captures, advance pieces
          if (captureMoves.length > 0) {
            // Choose capture that gets most pieces
            selectedMove = captureMoves.reduce((best, move) => 
              (move.captures?.length || 0) > (best.captures?.length || 0) ? move : best
            , captureMoves[0]);
          } else {
            // Advance pieces toward promotion
            selectedMove = movesToConsider.reduce((best, move) => 
              move.to.row > best.to.row ? move : best
            , movesToConsider[0]);
          }
        }

        makeMove(selectedMove);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayer, gameOver, difficulty, board, getAllValidMoves, makeMove]);

  const resetGame = useCallback(() => {
    setBoard(initializeBoard());
    setSelectedPiece(null);
    setValidMoves([]);
    setCurrentPlayer('red');
    setGameOver(false);
    setWinner(null);
    setHintMove(null);
    setMoveCount(0);
    setScore({ red: 12, black: 12 });
  }, []);

  return {
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
  };
}
