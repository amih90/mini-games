import { useRef, useCallback } from 'react';
import { clamp } from '../shared/phaser/gameUtils';

// ─── Types ───────────────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultySettings {
  ballSpeed: number;
  ballSpeedIncrement: number;
  aiSpeed: number;
  aiError: number;
  paddleWidth: number;
  winScore: number;
}

export interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface GameState {
  playerScore: number;
  aiScore: number;
  ballState: BallState;
  playerX: number;
  aiX: number;
  serving: 'player' | 'ai';
  rallyCount: number;
}

// ─── Constants ───────────────────────────────────────────────
const TABLE_WIDTH = 6;
const TABLE_DEPTH = 10;
const TABLE_Y = 0.5;
const BALL_RADIUS = 0.15;
const PADDLE_DEPTH = 0.3;
const PLAYER_Z = TABLE_DEPTH / 2 - 0.3;
const AI_Z = -(TABLE_DEPTH / 2 - 0.3);
const WALL_X = TABLE_WIDTH / 2 - 0.2;

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    ballSpeed: 6,
    ballSpeedIncrement: 0.3,
    aiSpeed: 3.5,
    aiError: 0.8,
    paddleWidth: 1.8,
    winScore: 5,
  },
  medium: {
    ballSpeed: 8,
    ballSpeedIncrement: 0.4,
    aiSpeed: 5.5,
    aiError: 0.4,
    paddleWidth: 1.4,
    winScore: 7,
  },
  hard: {
    ballSpeed: 11,
    ballSpeedIncrement: 0.5,
    aiSpeed: 8,
    aiError: 0.15,
    paddleWidth: 1.0,
    winScore: 11,
  },
};

export const GAME_CONSTANTS = {
  TABLE_WIDTH,
  TABLE_DEPTH,
  TABLE_Y,
  BALL_RADIUS,
  PADDLE_DEPTH,
  PLAYER_Z,
  AI_Z,
  WALL_X,
};

// ─── Hook ────────────────────────────────────────────────────
export function usePingPongGame(difficulty: Difficulty) {
  const settings = DIFFICULTY_SETTINGS[difficulty];

  const gameState = useRef<GameState>({
    playerScore: 0,
    aiScore: 0,
    ballState: { x: 0, y: TABLE_Y + 0.5, z: 0, vx: 0, vy: 0, vz: 0 },
    playerX: 0,
    aiX: 0,
    serving: 'player',
    rallyCount: 0,
  });

  const aiTargetOffset = useRef(0);
  const lastAiUpdate = useRef(0);

  const resetBall = useCallback((server: 'player' | 'ai') => {
    const speed = settings.ballSpeed;
    const angle = (Math.random() - 0.5) * 0.6;
    const dir = server === 'player' ? -1 : 1;

    gameState.current.ballState = {
      x: 0,
      y: TABLE_Y + 0.5,
      z: dir * 2,
      vx: Math.sin(angle) * speed * 0.3,
      vy: 0,
      vz: -dir * speed,
    };
    gameState.current.serving = server;
    gameState.current.rallyCount = 0;
  }, [settings.ballSpeed]);

  const resetGame = useCallback(() => {
    gameState.current.playerScore = 0;
    gameState.current.aiScore = 0;
    gameState.current.aiX = 0;
    gameState.current.playerX = 0;
    resetBall('player');
  }, [resetBall]);

  const update = useCallback((
    delta: number,
    playerTargetX: number,
    onPlayerScore: () => void,
    onAiScore: () => void,
    onHit: () => void,
  ) => {
    const state = gameState.current;
    const ball = state.ballState;
    const speedMult = 1 + state.rallyCount * 0.02;

    // ── Move ball ──
    ball.x += ball.vx * delta * speedMult;
    ball.z += ball.vz * delta * speedMult;
    ball.y += ball.vy * delta;

    // Gravity towards table surface
    if (ball.y > TABLE_Y + BALL_RADIUS) {
      ball.vy -= 9.8 * delta;
    } else {
      ball.y = TABLE_Y + BALL_RADIUS;
      ball.vy = Math.abs(ball.vy) * 0.5;
      if (Math.abs(ball.vy) < 0.5) ball.vy = 0;
    }

    // ── Wall bounce (X) ──
    if (ball.x > WALL_X) {
      ball.x = WALL_X;
      ball.vx = -Math.abs(ball.vx);
    } else if (ball.x < -WALL_X) {
      ball.x = -WALL_X;
      ball.vx = Math.abs(ball.vx);
    }

    // ── Player paddle (near, +Z) ──
    const halfPaddle = settings.paddleWidth / 2;
    state.playerX = clamp(playerTargetX, -WALL_X + halfPaddle, WALL_X - halfPaddle);

    if (
      ball.vz > 0 &&
      ball.z >= PLAYER_Z - PADDLE_DEPTH &&
      ball.z <= PLAYER_Z + PADDLE_DEPTH &&
      ball.x >= state.playerX - halfPaddle &&
      ball.x <= state.playerX + halfPaddle
    ) {
      const hitPos = (ball.x - state.playerX) / halfPaddle;
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vz * ball.vz) + settings.ballSpeedIncrement;
      ball.vz = -Math.abs(Math.cos(hitPos * 0.7) * speed);
      ball.vx = Math.sin(hitPos * 0.7) * speed;
      ball.vy = 2;
      ball.z = PLAYER_Z - PADDLE_DEPTH - 0.01;
      state.rallyCount++;
      onHit();
    }

    // ── AI Paddle (far, -Z) ──
    // Update AI target with some randomness
    const now = performance.now();
    if (now - lastAiUpdate.current > 200) {
      aiTargetOffset.current = (Math.random() - 0.5) * settings.aiError * 2;
      lastAiUpdate.current = now;
    }

    const aiTarget = ball.vz < 0
      ? ball.x + aiTargetOffset.current
      : 0;
    const aiDiff = aiTarget - state.aiX;
    const aiMove = clamp(aiDiff, -settings.aiSpeed * delta, settings.aiSpeed * delta);
    state.aiX = clamp(state.aiX + aiMove, -WALL_X + halfPaddle, WALL_X - halfPaddle);

    if (
      ball.vz < 0 &&
      ball.z <= AI_Z + PADDLE_DEPTH &&
      ball.z >= AI_Z - PADDLE_DEPTH &&
      ball.x >= state.aiX - halfPaddle &&
      ball.x <= state.aiX + halfPaddle
    ) {
      const hitPos = (ball.x - state.aiX) / halfPaddle;
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vz * ball.vz) + settings.ballSpeedIncrement;
      ball.vz = Math.abs(Math.cos(hitPos * 0.7) * speed);
      ball.vx = Math.sin(hitPos * 0.7) * speed;
      ball.vy = 2;
      ball.z = AI_Z + PADDLE_DEPTH + 0.01;
      state.rallyCount++;
      onHit();
    }

    // ── Scoring ──
    if (ball.z > PLAYER_Z + 2) {
      state.aiScore++;
      onAiScore();
      resetBall('player');
    } else if (ball.z < AI_Z - 2) {
      state.playerScore++;
      onPlayerScore();
      resetBall('ai');
    }

    return { ...state, ballState: { ...ball } };
  }, [settings, resetBall]);

  const isGameOver = useCallback(() => {
    const s = gameState.current;
    return s.playerScore >= settings.winScore || s.aiScore >= settings.winScore;
  }, [settings.winScore]);

  const getWinner = useCallback(() => {
    const s = gameState.current;
    if (s.playerScore >= settings.winScore) return 'player' as const;
    if (s.aiScore >= settings.winScore) return 'ai' as const;
    return null;
  }, [settings.winScore]);

  return {
    gameState,
    settings,
    resetBall,
    resetGame,
    update,
    isGameOver,
    getWinner,
  };
}
