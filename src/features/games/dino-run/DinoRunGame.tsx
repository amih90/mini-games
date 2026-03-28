'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { useTranslations } from 'next-intl';
import { TextDirection } from '@/i18n/routing';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'menu' | 'playing' | 'gameover';
type ObstacleType =
  | 'cactus-small'
  | 'cactus-large'
  | 'cactus-cluster'
  | 'bird'
  | 'rock'
  | 'meteor'
  | 'double-bird';
type PowerUpType = 'shield' | 'slowmo';

interface DinoRunGameProps {
  locale?: string;
}

interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: ObstacleType;
  y: number;
  passed: boolean;
  /** Meteor: frames remaining in warning phase (>0 = still warning) */
  warningTimer?: number;
  /** Meteor: vertical velocity once falling */
  vy?: number;
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
  bobPhase: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  collected: boolean;
  bobPhase: number;
}

interface Cloud {
  x: number;
  y: number;
  r1: number;
  r2: number;
  r3: number;
}

interface DifficultySettings {
  baseSpeed: number;
  maxSpeed: number;
  speedIncrement: number;
  speedInterval: number;
  minObstacleGap: number;
  maxObstacleGap: number;
  birdChanceThreshold: number;
  birdScoreMin: number;
  gravity: number;
  jumpForce: number;
  clusterChance: number;
  rockScoreMin: number;
  meteorScoreMin: number;
  doubleBirdScoreMin: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const GROUND_Y = CANVAS_HEIGHT - 50;
const DINO_WIDTH = 44;
const DINO_HEIGHT = 50;
const COIN_RADIUS = 8;
const POWERUP_SIZE = 22;
const DAY_NIGHT_INTERVAL = 1000;
const SHIELD_DURATION = 300; // frames (~5 s at 60 fps)
const SLOWMO_DURATION = 240; // frames (~4 s)

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    baseSpeed: 4,
    maxSpeed: 9,
    speedIncrement: 0.3,
    speedInterval: 600,
    minObstacleGap: 80,
    maxObstacleGap: 160,
    birdChanceThreshold: 0.9,
    birdScoreMin: 400,
    gravity: 0.7,
    jumpForce: -14,
    clusterChance: 0,
    rockScoreMin: 400,
    meteorScoreMin: 1200,
    doubleBirdScoreMin: 1800,
  },
  medium: {
    baseSpeed: 6,
    maxSpeed: 13,
    speedIncrement: 0.5,
    speedInterval: 500,
    minObstacleGap: 55,
    maxObstacleGap: 120,
    birdChanceThreshold: 0.75,
    birdScoreMin: 200,
    gravity: 0.8,
    jumpForce: -15,
    clusterChance: 0.15,
    rockScoreMin: 300,
    meteorScoreMin: 800,
    doubleBirdScoreMin: 1200,
  },
  hard: {
    baseSpeed: 8,
    maxSpeed: 16,
    speedIncrement: 0.6,
    speedInterval: 400,
    minObstacleGap: 40,
    maxObstacleGap: 90,
    birdChanceThreshold: 0.6,
    birdScoreMin: 100,
    gravity: 0.9,
    jumpForce: -16,
    clusterChance: 0.3,
    rockScoreMin: 200,
    meteorScoreMin: 600,
    doubleBirdScoreMin: 900,
  },
};

const MILESTONE_INTERVAL = 500;

interface DinoColor {
  name: string;
  primary: string;
  dark: string;
}

const DINO_COLORS: DinoColor[] = [
  { name: 'green', primary: '#22c55e', dark: '#16a34a' },
  { name: 'blue', primary: '#3b82f6', dark: '#2563eb' },
  { name: 'red', primary: '#ef4444', dark: '#dc2626' },
  { name: 'purple', primary: '#a855f7', dark: '#9333ea' },
  { name: 'orange', primary: '#f97316', dark: '#ea580c' },
  { name: 'pink', primary: '#ec4899', dark: '#db2777' },
];

const DEFAULT_DINO_COLOR = DINO_COLORS[0];



// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

function drawSky(ctx: CanvasRenderingContext2D, isNight: boolean) {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  if (isNight) {
    skyGradient.addColorStop(0, '#0f172a');
    skyGradient.addColorStop(1, '#1e293b');
  } else {
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F7FA');
  }
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawStars(ctx: CanvasRenderingContext2D, frameCount: number) {
  ctx.fillStyle = '#fff';
  // Deterministic star field
  for (let i = 0; i < 30; i++) {
    const sx = (i * 127 + 13) % CANVAS_WIDTH;
    const sy = (i * 89 + 7) % (GROUND_Y - 20);
    const twinkle = Math.sin(frameCount * 0.05 + i) * 0.5 + 0.5;
    ctx.globalAlpha = 0.3 + twinkle * 0.7;
    ctx.beginPath();
    ctx.arc(sx, sy, 1 + (i % 3 === 0 ? 1 : 0), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGround(ctx: CanvasRenderingContext2D, groundOffset: number, isNight: boolean) {
  ctx.fillStyle = isNight ? '#3b2a1a' : '#8B4513';
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  ctx.fillStyle = isNight ? '#1a4a1a' : '#228B22';
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 5);
  ctx.strokeStyle = isNight ? '#5a3a2a' : '#A0522D';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const lx = ((i * 80 - groundOffset * 0.5) % (CANVAS_WIDTH + 80)) - 40;
    ctx.beginPath();
    ctx.moveTo(lx, GROUND_Y + 15);
    ctx.lineTo(lx + 20, GROUND_Y + 15);
    ctx.stroke();
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, clouds: Cloud[], frameCount: number, isNight: boolean) {
  ctx.fillStyle = isNight ? 'rgba(100,116,139,0.4)' : 'rgba(255,255,255,0.8)';
  for (const cloud of clouds) {
    const cx = ((cloud.x - frameCount * 0.3) % (CANVAS_WIDTH + 200)) - 100;
    ctx.beginPath();
    ctx.arc(cx, cloud.y, cloud.r1, 0, Math.PI * 2);
    ctx.arc(cx + 25, cloud.y - 5, cloud.r2, 0, Math.PI * 2);
    ctx.arc(cx + 50, cloud.y, cloud.r3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDino(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isDucking: boolean,
  isJumping: boolean,
  frame: number,
  primaryColor: string = '#22c55e',
  darkColor: string = '#16a34a',
  shieldActive: boolean = false,
  slowMoActive: boolean = false,
) {
  ctx.save();
  ctx.translate(x, y);

  // Shield glow
  if (shieldActive) {
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.15;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    if (isDucking) {
      ctx.ellipse(DINO_WIDTH / 2 + 5, DINO_HEIGHT / 2 + 10, DINO_WIDTH / 2 + 18, 20, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(DINO_WIDTH / 2, DINO_HEIGHT / 2, DINO_WIDTH / 2 + 12, DINO_HEIGHT / 2 + 8, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  // SlowMo tint
  if (slowMoActive) {
    ctx.globalAlpha = 0.85;
  }

  if (isDucking) {
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(0, DINO_HEIGHT / 2, DINO_WIDTH + 10, DINO_HEIGHT / 2 - 5, 10);
    ctx.fill();
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(DINO_WIDTH + 5, DINO_HEIGHT / 2 + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(DINO_WIDTH + 8, DINO_HEIGHT / 2 + 7, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(DINO_WIDTH + 9, DINO_HEIGHT / 2 + 7, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(5, 15, 30, 35, 8);
    ctx.fill();
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.roundRect(20, 0, 24, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(34, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(35, 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(38, 14);
    ctx.lineTo(44, 14);
    ctx.stroke();
    ctx.fillStyle = darkColor;
    if (isJumping) {
      ctx.fillRect(10, 45, 8, 10);
      ctx.fillRect(25, 45, 8, 10);
    } else {
      const legOffset = frame === 0 ? 0 : 5;
      ctx.fillRect(10, 45 + legOffset, 8, 10 - legOffset);
      ctx.fillRect(25, 45 + (5 - legOffset), 8, 10 - (5 - legOffset));
    }
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(5, 25);
    ctx.lineTo(-10, 20);
    ctx.lineTo(-5, 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darkColor;
    ctx.fillRect(28, 28, 5, 8);
  }

  ctx.restore();
}

function drawCactus(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const bx = obs.x;
  const by = GROUND_Y - obs.height;
  ctx.fillStyle = '#228B22';
  ctx.fillRect(bx, by, obs.width, obs.height);
  ctx.fillRect(bx - 8, by + 15, 10, 8);
  ctx.fillRect(bx + obs.width - 2, by + 10, 10, 8);
  ctx.fillStyle = '#006400';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(bx + obs.width / 2, by - 5 + i * 15);
    ctx.lineTo(bx + obs.width / 2 - 3, by + i * 15);
    ctx.lineTo(bx + obs.width / 2 + 3, by + i * 15);
    ctx.fill();
  }
}

function drawBird(ctx: CanvasRenderingContext2D, obs: Obstacle, frameCount: number) {
  ctx.save();
  ctx.translate(obs.x, obs.y);
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.ellipse(20, 15, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(40, 10, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(48, 10);
  ctx.lineTo(55, 12);
  ctx.lineTo(48, 14);
  ctx.fill();
  ctx.fillStyle = '#818cf8';
  const wingAngle = Math.sin(frameCount * 0.3) * 0.5;
  ctx.save();
  ctx.translate(20, 15);
  ctx.rotate(wingAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-15, -20);
  ctx.lineTo(15, -20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(42, 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(43, 8, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRock(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const rx = obs.x;
  const ry = GROUND_Y - obs.height;
  // Main rock body — wide and low
  ctx.fillStyle = '#78716c';
  ctx.beginPath();
  ctx.moveTo(rx, GROUND_Y);
  ctx.lineTo(rx + 5, ry + 5);
  ctx.lineTo(rx + obs.width * 0.3, ry);
  ctx.lineTo(rx + obs.width * 0.7, ry + 3);
  ctx.lineTo(rx + obs.width - 3, ry + 8);
  ctx.lineTo(rx + obs.width, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#a8a29e';
  ctx.beginPath();
  ctx.moveTo(rx + 8, ry + 8);
  ctx.lineTo(rx + obs.width * 0.35, ry + 3);
  ctx.lineTo(rx + obs.width * 0.55, ry + 6);
  ctx.lineTo(rx + 12, ry + 12);
  ctx.closePath();
  ctx.fill();
  // Cracks
  ctx.strokeStyle = '#57534e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rx + obs.width * 0.4, ry + 5);
  ctx.lineTo(rx + obs.width * 0.5, ry + obs.height * 0.6);
  ctx.stroke();
}

function drawMeteor(ctx: CanvasRenderingContext2D, obs: Obstacle, frameCount: number) {
  if (obs.warningTimer && obs.warningTimer > 0) {
    // Warning phase: flashing "!" at landing position
    const flash = Math.sin(frameCount * 0.4) > 0;
    if (flash) {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠', obs.x + obs.width / 2, GROUND_Y - 10);
      ctx.restore();
      // Red column
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(obs.x, 0, obs.width, GROUND_Y);
      ctx.restore();
    }
    return; // Don't draw the rock yet
  }

  // Falling meteor
  ctx.save();
  ctx.translate(obs.x, obs.y);
  // Fire trail
  ctx.fillStyle = '#f97316';
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 4; i++) {
    const ty = -8 - i * 8 + Math.sin(frameCount * 0.5 + i) * 3;
    const tr = 6 - i;
    ctx.beginPath();
    ctx.arc(obs.width / 2 + Math.sin(i * 2) * 4, ty, tr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Rock body
  ctx.fillStyle = '#78716c';
  ctx.beginPath();
  ctx.ellipse(obs.width / 2, obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#a8a29e';
  ctx.beginPath();
  ctx.arc(obs.width / 2 - 3, obs.height / 2 - 3, 5, 0, Math.PI * 2);
  ctx.fill();
  // Glow
  ctx.fillStyle = '#dc2626';
  ctx.globalAlpha = 0.4 + Math.sin(frameCount * 0.3) * 0.2;
  ctx.beginPath();
  ctx.ellipse(obs.width / 2, obs.height / 2, obs.width / 2 + 4, obs.height / 2 + 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawDoubleBird(ctx: CanvasRenderingContext2D, obs: Obstacle, frameCount: number) {
  // Two birds stacked — one at obs.y, one 30px higher
  const bird1Y = obs.y;
  const bird2Y = obs.y - 35;
  for (const by of [bird1Y, bird2Y]) {
    ctx.save();
    ctx.translate(obs.x, by);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(15, 10, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(30, 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(36, 6);
    ctx.lineTo(42, 8);
    ctx.lineTo(36, 10);
    ctx.fill();
    ctx.fillStyle = '#f87171';
    const wa = Math.sin(frameCount * 0.35 + by * 0.1) * 0.5;
    ctx.save();
    ctx.translate(15, 10);
    ctx.rotate(wa);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12, -16);
    ctx.lineTo(12, -16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(32, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(32.5, 4, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawCoin(ctx: CanvasRenderingContext2D, coin: Coin, frameCount: number) {
  if (coin.collected) return;
  const bobY = coin.y + Math.sin(frameCount * 0.08 + coin.bobPhase) * 5;
  ctx.save();
  ctx.translate(coin.x, bobY);
  // Outer glow
  ctx.fillStyle = 'rgba(251,191,36,0.3)';
  ctx.beginPath();
  ctx.arc(0, 0, COIN_RADIUS + 3, 0, Math.PI * 2);
  ctx.fill();
  // Coin body
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, COIN_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  // Shine
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(-2, -2, COIN_RADIUS * 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Star/dollar mark
  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 0, 0);
  ctx.restore();
}

function drawPowerUpItem(ctx: CanvasRenderingContext2D, pu: PowerUp, frameCount: number) {
  if (pu.collected) return;
  const bobY = pu.y + Math.sin(frameCount * 0.06 + pu.bobPhase) * 4;
  ctx.save();
  ctx.translate(pu.x, bobY);

  if (pu.type === 'shield') {
    // Shield icon — golden badge
    ctx.fillStyle = 'rgba(251,191,36,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, POWERUP_SIZE / 2 + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(0, -POWERUP_SIZE / 2);
    ctx.lineTo(POWERUP_SIZE / 2, -POWERUP_SIZE / 4);
    ctx.lineTo(POWERUP_SIZE / 2, POWERUP_SIZE / 4);
    ctx.lineTo(0, POWERUP_SIZE / 2);
    ctx.lineTo(-POWERUP_SIZE / 2, POWERUP_SIZE / 4);
    ctx.lineTo(-POWERUP_SIZE / 2, -POWERUP_SIZE / 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛡', 0, 0);
  } else {
    // SlowMo icon — blue clock
    ctx.fillStyle = 'rgba(59,130,246,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, POWERUP_SIZE / 2 + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(0, 0, POWERUP_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🕐', 0, 0);
  }

  // Sparkle
  const sparkle = Math.sin(frameCount * 0.15) > 0.5;
  if (sparkle) {
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(POWERUP_SIZE / 2, -POWERUP_SIZE / 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  highScore: number,
  coinCount: number,
  comboCount: number,
  shieldTimer: number,
  slowMoTimer: number,
  tScore: string,
  tHighScore: string,
  tCoins: string,
  tCombo: string,
  tShield: string,
  tSlowMo: string,
  isRtl: boolean,
  isNight: boolean,
) {
  ctx.save();
  ctx.font = 'bold 14px monospace';
  ctx.textBaseline = 'top';

  const textColor = isNight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
  const dimColor = isNight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  if (isRtl) {
    ctx.textAlign = 'left';
    ctx.fillStyle = dimColor;
    ctx.fillText(`${tHighScore}: ${String(highScore).padStart(5, '0')}`, 10, 10);
    ctx.fillStyle = textColor;
    ctx.fillText(`${tScore}: ${String(score).padStart(5, '0')}`, 10, 28);
    // Coins
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🪙 ${tCoins}: ${coinCount}`, 10, 46);
  } else {
    ctx.textAlign = 'right';
    ctx.fillStyle = dimColor;
    ctx.fillText(`${tHighScore}: ${String(highScore).padStart(5, '0')}`, CANVAS_WIDTH - 10, 10);
    ctx.fillStyle = textColor;
    ctx.fillText(`${tScore}: ${String(score).padStart(5, '0')}`, CANVAS_WIDTH - 10, 28);
    // Coins
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🪙 ${tCoins}: ${coinCount}`, CANVAS_WIDTH - 10, 46);
  }

  // Combo display (center top)
  if (comboCount > 1) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`${tCombo}${comboCount}`, CANVAS_WIDTH / 2, 10);
  }

  // Active power-up indicator (center)
  if (shieldTimer > 0) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#fbbf24';
    const secs = Math.ceil(shieldTimer / 60);
    ctx.fillText(`${tShield} ${secs}s`, CANVAS_WIDTH / 2, 30);
  }
  if (slowMoTimer > 0) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#3b82f6';
    const secs = Math.ceil(slowMoTimer / 60);
    ctx.fillText(`${tSlowMo} ${secs}s`, CANVAS_WIDTH / 2, shieldTimer > 0 ? 48 : 30);
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DinoRunGame({ locale = 'en' }: DinoRunGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  const t = useTranslations('dinoRun');
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;

  const {
    playClick,
    playSuccess,
    playLevelUp,
    playGameOver,
    playHit,
    playJump,
    playPowerUp,
    playMatch,
    playWhoosh,
  } = useRetroSounds();

  // ---- React state (triggers re-render) ----
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dino-run-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [showInstructions, setShowInstructions] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('dino-run-instructions-seen');
    }
    return true;
  });
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showMilestone, setShowMilestone] = useState(false);
  const [dinoColor, setDinoColor] = useState<DinoColor>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dino-run-color');
      if (saved) {
        const found = DINO_COLORS.find((c) => c.name === saved);
        if (found) return found;
      }
    }
    return DEFAULT_DINO_COLOR;
  });
  const [coinCount, setCoinCount] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [powerUpLabel, setPowerUpLabel] = useState('');

  // ---- Mutable refs (no re-render) ----
  const dinoRef = useRef({
    x: 80,
    y: GROUND_Y - DINO_HEIGHT,
    vy: 0,
    isJumping: false,
    isDucking: false,
    frame: 0,
  });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const gameSpeedRef = useRef(6);
  const frameCountRef = useRef(0);
  const nextObstacleRef = useRef(100);
  const nextCoinRef = useRef(60);
  const nextPowerUpScoreRef = useRef(1500);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(highScore);
  const lastMilestoneRef = useRef(0);
  const levelRef = useRef(1);
  const groundOffsetRef = useRef(0);
  const cloudsRef = useRef<Cloud[]>([]);
  const settingsRef = useRef<DifficultySettings>(DIFFICULTY_SETTINGS.medium);
  const gameStateRef = useRef<GameState>('menu');
  const dinoColorRef = useRef<DinoColor>(dinoColor);
  const isDuckingKeyHeld = useRef(false);
  const coinCountRef = useRef(0);
  const comboRef = useRef(0);
  const shieldTimerRef = useRef(0);
  const slowMoTimerRef = useRef(0);
  const shakeFramesRef = useRef(0);
  const savedSpeedRef = useRef(0);

  // Keep refs synced
  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Generate randomised clouds
  const generateClouds = useCallback((): Cloud[] => {
    const c: Cloud[] = [];
    for (let i = 0; i < 6; i++) {
      c.push({
        x: Math.random() * (CANVAS_WIDTH + 200),
        y: 30 + Math.random() * 60,
        r1: 20 + Math.random() * 15,
        r2: 15 + Math.random() * 12,
        r3: 20 + Math.random() * 15,
      });
    }
    return c;
  }, []);

  // Spawn obstacle based on difficulty + score thresholds
  const spawnObstacle = useCallback(
    (settings: DifficultySettings, currentScore: number) => {
      const rand = Math.random();
      let type: ObstacleType;

      // Progressive obstacles unlock based on score
      const canRock = currentScore >= settings.rockScoreMin;
      const canMeteor = currentScore >= settings.meteorScoreMin;
      const canDoubleBird = currentScore >= settings.doubleBirdScoreMin;
      const canBird = currentScore > settings.birdScoreMin;
      const canCluster = currentScore > 300;

      // Build weighted selection
      if (canDoubleBird && rand < 0.08) {
        type = 'double-bird';
      } else if (canMeteor && rand < 0.15) {
        type = 'meteor';
      } else if (canBird && rand > settings.birdChanceThreshold) {
        type = 'bird';
      } else if (canRock && rand < 0.18 + (canMeteor ? 0.05 : 0)) {
        type = 'rock';
      } else if (canCluster && rand > 1 - settings.clusterChance) {
        type = 'cactus-cluster';
      } else if (Math.random() > 0.5) {
        type = 'cactus-large';
      } else {
        type = 'cactus-small';
      }

      let width: number;
      let height: number;
      let y: number;
      let warningTimer: number | undefined;
      let vy: number | undefined;

      switch (type) {
        case 'bird':
          width = 40;
          height = 30;
          y = GROUND_Y - DINO_HEIGHT - 10 - Math.random() * 40;
          break;
        case 'double-bird':
          width = 35;
          height = 65; // tall combined hitbox
          y = GROUND_Y - DINO_HEIGHT - 5 - Math.random() * 20;
          break;
        case 'rock':
          width = 55 + Math.random() * 20;
          height = 22 + Math.random() * 8;
          y = GROUND_Y;
          break;
        case 'meteor':
          width = 24;
          height = 24;
          y = -30; // starts above canvas
          warningTimer = 90; // ~1.5 sec warning
          vy = 0;
          break;
        case 'cactus-cluster':
          width = 50 + Math.random() * 15;
          height = 35 + Math.random() * 15;
          y = GROUND_Y;
          break;
        case 'cactus-large':
          width = 25 + Math.random() * 10;
          height = 50 + Math.random() * 15;
          y = GROUND_Y;
          break;
        default: // cactus-small
          width = 18 + Math.random() * 10;
          height = 30 + Math.random() * 15;
          y = GROUND_Y;
          break;
      }

      const xPos = type === 'meteor'
        ? 150 + Math.random() * (CANVAS_WIDTH - 250) // meteor drops within play area
        : CANVAS_WIDTH + 50;

      obstaclesRef.current.push({
        x: xPos,
        width,
        height,
        type,
        y,
        passed: false,
        warningTimer,
        vy,
      });
    },
    []
  );

  // Spawn a coin at a random height
  const spawnCoin = useCallback(() => {
    coinsRef.current.push({
      x: CANVAS_WIDTH + 30,
      y: GROUND_Y - 30 - Math.random() * 60,
      collected: false,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }, []);

  // Spawn a power-up
  const spawnPowerUp = useCallback(() => {
    const type: PowerUpType = Math.random() > 0.5 ? 'shield' : 'slowmo';
    powerUpsRef.current.push({
      x: CANVAS_WIDTH + 30,
      y: GROUND_Y - 50 - Math.random() * 40,
      type,
      collected: false,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }, []);

  // Start / restart game
  const startGame = useCallback(
    (diff: Difficulty) => {
      const settings = DIFFICULTY_SETTINGS[diff];
      settingsRef.current = settings;
      setDifficulty(diff);
      setScore(0);
      scoreRef.current = 0;
      setCurrentLevel(1);
      levelRef.current = 1;
      lastMilestoneRef.current = 0;
      setShowMilestone(false);
      setCoinCount(0);
      coinCountRef.current = 0;
      setComboCount(0);
      comboRef.current = 0;
      setPowerUpLabel('');
      shieldTimerRef.current = 0;
      slowMoTimerRef.current = 0;
      shakeFramesRef.current = 0;
      savedSpeedRef.current = 0;
      nextPowerUpScoreRef.current = 1500;

      dinoRef.current = {
        x: 80,
        y: GROUND_Y - DINO_HEIGHT,
        vy: 0,
        isJumping: false,
        isDucking: false,
        frame: 0,
      };
      obstaclesRef.current = [];
      coinsRef.current = [];
      powerUpsRef.current = [];
      gameSpeedRef.current = settings.baseSpeed;
      frameCountRef.current = 0;
      nextObstacleRef.current = 80;
      nextCoinRef.current = 60;
      groundOffsetRef.current = 0;
      cloudsRef.current = generateClouds();
      isDuckingKeyHeld.current = false;

      playClick();
      setGameState('playing');
    },
    [generateClouds, playClick]
  );

  usePlayAgainKey(gameState === 'gameover', useCallback(() => startGame(difficulty), [startGame, difficulty]));

  // Jump
  const jump = useCallback(() => {
    const dino = dinoRef.current;
    if (gameStateRef.current === 'playing' && !dino.isJumping) {
      dino.vy = settingsRef.current.jumpForce;
      dino.isJumping = true;
      dino.isDucking = false;
      isDuckingKeyHeld.current = false;
      playJump();
    }
  }, [playJump]);

  // Duck
  const setDucking = useCallback((ducking: boolean) => {
    isDuckingKeyHeld.current = ducking;
    if (!dinoRef.current.isJumping) {
      dinoRef.current.isDucking = ducking;
    }
  }, []);

  // Close instructions
  const closeInstructions = useCallback(() => {
    setShowInstructions(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dino-run-instructions-seen', 'true');
    }
  }, []);

  // -----------------------------------------------------------------------
  // Input handlers
  // -----------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (gameStateRef.current === 'playing') jump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        if (gameStateRef.current === 'playing') setDucking(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        setDucking(false);
      }
    };

    const handleCanvasClick = (e: Event) => {
      e.preventDefault();
      if (gameStateRef.current === 'playing') jump();
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (gameStateRef.current === 'playing') jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (canvas) {
      canvas.addEventListener('click', handleCanvasClick);
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('click', handleCanvasClick);
        canvas.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [jump, setDucking]);

  // -----------------------------------------------------------------------
  // Game loop
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const settings = settingsRef.current;

    const loop = () => {
      frameCountRef.current++;
      const fc = frameCountRef.current;
      const dino = dinoRef.current;

      // Determine effective game speed (slowmo halves speed)
      const isSlowMo = slowMoTimerRef.current > 0;
      const effectiveSpeed = isSlowMo ? gameSpeedRef.current * 0.5 : gameSpeedRef.current;

      // Day/night cycle
      const isNight = Math.floor(scoreRef.current / DAY_NIGHT_INTERVAL) % 2 === 1;

      // Physics
      dino.vy += settings.gravity;
      dino.y += dino.vy;
      const dinoH = dino.isDucking ? DINO_HEIGHT / 2 : DINO_HEIGHT;
      if (dino.y >= GROUND_Y - dinoH) {
        dino.y = GROUND_Y - dinoH;
        dino.vy = 0;
        if (dino.isJumping) {
          dino.isJumping = false;
          if (isDuckingKeyHeld.current) dino.isDucking = true;
        }
      }

      // Animation
      if (fc % 6 === 0) dino.frame = (dino.frame + 1) % 2;

      // Ground scroll
      groundOffsetRef.current += effectiveSpeed;

      // ---- Power-up timers ----
      if (shieldTimerRef.current > 0) shieldTimerRef.current--;
      if (slowMoTimerRef.current > 0) {
        slowMoTimerRef.current--;
        if (slowMoTimerRef.current === 0 && savedSpeedRef.current > 0) {
          gameSpeedRef.current = savedSpeedRef.current;
          savedSpeedRef.current = 0;
        }
      }

      // ---- Spawn obstacles ----
      nextObstacleRef.current--;
      if (nextObstacleRef.current <= 0) {
        spawnObstacle(settings, scoreRef.current);
        nextObstacleRef.current =
          settings.minObstacleGap + Math.random() * (settings.maxObstacleGap - settings.minObstacleGap);
      }

      // ---- Spawn coins ----
      nextCoinRef.current--;
      if (nextCoinRef.current <= 0) {
        if (Math.random() < 0.6) {
          spawnCoin();
        }
        nextCoinRef.current = 40 + Math.random() * 60;
      }

      // ---- Spawn power-ups based on score threshold ----
      if (scoreRef.current >= nextPowerUpScoreRef.current) {
        spawnPowerUp();
        nextPowerUpScoreRef.current += 1200 + Math.floor(Math.random() * 800);
      }

      // ---- Move obstacles ----
      obstaclesRef.current = obstaclesRef.current.filter((obs) => {
        if (obs.type === 'meteor') {
          // Meteor: warning phase then fall
          if (obs.warningTimer && obs.warningTimer > 0) {
            obs.warningTimer--;
            if (obs.warningTimer === 0) {
              obs.vy = 3 + effectiveSpeed * 0.3;
              obs.y = -30;
            }
            return true;
          }
          // Falling phase
          obs.y += (obs.vy || 4);
          return obs.y < GROUND_Y + 50;
        }
        obs.x -= effectiveSpeed;
        return obs.x > -100;
      });

      // ---- Move coins ----
      coinsRef.current = coinsRef.current.filter((c) => {
        if (!c.collected) c.x -= effectiveSpeed;
        return c.x > -50 && !c.collected;
      });

      // ---- Move power-ups ----
      powerUpsRef.current = powerUpsRef.current.filter((pu) => {
        if (!pu.collected) pu.x -= effectiveSpeed;
        return pu.x > -50 && !pu.collected;
      });

      // ---------------------------------------------------------------
      // Collision detection
      // ---------------------------------------------------------------
      // FIX: Ducking hitbox no longer drops below ground.
      // Standing: y = dino.y + 5, h = DINO_HEIGHT - 10 = 40
      // Ducking:  y = dino.y + 5, h = DINO_HEIGHT/2 - 10 = 15
      // This means ducking shrinks the hitbox (good for dodging birds)
      // but keeps it at the same vertical start (still collides with cacti/rocks).
      const dinoBox = {
        x: dino.x + (dino.isDucking ? 4 : 8),
        y: dino.y + 5,
        width: dino.isDucking ? DINO_WIDTH + 10 - 8 : DINO_WIDTH - 16,
        height: dinoH - 10,
      };

      let collided = false;
      const hasShield = shieldTimerRef.current > 0;

      for (const obs of obstaclesRef.current) {
        // Skip meteors still in warning phase
        if (obs.type === 'meteor' && obs.warningTimer && obs.warningTimer > 0) continue;

        let obsBox: { x: number; y: number; width: number; height: number };

        if (obs.type === 'bird') {
          obsBox = { x: obs.x + 5, y: obs.y + 3, width: obs.width - 10, height: obs.height - 6 };
        } else if (obs.type === 'double-bird') {
          // Tall combined hitbox covering both birds
          obsBox = { x: obs.x + 3, y: obs.y - 35, width: obs.width - 6, height: obs.height + 25 };
        } else if (obs.type === 'rock') {
          obsBox = { x: obs.x + 4, y: GROUND_Y - obs.height + 2, width: obs.width - 8, height: obs.height - 2 };
        } else if (obs.type === 'meteor') {
          obsBox = { x: obs.x + 2, y: obs.y + 2, width: obs.width - 4, height: obs.height - 4 };
        } else {
          // Cactus variants
          obsBox = { x: obs.x + 3, y: GROUND_Y - obs.height + 3, width: obs.width - 6, height: obs.height - 6 };
        }

        if (
          dinoBox.x < obsBox.x + obsBox.width &&
          dinoBox.x + dinoBox.width > obsBox.x &&
          dinoBox.y < obsBox.y + obsBox.height &&
          dinoBox.y + dinoBox.height > obsBox.y
        ) {
          if (hasShield) {
            // Shield absorbs the hit — remove obstacle
            obs.passed = true;
            obs.x = -200;
            shieldTimerRef.current = 0;
            shakeFramesRef.current = 8;
            playHit();
          } else {
            collided = true;
            break;
          }
        }
      }

      // ---- Coin collection ----
      for (const c of coinsRef.current) {
        if (c.collected) continue;
        const bobY = c.y + Math.sin(fc * 0.08 + c.bobPhase) * 5;
        const dx = dino.x + DINO_WIDTH / 2 - c.x;
        const dy = dino.y + dinoH / 2 - bobY;
        if (Math.sqrt(dx * dx + dy * dy) < COIN_RADIUS + 18) {
          c.collected = true;
          comboRef.current++;
          const bonus = 10 * comboRef.current;
          scoreRef.current += bonus;
          coinCountRef.current++;
          setCoinCount(coinCountRef.current);
          setComboCount(comboRef.current);
          playMatch();
        }
      }

      // ---- Power-up collection ----
      for (const pu of powerUpsRef.current) {
        if (pu.collected) continue;
        const bobY = pu.y + Math.sin(fc * 0.06 + pu.bobPhase) * 4;
        const dx = dino.x + DINO_WIDTH / 2 - pu.x;
        const dy = dino.y + dinoH / 2 - bobY;
        if (Math.sqrt(dx * dx + dy * dy) < POWERUP_SIZE / 2 + 20) {
          pu.collected = true;
          playPowerUp();
          if (pu.type === 'shield') {
            shieldTimerRef.current = SHIELD_DURATION;
            setPowerUpLabel(t('shield'));
          } else {
            slowMoTimerRef.current = SLOWMO_DURATION;
            if (savedSpeedRef.current === 0) {
              savedSpeedRef.current = gameSpeedRef.current;
            }
            setPowerUpLabel(t('slowMo'));
          }
          setTimeout(() => setPowerUpLabel(''), 1500);
        }
      }

      // ---- Game over ----
      if (collided) {
        playHit();
        shakeFramesRef.current = 10;
        setTimeout(() => playGameOver(), 200);
        comboRef.current = 0;
        setComboCount(0);
        const finalScore = scoreRef.current;
        if (finalScore > highScoreRef.current) {
          setHighScore(finalScore);
          localStorage.setItem('dino-run-highscore', String(finalScore));
        }
        setGameState('gameover');
        return;
      }

      // Score
      scoreRef.current++;
      setScore(scoreRef.current);

      // Milestone
      if (
        scoreRef.current > 0 &&
        scoreRef.current % MILESTONE_INTERVAL === 0 &&
        scoreRef.current !== lastMilestoneRef.current
      ) {
        lastMilestoneRef.current = scoreRef.current;
        playSuccess();
        setShowMilestone(true);
        setTimeout(() => setShowMilestone(false), 1500);
      }

      // Speed increase & level
      if (fc % settings.speedInterval === 0) {
        const baseTarget = isSlowMo ? savedSpeedRef.current || gameSpeedRef.current : gameSpeedRef.current;
        const newSpeed = Math.min(baseTarget + settings.speedIncrement, settings.maxSpeed);
        if (isSlowMo && savedSpeedRef.current > 0) {
          savedSpeedRef.current = newSpeed;
        } else {
          gameSpeedRef.current = newSpeed;
        }
        const currentBase = isSlowMo ? savedSpeedRef.current : gameSpeedRef.current;
        const newLevel =
          Math.floor((currentBase - settings.baseSpeed) / (settings.speedIncrement * 2)) + 1;
        if (newLevel > levelRef.current) {
          levelRef.current = newLevel;
          setCurrentLevel(newLevel);
          playLevelUp();
        }
      }

      // ---------------------------------------------------------------
      // Draw
      // ---------------------------------------------------------------
      ctx.save();

      // Screen shake offset
      if (shakeFramesRef.current > 0) {
        const intensity = shakeFramesRef.current;
        ctx.translate(
          (Math.random() - 0.5) * intensity * 1.5,
          (Math.random() - 0.5) * intensity * 1.5,
        );
        shakeFramesRef.current--;
      }

      drawSky(ctx, isNight);
      if (isNight) drawStars(ctx, fc);
      drawClouds(ctx, cloudsRef.current, fc, isNight);
      drawGround(ctx, groundOffsetRef.current, isNight);

      // Draw obstacles
      for (const obs of obstaclesRef.current) {
        switch (obs.type) {
          case 'bird':
            drawBird(ctx, obs, fc);
            break;
          case 'double-bird':
            drawDoubleBird(ctx, obs, fc);
            break;
          case 'rock':
            drawRock(ctx, obs);
            break;
          case 'meteor':
            drawMeteor(ctx, obs, fc);
            break;
          default:
            drawCactus(ctx, obs);
            break;
        }
      }

      // Draw coins
      for (const c of coinsRef.current) {
        drawCoin(ctx, c, fc);
      }

      // Draw power-ups
      for (const pu of powerUpsRef.current) {
        drawPowerUpItem(ctx, pu, fc);
      }

      // Draw dino
      drawDino(
        ctx,
        dino.x,
        dino.y,
        dino.isDucking,
        dino.isJumping,
        dino.frame,
        dinoColorRef.current.primary,
        dinoColorRef.current.dark,
        shieldTimerRef.current > 0,
        slowMoTimerRef.current > 0,
      );

      // SlowMo overlay tint
      if (isSlowMo) {
        ctx.fillStyle = 'rgba(59,130,246,0.08)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      drawHUD(
        ctx,
        scoreRef.current,
        highScoreRef.current,
        coinCountRef.current,
        comboRef.current,
        shieldTimerRef.current,
        slowMoTimerRef.current,
        t('score'),
        t('highScore'),
        t('coins'),
        t('combo'),
        t('shield'),
        t('slowMo'),
        isRtl,
        isNight,
      );

      ctx.restore();

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState, spawnObstacle, spawnCoin, spawnPowerUp, t('score'), t('highScore'), t('coins'), t('combo'), t('shield'), t('slowMo'), isRtl, playHit, playGameOver, playSuccess, playLevelUp, playMatch, playPowerUp, playWhoosh]);

  // -----------------------------------------------------------------------
  // Static screen draw (menu / gameover)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (gameState !== 'menu' && gameState !== 'gameover') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cloudsRef.current.length === 0) {
      cloudsRef.current = [
        { x: 100, y: 40, r1: 25, r2: 20, r3: 25 },
        { x: 350, y: 55, r1: 30, r2: 18, r3: 28 },
        { x: 600, y: 35, r1: 22, r2: 25, r3: 22 },
      ];
    }

    drawSky(ctx, false);
    drawClouds(ctx, cloudsRef.current, 0, false);
    drawGround(ctx, 0, false);
    drawDino(ctx, 80, GROUND_Y - DINO_HEIGHT, false, false, 0, dinoColorRef.current.primary, dinoColorRef.current.dark);
  }, [gameState, dinoColor]);

  // -----------------------------------------------------------------------
  // Difficulty selector handler
  // -----------------------------------------------------------------------
  const handleSelectDifficulty = useCallback(
    (diff: Difficulty) => {
      playClick();
      startGame(diff);
    },
    [startGame, playClick]
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <GameWrapper title={t('title')} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="flex flex-col items-center gap-4" dir={direction}>
        {/* Score + Level + Coins bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
          <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
            <div className="text-sm text-slate-500 font-medium">{t('score')}</div>
            <div className="text-2xl font-bold text-[#22c55e] font-mono">
              {String(score).padStart(5, '0')}
            </div>
          </div>
          <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
            <div className="text-sm text-slate-500 font-medium">{t('highScore')}</div>
            <div className="text-2xl font-bold text-[#f97316] font-mono">
              {String(highScore).padStart(5, '0')}
            </div>
          </div>
          <div className="bg-white/90 rounded-2xl px-5 py-2 shadow-lg text-center">
            <div className="text-sm text-slate-500 font-medium">🪙 {t('coins')}</div>
            <div className="text-2xl font-bold text-[#fbbf24] font-mono">{coinCount}</div>
          </div>
          {gameState === 'playing' && (
            <LevelDisplay level={currentLevel} />
          )}
        </div>

        {/* Canvas */}
        <div className="relative w-full max-w-[800px]">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-xl shadow-2xl border-4 border-[#22c55e]/30 cursor-pointer w-full"
            style={{ touchAction: 'none' }}
          />

          {/* Milestone toast */}
          <AnimatePresence>
            {showMilestone && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-yellow-400 text-slate-900 font-bold rounded-full shadow-lg text-lg"
              >
                {t('milestone')}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Power-up pickup toast */}
          <AnimatePresence>
            {powerUpLabel && gameState === 'playing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute top-12 left-1/2 -translate-x-1/2 px-5 py-2 bg-white/95 text-slate-800 font-bold rounded-full shadow-lg text-base"
              >
                {powerUpLabel}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Combo indicator */}
          <AnimatePresence>
            {comboCount > 1 && gameState === 'playing' && (
              <motion.div
                key={comboCount}
                initial={{ opacity: 0, scale: 1.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400/90 text-slate-900 font-bold rounded-full shadow text-sm"
              >
                {t('combo')}{comboCount} 🔥
              </motion.div>
            )}
          </AnimatePresence>

          {/* Menu overlay — difficulty selector */}
          <AnimatePresence>
            {gameState === 'menu' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl"
              >
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="text-5xl mb-3"
                >
                  🦖
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{t('title')}</h2>

                <p className="text-white/70 text-xs mb-1">{t('pickColor')}</p>
                <div className="flex gap-2 mb-3">
                  {DINO_COLORS.map((c) => (
                    <motion.button
                      key={c.name}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setDinoColor(c);
                        dinoColorRef.current = c;
                        localStorage.setItem('dino-run-color', c.name);
                        playClick();
                      }}
                      className="w-8 h-8 rounded-full transition-all min-h-[32px] min-w-[32px]"
                      style={{
                        backgroundColor: c.primary,
                        boxShadow: dinoColor.name === c.name ? `0 0 0 3px white, 0 0 0 5px ${c.primary}` : 'none',
                      }}
                      aria-label={c.name}
                    />
                  ))}
                </div>

                <p className="text-white/80 text-sm mb-4">{t('selectDifficulty')}</p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectDifficulty('easy')}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full shadow-lg min-h-[48px] min-w-[48px] flex flex-col items-center"
                  >
                    <span className="text-base">{t('easy')}</span>
                    <span className="text-xs font-normal opacity-80">{t('easyDesc')}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectDifficulty('medium')}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-full shadow-lg min-h-[48px] min-w-[48px] flex flex-col items-center"
                  >
                    <span className="text-base">{t('medium')}</span>
                    <span className="text-xs font-normal opacity-80">{t('mediumDesc')}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectDifficulty('hard')}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full shadow-lg min-h-[48px] min-w-[48px] flex flex-col items-center"
                  >
                    <span className="text-base">{t('hard')}</span>
                    <span className="text-xs font-normal opacity-80">{t('hardDesc')}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over overlay */}
          <AnimatePresence>
            {gameState === 'gameover' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl"
              >
                <div className="bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl max-w-xs w-full mx-4">
                  <div className="text-5xl mb-3">💥</div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('gameOver')}</h2>
                  <div className="text-4xl font-bold mb-1 font-mono" style={{ color: dinoColor.primary }}>{score}</div>
                  {score >= highScore && score > 0 && (
                    <div className="text-base text-[#f97316] font-bold mb-2">{t('newHighScore')}</div>
                  )}
                  <div className="text-sm text-slate-600 mb-3">
                    🪙 {t('coins')}: {coinCount}
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startGame(difficulty)}
                      className="px-8 py-3 text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                      style={{ backgroundColor: dinoColor.primary }}
                    >
                      {t('playAgain')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        playClick();
                        setGameState('menu');
                      }}
                      className="px-8 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-full shadow min-h-[48px]"
                    >
                      {t('selectDifficulty')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* On-screen mobile control buttons */}
        {gameState === 'playing' && (
          <div className="flex gap-6 sm:hidden">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onTouchStart={(e) => {
                e.preventDefault();
                jump();
              }}
              className="px-8 py-4 bg-[#22c55e] hover:bg-[#16a34a] text-white text-lg font-bold rounded-2xl shadow-lg min-h-[56px] min-w-[56px] active:bg-[#16a34a] select-none"
            >
              ⬆️ {t('jumpBtn')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onTouchStart={(e) => {
                e.preventDefault();
                setDucking(true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setDucking(false);
              }}
              className="px-8 py-4 bg-[#f97316] hover:bg-[#ea580c] text-white text-lg font-bold rounded-2xl shadow-lg min-h-[56px] min-w-[56px] active:bg-[#ea580c] select-none"
            >
              ⬇️ {t('duckBtn')}
            </motion.button>
          </div>
        )}

        {/* Control hints */}
        <div className="flex flex-wrap justify-center gap-2 text-slate-600 text-sm">
          <span className="px-3 py-1 bg-white/80 rounded-full">🖱️ Click = {t('jumpBtn')}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full">Space/↑/W = {t('jumpBtn')}</span>
          <span className="px-3 py-1 bg-white/80 rounded-full">↓/S = {t('duckBtn')}</span>
        </div>
      </div>

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={closeInstructions}
        title={t('title')}
        instructions={[
          { icon: t('instructions.step0Icon'), title: t('instructions.step0Title'), description: t('instructions.step0Desc') },
          { icon: t('instructions.step1Icon'), title: t('instructions.step1Title'), description: t('instructions.step1Desc') },
          { icon: t('instructions.step2Icon'), title: t('instructions.step2Title'), description: t('instructions.step2Desc') },
          { icon: t('instructions.step3Icon'), title: t('instructions.step3Title'), description: t('instructions.step3Desc') },
          { icon: t('instructions.step4Icon'), title: t('instructions.step4Title'), description: t('instructions.step4Desc') },
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
