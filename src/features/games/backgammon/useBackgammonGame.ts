'use client';

import { useState, useCallback, useEffect } from 'react';

export type Difficulty = 'learn' | 'easy' | 'medium' | 'hard';

type Player = 'white' | 'black';

interface Point {
  checkers: number; // Positive for white, negative for black
}

interface DiceRoll {
  die1: number;
  die2: number;
  remaining: number[];
}

interface Move {
  from: number;
  to: number;
  die: number;
}

export function useBackgammonGame() {
  const [board, setBoard] = useState<Point[]>(() => initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('white');
  const [difficulty, setDifficulty] = useState<Difficulty>('learn');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [dice, setDice] = useState<DiceRoll | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [hintMove, setHintMove] = useState<Move | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [barPieces, setBarPieces] = useState<{ white: number; black: number }>({ white: 0, black: 0 });
  const [bornOff, setBornOff] = useState<{ white: number; black: number }>({ white: 0, black: 0 });

  function initializeBoard(): Point[] {
    // Backgammon initial position (simplified)
    // Points are numbered 0-23
    // White moves from 0 to 23, Black moves from 23 to 0
    const points: Point[] = Array(24).fill(null).map(() => ({ checkers: 0 }));
    
    // Standard backgammon setup (simplified)
    points[0].checkers = 2;   // 2 white checkers
    points[5].checkers = -5;  // 5 black checkers
    points[7].checkers = -3;  // 3 black checkers
    points[11].checkers = 5;  // 5 white checkers
    points[12].checkers = -5; // 5 black checkers
    points[16].checkers = 3;  // 3 white checkers
    points[18].checkers = 5;  // 5 white checkers
    points[23].checkers = -2; // 2 black checkers
    
    return points;
  }

  const rollDice = useCallback(() => {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    
    // Doubles mean you can use each die twice
    const remaining = die1 === die2 
      ? [die1, die1, die1, die1] 
      : [die1, die2];
    
    setDice({ die1, die2, remaining });
    setSelectedPoint(null);
    setHintMove(null);
  }, []);

  const canMove = useCallback((board: Point[], from: number, die: number, player: Player): boolean => {
    // Check if on bar first
    if (player === 'white' && barPieces.white > 0 && from !== -1) return false;
    if (player === 'black' && barPieces.black > 0 && from !== -1) return false;

    const direction = player === 'white' ? 1 : -1;
    const to = from === -1 
      ? (player === 'white' ? die - 1 : 24 - die)
      : from + die * direction;

    // Check bounds
    if (to < 0 || to > 23) {
      // Bearing off - check if all pieces are in home board
      if (player === 'white' && to >= 24) {
        const allHome = board.slice(0, 18).every(p => p.checkers <= 0) && barPieces.white === 0;
        return allHome && board[from].checkers > 0;
      }
      if (player === 'black' && to < 0) {
        const allHome = board.slice(6, 24).every(p => p.checkers >= 0) && barPieces.black === 0;
        return allHome && board[from].checkers < 0;
      }
      return false;
    }

    // Check if point is blocked (opponent has 2 or more)
    const targetPoint = board[to];
    if (player === 'white' && targetPoint.checkers < -1) return false;
    if (player === 'black' && targetPoint.checkers > 1) return false;

    // Check if source has player's checker
    if (from === -1) return true; // Coming from bar
    if (player === 'white' && board[from].checkers <= 0) return false;
    if (player === 'black' && board[from].checkers >= 0) return false;

    return true;
  }, [barPieces]);

  const getPossibleMoves = useCallback((board: Point[], player: Player, diceRemaining: number[]): Move[] => {
    const moves: Move[] = [];

    // If on bar, must enter first
    if ((player === 'white' && barPieces.white > 0) || (player === 'black' && barPieces.black > 0)) {
      for (const die of diceRemaining) {
        if (canMove(board, -1, die, player)) {
          const direction = player === 'white' ? 1 : -1;
          const to = player === 'white' ? die - 1 : 24 - die;
          moves.push({ from: -1, to, die });
        }
      }
      return moves;
    }

    // Regular moves
    for (let from = 0; from < 24; from++) {
      const hasChecker = (player === 'white' && board[from].checkers > 0) ||
                        (player === 'black' && board[from].checkers < 0);
      
      if (hasChecker) {
        for (const die of diceRemaining) {
          if (canMove(board, from, die, player)) {
            const direction = player === 'white' ? 1 : -1;
            const to = from + die * direction;
            moves.push({ from, to: to < 0 || to > 23 ? -2 : to, die }); // -2 = bearing off
          }
        }
      }
    }

    return moves;
  }, [canMove, barPieces]);

  const makeMove = useCallback((move: Move) => {
    if (!dice) return;

    const newBoard = board.map(p => ({ ...p }));
    const player = currentPlayer;

    // Remove from bar or board
    if (move.from === -1) {
      if (player === 'white') {
        setBarPieces(prev => ({ ...prev, white: prev.white - 1 }));
      } else {
        setBarPieces(prev => ({ ...prev, black: prev.black - 1 }));
      }
    } else {
      if (player === 'white') {
        newBoard[move.from].checkers--;
      } else {
        newBoard[move.from].checkers++;
      }
    }

    // Place on board or bear off
    if (move.to === -2) {
      // Bearing off
      const newBornOffCount = player === 'white' ? bornOff.white + 1 : bornOff.black + 1;
      
      if (player === 'white') {
        setBornOff(prev => ({ ...prev, white: prev.white + 1 }));
        if (newBornOffCount === 15) {
          setWinner('white');
          setGameOver(true);
        }
      } else {
        setBornOff(prev => ({ ...prev, black: prev.black + 1 }));
        if (newBornOffCount === 15) {
          setWinner('black');
          setGameOver(true);
        }
      }
    } else {
      // Check for hit (opponent has 1 checker)
      if (player === 'white' && newBoard[move.to].checkers === -1) {
        newBoard[move.to].checkers = 0;
        setBarPieces(prev => ({ ...prev, black: prev.black + 1 }));
      } else if (player === 'black' && newBoard[move.to].checkers === 1) {
        newBoard[move.to].checkers = 0;
        setBarPieces(prev => ({ ...prev, white: prev.white + 1 }));
      }

      // Place checker
      if (player === 'white') {
        newBoard[move.to].checkers++;
      } else {
        newBoard[move.to].checkers--;
      }
    }

    setBoard(newBoard);
    setMoveCount(prev => prev + 1);

    // Remove used die
    const newRemaining = [...dice.remaining];
    const dieIndex = newRemaining.indexOf(move.die);
    if (dieIndex !== -1) {
      newRemaining.splice(dieIndex, 1);
    }

    if (newRemaining.length === 0) {
      // No more moves, switch player
      setCurrentPlayer(player === 'white' ? 'black' : 'white');
      setDice(null);
      setSelectedPoint(null);
      setValidMoves([]);
      setHintMove(null);
    } else {
      setDice({ ...dice, remaining: newRemaining });
    }
  }, [board, dice, currentPlayer, bornOff, barPieces]);

  const handlePointClick = useCallback((pointIndex: number) => {
    if (gameOver || currentPlayer !== 'white' || !dice) return;

    // Check if this is a valid move destination
    const validMove = validMoves.find(m => m.to === pointIndex);
    if (validMove && selectedPoint !== null) {
      makeMove(validMove);
      return;
    }

    // Select the point to move from
    const hasChecker = board[pointIndex].checkers > 0;
    if (hasChecker) {
      setSelectedPoint(pointIndex);
      const moves = getPossibleMoves(board, 'white', dice.remaining).filter(m => m.from === pointIndex);
      setValidMoves(moves);
      setHintMove(null);
    }
  }, [board, dice, selectedPoint, validMoves, currentPlayer, gameOver, getPossibleMoves, makeMove]);

  const getHint = useCallback(() => {
    if (gameOver || currentPlayer !== 'white' || !dice) return;

    const allMoves = getPossibleMoves(board, 'white', dice.remaining);
    if (allMoves.length === 0) return;

    setHintMove(allMoves[0]);
    setSelectedPoint(allMoves[0].from);
    setValidMoves(allMoves.filter(m => m.from === allMoves[0].from));
  }, [board, dice, currentPlayer, gameOver, getPossibleMoves]);

  // Start turn by rolling dice
  const startTurn = useCallback(() => {
    if (!gameOver && !dice) {
      rollDice();
    }
  }, [gameOver, dice, rollDice]);

  // AI turn
  useEffect(() => {
    if (currentPlayer === 'black' && !gameOver && dice && difficulty !== 'learn') {
      const timeoutId = setTimeout(() => {
        const allMoves = getPossibleMoves(board, 'black', dice.remaining);
        
        if (allMoves.length === 0) {
          // No valid moves, end turn
          setCurrentPlayer('white');
          setDice(null);
          return;
        }

        const selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        makeMove(selectedMove);
      }, 800);

      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayer, gameOver, dice, difficulty, board, getPossibleMoves, makeMove]);

  // Auto-roll dice for AI
  useEffect(() => {
    if (currentPlayer === 'black' && !gameOver && !dice && difficulty !== 'learn') {
      const timeoutId = setTimeout(rollDice, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayer, gameOver, dice, difficulty, rollDice]);

  const resetGame = useCallback(() => {
    setBoard(initializeBoard());
    setCurrentPlayer('white');
    setGameOver(false);
    setWinner(null);
    setDice(null);
    setSelectedPoint(null);
    setValidMoves([]);
    setHintMove(null);
    setMoveCount(0);
    setBarPieces({ white: 0, black: 0 });
    setBornOff({ white: 0, black: 0 });
  }, []);

  return {
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
  };
}
