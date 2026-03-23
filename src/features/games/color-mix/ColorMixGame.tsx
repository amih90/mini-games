'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { WinModal } from '../shared/WinModal';
import { InstructionsModal } from '../shared/InstructionsModal';
import { LevelDisplay } from '../shared/LevelDisplay';
import { usePlayAgainKey } from '../shared/usePlayAgainKey';
import { useRetroSounds } from '@/hooks/useRetroSounds';

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'menu' | 'playing' | 'levelComplete' | 'won';

interface PrimaryColor {
  id: string;
  name: string;
  hex: string;
  emoji: string;
}

interface MixRecipe {
  ingredients: string[]; // color ids
  result: string;
  resultHex: string;
  resultEmoji: string;
}

interface Challenge {
  targetName: string;
  targetHex: string;
  targetEmoji: string;
  recipe: MixRecipe;
}

interface DifficultyConfig {
  totalLevels: number;
  challengesPerLevel: number;
  availableColors: string[];
  recipes: MixRecipe[];
  scoreMultiplier: number;
  maxIngredients: number;
}

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────

const PRIMARY_COLORS: PrimaryColor[] = [
  { id: 'red', name: 'red', hex: '#EF4444', emoji: '🔴' },
  { id: 'blue', name: 'blue', hex: '#3B82F6', emoji: '🔵' },
  { id: 'yellow', name: 'yellow', hex: '#FACC15', emoji: '🟡' },
  { id: 'white', name: 'white', hex: '#F9FAFB', emoji: '⚪' },
  { id: 'black', name: 'black', hex: '#1F2937', emoji: '⚫' },
];

const ALL_RECIPES: MixRecipe[] = [
  // Primary mixes (2 colors)
  { ingredients: ['red', 'blue'], result: 'purple', resultHex: '#A855F7', resultEmoji: '🟣' },
  { ingredients: ['red', 'yellow'], result: 'orange', resultHex: '#F97316', resultEmoji: '🟠' },
  { ingredients: ['blue', 'yellow'], result: 'green', resultHex: '#22C55E', resultEmoji: '🟢' },
  // Tints and shades (2 colors)
  { ingredients: ['red', 'white'], result: 'pink', resultHex: '#F9A8D4', resultEmoji: '🩷' },
  { ingredients: ['blue', 'white'], result: 'light blue', resultHex: '#93C5FD', resultEmoji: '🩵' },
  { ingredients: ['red', 'black'], result: 'dark red', resultHex: '#991B1B', resultEmoji: '🔴' },
  { ingredients: ['blue', 'black'], result: 'dark blue', resultHex: '#1E3A5F', resultEmoji: '🔵' },
  { ingredients: ['yellow', 'white'], result: 'cream', resultHex: '#FEF9C3', resultEmoji: '🟡' },
];

// 3-ingredient recipes for hard mode
const TRIPLE_RECIPES: MixRecipe[] = [
  { ingredients: ['red', 'blue', 'yellow'], result: 'brown', resultHex: '#92400E', resultEmoji: '🟤' },
  { ingredients: ['red', 'yellow', 'white'], result: 'peach', resultHex: '#FDBA74', resultEmoji: '🍑' },
  { ingredients: ['blue', 'yellow', 'white'], result: 'mint', resultHex: '#A7F3D0', resultEmoji: '🌿' },
  { ingredients: ['red', 'blue', 'white'], result: 'lavender', resultHex: '#C4B5FD', resultEmoji: '💜' },
  { ingredients: ['red', 'yellow', 'black'], result: 'olive', resultHex: '#854D0E', resultEmoji: '🫒' },
  { ingredients: ['blue', 'yellow', 'black'], result: 'dark green', resultHex: '#14532D', resultEmoji: '🌲' },
  { ingredients: ['red', 'blue', 'black'], result: 'dark purple', resultHex: '#581C87', resultEmoji: '🔮' },
];

const EASY_RECIPES = ALL_RECIPES.filter(r =>
  ['purple', 'orange', 'green'].includes(r.result)
);

const MEDIUM_RECIPES = ALL_RECIPES;

const HARD_RECIPES = [...ALL_RECIPES, ...TRIPLE_RECIPES];

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    totalLevels: 3,
    challengesPerLevel: 8,
    availableColors: ['red', 'blue', 'yellow'],
    recipes: EASY_RECIPES,
    scoreMultiplier: 1,
    maxIngredients: 2,
  },
  medium: {
    totalLevels: 3,
    challengesPerLevel: 10,
    availableColors: ['red', 'blue', 'yellow', 'white', 'black'],
    recipes: MEDIUM_RECIPES,
    scoreMultiplier: 2,
    maxIngredients: 2,
  },
  hard: {
    totalLevels: 4,
    challengesPerLevel: 12,
    availableColors: ['red', 'blue', 'yellow', 'white', 'black'],
    recipes: HARD_RECIPES,
    scoreMultiplier: 3,
    maxIngredients: 3,
  },
};

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  easy: '🟢',
  medium: '🟡',
  hard: '🔴',
};

// ────────────────────────────────────────────────────────────────────
// Localized strings
// ────────────────────────────────────────────────────────────────────

const COLOR_NAMES: Record<string, Record<string, string>> = {
  en: { red: 'Red', blue: 'Blue', yellow: 'Yellow', white: 'White', black: 'Black', purple: 'Purple', orange: 'Orange', green: 'Green', pink: 'Pink', 'light blue': 'Light Blue', 'dark red': 'Dark Red', 'dark blue': 'Dark Blue', cream: 'Cream', brown: 'Brown', peach: 'Peach', mint: 'Mint', lavender: 'Lavender', olive: 'Olive', 'dark green': 'Dark Green', 'dark purple': 'Dark Purple' },
  he: { red: 'אדום', blue: 'כחול', yellow: 'צהוב', white: 'לבן', black: 'שחור', purple: 'סגול', orange: 'כתום', green: 'ירוק', pink: 'ורוד', 'light blue': 'תכלת', 'dark red': 'אדום כהה', 'dark blue': 'כחול כהה', cream: 'שמנת', brown: 'חום', peach: 'אפרסק', mint: 'מנטה', lavender: 'לבנדר', olive: 'זית', 'dark green': 'ירוק כהה', 'dark purple': 'סגול כהה' },
  zh: { red: '红色', blue: '蓝色', yellow: '黄色', white: '白色', black: '黑色', purple: '紫色', orange: '橙色', green: '绿色', pink: '粉红色', 'light blue': '浅蓝色', 'dark red': '深红色', 'dark blue': '深蓝色', cream: '奶油色', brown: '棕色', peach: '桃色', mint: '薄荷色', lavender: '薰衣草色', olive: '橄榄色', 'dark green': '深绿色', 'dark purple': '深紫色' },
  es: { red: 'Rojo', blue: 'Azul', yellow: 'Amarillo', white: 'Blanco', black: 'Negro', purple: 'Morado', orange: 'Naranja', green: 'Verde', pink: 'Rosa', 'light blue': 'Celeste', 'dark red': 'Rojo oscuro', 'dark blue': 'Azul oscuro', cream: 'Crema', brown: 'Marrón', peach: 'Melocotón', mint: 'Menta', lavender: 'Lavanda', olive: 'Oliva', 'dark green': 'Verde oscuro', 'dark purple': 'Morado oscuro' },
};

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: { title: 'Color Lab', make: 'Make', mixButton: 'Mix!', tryAgain: 'Try Again', great: 'Great job!', correct: 'Correct!', wrong: 'Oops! Try different colors!', pick: 'Pick colors to mix', nextChallenge: 'Next Challenge!', selectDifficulty: 'Choose your level', easy: 'Easy', medium: 'Medium', hard: 'Hard', score: 'Score', level: 'Level', challenge: 'Challenge', mixingBowl: 'Mixing Bowl', plus: '+', equals: '=', streak: 'streak', hint: 'Hint', hintMsg: 'This color needs {n} ingredients!', discovered: 'Discovered', newColor: 'New color discovered!', easyDesc: '3 colors, simple mixes', mediumDesc: '5 colors, tints & shades', hardDesc: '3-color combos!' },
  he: { title: 'מעבדת הצבעים', make: 'צרו', mixButton: '!ערבבו', tryAgain: 'נסו שוב', great: '!כל הכבוד', correct: '!נכון', wrong: '!אופס! נסו צבעים אחרים', pick: 'בחרו צבעים לערבוב', nextChallenge: '!אתגר הבא', selectDifficulty: 'בחרו רמת קושי', easy: 'קל', medium: 'בינוני', hard: 'קשה', score: 'ניקוד', level: 'שלב', challenge: 'אתגר', mixingBowl: 'קערת ערבוב', plus: '+', equals: '=', streak: 'רצף', hint: 'רמז', hintMsg: 'לצבע הזה צריך {n} מרכיבים!', discovered: 'התגלו', newColor: '!צבע חדש התגלה', easyDesc: '3 צבעים, ערבובים פשוטים', mediumDesc: '5 צבעים, גוונים בהירים וכהים', hardDesc: '!שילובי 3 צבעים' },
  zh: { title: '色彩实验室', make: '调出', mixButton: '混合！', tryAgain: '再试一次', great: '太棒了！', correct: '正确！', wrong: '哎呀！试试其他颜色！', pick: '选择颜色来混合', nextChallenge: '下一个挑战！', selectDifficulty: '选择难度', easy: '简单', medium: '中等', hard: '困难', score: '分数', level: '关卡', challenge: '挑战', mixingBowl: '调色盘', plus: '+', equals: '=', streak: '连击', hint: '提示', hintMsg: '这个颜色需要{n}种原料！', discovered: '已发现', newColor: '发现新颜色！', easyDesc: '3种颜色，简单混合', mediumDesc: '5种颜色，色调和阴影', hardDesc: '3色组合！' },
  es: { title: 'Laboratorio de Colores', make: 'Crea', mixButton: '¡Mezclar!', tryAgain: 'Intentar de nuevo', great: '¡Buen trabajo!', correct: '¡Correcto!', wrong: '¡Ups! ¡Prueba otros colores!', pick: 'Elige colores para mezclar', nextChallenge: '¡Siguiente reto!', selectDifficulty: 'Elige tu nivel', easy: 'Fácil', medium: 'Medio', hard: 'Difícil', score: 'Puntos', level: 'Nivel', challenge: 'Reto', mixingBowl: 'Paleta de mezcla', plus: '+', equals: '=', streak: 'racha', hint: 'Pista', hintMsg: '¡Este color necesita {n} ingredientes!', discovered: 'Descubiertos', newColor: '¡Nuevo color descubierto!', easyDesc: '3 colores, mezclas simples', mediumDesc: '5 colores, tintes y sombras', hardDesc: '¡Combos de 3 colores!' },
};

// ────────────────────────────────────────────────────────────────────
// Instructions
// ────────────────────────────────────────────────────────────────────

const INSTRUCTIONS_DATA: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '🎨', title: 'Goal', description: 'You\'re a color scientist! Mix paint colors together to create the target color shown on screen.' },
      { icon: '🧪', title: 'How to Play', description: 'Click on color tubes to select them for mixing. Then press the Mix button to combine them!' },
      { icon: '✨', title: 'Color Magic', description: 'Red + Blue = Purple, Red + Yellow = Orange, Blue + Yellow = Green. In hard mode, mix 3 colors to make brown, lavender, and more!' },
      { icon: '🔥', title: 'Streaks & Discovery', description: 'Get correct answers in a row to build a streak and earn bonus points! Discover new colors and fill your recipe book!' },
    ],
    controls: [
      { icon: '🖱️', description: 'Click or tap on color tubes to select them' },
      { icon: '🔄', description: 'Click a selected color again to deselect it' },
      { icon: '🧪', description: 'Press Mix to combine your selected colors' },
      { icon: '💡', description: 'After 2 wrong tries, a hint appears!' },
    ],
    tip: 'In hard mode, some colors need 3 ingredients — Red + Blue + Yellow = Brown!',
  },
  he: {
    instructions: [
      { icon: '🎨', title: 'מטרה', description: 'אתם מדענים של צבעים! ערבבו צבעי צבע כדי ליצור את הצבע המבוקש על המסך.' },
      { icon: '🧪', title: 'איך לשחק', description: 'לחצו על שפופרות צבע כדי לבחור אותן לערבוב. אז לחצו על כפתור הערבוב!' },
      { icon: '✨', title: 'קסם הצבעים', description: 'אדום + כחול = סגול, אדום + צהוב = כתום, כחול + צהוב = ירוק. ברמה קשה, ערבבו 3 צבעים ליצירת חום, לבנדר ועוד!' },
      { icon: '🔥', title: 'רצפים וגילויים', description: 'ענו נכון ברצף כדי לקבל בונוס נקודות! גלו צבעים חדשים ומלאו את ספר המתכונים!' },
    ],
    controls: [
      { icon: '🖱️', description: 'לחצו על שפופרות צבע כדי לבחור אותן' },
      { icon: '🔄', description: 'לחצו שוב על צבע נבחר כדי לבטל בחירה' },
      { icon: '🧪', description: 'לחצו ערבבו כדי לשלב את הצבעים' },
      { icon: '💡', description: 'אחרי 2 טעויות, מופיע רמז!' },
    ],
    tip: 'ברמה קשה, חלק מהצבעים צריכים 3 מרכיבים — אדום + כחול + צהוב = חום!',
  },
  zh: {
    instructions: [
      { icon: '🎨', title: '目标', description: '你是一位色彩科学家！混合颜料颜色来创造屏幕上显示的目标颜色。' },
      { icon: '🧪', title: '怎么玩', description: '点击颜料管来选择它们进行混合。然后按下混合按钮来组合它们！' },
      { icon: '✨', title: '颜色魔法', description: '红+蓝=紫，红+黄=橙，蓝+黄=绿。在困难模式下，混合3种颜色制作棕色、薰衣草色等！' },
      { icon: '🔥', title: '连击与发现', description: '连续答对可以获得连击奖励分数！发现新颜色并填满你的配方书！' },
    ],
    controls: [
      { icon: '🖱️', description: '点击颜料管来选择' },
      { icon: '🔄', description: '再次点击已选颜色来取消选择' },
      { icon: '🧪', description: '按混合按钮来组合颜色' },
      { icon: '💡', description: '连续错2次后会出现提示！' },
    ],
    tip: '在困难模式下，有些颜色需要3种原料——红+蓝+黄=棕色！',
  },
  es: {
    instructions: [
      { icon: '🎨', title: 'Objetivo', description: '¡Eres un científico del color! Mezcla colores de pintura para crear el color objetivo en la pantalla.' },
      { icon: '🧪', title: 'Cómo jugar', description: 'Haz clic en los tubos de pintura para seleccionarlos. ¡Luego presiona el botón Mezclar para combinarlos!' },
      { icon: '✨', title: 'Magia del Color', description: 'Rojo + Azul = Morado, Rojo + Amarillo = Naranja, Azul + Amarillo = Verde. ¡En modo difícil, mezcla 3 colores para hacer marrón, lavanda y más!' },
      { icon: '🔥', title: 'Rachas y Descubrimiento', description: '¡Acierta en racha para ganar puntos extra! ¡Descubre nuevos colores y llena tu libro de recetas!' },
    ],
    controls: [
      { icon: '🖱️', description: 'Clic o toca los tubos de pintura para seleccionar' },
      { icon: '🔄', description: 'Clic en un color seleccionado para deseleccionar' },
      { icon: '🧪', description: 'Presiona Mezclar para combinar los colores' },
      { icon: '💡', description: '¡Después de 2 errores aparece una pista!' },
    ],
    tip: '¡En modo difícil, algunos colores necesitan 3 ingredientes — Rojo + Azul + Amarillo = Marrón!',
  },
};

// ────────────────────────────────────────────────────────────────────
// Helper functions
// ────────────────────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateChallenges(config: DifficultyConfig, count: number): Challenge[] {
  const shuffled = shuffleArray(config.recipes);
  const challenges: Challenge[] = [];
  for (let i = 0; i < count; i++) {
    const recipe = shuffled[i % shuffled.length];
    challenges.push({
      targetName: recipe.result,
      targetHex: recipe.resultHex,
      targetEmoji: recipe.resultEmoji,
      recipe,
    });
  }
  return challenges;
}

function checkMix(selected: string[], recipe: MixRecipe): boolean {
  if (selected.length !== recipe.ingredients.length) return false;
  const sorted1 = [...selected].sort();
  const sorted2 = [...recipe.ingredients].sort();
  return sorted1.every((s, i) => s === sorted2[i]);
}

function findMatchingRecipe(selected: string[], recipes: MixRecipe[]): MixRecipe | null {
  for (const recipe of recipes) {
    if (checkMix(selected, recipe)) return recipe;
  }
  return null;
}

// ────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────

function PaintTube({
  color,
  isSelected,
  onClick,
  disabled,
  locale,
}: {
  color: PrimaryColor;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
  locale: string;
}) {
  const colorNames = COLOR_NAMES[locale] || COLOR_NAMES.en;

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.08, y: -4 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={isSelected ? { scale: 1.1, y: -6, boxShadow: `0 8px 30px ${color.hex}80` } : { scale: 1, y: 0 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all min-h-[44px] min-w-[44px]
        ${isSelected
          ? 'ring-2 sm:ring-4 ring-offset-1 sm:ring-offset-2 ring-yellow-400 bg-white/90 shadow-xl'
          : 'bg-white/70 hover:bg-white/90 shadow-md'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-label={`${colorNames[color.name]} paint tube${isSelected ? ' (selected)' : ''}`}
      aria-pressed={isSelected}
    >
      {/* Paint tube visual */}
      <div className="relative">
        <div
          className="w-10 h-14 sm:w-16 sm:h-24 rounded-t-lg sm:rounded-t-xl rounded-b-2xl sm:rounded-b-3xl border-2 border-white/50 shadow-inner"
          style={{ backgroundColor: color.hex }}
        >
          {/* Tube cap */}
          <div
            className="absolute -top-1.5 sm:-top-2 left-1/2 -translate-x-1/2 w-4 sm:w-6 h-3 sm:h-4 rounded-t-lg"
            style={{ backgroundColor: color.hex, filter: 'brightness(0.8)' }}
          />
          {/* Shine effect */}
          <div className="absolute top-2 sm:top-3 left-1.5 sm:left-2 w-1.5 sm:w-2 h-5 sm:h-8 bg-white/30 rounded-full" />
        </div>
        {/* Selected checkmark */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-7 sm:h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-md"
          >
            <span className="text-xs sm:text-sm">✓</span>
          </motion.div>
        )}
      </div>
      <span className="text-[10px] sm:text-sm font-bold text-gray-700 leading-tight">{colorNames[color.name]}</span>
    </motion.button>
  );
}

function MixingBowl({
  selectedColors,
  mixResult,
  isAnimating,
}: {
  selectedColors: PrimaryColor[];
  mixResult: { hex: string; name: string; emoji: string } | null;
  isAnimating: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Bowl */}
      <motion.div
        animate={isAnimating ? { rotate: [0, -5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="relative w-24 h-18 sm:w-40 sm:h-28"
      >
        {/* Bowl shape */}
        <div className="absolute bottom-0 w-full h-16 sm:h-24 bg-gray-200 rounded-b-[50%] rounded-t-lg border-2 sm:border-4 border-gray-300 overflow-hidden shadow-inner">
          {/* Color in bowl */}
          <AnimatePresence mode="wait">
            {mixResult ? (
              <motion.div
                key="result"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="absolute inset-0 rounded-b-[50%]"
                style={{ backgroundColor: mixResult.hex }}
              >
                {/* Bubbling effect */}
                <motion.div
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute top-2 left-1/4 w-3 h-3 bg-white/30 rounded-full"
                />
                <motion.div
                  animate={{ y: [2, -2, 2] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute top-4 right-1/3 w-2 h-2 bg-white/20 rounded-full"
                />
              </motion.div>
            ) : selectedColors.length > 0 ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="absolute inset-0 flex"
              >
                {selectedColors.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex-1 h-full"
                    style={{
                      backgroundColor: c.hex,
                      borderRadius: i === 0 ? '0 0 0 50%' : i === selectedColors.length - 1 ? '0 0 50% 0' : undefined,
                    }}
                  />
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        {/* Bowl rim */}
        <div className="absolute top-0 w-full h-4 bg-gray-300 rounded-t-lg border-2 border-gray-400" />
      </motion.div>
    </div>
  );
}

function TargetDisplay({
  challenge,
  locale,
  strings,
}: {
  challenge: Challenge;
  locale: string;
  strings: Record<string, string>;
}) {
  const colorNames = COLOR_NAMES[locale] || COLOR_NAMES.en;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-1.5 sm:gap-3 px-4 py-3 sm:p-6 bg-white/80 rounded-2xl sm:rounded-3xl shadow-lg backdrop-blur-sm"
    >
      <span className="text-sm sm:text-lg font-bold text-gray-600">{strings.make}:</span>
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-14 h-14 sm:w-24 sm:h-24 rounded-full border-3 sm:border-4 border-white shadow-xl flex items-center justify-center"
        style={{ backgroundColor: challenge.targetHex }}
      >
        <span className="text-2xl sm:text-4xl">{challenge.targetEmoji}</span>
      </motion.div>
      <span className="text-base sm:text-xl font-bold text-gray-800">
        {colorNames[challenge.targetName] || challenge.targetName}
      </span>
    </motion.div>
  );
}

function FeedbackOverlay({
  type,
  strings,
}: {
  type: 'correct' | 'wrong' | null;
  strings: Record<string, string>;
}) {
  return (
    <AnimatePresence>
      {type && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
            className={`
              text-center px-8 py-5 sm:px-12 sm:py-8 rounded-2xl sm:rounded-3xl shadow-2xl mx-4
              ${type === 'correct' ? 'bg-green-100 border-4 border-green-400' : 'bg-red-100 border-4 border-red-400'}
            `}
          >
            <span className="text-4xl sm:text-6xl block mb-2">
              {type === 'correct' ? '🎉' : '🤔'}
            </span>
            <span className={`text-2xl font-bold ${type === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
              {type === 'correct' ? strings.correct : strings.wrong}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FormulaDisplay({
  selectedColors,
  mixResult,
  locale,
  strings,
}: {
  selectedColors: PrimaryColor[];
  mixResult: { hex: string; name: string; emoji: string } | null;
  locale: string;
  strings: Record<string, string>;
}) {
  const colorNames = COLOR_NAMES[locale] || COLOR_NAMES.en;

  if (selectedColors.length === 0 && !mixResult) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-1 sm:gap-3 text-sm sm:text-xl font-bold text-gray-700 flex-wrap"
    >
      {selectedColors.map((c, i) => (
        <span key={c.id} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-400 mx-1">{strings.plus}</span>}
          <span
            className="inline-block w-4 h-4 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: c.hex }}
          />
          <span className="text-xs sm:text-base">{colorNames[c.name]}</span>
        </span>
      ))}
      {mixResult && (
        <>
          <span className="text-gray-400 mx-1">{strings.equals}</span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-4 h-4 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: mixResult.hex }}
            />
            <span className="text-xs sm:text-base">{colorNames[mixResult.name] || mixResult.name}</span>
          </span>
        </>
      )}
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Celebration particles
// ────────────────────────────────────────────────────────────────────

function CelebrationParticles({ color }: { color: string }) {
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 300 - 150,
    y: -(Math.random() * 200 + 100),
    rotate: Math.random() * 720 - 360,
    scale: Math.random() * 0.5 + 0.5,
    delay: Math.random() * 0.3,
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: p.scale, rotate: p.rotate, opacity: 0 }}
          transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Main game component
// ────────────────────────────────────────────────────────────────────

export function ColorMixGame() {
  const t = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'he';
  const strings = UI_STRINGS[locale] || UI_STRINGS.en;
  const { playClick, playSuccess, playDrop } = useRetroSounds();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [mixResult, setMixResult] = useState<{ hex: string; name: string; emoji: string } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Joy features state
  const [streak, setStreak] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [discoveredColors, setDiscoveredColors] = useState<Set<string>>(new Set());
  const [showNewDiscovery, setShowNewDiscovery] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];
  const currentChallenge = challenges[challengeIndex];
  const availableColors = PRIMARY_COLORS.filter(c => config.availableColors.includes(c.id));
  const selectedColors = selected.map(id => PRIMARY_COLORS.find(c => c.id === id)!).filter(Boolean);

  // Start game
  const startGame = useCallback((diff: Difficulty) => {
    playClick();
    setDifficulty(diff);
    setLevel(1);
    setChallengeIndex(0);
    setScore(0);
    setSelected([]);
    setMixResult(null);
    setFeedback(null);
    setStreak(0);
    setConsecutiveWrong(0);
    setDiscoveredColors(new Set());
    setShowNewDiscovery(false);
    const cfg = DIFFICULTY_CONFIG[diff];
    setChallenges(generateChallenges(cfg, cfg.challengesPerLevel));
    setPhase('playing');
  }, [playClick]);

  // Reset game
  const resetGame = useCallback(() => {
    setPhase('menu');
    setLevel(1);
    setChallengeIndex(0);
    setScore(0);
    setSelected([]);
    setMixResult(null);
    setFeedback(null);
    setChallenges([]);
    setShowCelebration(false);
    setStreak(0);
    setConsecutiveWrong(0);
    setDiscoveredColors(new Set());
    setShowNewDiscovery(false);
  }, []);

  // Play again key handler
  usePlayAgainKey(phase === 'won', resetGame);

  // Select a color
  const toggleColor = useCallback((colorId: string) => {
    if (isAnimating || feedback) return;
    playClick();

    setSelected(prev => {
      if (prev.includes(colorId)) {
        return prev.filter(id => id !== colorId);
      }
      if (prev.length >= config.maxIngredients) {
        return [...prev.slice(1), colorId];
      }
      return [...prev, colorId];
    });
    setMixResult(null);
  }, [isAnimating, feedback, playClick, config.maxIngredients]);

  // Mix colors
  const handleMix = useCallback(() => {
    if (selected.length < 2 || isAnimating || !currentChallenge) return;
    playClick();
    setIsAnimating(true);

    // Find what the mix produces (search all recipes in current difficulty)
    const matchedRecipe = findMatchingRecipe(selected, config.recipes);

    setTimeout(() => {
      if (matchedRecipe) {
        setMixResult({ hex: matchedRecipe.resultHex, name: matchedRecipe.result, emoji: matchedRecipe.resultEmoji });
      }

      setTimeout(() => {
        const isCorrect = checkMix(selected, currentChallenge.recipe);

        if (isCorrect) {
          playSuccess();
          setFeedback('correct');
          setShowCelebration(true);
          setConsecutiveWrong(0);

          // Streak bonus
          const newStreak = streak + 1;
          setStreak(newStreak);
          const streakBonus = newStreak >= 3 ? Math.min(newStreak, 5) * 25 : 0;
          setScore(prev => prev + 100 * config.scoreMultiplier + streakBonus);

          // Discovery tracking
          const colorName = currentChallenge.recipe.result;
          setDiscoveredColors(prev => {
            const next = new Set(prev);
            if (!next.has(colorName)) {
              setShowNewDiscovery(true);
              setTimeout(() => setShowNewDiscovery(false), 2000);
            }
            next.add(colorName);
            return next;
          });

          setTimeout(() => {
            setFeedback(null);
            setShowCelebration(false);
            setSelected([]);
            setMixResult(null);
            setIsAnimating(false);

            // Next challenge or next level
            const nextIndex = challengeIndex + 1;
            if (nextIndex >= config.challengesPerLevel) {
              // Level complete
              const nextLevel = level + 1;
              if (nextLevel > config.totalLevels) {
                // All levels complete!
                setPhase('won');
              } else {
                setLevel(nextLevel);
                setChallengeIndex(0);
                setChallenges(generateChallenges(config, config.challengesPerLevel));
                setPhase('levelComplete');
                setTimeout(() => setPhase('playing'), 1500);
              }
            } else {
              setChallengeIndex(nextIndex);
            }
          }, 1500);
        } else {
          playDrop();
          setFeedback('wrong');
          setStreak(0);
          setConsecutiveWrong(prev => prev + 1);
          setTimeout(() => {
            setFeedback(null);
            setSelected([]);
            setMixResult(null);
            setIsAnimating(false);
          }, 1500);
        }
      }, 600);
    }, 600);
  }, [selected, isAnimating, currentChallenge, config, challengeIndex, level, streak, playClick, playSuccess, playDrop]);

  // Keyboard Mix shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && phase === 'playing' && selected.length >= 2) {
        handleMix();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleMix, phase, selected.length]);

  // ── Render ──────────────────────────────────────────────────────

  const instrData = INSTRUCTIONS_DATA[locale] || INSTRUCTIONS_DATA.en;

  // MENU
  if (phase === 'menu') {
    return (
      <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          title={strings.title}
          instructions={instrData.instructions}
          controls={instrData.controls}
          tip={instrData.tip}
          locale={locale}
        />

        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 p-4" dir={isRtl ? 'rtl' : 'ltr'}>
          {/* Hero */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <span className="text-7xl sm:text-8xl block mb-4">🧪</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
              {strings.title}
            </h2>
          </motion.div>

          {/* Color preview animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3"
          >
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500 shadow-lg" />
            <span className="text-2xl sm:text-3xl text-white font-bold">+</span>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.3 }} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500 shadow-lg" />
            <span className="text-2xl sm:text-3xl text-white font-bold">=</span>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.6 }} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-500 shadow-lg border-4 border-yellow-300" />
          </motion.div>

          {/* Difficulty selection */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            <span className="text-xl font-bold text-white/90">{strings.selectDifficulty}</span>
            <div className="flex gap-4 flex-wrap justify-center">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <motion.button
                  key={diff}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startGame(diff)}
                  className="px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/90 shadow-lg hover:shadow-xl transition-shadow text-base sm:text-lg font-bold min-h-[44px] min-w-[44px] focus:outline-none focus:ring-4 focus:ring-yellow-300 flex flex-col items-center gap-1"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">{DIFFICULTY_EMOJI[diff]}</span>
                    {strings[diff]}
                  </span>
                  <span className="text-xs font-normal text-gray-500">
                    {strings[`${diff}Desc`]}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </GameWrapper>
    );
  }

  // LEVEL COMPLETE
  if (phase === 'levelComplete') {
    return (
      <GameWrapper title={strings.title}>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <span className="text-7xl block mb-4">🌟</span>
            <h2 className="text-3xl font-bold text-white drop-shadow-lg">{strings.great}</h2>
            <p className="text-xl text-white/80 mt-2">{strings.level} {level}</p>
          </motion.div>
        </div>
      </GameWrapper>
    );
  }

  // WON
  if (phase === 'won') {
    return (
      <GameWrapper title={strings.title}>
        <div className="flex items-center justify-center min-h-[80vh]">
          <WinModal isOpen onPlayAgain={resetGame} score={score} />
        </div>
      </GameWrapper>
    );
  }

  // PLAYING
  return (
    <GameWrapper title={strings.title} onInstructionsClick={() => setShowInstructions(true)}>
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={strings.title}
        instructions={instrData.instructions}
        controls={instrData.controls}
        tip={instrData.tip}
        locale={locale}
      />

      <FeedbackOverlay type={feedback} strings={strings} />

      <div className="flex flex-col items-center gap-2 sm:gap-6 p-2 sm:p-6 pb-4 sm:pb-8 min-h-[80vh] w-full max-w-3xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* HUD: Level + Score + Challenge counter */}
        <div className="flex items-center justify-between w-full gap-2">
          <LevelDisplay level={level} isRtl={isRtl} locale={locale} />
          <div className="flex items-center gap-1.5 sm:gap-4">
            <div className="px-2 sm:px-4 py-1 sm:py-2 bg-white/80 rounded-full shadow font-bold text-gray-700 text-xs sm:text-base whitespace-nowrap">
              {strings.challenge} {challengeIndex + 1}/{config.challengesPerLevel}
            </div>
            <div className="px-2 sm:px-4 py-1 sm:py-2 bg-yellow-300 rounded-full shadow font-bold text-gray-800 text-xs sm:text-base whitespace-nowrap">
              {strings.score}: {score}
            </div>
          </div>
        </div>

        {/* Streak indicator + Discovered counter */}
        <div className="flex items-center gap-2 sm:gap-4">
          {streak >= 2 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1 bg-orange-400 rounded-full shadow font-bold text-white text-sm flex items-center gap-1"
            >
              🔥 {streak} {strings.streak}!
            </motion.div>
          )}
          {discoveredColors.size > 0 && (
            <div className="px-3 py-1 bg-purple-400 rounded-full shadow font-bold text-white text-sm flex items-center gap-1">
              📖 {discoveredColors.size} {strings.discovered}
            </div>
          )}
        </div>

        {/* New discovery celebration */}
        <AnimatePresence>
          {showNewDiscovery && (
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="px-4 py-2 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-2xl shadow-lg text-center font-bold text-gray-800"
            >
              ✨ {strings.newColor} ✨
            </motion.div>
          )}
        </AnimatePresence>

        {/* Target color */}
        {currentChallenge && (
          <TargetDisplay challenge={currentChallenge} locale={locale} strings={strings} />
        )}

        {/* Formula display */}
        <FormulaDisplay selectedColors={selectedColors} mixResult={mixResult} locale={locale} strings={strings} />

        {/* Mixing bowl */}
        <div className="relative">
          <MixingBowl selectedColors={selectedColors} mixResult={mixResult} isAnimating={isAnimating} />
          {showCelebration && currentChallenge && (
            <CelebrationParticles color={currentChallenge.targetHex} />
          )}
        </div>

        {/* Color palette */}
        <div className="flex justify-center gap-1.5 sm:gap-5">
          {availableColors.map(color => (
            <PaintTube
              key={color.id}
              color={color}
              isSelected={selected.includes(color.id)}
              onClick={() => toggleColor(color.id)}
              disabled={isAnimating || !!feedback}
              locale={locale}
            />
          ))}
        </div>

        {/* Hint text / ingredient hint after consecutive wrong */}
        {selected.length < 2 && !feedback && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/70 font-medium text-center"
          >
            {consecutiveWrong >= 2 && currentChallenge
              ? `💡 ${strings.hintMsg.replace('{n}', String(currentChallenge.recipe.ingredients.length))}`
              : strings.pick}
          </motion.p>
        )}

        {/* Mix button */}
        <AnimatePresence>
          {selected.length >= 2 && !feedback && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMix}
              disabled={isAnimating}
              className="px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white text-lg sm:text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-shadow min-h-[44px] sm:min-h-[48px] focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <span>🧪</span>
                {strings.mixButton}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </GameWrapper>
  );
}
