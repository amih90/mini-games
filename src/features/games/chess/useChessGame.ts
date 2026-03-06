'use client';

import { useState, useCallback, useEffect } from 'react';

export type Difficulty = 'learn' | 'easy' | 'medium' | 'hard';

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

type Board = (Piece | null)[][];

interface Position {
  row: number;
  col: number;
}

interface Move {
  from: Position;
  to: Position;
  captured?: Piece;
}

export function useChessGame() {
  const [board, setBoard] = useState<Board>(() => initializeBoard());
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [difficulty, setDifficulty] = useState<Difficulty>('learn');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [hintMove, setHintMove] = useState<Move | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[], black: Piece[] }>({ 
    white: [], 
    black: [] 
  });

  function initializeBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place pawns
    for (let col = 0; col < 8; col++) {
      board[1][col] = { type: 'pawn', color: 'black' };
      board[6][col] = { type: 'pawn', color: 'white' };
    }
    
    // Place other pieces
    const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let col = 0; col < 8; col++) {
      board[0][col] = { type: backRow[col], color: 'black' };
      board[7][col] = { type: backRow[col], color: 'white' };
    }
    
    return board;
  }

  const isValidPosition = (row: number, col: number): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  };

  const getPossibleMoves = useCallback((board: Board, pos: Position): Position[] => {
    const piece = board[pos.row][pos.col];
    if (!piece) return [];

    const moves: Position[] = [];
    const { row, col } = pos;
    const { type, color } = piece;

    const addMove = (r: number, c: number) => {
      if (!isValidPosition(r, c)) return false;
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
        return true;
      }
      if (target.color !== color) {
        moves.push({ row: r, col: c });
      }
      return false;
    };

    switch (type) {
      case 'pawn':
        const direction = color === 'white' ? -1 : 1;
        // Move forward
        if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
          moves.push({ row: row + direction, col });
          // Double move from start
          if ((color === 'white' && row === 6) || (color === 'black' && row === 1)) {
            if (!board[row + 2 * direction][col]) {
              moves.push({ row: row + 2 * direction, col });
            }
          }
        }
        // Capture diagonally
        for (const dc of [-1, 1]) {
          if (isValidPosition(row + direction, col + dc)) {
            const target = board[row + direction][col + dc];
            if (target && target.color !== color) {
              moves.push({ row: row + direction, col: col + dc });
            }
          }
        }
        break;

      case 'rook':
        // Horizontal and vertical
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr * i, col + dc * i)) break;
          }
        }
        break;

      case 'knight':
        // L-shaped moves
        for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
          addMove(row + dr, col + dc);
        }
        break;

      case 'bishop':
        // Diagonals
        for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr * i, col + dc * i)) break;
          }
        }
        break;

      case 'queen':
        // Combination of rook and bishop
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr * i, col + dc * i)) break;
          }
        }
        break;

      case 'king':
        // One square in any direction
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          addMove(row + dr, col + dc);
        }
        break;
    }

    return moves;
  }, []);

  const getAllValidMoves = useCallback((board: Board, player: PieceColor): Move[] => {
    const allMoves: Move[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === player) {
          const moves = getPossibleMoves(board, { row, col });
          moves.forEach(to => {
            allMoves.push({ from: { row, col }, to, captured: board[to.row][to.col] || undefined });
          });
        }
      }
    }

    return allMoves;
  }, [getPossibleMoves]);

  const findKing = useCallback((board: Board, color: PieceColor): Position | null => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }, []);

  const makeMove = useCallback((move: Move) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[move.from.row][move.from.col];
    
    if (!piece) return;

    // Capture piece if present
    const captured = newBoard[move.to.row][move.to.col];
    if (captured) {
      setCapturedPieces(prev => ({
        ...prev,
        [captured.color]: [...prev[captured.color], captured]
      }));

      // Check if king was captured (game over)
      if (captured.type === 'king') {
        setWinner(currentPlayer);
        setGameOver(true);
      }
    }

    // Move the piece
    newBoard[move.to.row][move.to.col] = { ...piece, hasMoved: true };
    newBoard[move.from.row][move.from.col] = null;

    // Pawn promotion (simplified - always promote to queen)
    if (piece.type === 'pawn') {
      if ((piece.color === 'white' && move.to.row === 0) || 
          (piece.color === 'black' && move.to.row === 7)) {
        newBoard[move.to.row][move.to.col] = { type: 'queen', color: piece.color, hasMoved: true };
      }
    }

    setBoard(newBoard);
    setMoveCount(prev => prev + 1);
    setSelectedPiece(null);
    setValidMoves([]);
    setHintMove(null);

    // Switch player
    const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
    setCurrentPlayer(nextPlayer);

    // Check if next player has any valid moves
    if (!gameOver) {
      const nextPlayerMoves = getAllValidMoves(newBoard, nextPlayer);
      if (nextPlayerMoves.length === 0) {
        // Checkmate or stalemate
        const kingPos = findKing(newBoard, nextPlayer);
        if (!kingPos) {
          setWinner(currentPlayer);
          setGameOver(true);
        }
      }
    }
  }, [board, currentPlayer, gameOver, getAllValidMoves, findKing]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameOver || currentPlayer !== 'white') return;

    const piece = board[row][col];

    // If clicking on own piece, select it
    if (piece && piece.color === 'white') {
      const moves = getPossibleMoves(board, { row, col });
      setSelectedPiece({ row, col });
      setValidMoves(moves);
      setHintMove(null);
      return;
    }

    // If a piece is selected and clicking on valid move
    if (selectedPiece) {
      const isValid = validMoves.some(m => m.row === row && m.col === col);
      
      if (isValid) {
        makeMove({ 
          from: selectedPiece, 
          to: { row, col },
          captured: board[row][col] || undefined
        });
      }
    }
  }, [board, selectedPiece, validMoves, currentPlayer, gameOver, getPossibleMoves, makeMove]);

  const getHint = useCallback(() => {
    if (gameOver || currentPlayer !== 'white') return;

    const allMoves = getAllValidMoves(board, 'white');
    if (allMoves.length === 0) return;

    let selectedMove: Move;
    
    if (difficulty === 'learn') {
      // Prioritize captures
      const captureMoves = allMoves.filter(m => m.captured);
      if (captureMoves.length > 0) {
        selectedMove = captureMoves[0];
      } else {
        selectedMove = allMoves[0];
      }
    } else {
      // Random valid move
      selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
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
          setWinner('white');
          setGameOver(true);
          return;
        }

        let selectedMove: Move;

        if (difficulty === 'easy') {
          // Random move
          selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        } else if (difficulty === 'medium') {
          // Prefer captures
          const captureMoves = allMoves.filter(m => m.captured);
          if (captureMoves.length > 0) {
            selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
          } else {
            selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
          }
        } else {
          // Hard: Prioritize high-value captures
          const captureMoves = allMoves.filter(m => m.captured);
          if (captureMoves.length > 0) {
            const pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
            selectedMove = captureMoves.reduce((best, move) => {
              const bestValue = best.captured ? pieceValues[best.captured.type] : 0;
              const moveValue = move.captured ? pieceValues[move.captured.type] : 0;
              return moveValue > bestValue ? move : best;
            }, captureMoves[0]);
          } else {
            // Move pieces toward center or forward
            selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
          }
        }

        makeMove(selectedMove);
      }, 700);

      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayer, gameOver, difficulty, board, getAllValidMoves, makeMove]);

  const resetGame = useCallback(() => {
    setBoard(initializeBoard());
    setSelectedPiece(null);
    setValidMoves([]);
    setCurrentPlayer('white');
    setGameOver(false);
    setWinner(null);
    setHintMove(null);
    setMoveCount(0);
    setCapturedPieces({ white: [], black: [] });
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
    capturedPieces,
    handleCellClick,
    getHint,
    resetGame,
  };
}
