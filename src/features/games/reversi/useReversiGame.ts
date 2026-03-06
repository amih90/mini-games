'use client';

import { useState, useCallback, useEffect } from 'react';

export type Difficulty = 'learn' | 'easy' | 'medium' | 'hard';

type CellState = 'black' | 'white' | null;
type Board = CellState[][];

interface Position {
  row: number;
  col: number;
}

export function useReversiGame() {
  const [board, setBoard] = useState<Board>(() => initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<'black' | 'white'>('black');
  const [difficulty, setDifficulty] = useState<Difficulty>('learn');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'black' | 'white' | 'tie' | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [hintMove, setHintMove] = useState<Position | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [score, setScore] = useState({ black: 2, white: 2 });
  const [passedTurns, setPassedTurns] = useState(0);

  function initializeBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Initial position - center 4 squares
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    
    return board;
  }

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  const getFlippedPieces = useCallback((board: Board, row: number, col: number, player: 'black' | 'white'): Position[] => {
    if (board[row][col] !== null) return [];

    const opponent = player === 'black' ? 'white' : 'black';
    const flipped: Position[] = [];

    for (const [dr, dc] of directions) {
      const tempFlipped: Position[] = [];
      let r = row + dr;
      let c = col + dc;

      // Keep moving in this direction while we see opponent pieces
      while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opponent) {
        tempFlipped.push({ row: r, col: c });
        r += dr;
        c += dc;
      }

      // If we ended on our own piece and captured at least one opponent piece
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === player && tempFlipped.length > 0) {
        flipped.push(...tempFlipped);
      }
    }

    return flipped;
  }, []);

  const getValidMoves = useCallback((board: Board, player: 'black' | 'white'): Position[] => {
    const moves: Position[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === null) {
          const flipped = getFlippedPieces(board, row, col, player);
          if (flipped.length > 0) {
            moves.push({ row, col });
          }
        }
      }
    }

    return moves;
  }, [getFlippedPieces]);

  const calculateScore = useCallback((board: Board) => {
    let black = 0;
    let white = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === 'black') black++;
        else if (board[row][col] === 'white') white++;
      }
    }

    return { black, white };
  }, []);

  const makeMove = useCallback((row: number, col: number) => {
    const flipped = getFlippedPieces(board, row, col, currentPlayer);
    if (flipped.length === 0) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;

    // Flip captured pieces
    flipped.forEach(pos => {
      newBoard[pos.row][pos.col] = currentPlayer;
    });

    setBoard(newBoard);
    setMoveCount(prev => prev + 1);
    setHintMove(null);

    const newScore = calculateScore(newBoard);
    setScore(newScore);

    // Check if board is full
    const isFull = newBoard.every(row => row.every(cell => cell !== null));

    // Switch player
    const nextPlayer = currentPlayer === 'black' ? 'white' : 'black';
    const nextMoves = getValidMoves(newBoard, nextPlayer);

    if (nextMoves.length === 0) {
      // Next player has no moves
      const currentMoves = getValidMoves(newBoard, currentPlayer);
      
      if (currentMoves.length === 0 || isFull) {
        // Game over - neither player can move
        setGameOver(true);
        if (newScore.black > newScore.white) {
          setWinner('black');
        } else if (newScore.white > newScore.black) {
          setWinner('white');
        } else {
          setWinner('tie');
        }
      } else {
        // Current player gets another turn
        setPassedTurns(prev => prev + 1);
      }
    } else {
      setCurrentPlayer(nextPlayer);
      setPassedTurns(0);
    }
  }, [board, currentPlayer, getFlippedPieces, getValidMoves, calculateScore]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameOver || currentPlayer !== 'black') return;

    const flipped = getFlippedPieces(board, row, col, 'black');
    if (flipped.length > 0) {
      makeMove(row, col);
    }
  }, [board, currentPlayer, gameOver, getFlippedPieces, makeMove]);

  const getHint = useCallback(() => {
    if (gameOver || currentPlayer !== 'black' || validMoves.length === 0) return;

    let selectedMove: Position;

    if (difficulty === 'learn') {
      // Show the move that flips the most pieces
      selectedMove = validMoves.reduce((best, move) => {
        const bestFlips = getFlippedPieces(board, best.row, best.col, 'black').length;
        const moveFlips = getFlippedPieces(board, move.row, move.col, 'black').length;
        return moveFlips > bestFlips ? move : best;
      }, validMoves[0]);
    } else {
      // Random valid move
      selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    setHintMove(selectedMove);
  }, [board, currentPlayer, gameOver, difficulty, validMoves, getFlippedPieces]);

  // Update valid moves when board or player changes
  useEffect(() => {
    const moves = getValidMoves(board, currentPlayer);
    setValidMoves(moves);
  }, [board, currentPlayer, getValidMoves]);

  // AI move for computer
  useEffect(() => {
    if (currentPlayer === 'white' && !gameOver && difficulty !== 'learn' && validMoves.length > 0) {
      const timeoutId = setTimeout(() => {
        let selectedMove: Position;

        if (difficulty === 'easy') {
          // Random move
          selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        } else if (difficulty === 'medium') {
          // Prefer corners, then edges, then maximize flips
          const corners = validMoves.filter(m => 
            (m.row === 0 || m.row === 7) && (m.col === 0 || m.col === 7)
          );
          
          if (corners.length > 0) {
            selectedMove = corners[0];
          } else {
            // Choose move that flips most pieces
            selectedMove = validMoves.reduce((best, move) => {
              const bestFlips = getFlippedPieces(board, best.row, best.col, 'white').length;
              const moveFlips = getFlippedPieces(board, move.row, move.col, 'white').length;
              return moveFlips > bestFlips ? move : best;
            });
          }
        } else {
          // Hard: strategic positioning
          const corners = validMoves.filter(m => 
            (m.row === 0 || m.row === 7) && (m.col === 0 || m.col === 7)
          );
          
          if (corners.length > 0) {
            selectedMove = corners[0];
          } else {
            // Avoid squares next to corners if corner is empty
            const safeValidMoves = validMoves.filter(m => {
              // Avoid X-squares (next to corners)
              const dangerousSquares = [
                [0, 1], [1, 0], [1, 1], // Top-left corner neighbors
                [0, 6], [1, 6], [1, 7], // Top-right corner neighbors
                [6, 0], [6, 1], [7, 1], // Bottom-left corner neighbors
                [6, 6], [6, 7], [7, 6], // Bottom-right corner neighbors
              ];
              return !dangerousSquares.some(([r, c]) => r === m.row && c === m.col);
            });

            const movesToConsider = safeValidMoves.length > 0 ? safeValidMoves : validMoves;
            
            // Choose move that flips most pieces
            selectedMove = movesToConsider.reduce((best, move) => {
              const bestFlips = getFlippedPieces(board, best.row, best.col, 'white').length;
              const moveFlips = getFlippedPieces(board, move.row, move.col, 'white').length;
              return moveFlips > bestFlips ? move : best;
            });
          }
        }

        makeMove(selectedMove.row, selectedMove.col);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayer, gameOver, difficulty, validMoves, board, getFlippedPieces, makeMove]);

  const resetGame = useCallback(() => {
    setBoard(initializeBoard());
    setCurrentPlayer('black');
    setGameOver(false);
    setWinner(null);
    setHintMove(null);
    setMoveCount(0);
    setScore({ black: 2, white: 2 });
    setPassedTurns(0);
  }, []);

  return {
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
  };
}
