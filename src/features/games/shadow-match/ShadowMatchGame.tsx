'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { useRetroSounds } from '@/hooks/useRetroSounds';

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'playing' | 'matched' | 'levelComplete' | 'won';

interface ShadowItem {
  id: number;
  emoji: string;
  label: string;
}

interface LevelRound {
  objects: ShadowItem[];
  shadows: ShadowItem[]; // shuffled order
}

interface DifficultyConfig {
  totalLevels: number;
  roundsPerLevel: number;
  pairsPerRound: number;
  scoreMultiplier: number;
  showTimer: boolean;
  timeLimit: number;
}

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { totalLevels: 3, roundsPerLevel: 3, pairsPerRound: 3, scoreMultiplier: 1, showTimer: false, timeLimit: 0 },
  medium: { totalLevels: 4, roundsPerLevel: 4, pairsPerRound: 4, scoreMultiplier: 2, showTimer: false, timeLimit: 0 },
  hard: { totalLevels: 5, roundsPerLevel: 4, pairsPerRound: 5, scoreMultiplier: 3, showTimer: true, timeLimit: 30 },
};

const DIFFICULTY_EMOJI: Record<Difficulty, string> = { easy: '🟢', medium: '🟡', hard: '🔴' };

// Item pools — organized by visual complexity
const SIMPLE_ITEMS: { emoji: string; label: string }[] = [
  { emoji: '🍎', label: 'apple' }, { emoji: '🌟', label: 'star' }, { emoji: '🏠', label: 'house' },
  { emoji: '🚗', label: 'car' }, { emoji: '🐱', label: 'cat' }, { emoji: '🌳', label: 'tree' },
  { emoji: '⚽', label: 'ball' }, { emoji: '🐶', label: 'dog' }, { emoji: '🎈', label: 'balloon' },
  { emoji: '☂️', label: 'umbrella' }, { emoji: '🦋', label: 'butterfly' }, { emoji: '🐟', label: 'fish' },
];

const MEDIUM_ITEMS: { emoji: string; label: string }[] = [
  ...SIMPLE_ITEMS,
  { emoji: '🚀', label: 'rocket' }, { emoji: '🎸', label: 'guitar' }, { emoji: '🦁', label: 'lion' },
  { emoji: '🐘', label: 'elephant' }, { emoji: '✈️', label: 'airplane' }, { emoji: '🚂', label: 'train' },
  { emoji: '🐙', label: 'octopus' }, { emoji: '🦜', label: 'parrot' }, { emoji: '🎪', label: 'circus tent' },
  { emoji: '🏰', label: 'castle' },
];

const HARD_ITEMS: { emoji: string; label: string }[] = [
  ...MEDIUM_ITEMS,
  { emoji: '🦕', label: 'dinosaur' }, { emoji: '🐢', label: 'turtle' }, { emoji: '🦉', label: 'owl' },
  { emoji: '🦈', label: 'shark' }, { emoji: '🎻', label: 'violin' }, { emoji: '🏗️', label: 'crane' },
  { emoji: '⛵', label: 'sailboat' }, { emoji: '🎠', label: 'carousel' },
];

// ────────────────────────────────────────────────────────────────────
// Translations
// ────────────────────────────────────────────────────────────────────

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: { title: 'Shadow Match', matchShadow: 'Match each object to its shadow!', selectDifficulty: 'Choose your level', easy: 'Easy', medium: 'Medium', hard: 'Hard', easyDesc: '3 pairs, simple shapes', mediumDesc: '4 pairs, more objects', hardDesc: '5 pairs + timer', score: 'Score', level: 'Level', round: 'Round', timeLeft: 'Time', matched: 'Great match! ✨', objects: 'Objects', shadows: 'Shadows', levelComplete: 'Level Complete! ⭐', streak: 'streak', dragHint: 'Tap an object, then tap its shadow!', playAgain: 'Play Again' },
  he: { title: 'התאמת צללים', matchShadow: 'התאימו כל חפץ לצל שלו!', selectDifficulty: 'בחרו רמת קושי', easy: 'קל', medium: 'בינוני', hard: 'קשה', easyDesc: '3 זוגות, צורות פשוטות', mediumDesc: '4 זוגות, עוד חפצים', hardDesc: '5 זוגות + טיימר', score: 'ניקוד', level: 'שלב', round: 'סיבוב', timeLeft: 'זמן', matched: '!התאמה מעולה ✨', objects: 'חפצים', shadows: 'צללים', levelComplete: '!שלב הושלם ⭐', streak: 'רצף', dragHint: 'הקישו על חפץ, ואז על הצל שלו!', playAgain: 'שחקו שוב' },
  zh: { title: '影子配对', matchShadow: '将每个物品与它的影子配对！', selectDifficulty: '选择难度', easy: '简单', medium: '中等', hard: '困难', easyDesc: '3对，简单形状', mediumDesc: '4对，更多物品', hardDesc: '5对+计时器', score: '分数', level: '关卡', round: '回合', timeLeft: '时间', matched: '完美配对！✨', objects: '物品', shadows: '影子', levelComplete: '关卡完成！⭐', streak: '连击', dragHint: '点击一个物品，然后点击它的影子！', playAgain: '再玩一次' },
  es: { title: 'Sombras Iguales', matchShadow: '¡Empareja cada objeto con su sombra!', selectDifficulty: 'Elige tu nivel', easy: 'Fácil', medium: 'Medio', hard: 'Difícil', easyDesc: '3 pares, formas simples', mediumDesc: '4 pares, más objetos', hardDesc: '5 pares + temporizador', score: 'Puntos', level: 'Nivel', round: 'Ronda', timeLeft: 'Tiempo', matched: '¡Gran pareja! ✨', objects: 'Objetos', shadows: 'Sombras', levelComplete: '¡Nivel completo! ⭐', streak: 'racha', dragHint: '¡Toca un objeto y luego su sombra!', playAgain: 'Jugar de nuevo' },
};

const ITEM_LABELS: Record<string, Record<string, string>> = {
  en: { apple: 'Apple', star: 'Star', house: 'House', car: 'Car', cat: 'Cat', tree: 'Tree', ball: 'Ball', dog: 'Dog', balloon: 'Balloon', umbrella: 'Umbrella', butterfly: 'Butterfly', fish: 'Fish', rocket: 'Rocket', guitar: 'Guitar', lion: 'Lion', elephant: 'Elephant', airplane: 'Airplane', train: 'Train', octopus: 'Octopus', parrot: 'Parrot', 'circus tent': 'Circus Tent', castle: 'Castle', dinosaur: 'Dinosaur', turtle: 'Turtle', owl: 'Owl', shark: 'Shark', violin: 'Violin', crane: 'Crane', sailboat: 'Sailboat', carousel: 'Carousel' },
  he: { apple: 'תפוח', star: 'כוכב', house: 'בית', car: 'מכונית', cat: 'חתול', tree: 'עץ', ball: 'כדור', dog: 'כלב', balloon: 'בלון', umbrella: 'מטריה', butterfly: 'פרפר', fish: 'דג', rocket: 'רקטה', guitar: 'גיטרה', lion: 'אריה', elephant: 'פיל', airplane: 'מטוס', train: 'רכבת', octopus: 'תמנון', parrot: 'תוכי', 'circus tent': 'אוהל קרקס', castle: 'טירה', dinosaur: 'דינוזאור', turtle: 'צב', owl: 'ינשוף', shark: 'כריש', violin: 'כינור', crane: 'מנוף', sailboat: 'מפרשית', carousel: 'קרוסלה' },
  zh: { apple: '苹果', star: '星星', house: '房子', car: '汽车', cat: '猫', tree: '树', ball: '球', dog: '狗', balloon: '气球', umbrella: '雨伞', butterfly: '蝴蝶', fish: '鱼', rocket: '火箭', guitar: '吉他', lion: '狮子', elephant: '大象', airplane: '飞机', train: '火车', octopus: '章鱼', parrot: '鹦鹉', 'circus tent': '马戏团帐篷', castle: '城堡', dinosaur: '恐龙', turtle: '乌龟', owl: '猫头鹰', shark: '鲨鱼', violin: '小提琴', crane: '起重机', sailboat: '帆船', carousel: '旋转木马' },
  es: { apple: 'Manzana', star: 'Estrella', house: 'Casa', car: 'Coche', cat: 'Gato', tree: 'Árbol', ball: 'Pelota', dog: 'Perro', balloon: 'Globo', umbrella: 'Paraguas', butterfly: 'Mariposa', fish: 'Pez', rocket: 'Cohete', guitar: 'Guitarra', lion: 'León', elephant: 'Elefante', airplane: 'Avión', train: 'Tren', octopus: 'Pulpo', parrot: 'Loro', 'circus tent': 'Carpa de Circo', castle: 'Castillo', dinosaur: 'Dinosaurio', turtle: 'Tortuga', owl: 'Búho', shark: 'Tiburón', violin: 'Violín', crane: 'Grúa', sailboat: 'Velero', carousel: 'Carrusel' },
};

const INSTRUCTIONS_DATA: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '👤', title: 'Goal', description: 'Every object has a shadow! Your job is to figure out which shadow belongs to which object.' },
      { icon: '👀', title: 'Look Carefully', description: 'The shadows are dark silhouettes. Look at the shape — is it round like a ball? Tall like a tree? That\'s your clue!' },
      { icon: '👆', title: 'Match Them', description: 'First tap an object (the colorful one), then tap its matching shadow. Get it right and they disappear!' },
    ],
    controls: [
      { icon: '👆', description: 'Tap an object, then tap its shadow to match' },
      { icon: '⌨️', description: 'Press 1-5 to select objects, A-E for shadows' },
    ],
    tip: 'Look at the outline shape — a cat has pointy ears, a fish has a tail fin!',
  },
  he: {
    instructions: [
      { icon: '👤', title: 'מטרה', description: 'לכל חפץ יש צל! המשימה שלכם היא לגלות איזה צל שייך לאיזה חפץ.' },
      { icon: '👀', title: 'הסתכלו היטב', description: 'הצללים הם צלליות כהות. הסתכלו על הצורה — היא עגולה כמו כדור? גבוהה כמו עץ? זה הרמז!' },
      { icon: '👆', title: 'התאימו', description: 'הקישו על חפץ (הצבעוני), ואז הקישו על הצל שלו. תצליחו והם ייעלמו!' },
    ],
    controls: [
      { icon: '👆', description: 'הקישו על חפץ, ואז על הצל שלו להתאמה' },
      { icon: '⌨️', description: 'לחצו 1-5 לבחירת חפצים, A-E לצללים' },
    ],
    tip: 'הסתכלו על קו המתאר — לחתול יש אוזניים מחודדות, לדג יש סנפיר!',
  },
  zh: {
    instructions: [
      { icon: '👤', title: '目标', description: '每个物品都有影子！你要找出哪个影子属于哪个物品。' },
      { icon: '👀', title: '仔细看', description: '影子是黑色的轮廓。看看形状——像球一样圆？像树一样高？这就是线索！' },
      { icon: '👆', title: '配对', description: '先点击一个物品（彩色的那个），然后点击它的影子。配对成功它们就会消失！' },
    ],
    controls: [
      { icon: '👆', description: '点击物品，然后点击它的影子来配对' },
      { icon: '⌨️', description: '按1-5选择物品，A-E选择影子' },
    ],
    tip: '看看轮廓形状——猫有尖尖的耳朵，鱼有尾鳍！',
  },
  es: {
    instructions: [
      { icon: '👤', title: 'Objetivo', description: '¡Cada objeto tiene una sombra! Tu trabajo es descubrir qué sombra pertenece a cada objeto.' },
      { icon: '👀', title: 'Mira con cuidado', description: 'Las sombras son siluetas oscuras. Mira la forma — ¿es redonda como una pelota? ¿Alta como un árbol? ¡Esa es tu pista!' },
      { icon: '👆', title: 'Emparéjalos', description: 'Primero toca un objeto (el colorido), luego toca su sombra. ¡Si aciertas, desaparecen!' },
    ],
    controls: [
      { icon: '👆', description: 'Toca un objeto y luego su sombra para emparejar' },
      { icon: '⌨️', description: 'Presiona 1-5 para objetos, A-E para sombras' },
    ],
    tip: '¡Mira la silueta — un gato tiene orejas puntiagudas, un pez tiene aleta!',
  },
};

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getItemsForDifficulty(difficulty: Difficulty): { emoji: string; label: string }[] {
  switch (difficulty) {
    case 'easy': return SIMPLE_ITEMS;
    case 'medium': return MEDIUM_ITEMS;
    case 'hard': return HARD_ITEMS;
  }
}

function generateRound(difficulty: Difficulty, pairsCount: number): LevelRound {
  const pool = getItemsForDifficulty(difficulty);
  const selected = shuffleArray(pool).slice(0, pairsCount);
  const objects = selected.map((item, i) => ({ id: i, emoji: item.emoji, label: item.label }));
  const shadows = shuffleArray(objects.map((o) => ({ ...o })));
  return { objects, shadows };
}

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────

export function ShadowMatchGame() {
  const locale = useLocale();
  const t = UI_STRINGS[locale] || UI_STRINGS.en;
  const itemLabels = ITEM_LABELS[locale] || ITEM_LABELS.en;
  const isRtl = locale === 'he';

  const { playClick, playSuccess, playLevelUp, playHit, playWin, playMatch } = useRetroSounds();

  // State
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shadow-match-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [currentRound, setCurrentRound] = useState<LevelRound | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ objId: number; shadowId: number } | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showWin, setShowWin] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];
  const instrData = INSTRUCTIONS_DATA[locale] || INSTRUCTIONS_DATA.en;

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Timer for hard mode
  useEffect(() => {
    if (phase !== 'playing' || !config.showTimer || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time up — move to next round
          clearInterval(timer);
          advanceRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, config.showTimer, timeLeft]);

  const startNewRound = useCallback((diff: Difficulty, cfg: DifficultyConfig) => {
    setCurrentRound(generateRound(diff, cfg.pairsPerRound));
    setSelectedObjectId(null);
    setMatchedIds(new Set());
    setWrongPair(null);
    setPhase('playing');
    if (cfg.showTimer) setTimeLeft(cfg.timeLimit);
  }, []);

  const advanceRound = useCallback(() => {
    const newRound = round + 1;
    if (newRound > config.roundsPerLevel) {
      const newLevel = level + 1;
      if (newLevel > config.totalLevels) {
        playWin();
        setShowWin(true);
        setPhase('won');
      } else {
        playLevelUp();
        setLevel(newLevel);
        setRound(1);
        setPhase('levelComplete');
        setTimeout(() => startNewRound(difficulty, config), 1500);
      }
    } else {
      setRound(newRound);
      startNewRound(difficulty, config);
    }
  }, [round, level, config, difficulty, startNewRound, playLevelUp, playWin]);

  const startGame = useCallback((diff: Difficulty) => {
    playClick();
    setDifficulty(diff);
    setLevel(1);
    setRound(1);
    setScore(0);
    setStreak(0);
    setShowWin(false);
    const cfg = DIFFICULTY_CONFIG[diff];
    startNewRound(diff, cfg);
  }, [playClick, startNewRound]);

  // Handle object tap
  const handleObjectTap = useCallback((id: number) => {
    if (phase !== 'playing' || matchedIds.has(id)) return;
    playClick();
    setSelectedObjectId(id);
    setWrongPair(null);
  }, [phase, matchedIds, playClick]);

  // Handle shadow tap
  const handleShadowTap = useCallback((shadowId: number) => {
    if (phase !== 'playing' || selectedObjectId === null || matchedIds.has(shadowId)) return;

    if (selectedObjectId === shadowId) {
      // Correct match!
      playMatch();
      const newMatched = new Set(matchedIds);
      newMatched.add(shadowId);
      setMatchedIds(newMatched);

      const points = (10 + streak * 2) * config.scoreMultiplier;
      const newScore = score + points;
      setScore(newScore);
      setStreak((s) => s + 1);

      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('shadow-match-highscore', String(newScore));
      }

      setSelectedObjectId(null);
      setWrongPair(null);

      // Check if all matched
      if (newMatched.size === (currentRound?.objects.length || 0)) {
        playSuccess();
        feedbackTimeoutRef.current = setTimeout(() => advanceRound(), 1000);
      }
    } else {
      // Wrong match
      playHit();
      setStreak(0);
      setWrongPair({ objId: selectedObjectId, shadowId });
      feedbackTimeoutRef.current = setTimeout(() => {
        setWrongPair(null);
        setSelectedObjectId(null);
      }, 800);
    }
  }, [phase, selectedObjectId, matchedIds, currentRound, score, streak, config, highScore, advanceRound, playMatch, playSuccess, playHit]);

  // Keyboard support
  useEffect(() => {
    if (phase !== 'playing' || !currentRound) return;
    const handleKey = (e: KeyboardEvent) => {
      // Numbers 1-5 for objects
      const num = parseInt(e.key);
      if (num >= 1 && num <= currentRound.objects.length) {
        handleObjectTap(currentRound.objects[num - 1].id);
        return;
      }
      // Letters a-e for shadows
      const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };
      const shadowIdx = letterMap[e.key.toLowerCase()];
      if (shadowIdx !== undefined && shadowIdx < currentRound.shadows.length) {
        handleShadowTap(currentRound.shadows[shadowIdx].id);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, currentRound, handleObjectTap, handleShadowTap]);

  const handlePlayAgain = useCallback(() => {
    playClick();
    setPhase('menu');
    setShowWin(false);
  }, [playClick]);

  // ────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────

  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className={`container mx-auto px-4 py-6 max-w-3xl ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Difficulty Menu */}
        {phase === 'menu' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-white drop-shadow-md">{t.selectDifficulty}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <motion.button
                  key={diff}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startGame(diff)}
                  className="px-8 py-4 rounded-2xl text-xl font-bold text-white shadow-lg min-h-[48px] min-w-[48px]
                    bg-gradient-to-b from-white/30 to-white/10 border-2 border-white/40 hover:border-white/60 transition-all"
                >
                  <span className="text-2xl">{DIFFICULTY_EMOJI[diff]}</span>
                  <div>{t[diff]}</div>
                  <div className="text-sm opacity-80">{t[`${diff}Desc` as keyof typeof t]}</div>
                </motion.button>
              ))}
            </div>
            {highScore > 0 && (
              <p className="text-white/80 text-lg">🏆 {t.score}: {highScore}</p>
            )}
          </motion.div>
        )}

        {/* Playing */}
        {(phase === 'playing' || phase === 'matched') && currentRound && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header stats */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <LevelDisplay level={level} />
              <div className="flex gap-4 text-white font-bold text-lg">
                <span>⭐ {score}</span>
                {streak > 1 && <span className="text-yellow-200">🔥 {streak} {t.streak}</span>}
                <span>{t.round} {round}/{config.roundsPerLevel}</span>
                {config.showTimer && (
                  <span className={timeLeft <= 5 ? 'text-red-300 animate-pulse' : ''}>⏱️ {timeLeft}s</span>
                )}
              </div>
            </div>

            {/* Instruction hint */}
            <p className="text-center text-lg font-bold text-white/90 drop-shadow-md">{t.dragHint}</p>

            {/* Game area - two rows */}
            <div className="space-y-8">
              {/* Objects row */}
              <div>
                <h3 className="text-center text-white font-bold mb-3 text-lg">{t.objects} ✨</h3>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  {currentRound.objects.map((obj, idx) => {
                    const isMatched = matchedIds.has(obj.id);
                    const isSelected = selectedObjectId === obj.id;
                    const isWrong = wrongPair?.objId === obj.id;

                    return (
                      <motion.button
                        key={`obj-${obj.id}`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{
                          opacity: isMatched ? 0.3 : 1,
                          y: 0,
                          scale: isSelected ? 1.1 : isWrong ? [1, 0.9, 1] : 1,
                        }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={!isMatched ? { scale: 1.08, y: -4 } : {}}
                        whileTap={!isMatched ? { scale: 0.95 } : {}}
                        onClick={() => handleObjectTap(obj.id)}
                        disabled={isMatched}
                        className={`
                          relative flex flex-col items-center justify-center gap-1 p-3 sm:p-4 rounded-2xl
                          min-h-[80px] sm:min-h-[100px] min-w-[70px] sm:min-w-[80px] transition-all
                          ${isMatched ? 'bg-green-200/40 cursor-default' : isSelected ? 'bg-yellow-200/90 ring-4 ring-yellow-400 shadow-xl' : isWrong ? 'bg-red-200/70 ring-2 ring-red-400' : 'bg-white/90 hover:bg-white shadow-lg cursor-pointer'}
                        `}
                        aria-label={`${itemLabels[obj.label] || obj.label}${isSelected ? ' (selected)' : ''}${isMatched ? ' (matched)' : ''}`}
                      >
                        <span className="text-4xl sm:text-5xl">{isMatched ? '✅' : obj.emoji}</span>
                        <span className="text-xs font-medium text-slate-600">{itemLabels[obj.label] || obj.label}</span>
                        <span className="absolute top-1 left-2 text-xs text-slate-400 font-mono">{idx + 1}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-0.5 bg-white/30 rounded" />
                <span className="text-white text-2xl">👤</span>
                <div className="flex-1 h-0.5 bg-white/30 rounded" />
              </div>

              {/* Shadows row */}
              <div>
                <h3 className="text-center text-white font-bold mb-3 text-lg">{t.shadows} 👤</h3>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  {currentRound.shadows.map((shadow, idx) => {
                    const isMatched = matchedIds.has(shadow.id);
                    const isWrong = wrongPair?.shadowId === shadow.id;
                    const keys = ['A', 'B', 'C', 'D', 'E'];

                    return (
                      <motion.button
                        key={`shadow-${shadow.id}-${idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: isMatched ? 0.3 : 1,
                          y: 0,
                          scale: isWrong ? [1, 0.9, 1] : 1,
                        }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={!isMatched && selectedObjectId !== null ? { scale: 1.08, y: -4 } : {}}
                        whileTap={!isMatched ? { scale: 0.95 } : {}}
                        onClick={() => handleShadowTap(shadow.id)}
                        disabled={isMatched || selectedObjectId === null}
                        className={`
                          relative flex flex-col items-center justify-center gap-1 p-3 sm:p-4 rounded-2xl
                          min-h-[80px] sm:min-h-[100px] min-w-[70px] sm:min-w-[80px] transition-all
                          ${isMatched ? 'bg-green-200/40 cursor-default' : isWrong ? 'bg-red-200/70 ring-2 ring-red-400' : selectedObjectId !== null ? 'bg-slate-700/80 hover:bg-slate-600/80 shadow-lg cursor-pointer ring-2 ring-white/30' : 'bg-slate-800/70 shadow-lg cursor-not-allowed'}
                        `}
                        aria-label={`Shadow of ${itemLabels[shadow.label] || shadow.label}${isMatched ? ' (matched)' : ''}`}
                        style={{ filter: isMatched ? 'none' : 'brightness(0) opacity(0.85)' }}
                      >
                        <span className="text-4xl sm:text-5xl">{isMatched ? '✅' : shadow.emoji}</span>
                        <span className="text-xs font-medium text-white/50">?</span>
                        <span className="absolute top-1 left-2 text-xs text-white/40 font-mono">{keys[idx]}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Level Complete */}
        {phase === 'levelComplete' && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-12">
            <p className="text-5xl">⭐</p>
            <p className="text-3xl font-bold text-white drop-shadow-lg">{t.levelComplete}</p>
            <p className="text-xl text-white/80">{t.score}: {score}</p>
          </motion.div>
        )}
      </div>

      {/* Win Modal */}
      <WinModal isOpen={showWin} onPlayAgain={handlePlayAgain} score={score} />

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={t.title}
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />
    </GameWrapper>
  );
}
