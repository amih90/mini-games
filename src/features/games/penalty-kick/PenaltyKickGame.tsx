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
import { TextDirection } from '@/i18n/routing';

// ============================================================================
// PENALTY KICK — redesigned
//
// Physics model:
//   • 3-D perspective view.  The ball starts at penalty spot (bottom-centre)
//     and shrinks as it "flies" toward the goal face at the top of the canvas.
//   • Shot target = a point on the GOAL FACE plane.  On "aiming" the player
//     drags a target dot directly on the rendered goal face.
//   • Power bar = hold mouse/space; release to shoot.  More power = faster
//     shot and harder to save but also slightly less controllable.
//   • Keeper AI: at the moment of kick the keeper picks a dive direction.
//     On Easy it's usually wrong.  On Hard it usually reads the target side.
//   • Save detection: simple rectangle overlap between ball landing-rect and
//     keeper body-rect, all normalised in goal-face coordinates [-1,1].
//   • Miss detection: ball landing outside the goal frame.
//   • Wobble: on medium/hard the keeper sways while the player is aiming
//     to try to distract them.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'aiming' | 'shooting' | 'result';
type ShotResult = 'goal' | 'saved' | 'missed' | null;
type GameState = 'levelSelect' | 'playing' | 'gameover';

interface PenaltyKickGameProps {
  locale?: string;
}

// Goal-face normalised coord: x in [-1, 1], y in [-1, 1] (y=1 is top of goal)
interface GCoord {
  x: number;
  y: number;
}

interface DifficultySettings {
  keeperAccuracy: number;   // probability keeper guesses the correct side
  keeperSpeed: number;      // goal-face units per frame
  keeperHalfW: number;      // keeper half-width in goal-face units
  keeperHalfH: number;      // keeper half-height in goal-face units
  wobble: number;           // keeper x-sway amplitude while aiming (0 = none)
  label: string;
}

// ---------------------------------------------------------------------------
// Canvas constants
// ---------------------------------------------------------------------------
const CW = 600;
const CH = 440;
const MAX_ATTEMPTS = 5;

// Goal frame positions on canvas (top of canvas)
const GOAL_LEFT   = 120;
const GOAL_RIGHT  = 480;
const GOAL_TOP    = 38;
const GOAL_BOTTOM = 175;
const GOAL_CX     = (GOAL_LEFT + GOAL_RIGHT) / 2;  // 300
const GOAL_CY     = (GOAL_TOP + GOAL_BOTTOM) / 2;  // 106.5
const GOAL_HW     = (GOAL_RIGHT - GOAL_LEFT) / 2;  // 180
const GOAL_HH     = (GOAL_BOTTOM - GOAL_TOP) / 2;  // 68.5

// Penalty spot
const SPOT_X = CW / 2;
const SPOT_Y = CH - 75;

// Ball rendering
const BALL_R0 = 18; // radius at spot (start)
const BALL_R1 = 11; // radius at goal (end)

// Frames the ball takes to reach the goal
const SHOOT_FRAMES = 30;

// ---------------------------------------------------------------------------
// Difficulty settings
// ---------------------------------------------------------------------------
const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    keeperAccuracy: 0.28,
    keeperSpeed: 0.025,
    keeperHalfW: 0.36,
    keeperHalfH: 0.65,
    wobble: 0,
    label: 'easy',
  },
  medium: {
    keeperAccuracy: 0.55,
    keeperSpeed: 0.042,
    keeperHalfW: 0.32,
    keeperHalfH: 0.60,
    wobble: 0.12,
    label: 'medium',
  },
  hard: {
    keeperAccuracy: 0.78,
    keeperSpeed: 0.065,
    keeperHalfW: 0.27,
    keeperHalfH: 0.55,
    wobble: 0.26,
    label: 'hard',
  },
};

// ---------------------------------------------------------------------------
// Translation strings
// ---------------------------------------------------------------------------
const T: Record<string, Record<string, string>> = {
  en: {
    title: 'Penalty Kick',
    score: 'Goals',
    attempts: 'Shots',
    highScore: 'Best',
    goal: 'GOAL!',
    saved: 'SAVED!',
    missed: 'MISSED!',
    gameOver: 'Game Over!',
    playAgain: 'Play Again',
    newHighScore: 'New High Score!',
    selectDifficulty: 'Select Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    easyDesc: 'Slow keeper — easy save',
    mediumDesc: 'Keeper reads side 50%',
    hardDesc: 'Fast & smart keeper',
    power: 'Power',
    dragToAim: 'Drag inside the goal to aim',
    holdShoot: 'Hold & release to shoot',
    arrowsAim: 'Arrows/WASD = aim',
    spaceShoot: 'Space = charge & shoot',
  },
  he: {
    title: 'בעיטת עונשין',
    score: 'שערים',
    attempts: 'בעיטות',
    highScore: 'שיא',
    goal: '!גול',
    saved: '!נעצר',
    missed: '!החטאה',
    gameOver: '!המשחק נגמר',
    playAgain: 'שחק שוב',
    newHighScore: '!שיא חדש',
    selectDifficulty: 'בחר רמת קושי',
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
    easyDesc: 'שוער איטי',
    mediumDesc: 'שוער מנחש 50%',
    hardDesc: 'שוער מהיר וחכם',
    power: 'כוח',
    dragToAim: 'גרור בתוך השער לכיוון',
    holdShoot: 'החזק ושחרר לבעיטה',
    arrowsAim: 'חצים/WASD = כיוון',
    spaceShoot: 'רווח = טעינה ובעיטה',
  },
  zh: {
    title: '点球大战',
    score: '进球',
    attempts: '射门',
    highScore: '最佳',
    goal: '进球！',
    saved: '被扑！',
    missed: '偏了！',
    gameOver: '游戏结束！',
    playAgain: '再玩一次',
    newHighScore: '新纪录！',
    selectDifficulty: '选择难度',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    easyDesc: '守门员很慢',
    mediumDesc: '猜对方向50%',
    hardDesc: '快速聪明的守门员',
    power: '力量',
    dragToAim: '在球门内拖动以瞄准',
    holdShoot: '按住松开即射门',
    arrowsAim: '方向键 = 瞄准',
    spaceShoot: '空格 = 蓄力射门',
  },
  es: {
    title: 'Tiro Penal',
    score: 'Goles',
    attempts: 'Disparos',
    highScore: 'Mejor',
    goal: '¡GOL!',
    saved: '¡ATAJADO!',
    missed: '¡FALLADO!',
    gameOver: '¡Fin del juego!',
    playAgain: 'Jugar de nuevo',
    newHighScore: '¡Nuevo récord!',
    selectDifficulty: 'Elegir dificultad',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    easyDesc: 'Portero lento',
    mediumDesc: 'Adivina el lado 50%',
    hardDesc: 'Portero rápido e inteligente',
    power: 'Potencia',
    dragToAim: 'Arrastra en el arco para apuntar',
    holdShoot: 'Mantén y suelta para disparar',
    arrowsAim: 'Flechas/WASD = apuntar',
    spaceShoot: 'Espacio = cargar y disparar',
  },
};

// ---------------------------------------------------------------------------
// Instructions data (Feynman-style)
// ---------------------------------------------------------------------------
const INSTRUCTIONS_DATA: Record<
  string,
  {
    instructions: { icon: string; title: string; description: string }[];
    controls: { icon: string; description: string }[];
    tip: string;
  }
> = {
  en: {
    instructions: [
      { icon: '⚽', title: 'Penalty Kicks', description: 'Take 5 penalty kicks and try to score as many as possible. The goalkeeper will try to stop you!' },
      { icon: '🎯', title: 'Aim on the Goal', description: 'Move your cursor (or drag on mobile) directly on the goal face to place the target dot exactly where you want the ball to go.' },
      { icon: '💪', title: 'Charge Your Shot', description: 'Hold the mouse button (or Space) to fill the power bar. More power means a faster, harder-to-stop shot — but don\'t max it out or you lose accuracy.' },
      { icon: '🧤', title: 'The Goalkeeper', description: 'The keeper watches your aim and decides to dive at the moment you kick. Aim in one direction and quickly flick to the other to fool him!' },
    ],
    controls: [
      { icon: '🖱️', description: 'Mouse: drag inside goal to aim, hold + release to shoot' },
      { icon: '📱', description: 'Touch: drag on goal to aim, lift finger to shoot' },
      { icon: '⌨️', description: 'Arrows/WASD to aim, hold Space to charge, release to shoot' },
    ],
    tip: 'High corners are the hardest to save — but a low shot to the side the keeper doesn\'t dive is just as good!',
  },
  he: {
    instructions: [
      { icon: '⚽', title: 'בעיטות עונשין', description: 'בצע 5 בעיטות עונשין ונסה להבקיע כמה שיותר. השוער ינסה לעצור אותך!' },
      { icon: '🎯', title: 'כוון על השער', description: 'הזז את הסמן (או גרור במובייל) ישירות על פני השער כדי למקם את נקודת המטרה בדיוק איפה שתרצה.' },
      { icon: '💪', title: 'טעון את הבעיטה', description: 'החזק את כפתור העכבר (או רווח) כדי למלא את מד הכוח. כוח גבוה יותר = בעיטה מהירה יותר — אבל אל תמלא לגמרי או תאבד דיוק.' },
      { icon: '🧤', title: 'השוער', description: 'השוער עוקב אחר הכיוון שלך ומחליט לאן לקפוץ ברגע הבעיטה. כוון לכיוון אחד ואז החלף לאחר!' },
    ],
    controls: [
      { icon: '🖱️', description: 'עכבר: גרור בשער לכיוון, החזק ושחרר לבעיטה' },
      { icon: '📱', description: 'מגע: גרור על השער, רים אצבע לבעיטה' },
      { icon: '⌨️', description: 'חצים/WASD לכיוון, החזק רווח לטעינה, שחרר לבעיטה' },
    ],
    tip: 'פינות גבוהות הכי קשות לעצירה — אבל בעיטה נמוכה לצד שהשוער לא קופץ אליו גם עובדת!',
  },
  zh: {
    instructions: [
      { icon: '⚽', title: '点球', description: '踢5次点球，尽量多进球。守门员会尽力阻止你！' },
      { icon: '🎯', title: '在球门上瞄准', description: '将鼠标（或手指）直接拖到球门上，把目标点放在你想要球去的位置。' },
      { icon: '💪', title: '蓄力', description: '按住鼠标（或空格键）来填充力量条。力量越大，球速越快越难被扑——但别充满，否则会失去精度。' },
      { icon: '🧤', title: '守门员', description: '守门员会观察你的瞄准方向，在你射门的瞬间决定扑向哪边。往一边瞄准，然后突然改变方向来骗过他！' },
    ],
    controls: [
      { icon: '🖱️', description: '鼠标：在球门内拖动瞄准，按住松开射门' },
      { icon: '📱', description: '触屏：在球门上拖动，抬起手指射门' },
      { icon: '⌨️', description: '方向键/WASD瞄准，按住空格蓄力，松开射门' },
    ],
    tip: '高角球最难扑！但射向守门员未扑一侧的低球同样有效！',
  },
  es: {
    instructions: [
      { icon: '⚽', title: 'Penales', description: 'Toma 5 penales e intenta marcar la mayor cantidad. ¡El portero intentará detenerte!' },
      { icon: '🎯', title: 'Apunta en el arco', description: 'Mueve el cursor (o arrastra en móvil) directamente sobre la portería para colocar el punto de destino donde quieres que vaya el balón.' },
      { icon: '💪', title: 'Carga tu tiro', description: 'Mantén el botón del ratón (o Espacio) para llenar la barra de potencia. Más potencia = disparo más rápido — ¡pero no al máximo o perderás precisión!' },
      { icon: '🧤', title: 'El portero', description: 'El portero vigila tu apunte y decide a dónde lanzarse en el momento del disparo. ¡Apunta en una dirección y cambia rápido para engañarlo!' },
    ],
    controls: [
      { icon: '🖱️', description: 'Ratón: arrastra en el arco para apuntar, mantén + suelta para disparar' },
      { icon: '📱', description: 'Táctil: arrastra en el arco, levanta el dedo para disparar' },
      { icon: '⌨️', description: 'Flechas/WASD para apuntar, mantén Espacio para cargar, suelta para disparar' },
    ],
    tip: '¡Las esquinas altas son las más difíciles de atajar! Pero un disparo bajo al lado que el portero no se lanza es igual de efectivo.',
  },
};

// ---------------------------------------------------------------------------
// Helper: convert goal-face coords to canvas pixel coords
// ---------------------------------------------------------------------------
function goalToCanvas(g: GCoord): { cx: number; cy: number } {
  return {
    cx: GOAL_CX + g.x * GOAL_HW,
    cy: GOAL_CY - g.y * GOAL_HH,  // y=1 is top, so subtract
  };
}

function canvasToGoal(cx: number, cy: number): GCoord {
  return {
    x: (cx - GOAL_CX) / GOAL_HW,
    y: -(cy - GOAL_CY) / GOAL_HH,
  };
}

function clampGoal(g: GCoord): GCoord {
  return {
    x: Math.max(-0.95, Math.min(0.95, g.x)),
    y: Math.max(-0.95, Math.min(0.95, g.y)),
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PenaltyKickGame({ locale = 'en' }: PenaltyKickGameProps) {
  const t = T[locale] || T.en;
  const direction = useDirection();
  const isRtl = direction === TextDirection.RTL;
  const instrData = INSTRUCTIONS_DATA[locale] || INSTRUCTIONS_DATA.en;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const animFrameRef   = useRef<number | null>(null);

  // aiming state (refs so game loop reads latest without re-subscribing)
  const targetRef      = useRef<GCoord>({ x: 0, y: 0 });  // current aim on goal face
  const isPoweringRef  = useRef(false);
  const powerRef       = useRef(0);   // 0..100
  const resultDoneRef  = useRef(false);

  // shooting state
  const shootFrameRef  = useRef(0);   // 0..SHOOT_FRAMES during shot
  const shotTargetRef  = useRef<GCoord>({ x: 0, y: 0 });  // locked target
  const shotPowerRef   = useRef(0);

  // keeper runtime state
  const keeperRef = useRef({
    x: 0,     // current goal-face x (starts at 0 = center)
    y: 0,     // current goal-face y (starts at 0 = center)
    diveX: 0, // dive destination x
    diveY: 0, // dive destination y
    wobblePhase: 0,
    isDiving: false,
  });

  // ── State ─────────────────────────────────────────────────────────────────
  const [gameState,       setGameState]       = useState<GameState>('levelSelect');
  const [difficulty,      setDifficulty]      = useState<Difficulty>('medium');
  const [phase,           setPhase]           = useState<GamePhase>('aiming');
  const [score,           setScore]           = useState(0);
  const [attempts,        setAttempts]        = useState(0);
  const [shotResult,      setShotResult]      = useState<ShotResult>(null);
  const [showWin,         setShowWin]         = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('penalty-kick-hs');
      return s ? parseInt(s, 10) : 0;
    }
    return 0;
  });

  // ── Sounds ────────────────────────────────────────────────────────────────
  const { playShoot, playSuccess, playHit, playGameOver, playWin, playClick } =
    useRetroSounds();

  // ── Derived settings ──────────────────────────────────────────────────────
  const settings = DIFFICULTY_SETTINGS[difficulty];

  // ── Reset a single shot ───────────────────────────────────────────────────
  const resetShot = useCallback(() => {
    targetRef.current      = { x: 0, y: 0 };
    isPoweringRef.current  = false;
    powerRef.current       = 0;
    resultDoneRef.current  = false;
    shootFrameRef.current  = 0;

    // Reset keeper to center, random small offset
    const offX = (Math.random() - 0.5) * 0.1;
    keeperRef.current = {
      x: offX,
      y: 0,
      diveX: offX,
      diveY: 0,
      wobblePhase: Math.random() * Math.PI * 2,
      isDiving: false,
    };

    setPhase('aiming');
    setShotResult(null);
  }, []);

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      setScore(0);
      setAttempts(0);
      setGameState('playing');
      resetShot();
      playClick();
    },
    [resetShot, playClick],
  );

  // ── Fire the shot ─────────────────────────────────────────────────────────
  const fireShot = useCallback(() => {
    if (phase !== 'aiming' || !isPoweringRef.current) return;

    const target = { ...targetRef.current };
    const power  = Math.max(5, Math.min(100, powerRef.current));

    // Lock the shot
    shotTargetRef.current = target;
    shotPowerRef.current  = power;

    // Keeper AI: decide dive destination
    const s = DIFFICULTY_SETTINGS[difficulty];
    const guessCorrect = Math.random() < s.keeperAccuracy;
    const ballSide = target.x;  // negative = left, positive = right

    let diveX: number;
    let diveY: number;

    if (guessCorrect) {
      // Keeper dives toward the ball
      const signX = ballSide >= 0 ? 1 : -1;
      diveX = signX * (0.45 + Math.random() * 0.3);
      diveY = (Math.random() - 0.5) * 0.5 + target.y * 0.4;
    } else {
      // Keeper dives the WRONG way
      const signX = ballSide >= 0 ? -1 : 1;
      diveX = signX * (0.3 + Math.random() * 0.4);
      diveY = (Math.random() - 0.5) * 0.5;
    }

    keeperRef.current.diveX   = Math.max(-1, Math.min(1, diveX));
    keeperRef.current.diveY   = Math.max(-1, Math.min(1, diveY));
    keeperRef.current.isDiving = true;
    shootFrameRef.current      = 0;
    isPoweringRef.current      = false;

    setPhase('shooting');
    playShoot();
  }, [phase, difficulty, playShoot]);

  // ── Input handling ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;

    const toGoalCoord = (clientX: number, clientY: number): GCoord => {
      const rect = canvas.getBoundingClientRect();
      const cx = ((clientX - rect.left) / rect.width) * CW;
      const cy = ((clientY - rect.top) / rect.height) * CH;
      return clampGoal(canvasToGoal(cx, cy));
    };

    // Mouse
    const onMouseMove = (e: MouseEvent) => {
      if (phase !== 'aiming') return;
      targetRef.current = toGoalCoord(e.clientX, e.clientY);
    };
    const onMouseDown = () => {
      if (phase === 'aiming') { isPoweringRef.current = true; powerRef.current = 0; }
    };
    const onMouseUp = () => { if (isPoweringRef.current) fireShot(); };

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (phase !== 'aiming') return;
      const t0 = e.touches[0];
      targetRef.current = toGoalCoord(t0.clientX, t0.clientY);
      isPoweringRef.current = true;
      powerRef.current = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (phase !== 'aiming') return;
      const t0 = e.touches[0];
      targetRef.current = toGoalCoord(t0.clientX, t0.clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (isPoweringRef.current) fireShot();
    };

    // Keyboard
    const STEP = 0.06;
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'aiming') return;
      const cur = targetRef.current;
      if (e.code === 'ArrowLeft'  || e.code === 'KeyA') targetRef.current = clampGoal({ x: cur.x - STEP, y: cur.y });
      if (e.code === 'ArrowRight' || e.code === 'KeyD') targetRef.current = clampGoal({ x: cur.x + STEP, y: cur.y });
      if (e.code === 'ArrowUp'    || e.code === 'KeyW') targetRef.current = clampGoal({ x: cur.x, y: cur.y + STEP });
      if (e.code === 'ArrowDown'  || e.code === 'KeyS') targetRef.current = clampGoal({ x: cur.x, y: cur.y - STEP });
      if ((e.code === 'Space' || e.code === 'Enter') && !isPoweringRef.current) {
        e.preventDefault();
        isPoweringRef.current = true;
        powerRef.current = 0;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && isPoweringRef.current) fireShot();
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup',   onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup',   onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    };
  }, [gameState, phase, fireShot]);

  // ── Game loop (canvas draw + physics) ─────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = DIFFICULTY_SETTINGS[difficulty];

    const loop = () => {
      // ── Physics ────────────────────────────────────────────────────────────

      // Power charging
      if (isPoweringRef.current && phase === 'aiming') {
        powerRef.current = Math.min(powerRef.current + 1.8, 100);
      }

      // Keeper wobble while player is aiming
      if (phase === 'aiming' && s.wobble > 0) {
        keeperRef.current.wobblePhase += 0.04;
        keeperRef.current.x = Math.sin(keeperRef.current.wobblePhase) * s.wobble;
      }

      // Keeper dive during shot
      if (phase === 'shooting' && keeperRef.current.isDiving) {
        const k = keeperRef.current;
        const dx = k.diveX - k.x;
        const dy = k.diveY - k.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.01) {
          k.x += (dx / dist) * s.keeperSpeed * (1 + shootFrameRef.current / SHOOT_FRAMES);
          k.y += (dy / dist) * s.keeperSpeed * (1 + shootFrameRef.current / SHOOT_FRAMES);
        }
      }

      // Ball travel
      if (phase === 'shooting') {
        shootFrameRef.current = Math.min(shootFrameRef.current + 1, SHOOT_FRAMES);
      }

      // Result check — happens exactly at SHOOT_FRAMES
      if (phase === 'shooting' && shootFrameRef.current >= SHOOT_FRAMES && !resultDoneRef.current) {
        resultDoneRef.current = true;

        const target = shotTargetRef.current;
        const k      = keeperRef.current;

        // Check miss (outside goal frame — add small margin)
        const outX = Math.abs(target.x) > 1.0;
        const outY = target.y < -1.0 || target.y > 1.0;

        if (outX || outY) {
          setShotResult('missed');
          playHit();
        } else {
          // Check keeper save: keeper body rect overlap with ball landing point
          const kOverlapX = Math.abs(target.x - k.x) < (s.keeperHalfW + 0.04);
          const kOverlapY = Math.abs(target.y - k.y) < (s.keeperHalfH + 0.04);

          if (kOverlapX && kOverlapY) {
            setShotResult('saved');
            playHit();
          } else {
            setShotResult('goal');
            setScore((prev) => prev + 1);
            playSuccess();
          }
        }

        setPhase('result');
        setAttempts((prev) => prev + 1);
      }

      // ── Draw ───────────────────────────────────────────────────────────────
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, CH);
      sky.addColorStop(0, '#1565c0');
      sky.addColorStop(0.55, '#42a5f5');
      sky.addColorStop(0.56, '#2e7d32');
      sky.addColorStop(1, '#1b5e20');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, CW, CH);

      // Crowd silhouette band
      const crowdY = CH * 0.38;
      ctx.fillStyle = 'rgba(0,0,50,0.35)';
      ctx.fillRect(0, crowdY - 18, CW, 28);

      // Pitch stripes
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#2e7d32' : '#388e3c';
        ctx.fillRect(i * (CW / 7), CH * 0.56, CW / 7, CH * 0.44);
      }

      // Penalty arc (partial circle behind ball)
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(SPOT_X, SPOT_Y + 10, 80, Math.PI, 0, false);
      ctx.stroke();
      ctx.restore();

      // Penalty spot
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(SPOT_X, SPOT_Y, 4, 0, Math.PI * 2);
      ctx.fill();

      // ── GOAL structure ────────────────────────────────────────────────────
      // Net fill
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(GOAL_LEFT, GOAL_TOP, GOAL_RIGHT - GOAL_LEFT, GOAL_BOTTOM - GOAL_TOP);

      // Net grid
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 0.8;
      const NX = 10, NY = 6;
      for (let i = 0; i <= NX; i++) {
        const x = GOAL_LEFT + i * (GOAL_RIGHT - GOAL_LEFT) / NX;
        ctx.beginPath(); ctx.moveTo(x, GOAL_TOP); ctx.lineTo(x, GOAL_BOTTOM); ctx.stroke();
      }
      for (let j = 0; j <= NY; j++) {
        const y = GOAL_TOP + j * (GOAL_BOTTOM - GOAL_TOP) / NY;
        ctx.beginPath(); ctx.moveTo(GOAL_LEFT, y); ctx.lineTo(GOAL_RIGHT, y); ctx.stroke();
      }

      // Depth lines (perspective net)
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 0.6;
      for (let i = 0; i <= NX; i++) {
        const x = GOAL_LEFT + i * (GOAL_RIGHT - GOAL_LEFT) / NX;
        ctx.beginPath();
        ctx.moveTo(x, GOAL_BOTTOM);
        ctx.lineTo(GOAL_CX + (x - GOAL_CX) * 0.4, GOAL_BOTTOM + 28);
        ctx.stroke();
      }

      // Goal posts
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#eceff1';
      ctx.lineJoin = 'round';
      // Left post
      ctx.beginPath(); ctx.moveTo(GOAL_LEFT, GOAL_BOTTOM + 10); ctx.lineTo(GOAL_LEFT, GOAL_TOP); ctx.stroke();
      // Right post
      ctx.beginPath(); ctx.moveTo(GOAL_RIGHT, GOAL_BOTTOM + 10); ctx.lineTo(GOAL_RIGHT, GOAL_TOP); ctx.stroke();
      // Crossbar
      ctx.beginPath(); ctx.moveTo(GOAL_LEFT, GOAL_TOP); ctx.lineTo(GOAL_RIGHT, GOAL_TOP); ctx.stroke();
      // Post highlight
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.moveTo(GOAL_LEFT, GOAL_BOTTOM + 10); ctx.lineTo(GOAL_LEFT, GOAL_TOP); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(GOAL_RIGHT, GOAL_BOTTOM + 10); ctx.lineTo(GOAL_RIGHT, GOAL_TOP); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(GOAL_LEFT, GOAL_TOP); ctx.lineTo(GOAL_RIGHT, GOAL_TOP); ctx.stroke();

      // ── KEEPER ────────────────────────────────────────────────────────────
      const k = keeperRef.current;
      const kcx = GOAL_CX + k.x * GOAL_HW;
      const kcy = GOAL_CY - k.y * GOAL_HH;
      const kw  = s.keeperHalfW * GOAL_HW * 2;
      const kh  = s.keeperHalfH * GOAL_HH * 2;

      // Keeper shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(kcx, kcy + kh * 0.5 + 4, kw * 0.4, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (jersey)
      const keeperGrad = ctx.createLinearGradient(kcx - kw / 2, kcy - kh / 2, kcx + kw / 2, kcy + kh / 2);
      keeperGrad.addColorStop(0, '#ff6f00');
      keeperGrad.addColorStop(1, '#e65100');
      ctx.fillStyle = keeperGrad;
      ctx.beginPath();
      ctx.roundRect(kcx - kw / 2, kcy - kh / 2, kw, kh * 0.75, 6);
      ctx.fill();

      // Shorts
      ctx.fillStyle = '#1565c0';
      ctx.fillRect(kcx - kw * 0.45, kcy + kh * 0.22, kw * 0.4, kh * 0.18);
      ctx.fillRect(kcx + kw * 0.05, kcy + kh * 0.22, kw * 0.4, kh * 0.18);

      // Head
      ctx.fillStyle = '#ffcc80';
      ctx.beginPath();
      ctx.arc(kcx, kcy - kh * 0.42, kw * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Gloves
      ctx.fillStyle = '#c8e6c9';
      if (k.isDiving) {
        const armDir = Math.sign(k.diveX - k.x) || (k.diveX >= 0 ? 1 : -1);
        ctx.beginPath();
        ctx.arc(kcx + armDir * kw * 0.7, kcy - kh * 0.1, kw * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(kcx - kw * 0.58, kcy - kh * 0.05, kw * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(kcx + kw * 0.58, kcy - kh * 0.05, kw * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── AIM INDICATOR (aiming phase) ──────────────────────────────────────
      if (phase === 'aiming') {
        const { cx: tx, cy: ty } = goalToCanvas(targetRef.current);

        // Target shadow ring
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(tx + 2, ty + 2, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Animated target ring
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tx, ty, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Cross-hair lines
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx - 24, ty); ctx.lineTo(tx - 8, ty);
        ctx.moveTo(tx + 8,  ty); ctx.lineTo(tx + 24, ty);
        ctx.moveTo(tx, ty - 24); ctx.lineTo(tx, ty - 8);
        ctx.moveTo(tx, ty + 8);  ctx.lineTo(tx, ty + 24);
        ctx.stroke();

        // Inner dot
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── BALL ──────────────────────────────────────────────────────────────
      let ballCx: number, ballCy: number, ballR: number;

      if (phase === 'aiming' || phase === 'result') {
        ballCx = SPOT_X;
        ballCy = SPOT_Y;
        ballR  = BALL_R0;
      } else {
        // Interpolate from spot to target point on goal face
        const t0 = shootFrameRef.current / SHOOT_FRAMES;
        const ease = t0 < 0.5 ? 2 * t0 * t0 : -1 + (4 - 2 * t0) * t0; // easeInOut

        const { cx: tgtCx, cy: tgtCy } = goalToCanvas(shotTargetRef.current);

        // Curve arc: ball rises and comes back down slightly
        const arcHeight = 40 * (1 - ease);   // simulated arc
        ballCx = SPOT_X + (tgtCx - SPOT_X) * ease;
        ballCy = SPOT_Y + (tgtCy - SPOT_Y) * ease - arcHeight;
        ballR  = BALL_R0 + (BALL_R1 - BALL_R0) * ease;
      }

      // Ball shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(ballCx, ballCy + ballR + 2, ballR * 0.8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball
      const ballGrad = ctx.createRadialGradient(
        ballCx - ballR * 0.3, ballCy - ballR * 0.3, ballR * 0.1,
        ballCx, ballCy, ballR,
      );
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.4, '#e8e8e8');
      ballGrad.addColorStop(1, '#9e9e9e');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ballCx, ballCy, ballR, 0, Math.PI * 2);
      ctx.fill();

      // Ball panels (soccer ball hexagons)
      ctx.fillStyle = '#212121';
      const panelR = ballR * 0.32;
      const panelOffsets = [
        [0, -0.55],
        [-0.48, -0.28],
        [0.48, -0.28],
        [-0.3, 0.42],
        [0.3, 0.42],
      ];
      for (const [ox, oy] of panelOffsets) {
        ctx.beginPath();
        ctx.arc(ballCx + ox * ballR, ballCy + oy * ballR, panelR, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── POWER BAR ─────────────────────────────────────────────────────────
      if (phase === 'aiming') {
        const barW = 160, barH = 18;
        const barX = CW / 2 - barW / 2;
        const barY = CH - 30;

        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 4);
        ctx.fill();

        if (isPoweringRef.current) {
          const pw = (powerRef.current / 100) * barW;
          const pg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
          pg.addColorStop(0,   '#66bb6a');
          pg.addColorStop(0.5, '#ffee58');
          pg.addColorStop(1,   '#ef5350');
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.roundRect(barX, barY, pw, barH, 3);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, 3);
          ctx.fill();
        }

        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(
          isPoweringRef.current
            ? `${t.power}: ${Math.round(powerRef.current)}%`
            : `⬇ ${t.holdShoot}`,
          CW / 2, barY - 6
        );
      }

      // ── RESULT FLASH ──────────────────────────────────────────────────────
      if (phase === 'result' && shotResult) {
        const label =
          shotResult === 'goal' ? t.goal :
          shotResult === 'saved' ? t.saved : t.missed;
        const color =
          shotResult === 'goal' ? '#00e676' :
          shotResult === 'saved' ? '#ff9800' : '#ef5350';

        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 6;
        ctx.strokeText(label, CW / 2, CH / 2 + 10);
        ctx.fillStyle = color;
        ctx.fillText(label, CW / 2, CH / 2 + 10);
      }

      // ── HUD ───────────────────────────────────────────────────────────────
      // Scoreboard strip at top
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, CW, 32);
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      const left = isRtl ? CW - 10 : 10;
      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(`${t.score}: ${score}/${MAX_ATTEMPTS}  |  ${t.attempts}: ${attempts}/${MAX_ATTEMPTS}`, left, 21);
      // High score on right
      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.fillStyle = '#ffcc80';
      ctx.fillText(`🏆 ${t.highScore}: ${highScore}`, isRtl ? 10 : CW - 10, 21);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [gameState, phase, difficulty, score, attempts, highScore, shotResult, settings, t, isRtl, playSuccess, playHit]);

  // ── Auto-advance after result ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'result' || gameState !== 'playing') return;

    const timer = setTimeout(() => {
      if (attempts >= MAX_ATTEMPTS) {
        setGameState('gameover');
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('penalty-kick-hs', String(score));
        }
        if (score >= MAX_ATTEMPTS) { playWin(); setShowWin(true); }
        else                       { playGameOver(); }
      } else {
        resetShot();
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [phase, attempts, score, highScore, gameState, resetShot, playWin, playGameOver]);

  // ── Restart ────────────────────────────────────────────────────────────────
  const restartGame = useCallback(() => {
    setShowWin(false);
    setGameState('levelSelect');
    setScore(0);
    setAttempts(0);
    setShotResult(null);
    setPhase('aiming');
    playClick();
  }, [playClick]);

  usePlayAgainKey(gameState === 'gameover' && !showWin, restartGame);

  const levelNum = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)}>
      <div className="flex flex-col items-center gap-3">

        {/* Level display (only while playing) */}
        {gameState === 'playing' && (
          <LevelDisplay level={levelNum} />
        )}

        <div className="relative">
          {/* Canvas — always mounted so refs stay valid */}
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            className="rounded-xl shadow-2xl border-2 border-white/20 cursor-crosshair"
            style={{
              touchAction: 'none',
              maxWidth: '100%',
              display: gameState === 'playing' ? 'block' : 'none',
            }}
          />

          {/* ── Level selector ── */}
          <AnimatePresence>
            {gameState === 'levelSelect' && (
              <motion.div
                key="level-select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 px-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="text-7xl mb-4 select-none"
                >
                  ⚽
                </motion.div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{t.title}</h2>
                <p className="text-slate-500 mb-6">{t.selectDifficulty}</p>

                <div className="flex flex-wrap justify-center gap-4">
                  {(
                    [
                      { key: 'easy'   as Difficulty, emoji: '🟢', color: 'bg-green-500  hover:bg-green-600'  },
                      { key: 'medium' as Difficulty, emoji: '🟡', color: 'bg-yellow-500 hover:bg-yellow-600' },
                      { key: 'hard'   as Difficulty, emoji: '🔴', color: 'bg-red-500    hover:bg-red-600'    },
                    ] as const
                  ).map((d) => (
                    <motion.button
                      key={d.key}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startGame(d.key)}
                      className={`${d.color} text-white font-bold rounded-2xl px-8 py-4 shadow-lg min-w-[140px] min-h-[48px] flex flex-col items-center gap-1 transition-colors`}
                    >
                      <span className="text-2xl">{d.emoji}</span>
                      <span className="text-lg">{t[d.key]}</span>
                      <span className="text-xs opacity-80">{t[`${d.key}Desc` as keyof typeof t]}</span>
                    </motion.button>
                  ))}
                </div>

                {highScore > 0 && (
                  <p className="mt-6 text-slate-500 font-medium">
                    🏆 {t.highScore}: {highScore}/{MAX_ATTEMPTS}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Game over overlay ── */}
          <AnimatePresence>
            {gameState === 'gameover' && !showWin && (
              <motion.div
                key="gameover"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 px-4"
              >
                <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full">
                  <div className="text-5xl mb-4">🏆</div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-3">{t.gameOver}</h2>
                  <div className="text-4xl font-bold text-green-500 mb-2">{score}/{MAX_ATTEMPTS}</div>
                  {score > 0 && score === highScore && (
                    <div className="text-lg text-orange-500 font-bold mb-3">🌟 {t.newHighScore}</div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={restartGame}
                    className="mt-4 px-8 py-3 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-full shadow-lg min-h-[48px]"
                  >
                    {t.playAgain}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Control hints while playing */}
        {gameState === 'playing' && (
          <div className="flex flex-wrap justify-center gap-2 text-slate-600 text-xs">
            <span className="px-3 py-1 bg-white/80 rounded-full">🖱️ {t.dragToAim}</span>
            <span className="px-3 py-1 bg-white/80 rounded-full">⌨️ {t.arrowsAim}</span>
            <span className="px-3 py-1 bg-white/80 rounded-full">🎯 {t.holdShoot}</span>
          </div>
        )}
      </div>

      <WinModal
        isOpen={showWin}
        onClose={() => setShowWin(false)}
        onPlayAgain={restartGame}
        score={score}
      />

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
