/**
 * Pure backgammon game logic — no Phaser or UI dependencies.
 * Used by Phaser scenes for move validation, AI, board state, etc.
 */

export type Player = 'white' | 'black';

export interface Point {
  checkers: number; // positive = white, negative = black
}

export interface DiceRoll {
  die1: number;
  die2: number;
  remaining: number[];
}

export interface Move {
  from: number; // -1 = from bar
  to: number;   // -2 = bear off
  die: number;
}

export interface BoardState {
  points: Point[];
  bar: { white: number; black: number };
  bornOff: { white: number; black: number };
  currentPlayer: Player;
  dice: DiceRoll | null;
  moveCount: number;
  gameOver: boolean;
  winner: Player | null;
}

/* ------------------------------------------------------------------ */
/*  Initial board                                                     */
/* ------------------------------------------------------------------ */

export function createInitialBoard(): BoardState {
  const points: Point[] = Array.from({ length: 24 }, () => ({ checkers: 0 }));

  // Standard backgammon setup
  points[0].checkers = 2;    // 2 white
  points[5].checkers = -5;   // 5 black
  points[7].checkers = -3;   // 3 black
  points[11].checkers = 5;   // 5 white
  points[12].checkers = -5;  // 5 black
  points[16].checkers = 3;   // 3 white
  points[18].checkers = 5;   // 5 white
  points[23].checkers = -2;  // 2 black

  return {
    points,
    bar: { white: 0, black: 0 },
    bornOff: { white: 0, black: 0 },
    currentPlayer: 'white',
    dice: null,
    moveCount: 0,
    gameOver: false,
    winner: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Dice                                                              */
/* ------------------------------------------------------------------ */

export function rollDice(): DiceRoll {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const remaining = die1 === die2 ? [die1, die1, die1, die1] : [die1, die2];
  return { die1, die2, remaining };
}

/* ------------------------------------------------------------------ */
/*  Move validation                                                   */
/* ------------------------------------------------------------------ */

export function canMove(
  state: BoardState,
  from: number,
  die: number,
  player: Player,
): boolean {
  const { points, bar } = state;

  // Must enter from bar first
  if (player === 'white' && bar.white > 0 && from !== -1) return false;
  if (player === 'black' && bar.black > 0 && from !== -1) return false;

  const direction = player === 'white' ? 1 : -1;
  const to = from === -1
    ? (player === 'white' ? die - 1 : 24 - die)
    : from + die * direction;

  // Bearing off
  if (to < 0 || to > 23) {
    if (player === 'white' && to >= 24) {
      const allHome = points.slice(0, 18).every(p => p.checkers <= 0) && bar.white === 0;
      return allHome && from >= 0 && points[from].checkers > 0;
    }
    if (player === 'black' && to < 0) {
      const allHome = points.slice(6).every(p => p.checkers >= 0) && bar.black === 0;
      return allHome && from >= 0 && points[from].checkers < 0;
    }
    return false;
  }

  // Blocked?
  if (player === 'white' && points[to].checkers < -1) return false;
  if (player === 'black' && points[to].checkers > 1) return false;

  // Has checker at source?
  if (from === -1) return true; // entering from bar
  if (player === 'white' && points[from].checkers <= 0) return false;
  if (player === 'black' && points[from].checkers >= 0) return false;

  return true;
}

export function getPossibleMoves(state: BoardState, player: Player): Move[] {
  const { points, bar, dice } = state;
  if (!dice) return [];

  const moves: Move[] = [];

  // Must enter from bar first
  if ((player === 'white' && bar.white > 0) || (player === 'black' && bar.black > 0)) {
    for (const die of new Set(dice.remaining)) {
      if (canMove(state, -1, die, player)) {
        const to = player === 'white' ? die - 1 : 24 - die;
        moves.push({ from: -1, to, die });
      }
    }
    return moves;
  }

  // Regular moves
  for (let from = 0; from < 24; from++) {
    const hasChecker =
      (player === 'white' && points[from].checkers > 0) ||
      (player === 'black' && points[from].checkers < 0);

    if (!hasChecker) continue;

    for (const die of new Set(dice.remaining)) {
      if (canMove(state, from, die, player)) {
        const direction = player === 'white' ? 1 : -1;
        const to = from + die * direction;
        moves.push({ from, to: to < 0 || to > 23 ? -2 : to, die });
      }
    }
  }

  return moves;
}

/* ------------------------------------------------------------------ */
/*  Apply a move (returns new state — immutable)                      */
/* ------------------------------------------------------------------ */

export function applyMove(state: BoardState, move: Move): BoardState {
  const points = state.points.map(p => ({ ...p }));
  const bar = { ...state.bar };
  const bornOff = { ...state.bornOff };
  const dice = state.dice ? { ...state.dice, remaining: [...state.dice.remaining] } : null;
  const player = state.currentPlayer;
  let gameOver = state.gameOver;
  let winner = state.winner;

  // Remove from source
  if (move.from === -1) {
    bar[player]--;
  } else {
    points[move.from].checkers += player === 'white' ? -1 : 1;
  }

  // Place at destination
  if (move.to === -2) {
    bornOff[player]++;
    if (bornOff[player] === 15) {
      gameOver = true;
      winner = player;
    }
  } else {
    // Hit?
    if (player === 'white' && points[move.to].checkers === -1) {
      points[move.to].checkers = 0;
      bar.black++;
    } else if (player === 'black' && points[move.to].checkers === 1) {
      points[move.to].checkers = 0;
      bar.white++;
    }
    points[move.to].checkers += player === 'white' ? 1 : -1;
  }

  // Consume die
  if (dice) {
    const idx = dice.remaining.indexOf(move.die);
    if (idx !== -1) dice.remaining.splice(idx, 1);
  }

  // Switch player if no remaining dice
  let currentPlayer = state.currentPlayer;
  if (dice && dice.remaining.length === 0) {
    currentPlayer = player === 'white' ? 'black' : 'white';
  }

  return {
    points,
    bar,
    bornOff,
    currentPlayer,
    dice: dice && dice.remaining.length > 0 ? dice : null,
    moveCount: state.moveCount + 1,
    gameOver,
    winner,
  };
}

/* ------------------------------------------------------------------ */
/*  AI: pick a move (simple random / greedy)                          */
/* ------------------------------------------------------------------ */

export function pickAIMove(state: BoardState): Move | null {
  const moves = getPossibleMoves(state, state.currentPlayer);
  if (moves.length === 0) return null;

  // Prefer hits, then forward progress
  const hits = moves.filter(m => {
    if (m.to < 0 || m.to > 23) return false;
    const target = state.points[m.to].checkers;
    return state.currentPlayer === 'black' ? target === 1 : target === -1;
  });

  if (hits.length > 0) return hits[Math.floor(Math.random() * hits.length)];

  // Prefer bearing off
  const bearOffs = moves.filter(m => m.to === -2);
  if (bearOffs.length > 0) return bearOffs[Math.floor(Math.random() * bearOffs.length)];

  return moves[Math.floor(Math.random() * moves.length)];
}
