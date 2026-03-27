'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { R3FGameContainer } from '../shared/r3f/R3FGameContainer';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { useDirection } from '@/hooks/useDirection';
import { TextDirection } from '@/i18n/routing';

// ─── Types ──────────────────────────────────────────────────
type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'menu' | 'idle' | 'rolling' | 'counting' | 'roundComplete' | 'won';

interface AnimalDiceGameProps {
  locale?: string;
}

// ─── Constants ──────────────────────────────────────────────
const HALF = Math.PI / 2;
const PI   = Math.PI;

// Final euler [x, y] for each die face value (camera looks from Z+)
// BoxGeometry face assignment: +Z=1, -X=2, -Y=3, +Y=4, +X=5, -Z=6
const FACE_ROT: Record<number, [number, number]> = {
  1: [0,       0      ],
  2: [0,       HALF   ],
  3: [HALF,    0      ],
  4: [-HALF,   0      ],
  5: [0,       -HALF  ],
  6: [0,       PI     ],
};

// Pip positions (local space) for each die face
// Die size = 1.6 (half = 0.8); pips slightly outside face at ±0.84
const P = 0.84;   // face depth
const O = 0.28;   // pip offset from center

type PipPos = [number, number, number];
const PIPS: Record<number, PipPos[]> = {
  // Face 1 (+Z): 1 pip center
  1: [[0, 0, P]],
  // Face 2 (-X): 2 pips diagonal
  2: [[-P, O, O], [-P, -O, -O]],
  // Face 3 (-Y): 3 pips diagonal
  3: [[O, -P, O], [0, -P, 0], [-O, -P, -O]],
  // Face 4 (+Y): 4 pips corners
  4: [[O, P, O], [-O, P, O], [O, P, -O], [-O, P, -O]],
  // Face 5 (+X): 5 pips (4 corners + center)
  5: [[P, O, O], [P, O, -O], [P, 0, 0], [P, -O, O], [P, -O, -O]],
  // Face 6 (-Z): 6 pips (2 cols × 3 rows)
  6: [[O, O, -P], [-O, O, -P], [O, 0, -P], [-O, 0, -P], [O, -O, -P], [-O, -O, -P]],
};

// ─── Config ─────────────────────────────────────────────────
const DIFFICULTY_CONFIG: Record<Difficulty, {
  maxFace: number;
  rounds: number;
  timerSec: number | null;
  animalCount: number; // number of animal types used
}> = {
  easy:   { maxFace: 3, rounds: 5,  timerSec: null, animalCount: 3 },
  medium: { maxFace: 6, rounds: 6,  timerSec: null, animalCount: 6 },
  hard:   { maxFace: 6, rounds: 8,  timerSec: 12,   animalCount: 6 },
};

const ANIMALS = [
  { emoji: '🐘', name: { en: 'Elephant', he: 'פיל',     zh: '大象',  es: 'Elefante'  }, bg: 'from-sky-300 to-sky-400' },
  { emoji: '🐼', name: { en: 'Panda',    he: 'פנדה',    zh: '熊猫',  es: 'Panda'     }, bg: 'from-violet-300 to-purple-400' },
  { emoji: '🐸', name: { en: 'Frog',     he: 'צפרדע',   zh: '青蛙',  es: 'Rana'      }, bg: 'from-green-300 to-emerald-400' },
  { emoji: '🦊', name: { en: 'Fox',      he: 'שועל',    zh: '狐狸',  es: 'Zorro'     }, bg: 'from-orange-300 to-amber-400' },
  { emoji: '🐧', name: { en: 'Penguin',  he: 'פינגווין',zh: '企鹅',  es: 'Pingüino'  }, bg: 'from-cyan-300 to-teal-400' },
  { emoji: '🦁', name: { en: 'Lion',     he: 'אריה',    zh: '狮子',  es: 'León'      }, bg: 'from-yellow-300 to-amber-400' },
];

const NUMBER_WORDS: Record<string, string[]> = {
  en: ['', 'ONE',   'TWO',   'THREE', 'FOUR',  'FIVE',  'SIX'  ],
  he: ['', 'אחד',   'שניים', 'שלושה', 'ארבעה', 'חמישה', 'שישה' ],
  zh: ['', '一',    '二',    '三',    '四',     '五',    '六'   ],
  es: ['', 'UNO',   'DOS',   'TRES',  'CUATRO','CINCO', 'SEIS' ],
};

const FACE_COLORS: Record<number, string> = {
  1: '#fbbf24', // amber
  2: '#34d399', // emerald
  3: '#60a5fa', // blue
  4: '#f472b6', // pink
  5: '#a78bfa', // violet
  6: '#fb7185', // rose
};

// ─── Translations ────────────────────────────────────────────
const T: Record<string, Record<string, string>> = {
  en: {
    title: 'Animal Dice Safari',
    rollDice: '🎲 Roll the Dice!',
    tapAnimals: 'Tap each animal!',
    roundComplete: '⭐ Amazing counting!',
    rollAgain: '🎲 Roll Again!',
    score: 'Score',
    round: 'Round',
    timeLeft: 'Time',
    difficulty: 'Choose Difficulty',
    easy: '🟢 Easy',
    medium: '🟡 Medium',
    hard: '🔴 Hard',
    easyDesc: 'Numbers 1–3 · Big animals · No timer',
    mediumDesc: 'Numbers 1–6 · All animals',
    hardDesc: 'Numbers 1–6 · 12-second timer!',
    youRolled: 'You rolled',
    tapAll: 'Tap all of them!',
    tooSlow: '⏰ Time\'s up!',
    playAgain: 'Play Again',
  },
  he: {
    title: 'ספארי הקובייה',
    rollDice: '!🎲 זרקו את הקובייה',
    tapAnimals: '!הקישו על כל חיה',
    roundComplete: '!⭐ ספירה מדהימה',
    rollAgain: '!🎲 זרקו שוב',
    score: 'ניקוד',
    round: 'סיבוב',
    timeLeft: 'זמן',
    difficulty: 'בחרו רמת קושי',
    easy: '🟢 קל',
    medium: '🟡 בינוני',
    hard: '🔴 קשה',
    easyDesc: 'מספרים 1–3 · חיות גדולות · בלי שעון',
    mediumDesc: 'מספרים 1–6 · כל החיות',
    hardDesc: '!מספרים 1–6 · שעון 12 שניות',
    youRolled: 'יצא לכם',
    tapAll: '!הקישו על כולן',
    tooSlow: '!⏰ נגמר הזמן',
    playAgain: 'שחקו שוב',
  },
  zh: {
    title: '动物骰子大冒险',
    rollDice: '🎲 扔骰子！',
    tapAnimals: '点击每只动物！',
    roundComplete: '⭐ 数得太棒了！',
    rollAgain: '🎲 再扔一次！',
    score: '分数',
    round: '回合',
    timeLeft: '时间',
    difficulty: '选择难度',
    easy: '🟢 简单',
    medium: '🟡 中等',
    hard: '🔴 困难',
    easyDesc: '数字1–3·大动物·无限时',
    mediumDesc: '数字1–6·所有动物',
    hardDesc: '数字1–6·12秒倒计时！',
    youRolled: '你掷出了',
    tapAll: '点击全部！',
    tooSlow: '⏰ 时间到！',
    playAgain: '再玩一次',
  },
  es: {
    title: 'Safari de Dados',
    rollDice: '🎲 ¡Tira el dado!',
    tapAnimals: '¡Toca cada animal!',
    roundComplete: '⭐ ¡Qué bien contaste!',
    rollAgain: '🎲 ¡Tira de nuevo!',
    score: 'Puntos',
    round: 'Ronda',
    timeLeft: 'Tiempo',
    difficulty: 'Elige dificultad',
    easy: '🟢 Fácil',
    medium: '🟡 Medio',
    hard: '🔴 Difícil',
    easyDesc: 'Números 1–3 · Animales grandes · Sin cronómetro',
    mediumDesc: 'Números 1–6 · Todos los animales',
    hardDesc: '¡Números 1–6 · Cronómetro de 12 segundos!',
    youRolled: 'Sacaste el',
    tapAll: '¡Tócalos todos!',
    tooSlow: '⏰ ¡Se acabó el tiempo!',
    playAgain: 'Jugar de nuevo',
  },
};

const INSTRUCTIONS_DATA: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '🎲', title: 'Roll the dice!', description: 'Tap the big colorful cube to roll it. It will spin and land on a number from 1 to 6!' },
      { icon: '🐘', title: 'Animals appear!', description: 'After the dice lands, cute animals hop onto the screen — as many as the number on the dice!' },
      { icon: '👆', title: 'Tap to count!', description: 'Tap each animal one by one. Each one has a number badge so you know which one to tap next!' },
      { icon: '⭐', title: 'All done!', description: 'Once you tap all the animals, you get a star! Then roll the dice again and keep counting!' },
    ],
    controls: [
      { icon: '👆', description: 'Tap the dice to roll, tap animals to count' },
      { icon: '⌨️', description: 'Space / Enter to roll; number keys to tap animals' },
    ],
    tip: 'Say the number out loud as you tap each animal — "one elephant, two elephants!" — that\'s how counting wizards train!',
  },
  he: {
    instructions: [
      { icon: '🎲', title: '!זרקו את הקובייה', description: 'הקישו על הקובייה הצבעונית הגדולה כדי לזרוק אותה. היא תסתובב ותנחת על מספר בין 1 ל-6!' },
      { icon: '🐘', title: '!חיות מופיעות', description: 'אחרי שהקובייה נוחתת, חיות חמודות קופצות למסך — כמה שהמספר על הקובייה!' },
      { icon: '👆', title: '!הקישו לספור', description: 'הקישו על כל חיה אחת אחת. לכל אחת יש תג מספר כדי שתדעו על מי להקיש!' },
      { icon: '⭐', title: '!גמרנו', description: 'ברגע שתקישו על כל החיות, תקבלו כוכב! ואז זרקו שוב ותמשיכו לספור!' },
    ],
    controls: [
      { icon: '👆', description: 'הקישו על הקובייה לזריקה, על חיות לספירה' },
      { icon: '⌨️', description: 'רווח/אנטר לזריקה; מקשי מספר להקשה על חיות' },
    ],
    tip: '!אמרו את המספר בקול בכל הקשה — "פיל אחד, שני פילים" — כך מתאמנים קוסמי ספירה',
  },
  zh: {
    instructions: [
      { icon: '🎲', title: '扔骰子！', description: '点击大彩色方块来扔骰子。它会旋转并停在1到6之间的某个数字上！' },
      { icon: '🐘', title: '动物出现！', description: '骰子停下后，可爱的动物会跳到屏幕上——数量和骰子上的数字一样多！' },
      { icon: '👆', title: '点击来数数！', description: '一个一个地点击每只动物。每只动物都有一个数字徽章，告诉你下一个该点哪个！' },
      { icon: '⭐', title: '全部完成！', description: '点完所有动物后，你会得到一颗星！然后再扔骰子，继续数数！' },
    ],
    controls: [
      { icon: '👆', description: '点击骰子投掷，点击动物数数' },
      { icon: '⌨️', description: '空格/回车键投掷；数字键点击动物' },
    ],
    tip: '每次点击时大声说出数字——"一只大象，两只大象！"——这是数数高手的练习方法！',
  },
  es: {
    instructions: [
      { icon: '🎲', title: '¡Tira el dado!', description: '¡Toca el gran cubo de colores para tirarlo! Girará y caerá en un número del 1 al 6!' },
      { icon: '🐘', title: '¡Aparecen animales!', description: '¡Después de que el dado cae, animales adorables saltan a la pantalla — tantos como el número del dado!' },
      { icon: '👆', title: '¡Toca para contar!', description: '¡Toca cada animal uno por uno! Cada uno tiene una etiqueta de número para saber cuál tocar después.' },
      { icon: '⭐', title: '¡Todo listo!', description: '¡Una vez que tocas todos los animales, obtienes una estrella! ¡Luego tira de nuevo y sigue contando!' },
    ],
    controls: [
      { icon: '👆', description: 'Toca el dado para tirar, toca animales para contar' },
      { icon: '⌨️', description: 'Espacio/Enter para tirar; teclas numéricas para tocar animales' },
    ],
    tip: '¡Di el número en voz alta cada vez que tocas — "un elefante, dos elefantes!" — ¡así se entrenan los magos del conteo!',
  },
};

// ─── 3D Die component ────────────────────────────────────────

interface DieSceneProps {
  rolling: boolean;
  targetFace: number;
  onLanded: (face: number) => void;
  faceColor: string;
}

function Pip({ position }: { position: PipPos }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.08, 12, 8]} />
      <meshStandardMaterial color="#1e293b" roughness={0.4} />
    </mesh>
  );
}

function DiceScene({ rolling, targetFace, onLanded, faceColor }: DieSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const rotXRef = useRef(0);
  const rotYRef = useRef(0);
  const targetXRef = useRef(0);
  const targetYRef = useRef(0);
  const isLandedRef = useRef(true);
  const callbackFiredRef = useRef(false);
  const hoverRef = useRef(0);
  const hoverDirRef = useRef(1);

  useEffect(() => {
    if (rolling) {
      isLandedRef.current = false;
      callbackFiredRef.current = false;
      const [fx, fy] = FACE_ROT[targetFace];
      // Land at face rotation + extra full spins for drama
      const extraX = Math.ceil(rotXRef.current / (2 * Math.PI)) * 2 * Math.PI + 4 * Math.PI;
      const extraY = Math.ceil(rotYRef.current / (2 * Math.PI)) * 2 * Math.PI + 6 * Math.PI;
      targetXRef.current = extraX + fx;
      targetYRef.current = extraY + fy;
    }
  }, [rolling, targetFace]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!isLandedRef.current) {
      // Spring toward target rotation
      const speed = 3.5;
      rotXRef.current += (targetXRef.current - rotXRef.current) * speed * delta;
      rotYRef.current += (targetYRef.current - rotYRef.current) * speed * delta;

      groupRef.current.rotation.x = rotXRef.current;
      groupRef.current.rotation.y = rotYRef.current;

      const dX = Math.abs(targetXRef.current - rotXRef.current);
      const dY = Math.abs(targetYRef.current - rotYRef.current);
      if (dX < 0.015 && dY < 0.015 && !callbackFiredRef.current) {
        isLandedRef.current = true;
        callbackFiredRef.current = true;
        groupRef.current.rotation.x = targetXRef.current;
        groupRef.current.rotation.y = targetYRef.current;
        onLanded(targetFace);
      }
    } else {
      // Idle gentle bob
      hoverRef.current += delta * 1.2 * hoverDirRef.current;
      if (Math.abs(hoverRef.current) > 0.08) hoverDirRef.current *= -1;
      groupRef.current.position.y = hoverRef.current;
    }
  });

  const color = new THREE.Color(faceColor);

  return (
    <group ref={groupRef}>
      {/* Die body */}
      <RoundedBox args={[1.6, 1.6, 1.6]} radius={0.14} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.1} />
      </RoundedBox>

      {/* Pips for all 6 faces */}
      {Object.entries(PIPS).flatMap(([face, positions]) =>
        positions.map((pos, idx) => (
          <Pip key={`f${face}-p${idx}`} position={pos as PipPos} />
        ))
      )}

      {/* Point light for a nice reflection */}
      <pointLight position={[2, 3, 2]} intensity={3} color="#ffffff" />
    </group>
  );
}

// ─── Main component ──────────────────────────────────────────

export default function AnimalDiceGame({ locale = 'en' }: AnimalDiceGameProps) {
  const t = T[locale] || T.en;
  const instData = INSTRUCTIONS_DATA[locale] || INSTRUCTIONS_DATA.en;
  const numWords = NUMBER_WORDS[locale] || NUMBER_WORDS.en;
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;

  const sounds = useRetroSounds();
  const [showInstructions, setShowInstructions] = useState(true);

  // Game state
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [phase, setPhase] = useState<Phase>('menu');
  const [currentFace, setCurrentFace] = useState(1);
  const [rollingFace, setRollingFace] = useState(1);
  const [animalType, setAnimalType] = useState(0);
  const [tapped, setTapped] = useState<boolean[]>([]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [isRolling, setIsRolling] = useState(false);
  const [faceColor, setFaceColor] = useState(FACE_COLORS[1]);

  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('animal-dice-highscore');
      return s ? parseInt(s, 10) : 0;
    }
    return 0;
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSecs = DIFFICULTY_CONFIG[difficulty].timerSec;
  const config     = DIFFICULTY_CONFIG[difficulty];
  const allTapped  = tapped.length > 0 && tapped.every(Boolean);

  // ── Roll the die ──────────────────────────────────────────
  const roll = useCallback(() => {
    if (phase !== 'idle') return;
    sounds.playDice();
    const max = config.maxFace;
    const face = Math.floor(Math.random() * max) + 1;
    const animal = Math.floor(Math.random() * config.animalCount);
    setRollingFace(face);
    setAnimalType(animal);
    setFaceColor(FACE_COLORS[face]);
    setIsRolling(true);
    setPhase('rolling');
  }, [phase, config, sounds]);

  // ── Die landed callback ───────────────────────────────────
  const handleLanded = useCallback((face: number) => {
    setCurrentFace(face);
    setTapped(Array(face).fill(false));
    setIsRolling(false);
    setPhase('counting');
    if (timerSecs) {
      setTimeLeft(timerSecs);
    }
    sounds.playSuccess();
  }, [timerSecs, sounds]);

  // ── Tap animal ────────────────────────────────────────────
  const tapAnimal = useCallback((idx: number) => {
    if (phase !== 'counting') return;
    setTapped(prev => {
      if (prev[idx]) return prev; // already tapped
      // Must tap in order
      const nextIndex = prev.findIndex(v => !v);
      if (nextIndex !== idx) return prev;
      sounds.playHit();
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  }, [phase, sounds]);

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && phase === 'idle') {
        e.preventDefault();
        roll();
      }
      if ((e.code === 'Space' || e.code === 'Enter') && phase === 'roundComplete') {
        e.preventDefault();
        nextRound();
      }
      if (phase === 'counting') {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= currentFace) {
          e.preventDefault();
          tapAnimal(num - 1);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roll, tapAnimal, currentFace]);

  // ── All animals tapped ────────────────────────────────────
  useEffect(() => {
    if (!allTapped || phase !== 'counting') return;
    if (timerRef.current) clearInterval(timerRef.current);
    const pts = currentFace * 10 * (difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1);
    setScore(prev => {
      const next = prev + Math.round(pts);
      if (next > highScore) {
        setHighScore(next);
        localStorage.setItem('animal-dice-highscore', String(next));
      }
      return next;
    });
    sounds.playWin();
    setPhase('roundComplete');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTapped, phase]);

  // ── Timer (hard mode) ─────────────────────────────────────
  useEffect(() => {
    if (phase !== 'counting' || !timerSecs) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          sounds.playGameOver();
          // Skip remaining; give partial points, move to next round
          const tappedCount = tapped.filter(Boolean).length;
          const pts = tappedCount * 10 * 2;
          setScore(s => s + Math.round(pts));
          setPhase('roundComplete');
          return 0;
        }
        if (prev <= 4) sounds.playCountdown();
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Next round ────────────────────────────────────────────
  const nextRound = useCallback(() => {
    sounds.playClick();
    if (round >= config.rounds) {
      sounds.playWin();
      setPhase('won');
    } else {
      setRound(r => r + 1);
      setPhase('idle');
    }
  }, [round, config.rounds, sounds]);

  const startGame = useCallback((diff: Difficulty) => {
    sounds.playClick();
    setDifficulty(diff);
    setRound(1);
    setScore(0);
    setPhase('idle');
    setCurrentFace(1);
    setIsRolling(false);
    setTapped([]);
    setFaceColor(FACE_COLORS[1]);
  }, [sounds]);

  const playAgain = useCallback(() => {
    sounds.playClick();
    setPhase('menu');
  }, [sounds]);

  const animal = ANIMALS[animalType];

  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`flex flex-col items-center gap-3 w-full max-w-[600px] mx-auto ${isRtl ? 'direction-rtl' : ''}`}>

        {/* ── MENU ───────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-5 w-full pt-4"
            >
              <motion.div
                animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.1, 1.1, 1.05, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="text-8xl select-none"
              >
                🎲
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-800">{t.difficulty}</h2>

              <div className="flex flex-col gap-3 w-full">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => {
                  const bg = diff === 'easy' ? 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200'
                           : diff === 'medium' ? 'bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200'
                           : 'bg-red-100 border-red-400 text-red-800 hover:bg-red-200';
                  return (
                    <motion.button
                      key={diff}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => startGame(diff)}
                      className={`w-full px-6 py-4 rounded-2xl border-2 font-bold text-lg shadow-md transition-colors min-h-[64px] ${bg}`}
                    >
                      <div className="text-lg font-bold">{t[diff]}</div>
                      <div className="text-sm font-normal opacity-70 mt-0.5">{t[`${diff}Desc`]}</div>
                    </motion.button>
                  );
                })}
              </div>

              {highScore > 0 && (
                <p className="text-slate-500 text-sm">🏆 {t.score}: <span className="font-bold text-amber-600">{highScore}</span></p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PLAYING ────────────────────────────────────────── */}
        {phase !== 'menu' && (
          <>
            {/* HUD */}
            <div className="flex justify-between items-center w-full gap-2">
              <LevelDisplay level={round} />
              <div className="bg-white/90 rounded-2xl px-4 py-2 shadow-md text-center">
                <div className="text-xs text-slate-500">{t.score}</div>
                <div className="text-xl font-bold text-amber-600">{score}</div>
              </div>
              <div className="bg-white/90 rounded-2xl px-4 py-2 shadow-md text-center">
                <div className="text-xs text-slate-500">{t.round}</div>
                <div className="text-xl font-bold text-slate-700">{round}/{config.rounds}</div>
              </div>
              {timerSecs && phase === 'counting' && (
                <div className={`bg-white/90 rounded-2xl px-4 py-2 shadow-md text-center ${timeLeft <= 3 ? 'animate-pulse' : ''}`}>
                  <div className="text-xs text-slate-500">{t.timeLeft}</div>
                  <div className={`text-xl font-bold ${timeLeft <= 3 ? 'text-red-500' : 'text-blue-600'}`}>{timeLeft}s</div>
                </div>
              )}
            </div>

            {/* 3D Die */}
            <div
              className={`w-full cursor-pointer select-none transition-opacity ${phase === 'counting' ? 'opacity-60' : 'opacity-100'}`}
              style={{ maxHeight: 280 }}
              onClick={phase === 'idle' ? roll : undefined}
            >
              <R3FGameContainer
                camera={{ position: [0, 2, 6], fov: 45 }}
                className="!aspect-[2/1] max-h-[240px]"
              >
                <DiceScene
                  rolling={isRolling}
                  targetFace={rollingFace}
                  onLanded={handleLanded}
                  faceColor={faceColor}
                />
                <color attach="background" args={['#f8fafc']} />
              </R3FGameContainer>
            </div>

            {/* Prompt text */}
            <AnimatePresence mode="wait">
              {phase === 'idle' && (
                <motion.button
                  key="roll-btn"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={roll}
                  className="w-full py-5 rounded-3xl text-white text-2xl font-extrabold shadow-xl
                             bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600
                             active:scale-95 transition-all min-h-[72px]"
                >
                  {t.rollDice}
                </motion.button>
              )}

              {phase === 'rolling' && (
                <motion.div
                  key="rolling-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="text-2xl font-bold text-slate-500 py-4"
                >
                  🎲🎲🎲
                </motion.div>
              )}

              {phase === 'counting' && (
                <motion.div
                  key="counting-prompt"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="text-3xl font-extrabold" style={{ color: faceColor }}>
                    {numWords[currentFace]} {animal.emoji}
                  </div>
                  <div className="text-slate-600 text-base mt-1">{t.tapAnimals}</div>
                </motion.div>
              )}

              {phase === 'roundComplete' && (
                <motion.div
                  key="round-complete"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                  className="text-center"
                >
                  <div className="text-4xl font-extrabold text-emerald-500 mb-2">{t.roundComplete}</div>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={nextRound}
                    className="px-8 py-4 rounded-3xl text-white text-xl font-bold shadow-xl
                               bg-gradient-to-r from-emerald-400 to-teal-500 min-h-[60px]"
                  >
                    {round >= config.rounds ? '🏆 ' + t.playAgain : t.rollAgain}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Animal Stage ───────────────────────────────── */}
            {(phase === 'counting' || phase === 'roundComplete') && tapped.length > 0 && (
              <div className="w-full">
                {/* Face value and big number word */}
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {tapped.map((done, idx) => {
                    const isNext = !done && tapped.slice(0, idx).every(Boolean);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0, y: 60 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.12, type: 'spring', stiffness: 300, damping: 18 }}
                        className="relative"
                      >
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          animate={done
                            ? { rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.15, 1] }
                            : isNext
                            ? { scale: [1, 1.06, 1], transition: { duration: 0.7, repeat: Infinity } }
                            : {}
                          }
                          onClick={() => tapAnimal(idx)}
                          disabled={done || phase === 'roundComplete'}
                          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex flex-col items-center justify-center
                                      text-5xl sm:text-6xl shadow-lg transition-all select-none
                                      bg-gradient-to-br ${animal.bg}
                                      ${done ? 'opacity-40 grayscale cursor-default' : 'cursor-pointer active:scale-90'}
                                      ${isNext && !done ? 'ring-4 ring-white ring-offset-2 ring-offset-transparent' : ''}
                                    `}
                          onTouchStart={(e) => { e.preventDefault(); tapAnimal(idx); }}
                          aria-label={`${animal.name[locale as keyof typeof animal.name] || animal.name.en} ${idx + 1}`}
                        >
                          {done ? '✅' : animal.emoji}
                          {/* Sparkle on done */}
                          {done && (
                            <motion.div
                              initial={{ opacity: 1, scale: 0 }}
                              animate={{ opacity: 0, scale: 2 }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0 rounded-3xl bg-yellow-300 pointer-events-none"
                            />
                          )}
                        </motion.button>

                        {/* Number badge */}
                        <div
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center
                                     text-white text-sm font-extrabold shadow-md"
                          style={{ background: faceColor }}
                        >
                          {idx + 1}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Big number displayed at bottom */}
                <div className="flex justify-center mt-3 gap-1">
                  {Array.from({ length: currentFace }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 + 0.3 }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow`}
                      style={{ background: tapped[i] ? '#10b981' : faceColor, opacity: tapped[i] ? 1 : 0.6 }}
                    >
                      {i + 1}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── WIN MODAL ──────────────────────────────────────── */}
        <WinModal
          isOpen={phase === 'won'}
          onPlayAgain={playAgain}
          onClose={playAgain}
          score={score}
        />

        {/* ── INSTRUCTIONS ───────────────────────────────────── */}
        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          title={t.title}
          instructions={instData.instructions}
          controls={instData.controls}
          tip={instData.tip}
          locale={locale}
        />
      </div>
    </GameWrapper>
  );
}
