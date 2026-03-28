'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { useTranslations } from 'next-intl';
import { TextDirection } from '@/i18n/routing';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const GRID_SIZE = 40;
const COLS = CANVAS_WIDTH / GRID_SIZE; // 16
const ROWS = CANVAS_HEIGHT / GRID_SIZE; // 12

// ---------------------------------------------------------------------------
// Difficulty types & settings
// ---------------------------------------------------------------------------
type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultySettings {
  startingGold: number;
  startingLives: number;
  enemyHpMultiplier: number;
  enemySpeedMultiplier: number;
  goldPerKill: number;
  enemiesPerWave: number;
  wavesToWin: number;
  spawnBosses: boolean;
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    startingGold: 200,
    startingLives: 20,
    enemyHpMultiplier: 0.7,
    enemySpeedMultiplier: 0.8,
    goldPerKill: 15,
    enemiesPerWave: 4,
    wavesToWin: 5,
    spawnBosses: false,
  },
  medium: {
    startingGold: 150,
    startingLives: 10,
    enemyHpMultiplier: 1,
    enemySpeedMultiplier: 1,
    goldPerKill: 10,
    enemiesPerWave: 6,
    wavesToWin: 8,
    spawnBosses: false,
  },
  hard: {
    startingGold: 100,
    startingLives: 5,
    enemyHpMultiplier: 1.5,
    enemySpeedMultiplier: 1.3,
    goldPerKill: 8,
    enemiesPerWave: 8,
    wavesToWin: 12,
    spawnBosses: true,
  },
};

// ---------------------------------------------------------------------------
// Tower types
// ---------------------------------------------------------------------------
type TowerType = 'basic' | 'sniper' | 'splash';

interface TowerConfig {
  cost: number;
  range: number;
  damage: number;
  fireRate: number;
  color: string;
  emoji: string;
}

const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  basic: { cost: 25, range: 100, damage: 10, fireRate: 60, color: '#4ade80', emoji: '🗼' },
  sniper: { cost: 50, range: 180, damage: 30, fireRate: 120, color: '#60a5fa', emoji: '🎯' },
  splash: { cost: 40, range: 80, damage: 15, fireRate: 90, color: '#f97316', emoji: '💥' },
};

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------
interface Tower {
  x: number;
  y: number;
  type: TowerType;
  cooldown: number;
}

interface Enemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  pathIndex: number;
  type: 'normal' | 'fast' | 'tank' | 'boss';
  color: string;
}

interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  damage: number;
  speed: number;
  splash: boolean;
}

type GameState = 'chooseDifficulty' | 'idle' | 'playing' | 'won' | 'lost';

// ---------------------------------------------------------------------------
// Path through the map (grid coords)
// ---------------------------------------------------------------------------
const PATH: [number, number][] = [
  [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [4, 4], [4, 3], [4, 2],
  [5, 2], [6, 2], [7, 2], [8, 2], [8, 3], [8, 4], [8, 6], [8, 7],
  [8, 8], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [12, 8], [12, 7],
  [12, 6], [12, 5], [12, 4], [13, 4], [14, 4], [15, 4],
];

const PATH_SET = new Set(PATH.map(([c, r]) => `${c},${r}`));



// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------
interface TowerDefenseGameProps {
  locale?: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function TowerDefenseGame({ locale = 'en' }: TowerDefenseGameProps) {
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const t = useTranslations('towerDefense');

  // Sounds
  const { playClick, playSuccess, playLevelUp, playGameOver, playHit, playShoot } = useRetroSounds();

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const towersRef = useRef<Tower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);

  // Game state
  const [gameState, setGameState] = useState<GameState>('chooseDifficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState(0);
  const [gold, setGold] = useState(150);
  const [lives, setLives] = useState(10);
  const [wave, setWave] = useState(0);
  const [selectedTower, setSelectedTower] = useState<TowerType>('basic');
  const [showInstructions, setShowInstructions] = useState(false);
  const [message, setMessage] = useState('');

  // High score
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tower-defense-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Mutable refs for values accessed inside game loop
  const goldRef = useRef(gold);
  const livesRef = useRef(lives);
  const scoreRef = useRef(score);
  const waveRef = useRef(wave);
  const gameStateRef = useRef(gameState);
  const difficultyRef = useRef(difficulty);

  useEffect(() => { goldRef.current = gold; }, [gold]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { waveRef.current = wave; }, [wave]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  // ---------------------------------------------------------------------------
  // Save high score
  // ---------------------------------------------------------------------------
  const saveHighScore = useCallback((newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('tower-defense-highscore', String(newScore));
    }
  }, [highScore]);

  // ---------------------------------------------------------------------------
  // Spawn a wave of enemies
  // ---------------------------------------------------------------------------
  const spawnWave = useCallback((waveNum: number) => {
    const settings = DIFFICULTY_SETTINGS[difficultyRef.current];
    const count = settings.enemiesPerWave + Math.floor(waveNum * 0.5);
    const newEnemies: Enemy[] = [];

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let type: Enemy['type'] = 'normal';
      let hpBase = 30 + waveNum * 10;
      let speed = 1;
      let color = '#ef4444';

      if (rand > 0.8) {
        type = 'fast';
        hpBase = 20 + waveNum * 5;
        speed = 1.8;
        color = '#facc15';
      } else if (rand > 0.6) {
        type = 'tank';
        hpBase = 60 + waveNum * 15;
        speed = 0.6;
        color = '#a855f7';
      }

      // Boss on hard mode every 3rd wave
      if (settings.spawnBosses && waveNum % 3 === 0 && i === 0) {
        type = 'boss';
        hpBase = 150 + waveNum * 30;
        speed = 0.5;
        color = '#dc2626';
      }

      const hp = Math.round(hpBase * settings.enemyHpMultiplier);
      const finalSpeed = speed * settings.enemySpeedMultiplier;

      newEnemies.push({
        x: PATH[0][0] * GRID_SIZE + GRID_SIZE / 2,
        y: PATH[0][1] * GRID_SIZE + GRID_SIZE / 2,
        hp,
        maxHp: hp,
        speed: finalSpeed,
        pathIndex: 0,
        type,
        color,
      });
      // Stagger spawns by offsetting x
      newEnemies[newEnemies.length - 1].x -= i * 50;
    }

    enemiesRef.current = [...enemiesRef.current, ...newEnemies];
  }, []);

  // ---------------------------------------------------------------------------
  // Start the wave
  // ---------------------------------------------------------------------------
  const startWave = useCallback(() => {
    if (gameStateRef.current !== 'playing' && gameStateRef.current !== 'idle') return;
    const nextWave = waveRef.current + 1;
    setWave(nextWave);
    setGameState('playing');
    playLevelUp();
    spawnWave(nextWave);

    const settings = DIFFICULTY_SETTINGS[difficultyRef.current];
    if (settings.spawnBosses && nextWave % 3 === 0) {
      setMessage(t('bossWarning'));
    } else {
      setMessage(t('waveComing'));
    }
    setTimeout(() => setMessage(''), 2000);
  }, [playLevelUp, spawnWave, t]);

  // ---------------------------------------------------------------------------
  // Place tower on canvas click
  // ---------------------------------------------------------------------------
  const handleCanvasClick = useCallback((e: MouseEvent) => {
    if (gameStateRef.current !== 'playing' && gameStateRef.current !== 'idle') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const col = Math.floor(mx / GRID_SIZE);
    const row = Math.floor(my / GRID_SIZE);

    // Cannot place on path
    if (PATH_SET.has(`${col},${row}`)) {
      setMessage(t('blocked'));
      setTimeout(() => setMessage(''), 1500);
      return;
    }
    // Cannot place on existing tower
    if (towersRef.current.some(tw => tw.x === col && tw.y === row)) {
      setMessage(t('blocked'));
      setTimeout(() => setMessage(''), 1500);
      return;
    }

    const config = TOWER_CONFIGS[selectedTower];
    if (goldRef.current < config.cost) {
      setMessage(t('noGold'));
      setTimeout(() => setMessage(''), 1500);
      return;
    }

    towersRef.current.push({ x: col, y: row, type: selectedTower, cooldown: 0 });
    setGold(prev => prev - config.cost);
    playClick();
  }, [selectedTower, playClick, t]);

  // ---------------------------------------------------------------------------
  // Keyboard controls
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '1') { setSelectedTower('basic'); playClick(); }
      else if (e.key === '2') { setSelectedTower('sniper'); playClick(); }
      else if (e.key === '3') { setSelectedTower('splash'); playClick(); }
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (gameStateRef.current === 'idle' || gameStateRef.current === 'playing') {
          startWave();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playClick, startWave]);

  // ---------------------------------------------------------------------------
  // Canvas click handler
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('click', handleCanvasClick);
    return () => { canvas.removeEventListener('click', handleCanvasClick); };
  }, [handleCanvasClick]);

  // ---------------------------------------------------------------------------
  // Main game loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'idle') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      // --- UPDATE ---
      const settings = DIFFICULTY_SETTINGS[difficultyRef.current];

      // Move enemies along path
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const en = enemiesRef.current[i];
        if (en.pathIndex >= PATH.length - 1) {
          // Enemy reached end
          enemiesRef.current.splice(i, 1);
          setLives(prev => {
            const next = prev - (en.type === 'boss' ? 3 : 1);
            if (next <= 0) {
              setGameState('lost');
              playGameOver();
              saveHighScore(scoreRef.current);
            }
            return Math.max(0, next);
          });
          continue;
        }

        const target = PATH[en.pathIndex + 1];
        const tx = target[0] * GRID_SIZE + GRID_SIZE / 2;
        const ty = target[1] * GRID_SIZE + GRID_SIZE / 2;
        const dx = tx - en.x;
        const dy = ty - en.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < en.speed * 2) {
          en.pathIndex++;
          en.x = tx;
          en.y = ty;
        } else {
          en.x += (dx / dist) * en.speed;
          en.y += (dy / dist) * en.speed;
        }
      }

      // Towers fire projectiles
      for (const tower of towersRef.current) {
        if (tower.cooldown > 0) { tower.cooldown--; continue; }
        const cfg = TOWER_CONFIGS[tower.type];
        const tcx = tower.x * GRID_SIZE + GRID_SIZE / 2;
        const tcy = tower.y * GRID_SIZE + GRID_SIZE / 2;

        let closest: Enemy | null = null;
        let closestDist = Infinity;
        for (const en of enemiesRef.current) {
          const d = Math.sqrt((en.x - tcx) ** 2 + (en.y - tcy) ** 2);
          if (d < cfg.range && d < closestDist) {
            closest = en;
            closestDist = d;
          }
        }

        if (closest) {
          projectilesRef.current.push({
            x: tcx,
            y: tcy,
            targetX: closest.x,
            targetY: closest.y,
            damage: cfg.damage,
            speed: 5,
            splash: tower.type === 'splash',
          });
          tower.cooldown = cfg.fireRate;
          playShoot();
        }
      }

      // Move projectiles
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const p = projectilesRef.current[i];
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < p.speed * 2) {
          // Hit
          if (p.splash) {
            // Splash damage
            for (const en of enemiesRef.current) {
              const d = Math.sqrt((en.x - p.targetX) ** 2 + (en.y - p.targetY) ** 2);
              if (d < GRID_SIZE * 1.5) {
                en.hp -= p.damage;
              }
            }
          } else {
            // Single target
            let hitEnemy: Enemy | null = null;
            let hitDist = Infinity;
            for (const en of enemiesRef.current) {
              const d = Math.sqrt((en.x - p.targetX) ** 2 + (en.y - p.targetY) ** 2);
              if (d < GRID_SIZE && d < hitDist) {
                hitEnemy = en;
                hitDist = d;
              }
            }
            if (hitEnemy) {
              hitEnemy.hp -= p.damage;
              playHit();
            }
          }
          projectilesRef.current.splice(i, 1);
        } else {
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;
        }
      }

      // Remove dead enemies and award gold/score
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        if (enemiesRef.current[i].hp <= 0) {
          const killed = enemiesRef.current[i];
          enemiesRef.current.splice(i, 1);
          const goldEarned = killed.type === 'boss' ? settings.goldPerKill * 3 : settings.goldPerKill;
          const scoreEarned = killed.type === 'boss' ? 50 : 10;
          setGold(prev => prev + goldEarned);
          setScore(prev => prev + scoreEarned);
        }
      }

      // Check wave complete
      if (enemiesRef.current.length === 0 && waveRef.current > 0 && gameStateRef.current === 'playing') {
        if (waveRef.current >= settings.wavesToWin) {
          setGameState('won');
          playSuccess();
          saveHighScore(scoreRef.current);
        } else {
          setGameState('idle');
        }
      }

      // --- DRAW ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grass background
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * GRID_SIZE, 0);
        ctx.lineTo(c * GRID_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * GRID_SIZE);
        ctx.lineTo(CANVAS_WIDTH, r * GRID_SIZE);
        ctx.stroke();
      }

      // Draw path
      ctx.fillStyle = '#d4a373';
      for (const [c, r] of PATH) {
        ctx.fillRect(c * GRID_SIZE, r * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }

      // Draw towers
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const tower of towersRef.current) {
        const cfg = TOWER_CONFIGS[tower.type];
        // Range indicator
        ctx.beginPath();
        ctx.arc(tower.x * GRID_SIZE + GRID_SIZE / 2, tower.y * GRID_SIZE + GRID_SIZE / 2, cfg.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fill();
        // Base
        ctx.fillStyle = cfg.color;
        ctx.fillRect(tower.x * GRID_SIZE + 4, tower.y * GRID_SIZE + 4, GRID_SIZE - 8, GRID_SIZE - 8);
        // Emoji
        ctx.fillText(cfg.emoji, tower.x * GRID_SIZE + GRID_SIZE / 2, tower.y * GRID_SIZE + GRID_SIZE / 2);
      }

      // Draw enemies
      for (const en of enemiesRef.current) {
        const size = en.type === 'boss' ? 16 : 10;
        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.arc(en.x, en.y, size, 0, Math.PI * 2);
        ctx.fill();
        // HP bar
        const barW = size * 2;
        const barH = 4;
        const barX = en.x - barW / 2;
        const barY = en.y - size - 6;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(barX, barY, barW * (en.hp / en.maxHp), barH);
      }

      // Draw projectiles
      for (const p of projectilesRef.current) {
        ctx.fillStyle = p.splash ? '#f97316' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameState, playGameOver, playHit, playShoot, playSuccess, saveHighScore]);

  // ---------------------------------------------------------------------------
  // Choose difficulty & start
  // ---------------------------------------------------------------------------
  const chooseDifficulty = useCallback((diff: Difficulty) => {
    const settings = DIFFICULTY_SETTINGS[diff];
    setDifficulty(diff);
    setGold(settings.startingGold);
    setLives(settings.startingLives);
    setScore(0);
    setWave(0);
    towersRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    setGameState('idle');
    playClick();
  }, [playClick]);

  // ---------------------------------------------------------------------------
  // Reset game
  // ---------------------------------------------------------------------------
  const resetGame = useCallback(() => {
    setGameState('chooseDifficulty');
    setScore(0);
    setWave(0);
    towersRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    setMessage('');
    playClick();
  }, [playClick]);

  usePlayAgainKey(gameState === 'lost', resetGame);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const config = TOWER_CONFIGS[selectedTower];
  const towerTypes: TowerType[] = ['basic', 'sniper', 'splash'];

  return (
    <GameWrapper title={t('title')} onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`flex flex-col items-center gap-4 ${isRtl ? 'direction-rtl' : ''}`}>
        {/* Difficulty chooser */}
        <AnimatePresence>
          {gameState === 'chooseDifficulty' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4 p-8 bg-white/90 rounded-2xl shadow-xl"
            >
              <h2 className="text-2xl font-bold text-gray-800">{t('selectDifficulty')}</h2>
              <div className="flex gap-4">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
                  <button
                    key={diff}
                    onClick={() => chooseDifficulty(diff)}
                    className={`px-6 py-3 rounded-xl font-bold text-white transition-transform hover:scale-105 ${
                      diff === 'easy' ? 'bg-green-500 hover:bg-green-600' :
                      diff === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' :
                      'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {diff === 'easy' ? '😊' : diff === 'medium' ? '😐' : '😈'}{' '}
                    {(t as any)(diff)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD */}
        {gameState !== 'chooseDifficulty' && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
              <LevelDisplay level={wave} />
              <span className="px-3 py-1 bg-yellow-400 rounded-full text-gray-800">
                {'💰'} {t('gold')}: {gold}
              </span>
              <span className="px-3 py-1 bg-red-400 rounded-full text-white">
                {'❤️'} {t('lives')}: {lives}
              </span>
              <span className="px-3 py-1 bg-blue-400 rounded-full text-white">
                {'⭐'} {t('score')}: {score}
              </span>
              <span className="px-3 py-1 bg-purple-400 rounded-full text-white">
                {'🏆'} {t('highScore')}: {highScore}
              </span>
            </div>

            {/* Tower selector */}
            <div className="flex gap-2">
              {towerTypes.map((tw, idx) => {
                const cfg = TOWER_CONFIGS[tw];
                return (
                  <button
                    key={tw}
                    onClick={() => { setSelectedTower(tw); playClick(); }}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg font-semibold text-sm border-2 transition-all ${
                      selectedTower === tw
                        ? 'border-yellow-400 bg-yellow-100 scale-105'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span>{cfg.emoji}</span>
                    <span>{(t as any)(tw)}</span>
                    <span className="text-xs text-gray-500">({idx + 1})</span>
                    <span className="text-xs text-yellow-600">{'💰'}{cfg.cost}</span>
                  </button>
                );
              })}
            </div>

            {/* Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-lg font-bold text-red-600"
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="rounded-xl border-4 border-green-700 shadow-lg cursor-crosshair"
              style={{ maxWidth: '100%', height: 'auto' }}
            />

            {/* Start wave button */}
            {(gameState === 'idle' || gameState === 'playing') && enemiesRef.current.length === 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startWave}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                {'⚔️'} {t('start')} {wave + 1}
              </motion.button>
            )}

            {/* Info line */}
            <p className="text-xs text-gray-500">{t('placeTower')} | {t('pressKeys')}</p>
          </>
        )}

        {/* Game over overlay */}
        <AnimatePresence>
          {gameState === 'lost' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl z-10"
            >
              <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-2xl">
                <h2 className="text-3xl font-bold text-red-600">{t('gameOver')}</h2>
                <p className="text-lg">{t('score')}: {score}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetGame}
                  className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl"
                >
                  {t('playAgain')}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Win modal */}
        <WinModal
          isOpen={gameState === 'won'}
          onClose={resetGame}
          onPlayAgain={resetGame}
          score={score}
        />
      </div>

      {/* Instructions modal */}
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
