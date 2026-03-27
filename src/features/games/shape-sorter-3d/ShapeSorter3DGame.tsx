'use client';

import { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Stars, Text, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'difficulty' | 'instructions' | 'playing' | 'gameover' | 'win';
type ShapeType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'dodecahedron' | 'octahedron';

interface ShapeItem {
  id: number;
  type: ShapeType;
  color: string;
  position: [number, number, number];
  matched: boolean;
}

interface TargetSlot {
  shapeType: ShapeType;
  position: [number, number, number];
  matched: boolean;
}

interface DifficultyConfig {
  shapeCount: number;
  rotationSpeed: number;
  timeLimit: number;
  availableShapes: ShapeType[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy:   { shapeCount: 3, rotationSpeed: 0.005, timeLimit: 60, availableShapes: ['box', 'sphere', 'cylinder'] },
  medium: { shapeCount: 5, rotationSpeed: 0.01,  timeLimit: 45, availableShapes: ['box', 'sphere', 'cylinder', 'cone', 'torus'] },
  hard:   { shapeCount: 7, rotationSpeed: 0.02,  timeLimit: 30, availableShapes: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'dodecahedron', 'octahedron'] },
};

const SHAPE_COLORS: Record<ShapeType, string> = {
  box:          '#ef4444',
  sphere:       '#3b82f6',
  cylinder:     '#22c55e',
  cone:         '#f59e0b',
  torus:        '#a855f7',
  dodecahedron: '#ec4899',
  octahedron:   '#14b8a6',
};

const translations: Record<string, Record<string, string>> = {
  en: {
    title: '3D Shape Sorter', score: 'Score', lives: 'Lives', time: 'Time',
    gameOver: 'Game Over!', youWin: 'You Win!', playAgain: 'Play Again',
    easy: 'Easy', medium: 'Medium', hard: 'Hard',
    chooseDifficulty: 'Choose Difficulty',
    box: 'Cube', sphere: 'Sphere', cylinder: 'Cylinder', cone: 'Cone',
    torus: 'Ring', dodecahedron: 'Dodecahedron', octahedron: 'Octahedron',
    selectShape: 'Click a shape, then click its matching slot!',
    round: 'Round',
  },
  he: {
    title: 'מיון צורות תלת-ממד', score: 'ניקוד', lives: 'חיים', time: 'זמן',
    gameOver: '!המשחק נגמר', youWin: '!ניצחת', playAgain: 'שחק שוב',
    easy: 'קל', medium: 'בינוני', hard: 'קשה',
    chooseDifficulty: 'בחר רמת קושי',
    box: 'קובייה', sphere: 'כדור', cylinder: 'גליל', cone: 'חרוט',
    torus: 'טבעת', dodecahedron: 'דודקאהדרון', octahedron: 'אוקטאהדרון',
    selectShape: '!לחץ על צורה, ואז על החריץ המתאים',
    round: 'סיבוב',
  },
  zh: {
    title: '3D形状分类器', score: '得分', lives: '生命', time: '时间',
    gameOver: '游戏结束！', youWin: '你赢了！', playAgain: '再玩一次',
    easy: '容易', medium: '中等', hard: '困难',
    chooseDifficulty: '选择难度',
    box: '立方体', sphere: '球体', cylinder: '圆柱体', cone: '圆锥体',
    torus: '圆环', dodecahedron: '十二面体', octahedron: '八面体',
    selectShape: '点击一个形状，然后点击匹配的槽！',
    round: '轮次',
  },
  es: {
    title: 'Clasificador 3D', score: 'Puntuación', lives: 'Vidas', time: 'Tiempo',
    gameOver: '¡Fin del juego!', youWin: '¡Ganaste!', playAgain: 'Jugar de nuevo',
    easy: 'Fácil', medium: 'Medio', hard: 'Difícil',
    chooseDifficulty: 'Elige dificultad',
    box: 'Cubo', sphere: 'Esfera', cylinder: 'Cilindro', cone: 'Cono',
    torus: 'Toro', dodecahedron: 'Dodecaedro', octahedron: 'Octaedro',
    selectShape: '¡Haz clic en una forma y luego en su ranura correcta!',
    round: 'Ronda',
  },
};

// ─── 3D Shape Component ───────────────────────────────────────────────────────

interface Shape3DProps {
  item: ShapeItem;
  isSelected: boolean;
  rotationSpeed: number;
  onClick: (id: number) => void;
}

function Shape3D({ item, isSelected, rotationSpeed, onClick }: Shape3DProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * rotationSpeed * 60;
      meshRef.current.rotation.y += delta * rotationSpeed * 80;
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(item.id);
  }, [item.id, onClick]);

  const geometry = (() => {
    switch (item.type) {
      case 'box':          return <boxGeometry args={[1.2, 1.2, 1.2]} />;
      case 'sphere':       return <sphereGeometry args={[0.7, 32, 32]} />;
      case 'cylinder':     return <cylinderGeometry args={[0.5, 0.5, 1.2, 32]} />;
      case 'cone':         return <coneGeometry args={[0.7, 1.3, 32]} />;
      case 'torus':        return <torusGeometry args={[0.5, 0.25, 16, 32]} />;
      case 'dodecahedron': return <dodecahedronGeometry args={[0.75]} />;
      case 'octahedron':   return <octahedronGeometry args={[0.8]} />;
    }
  })();

  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
      <mesh
        ref={meshRef}
        position={item.position}
        onClick={handleClick}
        castShadow
      >
        {geometry}
        <meshStandardMaterial
          color={item.color}
          emissive={isSelected ? item.color : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
    </Float>
  );
}

// ─── Target Slot Component ────────────────────────────────────────────────────

interface TargetSlotProps {
  slot: TargetSlot;
  index: number;
  isHighlighted: boolean;
  label: string;
  onTargetClick: (shapeType: ShapeType) => void;
}

function TargetSlot3D({ slot, isHighlighted, label, onTargetClick }: TargetSlotProps) {
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      if (isHighlighted) {
        mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
      } else {
        mat.emissiveIntensity = 0.2;
      }
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!slot.matched) onTargetClick(slot.shapeType);
  }, [slot, onTargetClick]);

  if (slot.matched) return null;

  return (
    <group position={slot.position} onClick={handleClick}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.08, 8, 48]} />
        <meshStandardMaterial
          color={SHAPE_COLORS[slot.shapeType]}
          emissive={SHAPE_COLORS[slot.shapeType]}
          emissiveIntensity={0.2}
        />
      </mesh>
      <Text
        position={[0, 1.4, 0]}
        fontSize={0.35}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {label}
      </Text>
    </group>
  );
}

// ─── Particle Burst ───────────────────────────────────────────────────────────

function ParticleBurst({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null!);
  const particles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * Math.PI * 2,
    speed: 2 + Math.random() * 2,
    offset: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5] as [number, number, number],
  }));

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.children.forEach((child, i) => {
        const p = particles[i];
        child.position.x = position[0] + Math.cos(p.angle) * p.speed * (t % 1);
        child.position.y = position[1] + p.speed * (t % 1) * 0.5;
        child.position.z = position[2] + Math.sin(p.angle) * p.speed * (t % 1);
        (child as THREE.Mesh).material && ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity && (
          ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 1 - (t % 1)
        );
      });
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((_, i) => (
        <mesh key={i} position={position}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color={`hsl(${i * 30}, 100%, 60%)`} transparent />
        </mesh>
      ))}
    </group>
  );
}

// ─── Game Scene ───────────────────────────────────────────────────────────────

interface GameSceneProps {
  shapes: ShapeItem[];
  targets: TargetSlot[];
  selectedId: number | null;
  rotationSpeed: number;
  locale: string;
  t: Record<string, string>;
  matchedPositions: [number, number, number][];
  onShapeClick: (id: number) => void;
  onTargetClick: (shapeType: ShapeType) => void;
}

function GameScene({
  shapes, targets, selectedId, rotationSpeed, locale, t,
  matchedPositions, onShapeClick, onTargetClick,
}: GameSceneProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" castShadow />
      <pointLight position={[-5, -5, 5]} intensity={0.5} color="#8888ff" />
      <Stars radius={80} depth={50} count={3000} factor={4} saturation={0} />

      {shapes.filter(s => !s.matched).map(shape => (
        <Shape3D
          key={shape.id}
          item={shape}
          isSelected={selectedId === shape.id}
          rotationSpeed={rotationSpeed}
          onClick={onShapeClick}
        />
      ))}

      {targets.map((slot, i) => (
        <TargetSlot3D
          key={slot.shapeType}
          slot={slot}
          index={i}
          isHighlighted={selectedId !== null}
          label={t[slot.shapeType] || slot.shapeType}
          onTargetClick={onTargetClick}
        />
      ))}

      {matchedPositions.map((pos, i) => (
        <ParticleBurst key={i} position={pos} />
      ))}
    </>
  );
}

// ─── Build Shapes & Targets ───────────────────────────────────────────────────

function buildRound(difficulty: Difficulty): { shapes: ShapeItem[]; targets: TargetSlot[] } {
  const cfg = DIFFICULTY_SETTINGS[difficulty];
  const shuffled = [...cfg.availableShapes].sort(() => Math.random() - 0.5).slice(0, cfg.shapeCount);

  const shapes: ShapeItem[] = shuffled.map((type, i) => {
    const angle = (i / shuffled.length) * Math.PI * 2;
    const radius = 3.5;
    return {
      id: i,
      type,
      color: SHAPE_COLORS[type],
      position: [Math.cos(angle) * radius, Math.sin(angle) * 1.5, 0],
      matched: false,
    };
  });

  const targetsX = shuffled.length <= 4
    ? shuffled.map((_, i) => (i - (shuffled.length - 1) / 2) * 2.8)
    : shuffled.map((_, i) => (i - (shuffled.length - 1) / 2) * 2.2);

  const targets: TargetSlot[] = shuffled.map((type, i) => ({
    shapeType: type,
    position: [targetsX[i], -3.5, 0],
    matched: false,
  }));

  return { shapes, targets };
}

// ─── Instructions data ────────────────────────────────────────────────────────

const instructionsData: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '🔷', title: 'Look at the shapes', description: 'Colorful 3D shapes are floating in space — cube, sphere, cylinder, and more!' },
      { icon: '🎯', title: 'Find the slots', description: 'At the bottom you see labeled slots. Each slot is waiting for one specific shape.' },
      { icon: '✅', title: 'Match them!', description: 'Click a shape, then click the slot with the same name. Score points for every correct match!' },
    ],
    controls: [
      { icon: '🖱️', description: 'Click a shape, then click its matching slot' },
      { icon: '⌨️', description: 'Tab to cycle shapes, Enter to select, arrow keys for slots' },
      { icon: '👆', description: 'Tap on mobile devices' },
    ],
    tip: 'Look at the shape carefully before picking — a cone is pointy at the top, a cylinder has flat circles on both ends!',
  },
  he: {
    instructions: [
      { icon: '🔷', title: 'הסתכלו על הצורות', description: 'צורות תלת-ממד צבעוניות מרחפות בחלל — קובייה, כדור, גליל ועוד!' },
      { icon: '🎯', title: 'מצאו את החריצים', description: 'בתחתית יש חריצים עם שמות. כל חריץ מחכה לצורה מסוימת אחת.' },
      { icon: '✅', title: 'התאימו אותם!', description: 'לחצו על צורה, ואז על החריץ עם אותו שם. קבלו נקודות על כל התאמה נכונה!' },
    ],
    controls: [
      { icon: '🖱️', description: 'לחצו על צורה, ואז על החריץ המתאים' },
      { icon: '⌨️', description: 'Tab למעבר בין צורות, Enter לבחירה' },
      { icon: '👆', description: 'הקישו במכשיר נייד' },
    ],
    tip: '!הסתכלו על הצורה בעיון לפני שבוחרים — לחרוט יש קצה מחודד בחלק העליון',
  },
  zh: {
    instructions: [
      { icon: '🔷', title: '观察形状', description: '彩色的3D形状漂浮在太空中——立方体、球体、圆柱体等！' },
      { icon: '🎯', title: '找到插槽', description: '底部有标有名称的插槽。每个插槽都在等待一个特定的形状。' },
      { icon: '✅', title: '配对它们！', description: '点击一个形状，然后点击同名的插槽。每次正确匹配得分！' },
    ],
    controls: [
      { icon: '🖱️', description: '点击形状，然后点击匹配的插槽' },
      { icon: '⌨️', description: 'Tab切换形状，Enter选择，方向键切换插槽' },
      { icon: '👆', description: '在移动设备上点击' },
    ],
    tip: '仔细看形状再选择——圆锥体顶部是尖的，圆柱体两端是平的！',
  },
  es: {
    instructions: [
      { icon: '🔷', title: 'Mira las formas', description: '¡Formas 3D coloridas flotan en el espacio — cubo, esfera, cilindro y más!' },
      { icon: '🎯', title: 'Encuentra las ranuras', description: 'En la parte inferior hay ranuras etiquetadas. ¡Cada ranura espera una forma específica!' },
      { icon: '✅', title: '¡Hazlos coincidir!', description: 'Haz clic en una forma, luego en la ranura con el mismo nombre. ¡Gana puntos por cada coincidencia!' },
    ],
    controls: [
      { icon: '🖱️', description: 'Haz clic en una forma, luego en su ranura' },
      { icon: '⌨️', description: 'Tab para ciclar formas, Enter para seleccionar' },
      { icon: '👆', description: 'Toca en dispositivos móviles' },
    ],
    tip: '¡Mira bien la forma antes de elegir — un cono tiene la punta arriba, un cilindro tiene círculos planos en ambos extremos!',
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface ShapeSorter3DGameProps {
  locale?: string;
}

export default function ShapeSorter3DGame({ locale = 'en' }: ShapeSorter3DGameProps) {
  const t = translations[locale] || translations.en;
  const isRtl = locale === 'he';
  const instrData = instructionsData[locale] || instructionsData.en;

  const { playClick, playSuccess, playHit, playLevelUp, playGameOver, playWin } = useRetroSounds();

  const [phase, setPhase] = useState<Phase>('difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [round, setRound] = useState(1);
  const [showInstructions, setShowInstructions] = useState(false);
  const [shapes, setShapes] = useState<ShapeItem[]>([]);
  const [targets, setTargets] = useState<TargetSlot[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [matchedPositions, setMatchedPositions] = useState<[number, number, number][]>([]);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('shape-sorter-3d-highscore');
      return s ? parseInt(s, 10) : 0;
    }
    return 0;
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // High score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('shape-sorter-3d-highscore', String(score));
    }
  }, [score, highScore]);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    setLives(3);
    setRound(1);
    setTimeLeft(DIFFICULTY_SETTINGS[diff].timeLimit);
    const { shapes: s, targets: tgt } = buildRound(diff);
    setShapes(s);
    setTargets(tgt);
    setSelectedId(null);
    setMatchedPositions([]);
    setPhase('instructions');
    setShowInstructions(true);
    playClick();
  }, [playClick]);

  const startPlaying = useCallback(() => {
    setShowInstructions(false);
    setPhase('playing');
  }, []);

  const nextRound = useCallback(() => {
    const newRound = round + 1;
    setRound(newRound);
    setTimeLeft(DIFFICULTY_SETTINGS[difficulty].timeLimit);
    const { shapes: s, targets: tgt } = buildRound(difficulty);
    setShapes(s);
    setTargets(tgt);
    setSelectedId(null);
    setMatchedPositions([]);
    playLevelUp();
  }, [round, difficulty, playLevelUp]);

  const handleShapeClick = useCallback((id: number) => {
    if (phase !== 'playing') return;
    playClick();
    setSelectedId(prev => prev === id ? null : id);
  }, [phase, playClick]);

  const handleTargetClick = useCallback((shapeType: ShapeType) => {
    if (phase !== 'playing' || selectedId === null) return;

    const shape = shapes.find(s => s.id === selectedId);
    if (!shape) return;

    if (shape.type === shapeType) {
      // Correct match!
      playSuccess();
      const matchedPos = shape.position;
      setMatchedPositions(prev => [...prev, matchedPos]);
      setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, matched: true } : s));
      setTargets(prev => prev.map(tgt => tgt.shapeType === shapeType ? { ...tgt, matched: true } : tgt));
      setScore(prev => prev + 100);
      setSelectedId(null);

      // Check if round complete
      setTimeout(() => {
        setShapes(prev => {
          const remaining = prev.filter(s => !s.matched && s.id !== selectedId);
          if (remaining.length === 0) {
            // Win after 3 rounds
            if (round >= 3) {
              setPhase('win');
              playWin();
            } else {
              nextRound();
            }
          }
          return prev;
        });
      }, 600);
    } else {
      // Wrong match
      playHit();
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) {
          setPhase('gameover');
          playGameOver();
        }
        return next;
      });
      setSelectedId(null);
    }
  }, [phase, selectedId, shapes, round, nextRound, playSuccess, playHit, playWin, playGameOver]);

  // Keyboard navigation
  useEffect(() => {
    if (phase !== 'playing') return;
    const activeShapes = shapes.filter(s => !s.matched);
    const activeTargets = targets.filter(t => !t.matched);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (activeShapes.length === 0) return;
        setSelectedId(prev => {
          const idx = activeShapes.findIndex(s => s.id === prev);
          return activeShapes[(idx + 1) % activeShapes.length].id;
        });
      }
      if (e.key === 'Enter' && selectedId !== null) {
        // Try to match with first available target of the selected shape type
        const shape = shapes.find(s => s.id === selectedId);
        if (shape) {
          const target = activeTargets.find(tgt => tgt.shapeType === shape.type);
          if (target) handleTargetClick(target.shapeType);
        }
      }
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, shapes, targets, selectedId, handleTargetClick]);

  const cfg = DIFFICULTY_SETTINGS[difficulty];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 3D Canvas */}
      {(phase === 'playing' || phase === 'win' || phase === 'gameover') && (
        <Canvas camera={{ position: [0, 1, 12], fov: 60 }} style={{ position: 'absolute', inset: 0 }}>
          <Suspense fallback={null}>
            <GameScene
              shapes={shapes}
              targets={targets}
              selectedId={selectedId}
              rotationSpeed={cfg.rotationSpeed}
              locale={locale}
              t={t}
              matchedPositions={matchedPositions}
              onShapeClick={handleShapeClick}
              onTargetClick={handleTargetClick}
            />
          </Suspense>
        </Canvas>
      )}

      {/* HUD Overlay */}
      {phase === 'playing' && (
        <div className="absolute top-4 left-0 right-0 flex justify-between items-start px-4 pointer-events-none z-10">
          <div className="bg-black/60 rounded-2xl px-4 py-2 text-white text-sm font-bold space-y-1">
            <div>⭐ {t.score}: {score}</div>
            <div>❤️ {t.lives}: {'❤️'.repeat(lives)}</div>
            <div>🏆 {highScore > 0 ? `Best: ${highScore}` : ''}</div>
          </div>
          <div className="bg-black/60 rounded-2xl px-4 py-2 text-white text-center font-bold">
            <div className="text-2xl">{timeLeft}s</div>
            <div className="text-xs">{t.round} {round}/3</div>
          </div>
        </div>
      )}

      {/* Selection hint */}
      {phase === 'playing' && (
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
          <div className="inline-block bg-black/60 rounded-xl px-4 py-2 text-white text-sm">
            {selectedId !== null
              ? `✅ ${t[shapes.find(s => s.id === selectedId)?.type ?? 'box'] ?? '?'} — ${t.selectShape.split('!')[0]}`
              : t.selectShape}
          </div>
        </div>
      )}

      {/* Difficulty Selection */}
      {phase === 'difficulty' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black z-20">
          <div className="text-center px-6 max-w-md">
            <div className="text-7xl mb-4">🔷</div>
            <h1 className="text-4xl font-bold text-white mb-2">{t.title}</h1>
            <p className="text-purple-300 mb-8">{t.chooseDifficulty}</p>
            <div className="flex flex-col gap-4">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
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
                  {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {t[d]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {phase === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="text-7xl mb-4">💀</div>
            <h2 className="text-4xl font-bold text-white mb-2">{t.gameOver}</h2>
            <p className="text-2xl text-yellow-400 mb-8">{t.score}: {score}</p>
            <button
              onClick={() => setPhase('difficulty')}
              className="min-h-[56px] px-8 rounded-2xl font-bold text-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 transition-transform"
            >
              {t.playAgain}
            </button>
          </div>
        </div>
      )}

      {/* Win Overlay */}
      {phase === 'win' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="text-7xl mb-4">🎉</div>
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

      {/* Instructions Modal */}
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
