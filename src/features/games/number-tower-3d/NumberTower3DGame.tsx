'use client';

import { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useTranslations, useLocale } from 'next-intl';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';
import { GameWrapper } from '../shared/GameWrapper';

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'difficulty' | 'instructions' | 'playing' | 'gameover' | 'win';

interface FallingBlock {
  id: number;
  value: number;
  x: number;
  z: number;
  speed: number;
  color: string;
  lane: number;
}

interface StackedBlock {
  value: number;
  color: string;
  id: number;
}

interface DifficultyConfig {
  maxNumber: number;
  fallSpeed: number;
  timeLimit: number;
  targetMin: number;
  targetMax: number;
  lanes: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy:   { maxNumber: 5,  fallSpeed: 0.03, timeLimit: 90, targetMin: 5,  targetMax: 10, lanes: 3 },
  medium: { maxNumber: 10, fallSpeed: 0.05, timeLimit: 60, targetMin: 10, targetMax: 20, lanes: 4 },
  hard:   { maxNumber: 20, fallSpeed: 0.08, timeLimit: 45, targetMin: 15, targetMax: 30, lanes: 5 },
};

const BLOCK_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];



// ─── Falling Block 3D ────────────────────────────────────────────────────────

interface FallingBlock3DProps {
  block: FallingBlock;
  yPos: number;
  isHighlighted: boolean;
  onCatch: (id: number) => void;
}

function FallingBlock3D({ block, yPos, isHighlighted, onCatch }: FallingBlock3DProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = yPos;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[block.x, yPos, block.z]}
      onClick={(e) => { e.stopPropagation(); onCatch(block.id); }}
      castShadow
    >
      <boxGeometry args={[1.0, 1.0, 1.0]} />
      <meshStandardMaterial
        color={block.color}
        emissive={isHighlighted ? block.color : '#000000'}
        emissiveIntensity={isHighlighted ? 0.5 : 0}
        metalness={0.1}
        roughness={0.5}
      />
      <Text
        position={[0, 0, 0.51]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="black"
      >
        {block.value}
      </Text>
      <Text
        position={[0, 0, -0.51]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
        rotation={[0, Math.PI, 0]}
        outlineWidth={0.04}
        outlineColor="black"
      >
        {block.value}
      </Text>
    </mesh>
  );
}

// ─── Stacked Block 3D ────────────────────────────────────────────────────────

function StackedBlock3D({ block, stackIndex }: { block: StackedBlock; stackIndex: number }) {
  return (
    <Float speed={0} floatIntensity={0}>
      <mesh position={[0, -2 + stackIndex * 1.05, 0]} castShadow>
        <boxGeometry args={[1.2, 1.0, 1.2]} />
        <meshStandardMaterial color={block.color} metalness={0.2} roughness={0.4} />
        <Text
          position={[0, 0, 0.61]}
          fontSize={0.45}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="black"
        >
          {block.value}
        </Text>
      </mesh>
    </Float>
  );
}

// ─── Tower Scene ──────────────────────────────────────────────────────────────

interface TowerSceneProps {
  fallingBlocks: FallingBlock[];
  fallingYPositions: number[];
  stackedBlocks: StackedBlock[];
  highlightedLane: number;
  onCatch: (id: number) => void;
}

function TowerScene({ fallingBlocks, fallingYPositions, stackedBlocks, highlightedLane, onCatch }: TowerSceneProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#8888ff" />
      <Stars radius={60} depth={30} count={2000} factor={3} saturation={0} />

      {/* Ground platform */}
      <mesh position={[0, -3, 0]} receiveShadow>
        <boxGeometry args={[8, 0.3, 4]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Stacked tower blocks */}
      {stackedBlocks.map((block, i) => (
        <StackedBlock3D key={block.id} block={block} stackIndex={i} />
      ))}

      {/* Falling blocks */}
      {fallingBlocks.map((block, i) => (
        <FallingBlock3D
          key={block.id}
          block={block}
          yPos={fallingYPositions[i] ?? 8}
          isHighlighted={block.lane === highlightedLane}
          onCatch={onCatch}
        />
      ))}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

let blockIdCounter = 0;

function generateBlock(cfg: DifficultyConfig): FallingBlock {
  const value = Math.floor(Math.random() * cfg.maxNumber) + 1;
  const lane = Math.floor(Math.random() * cfg.lanes);
  const laneSpacing = 2.0;
  const x = (lane - (cfg.lanes - 1) / 2) * laneSpacing;
  return {
    id: blockIdCounter++,
    value,
    x,
    z: 0,
    speed: cfg.fallSpeed + Math.random() * 0.01,
    color: BLOCK_COLORS[value % BLOCK_COLORS.length],
    lane,
  };
}

export default function NumberTower3DGame() {
  const t = useTranslations('numberTower3D');
  const locale = useLocale();
  const isRtl = locale === 'he';

  const { playClick, playSuccess, playHit, playLevelUp, playGameOver, playWin, playTick } = useRetroSounds();

  const [phase, setPhase] = useState<Phase>('difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(90);
  const [showInstructions, setShowInstructions] = useState(false);
  const [targetSum, setTargetSum] = useState(0);
  const [currentSum, setCurrentSum] = useState(0);
  const [stackedBlocks, setStackedBlocks] = useState<StackedBlock[]>([]);
  const [fallingBlocks, setFallingBlocks] = useState<FallingBlock[]>([]);
  const [fallingYPositions, setFallingYPositions] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const [statusMsg, setStatusMsg] = useState('');
  const [highlightedLane, setHighlightedLane] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('number-tower-3d-highscore');
      return s ? parseInt(s, 10) : 0;
    }
    return 0;
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fallingYRef = useRef<number[]>([]);
  const blocksRef = useRef<FallingBlock[]>([]);
  const phaseRef = useRef<Phase>('difficulty');
  const caughtRef = useRef(false);

  phaseRef.current = phase;

  // High score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('number-tower-3d-highscore', String(score));
    }
  }, [score, highScore]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase('gameover');
          playGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase, playGameOver]);

  // Animation loop for falling blocks
  useEffect(() => {
    if (phase !== 'playing') return;
    const cfg = DIFFICULTY_SETTINGS[difficulty];

    const animate = () => {
      fallingYRef.current = fallingYRef.current.map((y, i) => {
        const newY = y - (blocksRef.current[i]?.speed ?? cfg.fallSpeed);
        return newY;
      });

      // Remove blocks that fell below ground
      const toRemove: number[] = [];
      fallingYRef.current.forEach((y, i) => {
        if (y < -3.5) toRemove.push(i);
      });

      if (toRemove.length > 0) {
        const idsToRemove = toRemove.map(i => blocksRef.current[i]?.id);
        blocksRef.current = blocksRef.current.filter((_, i) => !toRemove.includes(i));
        fallingYRef.current = fallingYRef.current.filter((_, i) => !toRemove.includes(i));
        setFallingBlocks(prev => prev.filter(b => !idsToRemove.includes(b.id)));
        setFallingYPositions([...fallingYRef.current]);
      } else {
        setFallingYPositions([...fallingYRef.current]);
      }

      // Spawn new blocks if too few
      if (blocksRef.current.length < cfg.lanes && Math.random() < 0.03) {
        const newBlock = generateBlock(cfg);
        blocksRef.current.push(newBlock);
        fallingYRef.current.push(9 + Math.random() * 4);
        setFallingBlocks([...blocksRef.current]);
        setFallingYPositions([...fallingYRef.current]);
      }

      // Rotate highlighted lane
      setHighlightedLane(prev => (blocksRef.current.length > 0
        ? blocksRef.current[Math.floor(Date.now() / 800) % blocksRef.current.length]?.lane ?? prev
        : prev));

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, difficulty]);

  const generateTarget = useCallback((diff: Difficulty) => {
    const cfg = DIFFICULTY_SETTINGS[diff];
    return cfg.targetMin + Math.floor(Math.random() * (cfg.targetMax - cfg.targetMin + 1));
  }, []);

  const startGame = useCallback((diff: Difficulty) => {
    blocksRef.current = [];
    fallingYRef.current = [];
    blockIdCounter = 0;
    const target = generateTarget(diff);
    setDifficulty(diff);
    setScore(0);
    setLives(3);
    setRound(1);
    setTimeLeft(DIFFICULTY_SETTINGS[diff].timeLimit);
    setTargetSum(target);
    setCurrentSum(0);
    setStackedBlocks([]);
    setFallingBlocks([]);
    setFallingYPositions([]);
    setStatusMsg('');
    setPhase('instructions');
    setShowInstructions(true);
    playClick();
  }, [generateTarget, playClick]);

  const startPlaying = useCallback(() => {
    setShowInstructions(false);
    setPhase('playing');

    // Spawn initial blocks
    const cfg = DIFFICULTY_SETTINGS[difficulty];
    const initial: FallingBlock[] = [];
    const initialY: number[] = [];
    for (let i = 0; i < cfg.lanes; i++) {
      initial.push(generateBlock(cfg));
      initialY.push(6 + i * 2.5);
    }
    blocksRef.current = initial;
    fallingYRef.current = initialY;
    setFallingBlocks([...initial]);
    setFallingYPositions([...initialY]);
  }, [difficulty]);

  const catchBlock = useCallback((blockId: number) => {
    if (phaseRef.current !== 'playing' || caughtRef.current) return;
    caughtRef.current = true;
    setTimeout(() => { caughtRef.current = false; }, 200);

    const block = blocksRef.current.find(b => b.id === blockId);
    if (!block) return;

    const newSum = currentSum + block.value;

    if (newSum > targetSum) {
      // Overshot!
      playHit();
      setStatusMsg(t('tooHigh'));
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) {
          setPhase('gameover');
          playGameOver();
        }
        return next;
      });
      // Reset tower
      setCurrentSum(0);
      setStackedBlocks([]);
      setTimeout(() => setStatusMsg(''), 1800);
    } else if (newSum === targetSum) {
      // Perfect match!
      playSuccess();
      setStatusMsg(t('perfect'));
      setScore(prev => prev + 300 + Math.floor(timeLeft * 2));
      setStackedBlocks(prev => [...prev, { value: block.value, color: block.color, id: block.id }]);
      setCurrentSum(newSum);

      // Start next round
      setTimeout(() => {
        if (round >= 5) {
          setPhase('win');
          playWin();
        } else {
          setRound(prev => prev + 1);
          const newTarget = generateTarget(difficulty);
          setTargetSum(newTarget);
          setCurrentSum(0);
          setStackedBlocks([]);
          setStatusMsg('');
          playLevelUp();
        }
      }, 1500);
    } else {
      // Good catch, keep going
      playTick();
      setCurrentSum(newSum);
      setStackedBlocks(prev => [...prev, { value: block.value, color: block.color, id: block.id }]);
    }

    // Remove caught block
    const blockIndex = blocksRef.current.findIndex(b => b.id === blockId);
    if (blockIndex !== -1) {
      blocksRef.current.splice(blockIndex, 1);
      fallingYRef.current.splice(blockIndex, 1);
      setFallingBlocks([...blocksRef.current]);
      setFallingYPositions([...fallingYRef.current]);
    }

    playClick();
  }, [currentSum, targetSum, timeLeft, round, difficulty, t, generateTarget,
    playClick, playSuccess, playHit, playTick, playLevelUp, playWin, playGameOver]);

  // Keyboard & touch support
  useEffect(() => {
    if (phase !== 'playing') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        // Catch the block in the highlighted lane
        const block = blocksRef.current.find(b => b.lane === highlightedLane);
        if (block) catchBlock(block.id);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, highlightedLane, catchBlock]);

  return (
    <GameWrapper title={t('title')} onInstructionsClick={() => setShowInstructions(true)} fullHeight>
    <div className="relative w-full h-full bg-black overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 3D Canvas */}
      {(phase === 'playing' || phase === 'win' || phase === 'gameover') && (
        <Canvas
          camera={{ position: [0, 2, 12], fov: 60 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Suspense fallback={null}>
            <TowerScene
              fallingBlocks={fallingBlocks}
              fallingYPositions={fallingYPositions}
              stackedBlocks={stackedBlocks}
              highlightedLane={highlightedLane}
              onCatch={catchBlock}
            />
          </Suspense>
        </Canvas>
      )}

      {/* HUD */}
      {phase === 'playing' && (
        <>
          <div className="absolute top-4 left-0 right-0 flex justify-between items-start px-4 pointer-events-none z-10">
            <div className="bg-black/70 rounded-2xl px-4 py-2 text-white text-sm font-bold space-y-1">
              <div>⭐ {t('score')}: {score}</div>
              <div>❤️ {'❤️'.repeat(lives)}</div>
              <div>🏆 {round}/5</div>
            </div>
            <div className="text-center">
              <div className="bg-black/70 rounded-2xl px-6 py-3">
                <div className="text-yellow-400 text-xs font-bold uppercase mb-1">{t('target')}</div>
                <div className="text-4xl font-bold text-white">{targetSum}</div>
              </div>
              <div className="mt-2 bg-black/70 rounded-xl px-4 py-2">
                <div className="text-green-400 text-xs">{t('sum')}: <span className="text-xl font-bold">{currentSum}</span></div>
                <div className="w-full bg-gray-700 h-2 rounded-full mt-1">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((currentSum / targetSum) * 100, 100)}%`,
                      background: currentSum > targetSum ? '#ef4444' : '#22c55e',
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="bg-black/70 rounded-2xl px-4 py-2 text-white text-center font-bold">
              <div className="text-2xl">{timeLeft}s</div>
              <div className="text-xs">{t('time')}</div>
            </div>
          </div>

          {/* Status message */}
          {statusMsg && (
            <div className="absolute top-1/3 left-0 right-0 text-center z-20 pointer-events-none">
              <div className="inline-block text-3xl font-bold text-yellow-400 bg-black/70 rounded-2xl px-6 py-3 animate-bounce">
                {statusMsg}
              </div>
            </div>
          )}

          {/* Bottom hint */}
          <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
            <div className="inline-block bg-black/60 rounded-xl px-4 py-2 text-white text-sm">
              {t('clickCatch')}
            </div>
          </div>

          {/* Mobile catch button */}
          <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-4 md:hidden z-20 px-4">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                const block = blocksRef.current.find(b => b.lane === highlightedLane);
                if (block) catchBlock(block.id);
              }}
              className="flex-1 max-w-[200px] py-4 rounded-2xl bg-yellow-400 text-black font-bold text-xl shadow-lg active:scale-95 transition-transform select-none"
            >
              ✋ {t('clickCatch')}
            </button>
          </div>
        </>
      )}

      {/* Difficulty Selection */}
      {phase === 'difficulty' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-900 to-black z-20">
          <div className="text-center px-6 max-w-md">
            <div className="text-7xl mb-4">🔢</div>
            <h1 className="text-4xl font-bold text-white mb-2">{t('title')}</h1>
            <p className="text-indigo-300 mb-8">{t('chooseDifficulty')}</p>
            <div className="flex flex-col gap-4">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                const cfg = DIFFICULTY_SETTINGS[d];
                return (
                  <button
                    key={d}
                    onClick={() => startGame(d)}
                    className="min-h-[56px] rounded-2xl font-bold text-lg text-white transition-transform hover:scale-105 active:scale-95 shadow-lg"
                    style={{
                      background: d === 'easy' ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
                        d === 'medium' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                          'linear-gradient(135deg, #ef4444, #dc2626)',
                    }}
                  >
                    {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {(t as any)(d)} — 1-{cfg.maxNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="text-7xl mb-4">💥</div>
            <h2 className="text-4xl font-bold text-white mb-2">{t('gameOver')}</h2>
            <p className="text-2xl text-yellow-400 mb-8">{t('score')}: {score}</p>
            <button
              onClick={() => setPhase('difficulty')}
              className="min-h-[56px] px-8 rounded-2xl font-bold text-xl text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-105 transition-transform"
            >
              {t('playAgain')}
            </button>
          </div>
        </div>
      )}

      {/* Win */}
      {phase === 'win' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="text-7xl mb-4">🏆</div>
            <h2 className="text-4xl font-bold text-yellow-400 mb-2">{t('youWin')}</h2>
            <p className="text-2xl text-white mb-8">{t('score')}: {score}</p>
            <button
              onClick={() => setPhase('difficulty')}
              className="min-h-[56px] px-8 rounded-2xl font-bold text-xl text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 transition-transform"
            >
              {t('playAgain')}
            </button>
          </div>
        </div>
      )}

      <InstructionsModal
        isOpen={showInstructions}
        onClose={startPlaying}
        title={t('title')}
        instructions={[
            { icon: t('instructions.step0Icon'), title: t('instructions.step0Title'), description: t('instructions.step0Desc') },
            { icon: t('instructions.step1Icon'), title: t('instructions.step1Title'), description: t('instructions.step1Desc') },
            { icon: t('instructions.step2Icon'), title: t('instructions.step2Title'), description: t('instructions.step2Desc') },
          ]}
          controls={[
            { icon: t('instructions.ctrl0Icon'), description: t('instructions.ctrl0Desc') },
            { icon: t('instructions.ctrl1Icon'), description: t('instructions.ctrl1Desc') },
            { icon: t('instructions.ctrl2Icon'), description: t('instructions.ctrl2Desc') },
          ]}
          tip={t('instructions.tip')}
        locale={locale}
      />
    </div>
    </GameWrapper>
  );
}
