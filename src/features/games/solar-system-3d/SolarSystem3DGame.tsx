'use client';

import { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';
import { GameWrapper } from '../shared/GameWrapper';

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'difficulty' | 'instructions' | 'playing' | 'gameover' | 'win';

interface PlanetData {
  name: string;
  radius: number;
  orbitRadius: number;
  speed: number;
  color: string;
  emoji: string;
  facts: Record<string, string>;
}

interface DifficultyConfig {
  activePlanets: number;
  orbitSpeedMultiplier: number;
  timeLimit: number;
  glowDuration: number;
}

// ─── Planet Data ──────────────────────────────────────────────────────────────

const ALL_PLANETS: PlanetData[] = [
  {
    name: 'Mercury', radius: 0.3, orbitRadius: 3.0, speed: 0.04, color: '#b5b5b5', emoji: '☿',
    facts: {
      en: 'Mercury is the closest planet to the Sun — and it has no moons!',
      he: 'מרקורי הוא הכוכב הקרוב ביותר לשמש — ואין לו ירחים!',
      zh: '水星是离太阳最近的行星——而且它没有卫星！',
      es: '¡Mercurio es el planeta más cercano al Sol y no tiene lunas!',
    },
  },
  {
    name: 'Venus', radius: 0.5, orbitRadius: 4.8, speed: 0.025, color: '#e8cda0', emoji: '♀',
    facts: {
      en: 'Venus is the hottest planet — hotter than Mercury, even though it\'s farther from the Sun!',
      he: 'נוגה הוא הכוכב החם ביותר — חם יותר ממרקורי אפילו שהוא רחוק יותר מהשמש!',
      zh: '金星是最热的行星——尽管它离太阳更远，但比水星还热！',
      es: '¡Venus es el planeta más caliente, ¡más caliente que Mercurio aunque está más lejos del Sol!',
    },
  },
  {
    name: 'Earth', radius: 0.55, orbitRadius: 6.5, speed: 0.02, color: '#4fc3f7', emoji: '🌍',
    facts: {
      en: 'Earth is the only planet we know of that has life — and it\'s 71% covered in water!',
      he: 'כדור הארץ הוא הכוכב היחיד שאנו יודעים שיש בו חיים — ו-71% ממנו מכוסה במים!',
      zh: '地球是我们已知唯一有生命的行星——71%被水覆盖！',
      es: '¡La Tierra es el único planeta que conocemos con vida — y está cubierta en un 71% por agua!',
    },
  },
  {
    name: 'Mars', radius: 0.42, orbitRadius: 8.5, speed: 0.015, color: '#ef5350', emoji: '♂',
    facts: {
      en: 'Mars is called the Red Planet because its soil contains iron oxide — rust!',
      he: 'מאדים נקרא הכוכב האדום כי האדמה שלו מכילה תחמוצת ברזל — חלודה!',
      zh: '火星被称为红色星球，因为它的土壤含有氧化铁——锈！',
      es: '¡Marte se llama el Planeta Rojo porque su suelo contiene óxido de hierro — ¡óxido!',
    },
  },
  {
    name: 'Jupiter', radius: 1.1, orbitRadius: 12.0, speed: 0.008, color: '#ff8f00', emoji: '♃',
    facts: {
      en: 'Jupiter is so big that 1,300 Earths could fit inside it — it\'s the largest planet!',
      he: 'צדק כל כך גדול שבתוכו יכולים להיכנס 1,300 כדורי ארץ — הוא הכוכב הגדול ביותר!',
      zh: '木星大到可以容纳1300个地球——它是最大的行星！',
      es: '¡Júpiter es tan grande que 1300 Tierras cabrían dentro — es el planeta más grande!',
    },
  },
  {
    name: 'Saturn', radius: 0.95, orbitRadius: 16.0, speed: 0.006, color: '#ffd54f', emoji: '♄',
    facts: {
      en: 'Saturn has beautiful rings made of ice and rock — they\'re as wide as 282 Earths!',
      he: 'לשבתאי יש טבעות יפהפיות עשויות מקרח וסלע — הן רחבות כמו 282 כדורי ארץ!',
      zh: '土星有美丽的由冰和岩石组成的环——它们有282个地球那么宽！',
      es: '¡Saturno tiene hermosos anillos de hielo y roca — son tan anchos como 282 Tierras!',
    },
  },
  {
    name: 'Uranus', radius: 0.7, orbitRadius: 20.0, speed: 0.004, color: '#80deea', emoji: '⛢',
    facts: {
      en: 'Uranus spins on its side like a rolling ball — it\'s tilted 98 degrees!',
      he: 'אורנוס מסתובב על צידו כמו כדור מתגלגל — הוא מוטה 98 מעלות!',
      zh: '天王星像滚球一样侧着旋转——它倾斜了98度！',
      es: '¡Urano gira de lado como una pelota rodante — está inclinado 98 grados!',
    },
  },
  {
    name: 'Neptune', radius: 0.68, orbitRadius: 24.0, speed: 0.003, color: '#1565c0', emoji: '♆',
    facts: {
      en: 'Neptune has winds faster than any other planet — up to 2,100 km/h!',
      he: 'לנפטון יש רוחות מהירות יותר מכל כוכב אחר — עד 2,100 קמ״ש!',
      zh: '海王星的风速比任何其他行星都快——高达2100公里/小时！',
      es: '¡Neptuno tiene vientos más rápidos que cualquier otro planeta — hasta 2,100 km/h!',
    },
  },
];

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy:   { activePlanets: 4,  orbitSpeedMultiplier: 0.5, timeLimit: 90, glowDuration: 3000 },
  medium: { activePlanets: 6,  orbitSpeedMultiplier: 1.0, timeLimit: 60, glowDuration: 2000 },
  hard:   { activePlanets: 8,  orbitSpeedMultiplier: 1.8, timeLimit: 45, glowDuration: 1200 },
};

const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Solar System Explorer', score: 'Score', lives: 'Lives', time: 'Time',
    gameOver: 'Game Over!', youWin: '🎉 Mission Complete!', playAgain: 'Play Again',
    easy: 'Easy', medium: 'Medium', hard: 'Hard', chooseDifficulty: 'Choose Difficulty',
    collected: 'Facts Collected', clickPlanet: 'Click glowing planets to collect facts!',
    factTitle: 'Planet Fact!', close: 'Awesome!',
  },
  he: {
    title: 'חוקר מערכת השמש', score: 'ניקוד', lives: 'חיים', time: 'זמן',
    gameOver: '!המשחק נגמר', youWin: '!משימה הושלמה', playAgain: 'שחק שוב',
    easy: 'קל', medium: 'בינוני', hard: 'קשה', chooseDifficulty: 'בחר רמת קושי',
    collected: 'עובדות שנאספו', clickPlanet: '!לחצו על כוכבי לכת זוהרים לאיסוף עובדות',
    factTitle: '!עובדה על כוכב לכת', close: '!מדהים',
  },
  zh: {
    title: '太阳系探索者', score: '得分', lives: '生命', time: '时间',
    gameOver: '游戏结束！', youWin: '任务完成！', playAgain: '再玩一次',
    easy: '容易', medium: '中等', hard: '困难', chooseDifficulty: '选择难度',
    collected: '收集的事实', clickPlanet: '点击发光的行星收集事实！',
    factTitle: '行星事实！', close: '太棒了！',
  },
  es: {
    title: 'Explorador del Sistema Solar', score: 'Puntuación', lives: 'Vidas', time: 'Tiempo',
    gameOver: '¡Fin del juego!', youWin: '¡Misión cumplida!', playAgain: 'Jugar de nuevo',
    easy: 'Fácil', medium: 'Medio', hard: 'Difícil', chooseDifficulty: 'Elige dificultad',
    collected: 'Datos recopilados', clickPlanet: '¡Haz clic en los planetas brillantes para recopilar datos!',
    factTitle: '¡Dato del planeta!', close: '¡Increíble!',
  },
};

const instructionsData: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '🌞', title: 'The Solar System', description: 'All 8 planets orbit around the Sun. Each planet has a different size, color, and orbit speed!' },
      { icon: '✨', title: 'Watch for the glow', description: 'When a planet lights up and sparkles, that means it has a fact card ready for you to collect!' },
      { icon: '🖱️', title: 'Click to collect', description: 'Click the glowing planet to collect its fact card. Collect all planets to win the mission!' },
    ],
    controls: [
      { icon: '🖱️', description: 'Click glowing planets to collect facts' },
      { icon: '⌨️', description: 'Number keys 1-8 to target planets by order' },
      { icon: '👆', description: 'Tap on mobile devices' },
    ],
    tip: 'Watch the orbit paths carefully — faster inner planets are easier to click early before they speed past!',
  },
  he: {
    instructions: [
      { icon: '🌞', title: 'מערכת השמש', description: 'כל 8 כוכבי הלכת מקיפים את השמש. לכל כוכב גודל, צבע ומהירות מסלול שונים!' },
      { icon: '✨', title: 'חפשו את הזוהר', description: 'כשכוכב לכת מאיר ומנצנץ, זה אומר שיש לו כרטיס עובדה שמחכה שתאספו!' },
      { icon: '🖱️', title: 'לחצו לאיסוף', description: 'לחצו על כוכב הלכת הזוהר כדי לאסוף את כרטיס העובדה שלו. אספו את כל כוכבי הלכת כדי לנצח!' },
    ],
    controls: [
      { icon: '🖱️', description: 'לחצו על כוכבי לכת זוהרים לאיסוף עובדות' },
      { icon: '⌨️', description: 'מקשים 1-8 לבחירת כוכבי לכת לפי סדר' },
      { icon: '👆', description: 'הקישו במכשיר נייד' },
    ],
    tip: '!שימו לב למסלולי המעגל — כוכבי לכת פנימיים מהירים יותר קל ללחוץ עליהם מוקדם',
  },
  zh: {
    instructions: [
      { icon: '🌞', title: '太阳系', description: '所有8颗行星都围绕太阳运行。每颗行星有不同的大小、颜色和轨道速度！' },
      { icon: '✨', title: '注意发光', description: '当一颗行星发光闪烁时，意味着它有一张事实卡等你收集！' },
      { icon: '🖱️', title: '点击收集', description: '点击发光的行星收集它的事实卡。收集所有行星完成任务！' },
    ],
    controls: [
      { icon: '🖱️', description: '点击发光的行星收集事实' },
      { icon: '⌨️', description: '数字键1-8按顺序定位行星' },
      { icon: '👆', description: '在移动设备上点击' },
    ],
    tip: '仔细观察轨道路径——内行星移动更快，要早点点击！',
  },
  es: {
    instructions: [
      { icon: '🌞', title: 'El Sistema Solar', description: '¡Los 8 planetas orbitan alrededor del Sol. Cada planeta tiene diferente tamaño, color y velocidad!' },
      { icon: '✨', title: 'Observa el brillo', description: '¡Cuando un planeta brilla y centellea, tiene una tarjeta de datos lista para recopilar!' },
      { icon: '🖱️', title: 'Haz clic para recopilar', description: '¡Haz clic en el planeta brillante para recopilar su tarjeta de datos. ¡Recoge todos los planetas para ganar!' },
    ],
    controls: [
      { icon: '🖱️', description: 'Haz clic en planetas brillantes para recopilar datos' },
      { icon: '⌨️', description: 'Teclas numéricas 1-8 para apuntar planetas por orden' },
      { icon: '👆', description: 'Toca en dispositivos móviles' },
    ],
    tip: '¡Observa los caminos de órbita — los planetas internos rápidos son más fáciles de hacer clic antes de que pasen!',
  },
};

// ─── Sun Component ────────────────────────────────────────────────────────────

function Sun() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color="#ffd700" emissive="#ff8c00" emissiveIntensity={1.5} />
      </mesh>
      {/* Glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#ffdd44" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={4} color="#fff5c0" distance={60} decay={2} />
    </group>
  );
}

// ─── Orbit Ring ───────────────────────────────────────────────────────────────

function OrbitRing({ radius }: { radius: number }) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.15 }))} />
  );
}

// ─── Planet Component ─────────────────────────────────────────────────────────

interface PlanetProps {
  planet: PlanetData;
  isGlowing: boolean;
  isCollected: boolean;
  speedMultiplier: number;
  onClick: (planet: PlanetData) => void;
}

function Planet({ planet, isGlowing, isCollected, speedMultiplier, onClick }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const angle = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    angle.current += planet.speed * speedMultiplier * delta;
    const x = Math.cos(angle.current) * planet.orbitRadius;
    const z = Math.sin(angle.current) * planet.orbitRadius;
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      meshRef.current.rotation.y += delta * 0.5;
    }
    if (glowRef.current) {
      glowRef.current.position.set(x, 0, z);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (isGlowing) {
        mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 6) * 0.2;
      }
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isCollected) onClick(planet);
  }, [planet, isCollected, onClick]);

  if (isCollected) return null;

  return (
    <>
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[planet.radius, 32, 32]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={isGlowing ? planet.color : '#000000'}
          emissiveIntensity={isGlowing ? 1.2 : 0}
          metalness={0.1}
          roughness={0.6}
        />
        {/* Saturn rings */}
        {planet.name === 'Saturn' && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.3, 2.2, 32]} />
            <meshBasicMaterial color="#c8a86b" side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
        )}
        {isGlowing && (
          <Html center distanceFactor={8}>
            <div className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-full pointer-events-none whitespace-nowrap animate-pulse">
              ✨ {planet.emoji} {planet.name}
            </div>
          </Html>
        )}
      </mesh>
      {/* Glow halo */}
      {isGlowing && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[planet.radius * 2.0, 16, 16]} />
          <meshBasicMaterial color={planet.color} transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>
      )}
    </>
  );
}

// ─── Game Scene ───────────────────────────────────────────────────────────────

interface GameSceneProps {
  activePlanets: PlanetData[];
  glowingPlanet: string | null;
  collectedPlanets: string[];
  speedMultiplier: number;
  onPlanetClick: (planet: PlanetData) => void;
}

function SolarSystemScene({
  activePlanets, glowingPlanet, collectedPlanets, speedMultiplier, onPlanetClick,
}: GameSceneProps) {
  return (
    <>
      <ambientLight intensity={0.05} />
      <Stars radius={100} depth={50} count={6000} factor={4} saturation={0} />
      <Sun />
      {activePlanets.map(planet => (
        <OrbitRing key={`orbit-${planet.name}`} radius={planet.orbitRadius} />
      ))}
      {activePlanets.map(planet => (
        <Planet
          key={planet.name}
          planet={planet}
          isGlowing={glowingPlanet === planet.name}
          isCollected={collectedPlanets.includes(planet.name)}
          speedMultiplier={speedMultiplier}
          onClick={onPlanetClick}
        />
      ))}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SolarSystem3DGameProps {
  locale?: string;
}

export default function SolarSystem3DGame({ locale = 'en' }: SolarSystem3DGameProps) {
  const t = translations[locale] || translations.en;
  const isRtl = locale === 'he';
  const instrData = instructionsData[locale] || instructionsData.en;

  const { playClick, playSuccess, playBeep, playHit, playLevelUp, playGameOver, playWin } = useRetroSounds();

  const [phase, setPhase] = useState<Phase>('difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(90);
  const [showInstructions, setShowInstructions] = useState(false);
  const [activePlanets, setActivePlanets] = useState<PlanetData[]>([]);
  const [glowingPlanet, setGlowingPlanet] = useState<string | null>(null);
  const [collectedPlanets, setCollectedPlanets] = useState<string[]>([]);
  const [currentFact, setCurrentFact] = useState<{ planet: PlanetData; fact: string } | null>(null);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('solar-system-3d-highscore');
      return s ? parseInt(s, 10) : 0;
    }
    return 0;
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const glowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const glowIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // High score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('solar-system-3d-highscore', String(score));
    }
  }, [score, highScore]);

  // Countdown timer
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

  // Glow interval — pick random non-collected planet to light up
  useEffect(() => {
    if (phase !== 'playing') return;
    const cfg = DIFFICULTY_SETTINGS[difficulty];

    const scheduleGlow = () => {
      glowIntervalRef.current = setTimeout(() => {
        setGlowingPlanet(prev => {
          if (prev) return prev; // already glowing
          return null;
        });
        setCollectedPlanets(collected => {
          setActivePlanets(planets => {
            const available = planets.filter(p => !collected.includes(p.name));
            if (available.length === 0) return planets;
            const chosen = available[Math.floor(Math.random() * available.length)];
            setGlowingPlanet(chosen.name);
            playBeep();
            // Auto-clear after duration
            glowTimerRef.current = setTimeout(() => {
              setGlowingPlanet(null);
              scheduleGlow();
            }, cfg.glowDuration);
            return planets;
          });
          return collected;
        });
      }, 1500 + Math.random() * 1000);
    };

    scheduleGlow();
    return () => {
      clearTimeout(glowIntervalRef.current!);
      clearTimeout(glowTimerRef.current!);
    };
  }, [phase, difficulty, playBeep]);

  const startGame = useCallback((diff: Difficulty) => {
    const cfg = DIFFICULTY_SETTINGS[diff];
    setDifficulty(diff);
    setScore(0);
    setLives(3);
    setTimeLeft(cfg.timeLimit);
    setCollectedPlanets([]);
    setGlowingPlanet(null);
    setCurrentFact(null);
    setActivePlanets(ALL_PLANETS.slice(0, cfg.activePlanets));
    setPhase('instructions');
    setShowInstructions(true);
    playClick();
  }, [playClick]);

  const startPlaying = useCallback(() => {
    setShowInstructions(false);
    setPhase('playing');
  }, []);

  const handlePlanetClick = useCallback((planet: PlanetData) => {
    if (phase !== 'playing') return;

    if (glowingPlanet === planet.name) {
      // Correct! Collect it
      clearTimeout(glowTimerRef.current!);
      playSuccess();
      setGlowingPlanet(null);
      setScore(prev => prev + 200);
      setCurrentFact({ planet, fact: planet.facts[locale] || planet.facts.en });
      setCollectedPlanets(prev => {
        const next = [...prev, planet.name];
        // Check win
        const cfg = DIFFICULTY_SETTINGS[difficulty];
        if (next.length >= cfg.activePlanets) {
          setTimeout(() => {
            setCurrentFact(null);
            setPhase('win');
            playWin();
          }, 2000);
        } else {
          setTimeout(() => {
            setCurrentFact(null);
            // Re-schedule glow
            const schedDelay = 1000;
            glowIntervalRef.current = setTimeout(() => {
              setCollectedPlanets(c2 => {
                setActivePlanets(planets => {
                  const available = planets.filter(p => !c2.includes(p.name));
                  if (available.length === 0) return planets;
                  const chosen = available[Math.floor(Math.random() * available.length)];
                  setGlowingPlanet(chosen.name);
                  playBeep();
                  glowTimerRef.current = setTimeout(() => {
                    setGlowingPlanet(null);
                  }, DIFFICULTY_SETTINGS[difficulty].glowDuration);
                  return planets;
                });
                return c2;
              });
            }, schedDelay);
          }, 2000);
        }
        return next;
      });
    } else if (planet.name !== glowingPlanet) {
      // Wrong planet clicked
      playHit();
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) {
          setPhase('gameover');
          playGameOver();
        }
        return next;
      });
    }
  }, [phase, glowingPlanet, locale, difficulty, playSuccess, playHit, playWin, playGameOver, playBeep]);

  // Keyboard support — number keys 1-8 to click planets
  useEffect(() => {
    if (phase !== 'playing') return;
    const handleKey = (e: KeyboardEvent) => {
      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= activePlanets.length) {
        handlePlanetClick(activePlanets[idx - 1]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, activePlanets, handlePlanetClick]);

  const cfg = DIFFICULTY_SETTINGS[difficulty];

  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)} fullHeight>
    <div className="relative w-full h-full bg-black overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 3D Canvas */}
      {(phase === 'playing' || phase === 'win' || phase === 'gameover') && (
        <Canvas
          camera={{ position: [0, 28, 28], fov: 55 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Suspense fallback={null}>
            <SolarSystemScene
              activePlanets={activePlanets}
              glowingPlanet={glowingPlanet}
              collectedPlanets={collectedPlanets}
              speedMultiplier={cfg.orbitSpeedMultiplier}
              onPlanetClick={handlePlanetClick}
            />
          </Suspense>
        </Canvas>
      )}

      {/* HUD */}
      {phase === 'playing' && (
        <div className="absolute top-4 left-0 right-0 flex justify-between items-start px-4 pointer-events-none z-10">
          <div className="bg-black/60 rounded-2xl px-4 py-2 text-white text-sm font-bold space-y-1">
            <div>⭐ {t.score}: {score}</div>
            <div>❤️ {'❤️'.repeat(lives)}</div>
            <div>🌍 {t.collected}: {collectedPlanets.length}/{cfg.activePlanets}</div>
          </div>
          <div className="bg-black/60 rounded-2xl px-4 py-2 text-white text-center font-bold">
            <div className="text-2xl">{timeLeft}s</div>
            <div className="text-xs">{t.time}</div>
          </div>
        </div>
      )}

      {/* Bottom hint */}
      {phase === 'playing' && !currentFact && (
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
          <div className="inline-block bg-black/60 rounded-xl px-4 py-2 text-white text-sm">
            {glowingPlanet ? `✨ ${glowingPlanet} is glowing! Click it!` : t.clickPlanet}
          </div>
        </div>
      )}

      {/* Fact popup */}
      {currentFact && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 p-4">
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 max-w-md text-center shadow-2xl border-2 border-yellow-400">
            <div className="text-6xl mb-3">{currentFact.planet.emoji}</div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-2">{currentFact.planet.name}!</h3>
            <p className="text-white text-lg leading-relaxed mb-6">{currentFact.fact}</p>
            <div className="text-yellow-300 text-sm animate-pulse">⌛ Continuing in a moment...</div>
          </div>
        </div>
      )}

      {/* Difficulty Selection */}
      {phase === 'difficulty' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-black z-20">
          <div className="text-center px-6 max-w-md">
            <div className="text-7xl mb-4">🪐</div>
            <h1 className="text-4xl font-bold text-white mb-2">{t.title}</h1>
            <p className="text-indigo-300 mb-8">{t.chooseDifficulty}</p>
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
                  {d === 'easy' && ` — ${ALL_PLANETS.slice(0, 4).map(p => p.emoji).join(' ')}`}
                  {d === 'medium' && ` — ${ALL_PLANETS.slice(0, 6).map(p => p.emoji).join(' ')}`}
                  {d === 'hard' && ` — ${ALL_PLANETS.map(p => p.emoji).join(' ')}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="text-7xl mb-4">💫</div>
            <h2 className="text-4xl font-bold text-white mb-2">{t.gameOver}</h2>
            <p className="text-2xl text-yellow-400 mb-2">{t.score}: {score}</p>
            <p className="text-indigo-300 mb-8">{t.collected}: {collectedPlanets.length}/{cfg.activePlanets}</p>
            <button
              onClick={() => setPhase('difficulty')}
              className="min-h-[56px] px-8 rounded-2xl font-bold text-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 transition-transform"
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
            <div className="text-7xl mb-4">🚀</div>
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
    </GameWrapper>
  );
}
