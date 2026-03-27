'use client';

import { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';

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

const translations: Record<string, Record<string, string>> = {
  en: {
    title: '3D Number Tower', score: 'Score', lives: 'Lives', time: 'Time',
    gameOver: 'Game Over!', youWin: '🎉 Tower Complete!', playAgain: 'Play Again',
    easy: 'Easy', medium: 'Medium', hard: 'Hard', chooseDifficulty: 'Choose Difficulty',
    target: 'Target', sum: 'Sum', catchBlock: 'Catch numbered blocks to build your tower!',
    tooHigh: 'Too high! Tower collapsed!', perfect: 'Perfect match!', clickCatch: 'Click / Press Space to catch!',
  },
  he: {
    title: 'מגדל מספרים תלת-ממד', score: 'ניקוד', lives: 'חיים', time: 'זמן',
    gameOver: '!המשחק נגמר', youWin: '!המגדל הושלם', playAgain: 'שחק שוב',
    easy: 'קל', medium: 'בינוני', hard: 'קשה', chooseDifficulty: 'בחר רמת קושי',
    target: 'מטרה', sum: 'סכום', catchBlock: '!תפסו קוביות ממוספרות לבניית המגדל',
    tooHigh: '!גבוה מדי! המגדל קרס', perfect: '!התאמה מושלמת', clickCatch: '!לחצו / לחצו Space לתפיסה',
  },
  zh: {
    title: '3D数字塔', score: '得分', lives: '生命', time: '时间',
    gameOver: '游戏结束！', youWin: '塔楼完成！', playAgain: '再玩一次',
    easy: '容易', medium: '中等', hard: '困难', chooseDifficulty: '选择难度',
    target: '目标', sum: '总和', catchBlock: '接住数字方块建造你的塔！',
    tooHigh: '太高了！塔倒塌了！', perfect: '完美匹配！', clickCatch: '点击/按空格键接住！',
  },
  es: {
    title: 'Torre de Números 3D', score: 'Puntuación', lives: 'Vidas', time: 'Tiempo',
    gameOver: '¡Fin del juego!', youWin: '¡Torre completa!', playAgain: 'Jugar de nuevo',
    easy: 'Fácil', medium: 'Medio', hard: 'Difícil', chooseDifficulty: 'Elige dificultad',
    target: 'Objetivo', sum: 'Suma', catchBlock: '¡Atrapa bloques numerados para construir tu torre!',
    tooHigh: '¡Demasiado alto! ¡La torre colapsó!', perfect: '¡Combinación perfecta!', clickCatch: '¡Clic / Barra espaciadora para atrapar!',
  },
};

const instructionsData: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '🔢', title: 'See the target', description: 'A target number appears at the top. You need to build a tower whose blocks add up to exactly that number!' },
      { icon: '🧱', title: 'Catch falling blocks', description: 'Number blocks fall from the sky. Click a block or press Space to catch it and add it to your tower.' },
      { icon: '🎯', title: 'Hit the target exactly', description: 'If your tower sum equals the target — you win the round! Stack too high and the tower falls!' },
    ],
    controls: [
      { icon: '🖱️', description: 'Click a falling block to catch it' },
      { icon: '⌨️', description: 'Space bar or Enter to catch the highlighted block' },
      { icon: '👆', description: 'Tap on mobile devices' },
    ],
    tip: 'Think before you catch — if the target is 7 and you already have 5, only catch a block with value 2!',
  },
  he: {
    instructions: [
      { icon: '🔢', title: 'ראו את המטרה', description: '!מספר מטרה מופיע בחלק העליון. עליכם לבנות מגדל שהקוביות שלו מסתכמות בדיוק במספר זה' },
      { icon: '🧱', title: 'תפסו קוביות נופלות', description: 'קוביות מספרים נופלות מהשמים. לחצו על קובייה או לחצו על Space כדי לתפוס אותה ולהוסיף אותה למגדל.' },
      { icon: '🎯', title: 'פגעו במטרה בדיוק', description: '!אם סכום המגדל שלכם שווה למטרה — ניצחתם בסיבוב! אם תגיעו גבוה מדי, המגדל יקרוס' },
    ],
    controls: [
      { icon: '🖱️', description: 'לחצו על קובייה נופלת לתפיסה' },
      { icon: '⌨️', description: 'Space או Enter לתפיסת הקובייה המודגשת' },
      { icon: '👆', description: 'הקישו במכשיר נייד' },
    ],
    tip: '!חשבו לפני שתופסים — אם המטרה היא 7 וכבר יש לכם 5, תפסו רק קובייה עם ערך 2',
  },
  zh: {
    instructions: [
      { icon: '🔢', title: '看目标', description: '顶部出现一个目标数字。你需要建造一个方块总和恰好等于该数字的塔！' },
      { icon: '🧱', title: '接住落下的方块', description: '数字方块从天空落下。点击方块或按空格键来接住它并加入你的塔。' },
      { icon: '🎯', title: '精确达到目标', description: '如果你的塔的总和等于目标——你赢得这一轮！叠得太高，塔就会倒塌！' },
    ],
    controls: [
      { icon: '🖱️', description: '点击落下的方块接住它' },
      { icon: '⌨️', description: '空格键或Enter接住高亮的方块' },
      { icon: '👆', description: '在移动设备上点击' },
    ],
    tip: '接住之前先想想——如果目标是7，你已经有5了，只接2的方块！',
  },
  es: {
    instructions: [
      { icon: '🔢', title: 'Ve el objetivo', description: '¡Aparece un número objetivo en la parte superior. Necesitas construir una torre cuyos bloques sumen exactamente ese número!' },
      { icon: '🧱', title: 'Atrapa bloques cayendo', description: 'Bloques numerados caen del cielo. Haz clic en un bloque o presiona Espacio para atraparlo y añadirlo a tu torre.' },
      { icon: '🎯', title: 'Alcanza el objetivo exacto', description: '¡Si la suma de tu torre es igual al objetivo — ganas la ronda! ¡Apila demasiado alto y la torre cae!' },
    ],
    controls: [
      { icon: '🖱️', description: 'Haz clic en un bloque cayendo para atraparlo' },
      { icon: '⌨️', description: 'Barra espaciadora o Enter para atrapar el bloque resaltado' },
      { icon: '👆', description: 'Toca en dispositivos móviles' },
    ],
    tip: '¡Piensa antes de atrapar — si el objetivo es 7 y ya tienes 5, solo atrapa un bloque con valor 2!',
  },
};

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

interface NumberTower3DGameProps {
  locale?: string;
}

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

export default function NumberTower3DGame({ locale = 'en' }: NumberTower3DGameProps) {
  const t = translations[locale] || translations.en;
  const isRtl = locale === 'he';
  const instrData = instructionsData[locale] || instructionsData.en;

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
      setStatusMsg(t.tooHigh);
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
      setStatusMsg(t.perfect);
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
    <div className="relative w-full h-screen bg-black overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
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
              <div>⭐ {t.score}: {score}</div>
              <div>❤️ {'❤️'.repeat(lives)}</div>
              <div>🏆 {round}/5</div>
            </div>
            <div className="text-center">
              <div className="bg-black/70 rounded-2xl px-6 py-3">
                <div className="text-yellow-400 text-xs font-bold uppercase mb-1">{t.target}</div>
                <div className="text-4xl font-bold text-white">{targetSum}</div>
              </div>
              <div className="mt-2 bg-black/70 rounded-xl px-4 py-2">
                <div className="text-green-400 text-xs">{t.sum}: <span className="text-xl font-bold">{currentSum}</span></div>
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
              <div className="text-xs">{t.time}</div>
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
              {t.clickCatch}
            </div>
          </div>
        </>
      )}

      {/* Difficulty Selection */}
      {phase === 'difficulty' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-900 to-black z-20">
          <div className="text-center px-6 max-w-md">
            <div className="text-7xl mb-4">🔢</div>
            <h1 className="text-4xl font-bold text-white mb-2">{t.title}</h1>
            <p className="text-indigo-300 mb-8">{t.chooseDifficulty}</p>
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
                    {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {t[d]} — 1-{cfg.maxNumber}
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
            <h2 className="text-4xl font-bold text-white mb-2">{t.gameOver}</h2>
            <p className="text-2xl text-yellow-400 mb-8">{t.score}: {score}</p>
            <button
              onClick={() => setPhase('difficulty')}
              className="min-h-[56px] px-8 rounded-2xl font-bold text-xl text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-105 transition-transform"
            >
              {t.playAgain}
            </button>
          </div>
        </div>
      )}

      {/* Win */}
      {phase === 'win' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="text-7xl mb-4">🏆</div>
            <h2 className="text-4xl font-bold text-yellow-400 mb-2">{t.youWin}</h2>
            <p className="text-2xl text-white mb-8">{t.score}: {score}</p>
            <button
              onClick={() => setPhase('difficulty')}
              className="min-h-[56px] px-8 rounded-2xl font-bold text-xl text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 transition-transform"
            >
              {t.playAgain}
            </button>
          </div>
        </div>
      )}

      <InstructionsModal
        isOpen={showInstructions}
        onClose={startPlaying}
        title={t.title}
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />
    </div>
  );
}
