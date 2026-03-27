'use client';

import { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';
import { GameWrapper } from '../shared/GameWrapper';
import { usePlanetTextures } from './hooks/usePlanetTextures';
import { SunWithCorona } from './components/SunWithCorona';
import { SaturnRings } from './components/SaturnRings';
import { StarObject } from './components/StarObject';
import { NAMED_STARS, NamedStar } from './data/namedStars';
import EarthExplorerScene from './EarthExplorerScene';

// ─── Types ─────────────────────────────────────────────────────────────────────────────────

type GameMode = 'solar-system' | 'earth-explorer';

interface PlanetData {
  name: string;
  radius: number;
  orbitRadius: number;
  speed: number;
  textureKey: 'mercury' | 'venus' | 'earthDay' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
  emoji: string;
  moons: number;
  facts: Record<string, string[]>;
}

// ─── Planet definitions ──────────────────────────────────────────────

const ALL_PLANETS: PlanetData[] = [
  {
    name: 'Mercury', radius: 0.3, orbitRadius: 3.0, speed: 0.04,
    textureKey: 'mercury', emoji: '☿', moons: 0,
    facts: {
      en: [
        'Mercury is the closest planet to the Sun — and it has no moons!',
        "A day on Mercury lasts 59 Earth days, but a year is only 88 days — it's the fastest planet!",
      ],
      he: [
        'מרקורי הוא הכוכב הקרוב ביותר לשמש — ואין לו ירחים!',
        'יום על מרקורי נמשך 59 ימי כדור הארץ, אבל שנה היא רק 88 ימים!',
      ],
      zh: [
        '水星是离太阳最近的行星——而且它没有卫星！',
        '水星上的一天持续59个地球日，但一年只有88天——它是运动最快的行星！',
      ],
      es: [
        '¡Mercurio es el planeta más cercano al Sol y no tiene lunas!',
        '¡Un día en Mercurio dura 59 días de la Tierra, pero un año solo 88 días — es el planeta más rápido!',
      ],
    },
  },
  {
    name: 'Venus', radius: 0.5, orbitRadius: 4.8, speed: 0.025,
    textureKey: 'venus', emoji: '♀', moons: 0,
    facts: {
      en: [
        "Venus is the hottest planet — hotter than Mercury, even though it's farther from the Sun!",
        'Venus rotates backwards compared to most planets — the Sun rises in the west there!',
      ],
      he: [
        'נוגה הוא הכוכב החם ביותר — חם יותר ממרקורי, אפילו שהוא רחוק יותר מהשמש!',
        'נוגה מסתובב בכיוון ההפוך ממרבית הכוכבים — השמש זורחת שם במערב!',
      ],
      zh: [
        '金星是最热的行星——尽管比水星离太阳更远，但比水星还热！',
        '金星的自转方向与大多数行星相反——在那里太阳从西边升起！',
      ],
      es: [
        '¡Venus es el planeta más caliente — más caliente que Mercurio, aunque está más lejos del Sol!',
        '¡Venus gira al revés comparado con la mayoría de los planetas — el Sol sale por el oeste allí!',
      ],
    },
  },
  {
    name: 'Earth', radius: 0.55, orbitRadius: 6.5, speed: 0.02,
    textureKey: 'earthDay', emoji: '🌍', moons: 1,
    facts: {
      en: [
        "Earth is the only planet we know of that has life — and it's 71% covered in water!",
        "Earth's magnetic field protects us from deadly solar radiation — without it, life would be impossible!",
      ],
      he: [
        'כדור הארץ הוא הכוכב היחידי שאנו מכירים שיש בו חיים — ו-71% ממנו מכוסה במים!',
        'השדה המגנטי של כדור הארץ מגן עלינו מקרינה סולארית קטלנית!',
      ],
      zh: [
        '地球是我们已知唯一有生命的行星—71%的面积被水覆盖！',
        '地球的磁场保护我们免受致命的太阳辐射——没有它，生命将不可能存在！',
      ],
      es: [
        '¡La Tierra es el único planeta con vida que conocemos — y está cubierta en un 71% por agua!',
        '¡El campo magnético de la Tierra nos protege de la mortal radiación solar!',
      ],
    },
  },
  {
    name: 'Mars', radius: 0.42, orbitRadius: 8.5, speed: 0.015,
    textureKey: 'mars', emoji: '♂', moons: 2,
    facts: {
      en: [
        'Mars is called the Red Planet because its soil contains iron oxide — rust!',
        'Mars has the tallest volcano in the solar system — Olympus Mons is 3× the height of Everest!',
      ],
      he: [
        'מאדים נקרא הכוכב האדום כי קרקעו מכילה תחמוצת ברזל — חלודה!',
        'למאדים יש את הר הגעש הגבוה ביותר בשיטת השמש — אולימפוס מונס גבוה פי 3 מאוורסט!',
      ],
      zh: [
        '火星被称为红色星球，因为其土壤含有氧化铁——铁锈！',
        '火星拥有太阳系中最高的火山——奥林帕斯山是珠穆朗玛峰高度的3倍！',
      ],
      es: [
        '¡Marte se llama el Planeta Rojo porque su suelo contiene óxido de hierro — ¡óxido!',
        '¡Marte tiene el volcán más alto del sistema solar — el Olympus Mons es 3 veces la altura del Everest!',
      ],
    },
  },
  {
    name: 'Jupiter', radius: 1.1, orbitRadius: 12.0, speed: 0.008,
    textureKey: 'jupiter', emoji: '♃', moons: 95,
    facts: {
      en: [
        "Jupiter is so big that 1,300 Earths could fit inside it — it's the largest planet!",
        "Jupiter's Great Red Spot is a storm that has been raging for over 350 years — and it's bigger than Earth!",
      ],
      he: [
        'צדק כל כך גדול שניתן לדחוס לתוכו 1,300 כדורי ארץ — הוא הכוכב הגדול ביותר!',
        'הנקודה האדומה הגדולה של צדק היא סופה שמתחוללת מזה 350 שנה — וגדולה מכדור הארץ!',
      ],
      zh: [
        '木星大到可以容纳1300个地球——它是最大的行星！',
        '木星的大红斑是一场持续超过350年的风暴——而且比地球还大！',
      ],
      es: [
        '¡Júpiter es tan grande que cabrían 1,300 Tierras dentro — es el planeta más grande!',
        '¡La Gran Mancha Roja de Júpiter es una tormenta que lleva más de 350 años rugiendo — y es más grande que la Tierra!',
      ],
    },
  },
  {
    name: 'Saturn', radius: 0.95, orbitRadius: 16.0, speed: 0.006,
    textureKey: 'saturn', emoji: '♄', moons: 146,
    facts: {
      en: [
        "Saturn has beautiful rings made of ice and rock — they're as wide as 282 Earths!",
        'Saturn is the least dense planet — it would float in water if you had a big enough bathtub!',
      ],
      he: [
        'לשבתאי יש טבעות יפהפיות מקרח וסלע — רחבות כ-282 כדורי ארץ!',
        'שבתאי הוא הכוכב דל הצפיפות ביותר — הוא היה צף על מים אם היה לך אמבטיה גדולה מספיק!',
      ],
      zh: [
        '土星有由冰和岩石组成的美丽光环——宽度相当于282个地球！',
        '土星是密度最小的行星——如果有足够大的浴缸，它会漂浮在水面上！',
      ],
      es: [
        '¡Saturno tiene hermosos anillos de hielo y roca — son tan anchos como 282 Tierras!',
        '¡Saturno es el planeta menos denso — flotaría en el agua si tuvieras una bañera suficientemente grande!',
      ],
    },
  },
  {
    name: 'Uranus', radius: 0.7, orbitRadius: 20.0, speed: 0.004,
    textureKey: 'uranus', emoji: '⛢', moons: 28,
    facts: {
      en: [
        "Uranus spins on its side like a rolling ball — it's tilted 98 degrees!",
        'Uranus is so far that a single trip there would take about 10 years from Earth!',
      ],
      he: [
        'אורנוס מסתובב על צידו כמו כדור מתגלגל — הוא מוטה ב-98 מעלות!',
        'אורנוס כל כך רחוק שטיול יחידי אליו יקח כ-10 שנים מכדור הארץ!',
      ],
      zh: ['天王星像滚球一样侧着旋转——倾斜了98度！', '天王星距离如此之远，从地球到那里的单程旅行需要约10年！'],
      es: [
        '¡Urano gira de lado como una pelota rodante — está inclinado 98 grados!',
        '¡Urano está tan lejos que un viaje desde la Tierra tardaría unos 10 años!',
      ],
    },
  },
  {
    name: 'Neptune', radius: 0.68, orbitRadius: 24.0, speed: 0.003,
    textureKey: 'neptune', emoji: '♆', moons: 16,
    facts: {
      en: [
        'Neptune has winds faster than any other planet — up to 2,100 km/h!',
        'Neptune takes 165 Earth years to orbit the Sun — it only completed one full orbit since its discovery in 1846!',
      ],
      he: [
        'לנפטון יש רוחות מהירות יותר מכל כוכב אחר — עד 2,100 קמ"ש!',
        'נפטון לוקח 165 שנות כדור הארץ להקיף את השמש. הוא השלים רק מסלול אחד מלא מאז גילויו ב-1846!',
      ],
      zh: [
        '海王星有任何行星中最快的风速——高达每小时2100公里！',
        '海王星绕太阳一周需要165个地球年。自1846年被发现以来，它只完成了一个完整的轨道！',
      ],
      es: [
        '¡Neptuno tiene vientos más rápidos que cualquier otro planeta — hasta 2,100 km/h!',
        '¡Neptuno tarda 165 años terrestres en orbitar el Sol. Solo completó una órbita desde su descubrimiento en 1846!',
      ],
    },
  },
];

// ─── Translations ─────────────────────────────────────────────────────────────────────────────

const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Solar System Explorer', subtitle: 'Click any planet or star to explore!',
    startExploring: 'Begin Exploring 🔭', exploreEarth: 'Explore Earth 🌍',
    instructions: 'How to Explore', closePanel: 'Continue Exploring',
    orbitDistance: 'Orbit', knownMoons: 'Moons', starType: 'Type',
    distance: 'Distance', temperature: 'Temperature', constellation: 'Constellation',
    starInfoClose: 'Amazing!', au: 'AU',
  },
  he: {
    title: 'חוקר מערכת השמש', subtitle: 'לחץ על כוכב לכת או כוכב כדי לחקור!',
    startExploring: 'התחל לחקור 🔭', exploreEarth: 'חקור כדור הארץ 🌍',
    instructions: 'איך לחקור', closePanel: 'המשך לחקור',
    orbitDistance: 'מסלול', knownMoons: 'ירחים', starType: 'סוג',
    distance: 'מרחק', temperature: 'טמפרטורה', constellation: 'קבוצת כוכבים',
    starInfoClose: 'מדהים!', au: 'AU',
  },
  zh: {
    title: '太阳系探索者', subtitle: '点击任何行星或恒星来探索！',
    startExploring: '开始探索 🔭', exploreEarth: '探索地球 🌍',
    instructions: '如何探索', closePanel: '继续探索',
    orbitDistance: '轨道', knownMoons: '卫星', starType: '类型',
    distance: '距离', temperature: '温度', constellation: '星座',
    starInfoClose: '太棒了！', au: 'AU',
  },
  es: {
    title: 'Explorador del Sistema Solar', subtitle: '¡Haz clic en cualquier planeta o estrella!',
    startExploring: 'Empezar a Explorar 🔭', exploreEarth: 'Explorar la Tierra 🌍',
    instructions: 'Cómo Explorar', closePanel: 'Seguir Explorando',
    orbitDistance: 'Órbita', knownMoons: 'Lunas', starType: 'Tipo',
    distance: 'Distancia', temperature: 'Temperatura', constellation: 'Constelación',
    starInfoClose: '¡Increíble!', au: 'UA',
  },
};

const instructionsData: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '🪐', title: 'Roam Freely', description: 'Drag to rotate the solar system. Scroll to zoom in and out. No time limit — explore at your own pace!' },
      { icon: '🌟', title: 'Click Planets', description: 'Click any planet to focus the camera on it and read amazing facts. The camera will smoothly glide to it!' },
      { icon: '⭐', title: 'Click Stars', description: "The bright stars in the background are real named stars! Click them to learn their distance, temperature, and story." },
    ],
    controls: [
      { icon: '🖱️', description: 'Drag to rotate camera, scroll to zoom' },
      { icon: '🪐', description: 'Click any planet to focus and learn' },
      { icon: '⭐', description: 'Click distant stars to learn about them' },
      { icon: '🌍', description: 'Tap "Explore Earth" for the Earth scene' },
    ],
    tip: 'Try clicking Saturn and zooming in — you can see its rings up close!',
  },
  he: {
    instructions: [
      { icon: '🪐', title: 'תנוע בחופשיות', description: 'גרור לסיבוב מערכת השמש. גלגל לזום פנימה והחוצה. ללא הגבלת זמן — חקור בקצב שלך!' },
      { icon: '🌟', title: 'לחץ על כוכבי לכת', description: 'לחץ על כל כוכב לכת כדי למקד את המצלמה עליו ולקרוא עובדות מדהימות!' },
      { icon: '⭐', title: 'לחץ על כוכבים', description: 'הכוכבים הבהירים ברקע הם כוכבים אמיתיים! לחץ עליהם ללמוד עליהם.' },
    ],
    controls: [
      { icon: '🖱️', description: 'גרור לסיבוב מצלמה, גלגל לזום' },
      { icon: '🪐', description: 'לחץ על כוכב לכת למיקוד ולמידה' },
      { icon: '⭐', description: 'לחץ על כוכבים רחוקים ללמוד עליהם' },
      { icon: '🌍', description: 'הקש "חקור כדור הארץ" לזום' },
    ],
    tip: 'נסה ללחוץ על שבתאי ולהתקרב — תוכל לראות את טבעותיו מקרוב!',
  },
  zh: {
    instructions: [
      { icon: '🪐', title: '自由漫游', description: '拖动旋转太阳系。滚动缩放。没有时间限制——按自己的节奏探索！' },
      { icon: '🌟', title: '点击行星', description: '点击任何行星将相机聚焦在它上面并阅读惊人的事实！' },
      { icon: '⭐', title: '点击恒星', description: '背景中明亮的恒星都是真实的具名恒星！点击了解距离、温度和故事。' },
    ],
    controls: [
      { icon: '🖱️', description: '拖动旋转相机，滚动缩放' },
      { icon: '🪐', description: '点击任何行星聚焦并学习' },
      { icon: '⭐', description: '点击遥远的恒星学习' },
      { icon: '🌍', description: '点击"探索地球"进入地球场景' },
    ],
    tip: '尝试点击土星并放大——你可以近距离看到它的光环！',
  },
  es: {
    instructions: [
      { icon: '🪐', title: 'Explora Libremente', description: '¡Arrastra para rotar el sistema solar. Desplaza para ampliar. Sin límite de tiempo — explora a tu ritmo!' },
      { icon: '🌟', title: 'Clic en Planetas', description: '¡Haz clic en cualquier planeta para enfocar la cámara y leer datos asombrosos!' },
      { icon: '⭐', title: 'Clic en Estrellas', description: '¡Las estrellas del fondo son reales! Haz clic para aprender distancia, temperatura e historia.' },
    ],
    controls: [
      { icon: '🖱️', description: 'Arrastra para rotar, rueda para zoom' },
      { icon: '🪐', description: 'Clic en planetas para enfocar' },
      { icon: '⭐', description: 'Clic en estrellas distantes' },
      { icon: '🌍', description: 'Toca "Explorar la Tierra" para la escena de la Tierra' },
    ],
    tip: '¡Intenta hacer clic en Saturno y acercarte — puedes ver sus anillos de cerca!',
  },
};

// ─── Milky Way Skybox ─────────────────────────────────────────────────────────────────────────────

function MilkyWaySkybox({ texture }: { texture: THREE.Texture }) {
  return (
    <mesh>
      <sphereGeometry args={[490, 32, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

// ─── Orbit Ring ─────────────────────────────────────────────────────────────────────────────────────

function OrbitRing({ radius }: { radius: number }) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.10 }))} />
  );
}

// ─── Generic planet with world-pos click ──────────────────────────────────────────────────────────────

interface WorldPosPlanetProps {
  planet: PlanetData;
  texture: THREE.Texture;
  isSelected: boolean;
  onPlanetClick: (planet: PlanetData, worldPos: THREE.Vector3) => void;
}

function WorldPosPlanet({ planet, texture, isSelected, onPlanetClick }: WorldPosPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const angle = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    angle.current += planet.speed * delta;
    const x = Math.cos(angle.current) * planet.orbitRadius;
    const z = Math.sin(angle.current) * planet.orbitRadius;
    if (meshRef.current) { meshRef.current.position.set(x, 0, z); meshRef.current.rotation.y += delta * 0.4; }
    if (glowRef.current) {
      glowRef.current.position.set(x, 0, z);
      if (isSelected) {
        (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
      }
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const wp = new THREE.Vector3();
    if (meshRef.current) meshRef.current.getWorldPosition(wp);
    onPlanetClick(planet, wp);
  }, [planet, onPlanetClick]);

  return (
    <>
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[planet.radius, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          emissive={isSelected ? '#6699ff' : '#000000'}
          emissiveIntensity={isSelected ? 0.25 : 0}
          roughness={0.8} metalness={0.05}
        />
      </mesh>
      {isSelected && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[planet.radius * 2.2, 16, 16]} />
          <meshBasicMaterial color="#aaccff" transparent opacity={0.15} side={THREE.BackSide} />
        </mesh>
      )}
    </>
  );
}

// ─── Saturn with rings + world-pos click ─────────────────────────────────────────────────────

interface SaturnPlanetProps {
  planet: PlanetData;
  isSelected: boolean;
  saturnTexture: THREE.Texture;
  ringTexture: THREE.Texture;
  onPlanetClick: (planet: PlanetData, worldPos: THREE.Vector3) => void;
}

function SaturnPlanet({ planet, isSelected, saturnTexture, ringTexture, onPlanetClick }: SaturnPlanetProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const angle = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    angle.current += planet.speed * delta;
    const x = Math.cos(angle.current) * planet.orbitRadius;
    const z = Math.sin(angle.current) * planet.orbitRadius;
    if (groupRef.current) groupRef.current.position.set(x, 0, z);
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.4;
    if (glowRef.current && isSelected) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const wp = new THREE.Vector3();
    if (groupRef.current) groupRef.current.getWorldPosition(wp);
    onPlanetClick(planet, wp);
  }, [planet, onPlanetClick]);

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[planet.radius, 32, 32]} />
        <meshStandardMaterial
          map={saturnTexture}
          emissive={isSelected ? '#6699ff' : '#000000'}
          emissiveIntensity={isSelected ? 0.25 : 0}
          roughness={0.8}
        />
      </mesh>
      <SaturnRings ringTexture={ringTexture} />
      {isSelected && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[planet.radius * 2.2, 16, 16]} />
          <meshBasicMaterial color="#aaccff" transparent opacity={0.15} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

// ─── Earth with Moon ────────────────────────────────────────────────────────────────────────────

interface EarthPlanetProps {
  planet: PlanetData;
  earthTexture: THREE.Texture;
  moonTexture: THREE.Texture;
  isSelected: boolean;
  onPlanetClick: (planet: PlanetData, worldPos: THREE.Vector3) => void;
}

function EarthPlanet({ planet, earthTexture, moonTexture, isSelected, onPlanetClick }: EarthPlanetProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const earthRef = useRef<THREE.Mesh>(null!);
  const moonRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const earthAngle = useRef(Math.random() * Math.PI * 2);
  const moonAngle = useRef(0);

  useFrame((state, delta) => {
    earthAngle.current += planet.speed * delta;
    moonAngle.current += 0.8 * delta;
    const ex = Math.cos(earthAngle.current) * planet.orbitRadius;
    const ez = Math.sin(earthAngle.current) * planet.orbitRadius;
    if (groupRef.current) groupRef.current.position.set(ex, 0, ez);
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.3;
    if (moonRef.current) {
      moonRef.current.position.set(
        Math.cos(moonAngle.current) * 1.4, 0,
        Math.sin(moonAngle.current) * 1.4,
      );
    }
    if (glowRef.current && isSelected) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const wp = new THREE.Vector3();
    if (groupRef.current) groupRef.current.getWorldPosition(wp);
    onPlanetClick(planet, wp);
  }, [planet, onPlanetClick]);

  return (
    <group ref={groupRef}>
      <mesh ref={earthRef} onClick={handleClick}>
        <sphereGeometry args={[planet.radius, 32, 32]} />
        <meshStandardMaterial
          map={earthTexture}
          emissive={isSelected ? '#6699ff' : '#000000'}
          emissiveIntensity={isSelected ? 0.25 : 0}
          roughness={0.7} metalness={0.05}
        />
      </mesh>
      <mesh ref={moonRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial map={moonTexture} roughness={0.9} />
      </mesh>
      {isSelected && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[planet.radius * 2.2, 16, 16]} />
          <meshBasicMaterial color="#aaccff" transparent opacity={0.15} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

// ─── Camera Rig ──────────────────────────────────────────────────────────────────────────────────────

interface CameraRigProps {
  focusPoint: THREE.Vector3 | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

function CameraRig({ focusPoint, controlsRef }: CameraRigProps) {
  useFrame((_, delta) => {
    if (!focusPoint || !controlsRef.current) return;
    const controls = controlsRef.current;
    (controls.target as THREE.Vector3).lerp(focusPoint, Math.min(delta * 2.5, 1));
    controls.update();
  });
  return null;
}

// ─── Explorer Scene ───────────────────────────────────────────────────────────────────────────────────

interface ExplorerSceneProps {
  planets: PlanetData[];
  selectedPlanetName: string | null;
  selectedStarId: string | null;
  onPlanetClick: (planet: PlanetData, worldPos: THREE.Vector3) => void;
  onStarClick: (star: NamedStar) => void;
  locale: string;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  focusPoint: THREE.Vector3 | null;
}

function ExplorerScene({
  planets, selectedPlanetName, selectedStarId,
  onPlanetClick, onStarClick, locale, controlsRef, focusPoint,
}: ExplorerSceneProps) {
  const textures = usePlanetTextures();

  return (
    <>
      <ambientLight intensity={0.04} />
      <MilkyWaySkybox texture={textures.milkyWay} />
      <SunWithCorona texture={textures.sun} />
      {planets.map(planet => <OrbitRing key={'o-' + planet.name} radius={planet.orbitRadius} />)}
      {planets.map(planet => {
        if (planet.name === 'Saturn') {
          return (
            <SaturnPlanet key={planet.name} planet={planet}
              isSelected={selectedPlanetName === planet.name}
              saturnTexture={textures.saturn} ringTexture={textures.saturnRing}
              onPlanetClick={onPlanetClick} />
          );
        }
        if (planet.name === 'Earth') {
          return (
            <EarthPlanet key={planet.name} planet={planet}
              earthTexture={textures.earthDay} moonTexture={textures.moon}
              isSelected={selectedPlanetName === planet.name}
              onPlanetClick={onPlanetClick} />
          );
        }
        return (
          <WorldPosPlanet key={planet.name} planet={planet} texture={textures[planet.textureKey]}
            isSelected={selectedPlanetName === planet.name} onPlanetClick={onPlanetClick} />
        );
      })}
      {NAMED_STARS.map(star => (
        <StarObject key={star.id} star={star} skyRadius={200} locale={locale}
          isSelected={selectedStarId === star.id} onStarClick={onStarClick} />
      ))}
      <CameraRig focusPoint={focusPoint} controlsRef={controlsRef} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.3} intensity={1.2} radius={0.6} />
        <Vignette darkness={0.4} offset={0.3} />
      </EffectComposer>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────────────────────────────

interface SolarSystem3DGameProps {
  locale?: string;
}

export default function SolarSystem3DGame({ locale = 'en' }: SolarSystem3DGameProps) {
  const t = translations[locale] || translations.en;
  const isRtl = locale === 'he';
  const instrData = instructionsData[locale] || instructionsData.en;

  const { playClick, playSuccess, playBeep } = useRetroSounds();

  const [gameMode, setGameMode] = useState<GameMode>('solar-system');
  const [exploring, setExploring] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [selectedStar, setSelectedStar] = useState<NamedStar | null>(null);
  const [focusPoint, setFocusPoint] = useState<THREE.Vector3 | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const handlePlanetClick = useCallback((planet: PlanetData, worldPos: THREE.Vector3) => {
    setSelectedPlanet(planet);
    setSelectedStar(null);
    if (worldPos.lengthSq() > 0.01) setFocusPoint(worldPos.clone());
    playSuccess();
  }, [playSuccess]);

  const handleStarClick = useCallback((star: NamedStar) => {
    setSelectedStar(star);
    setSelectedPlanet(null);
    playBeep();
  }, [playBeep]);

  const handleClosePlanetPanel = useCallback(() => {
    setSelectedPlanet(null);
    setFocusPoint(null);
    playClick();
  }, [playClick]);

  const handleCloseStarPanel = useCallback(() => {
    setSelectedStar(null);
    playClick();
  }, [playClick]);

  if (gameMode === 'earth-explorer') {
    return (
      <GameWrapper title="🌍 Earth Explorer" onInstructionsClick={() => {}} fullHeight>
        <EarthExplorerScene locale={locale} onBack={() => { setGameMode('solar-system'); playClick(); }} />
      </GameWrapper>
    );
  }

  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)} fullHeight>
      <div className="relative w-full h-full bg-black overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>

        {/* 3D Scene */}
        {exploring && (
          <Canvas camera={{ position: [0, 28, 28], fov: 55 }} style={{ position: 'absolute', inset: 0 }}>
            <Suspense fallback={null}>
              <ExplorerScene
                planets={ALL_PLANETS}
                selectedPlanetName={selectedPlanet?.name ?? null}
                selectedStarId={selectedStar?.id ?? null}
                onPlanetClick={handlePlanetClick}
                onStarClick={handleStarClick}
                locale={locale}
                controlsRef={controlsRef}
                focusPoint={focusPoint}
              />
            </Suspense>
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              minDistance={3}
              maxDistance={100}
              enableDamping
              dampingFactor={0.05}
            />
          </Canvas>
        )}

        {/* Welcome Screen */}
        {!exploring && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-black z-20">
            <div className="text-center px-6 max-w-md">
              <div className="text-8xl mb-4">🔭</div>
              <h1 className="text-4xl font-bold text-white mb-2">{t.title}</h1>
              <p className="text-indigo-300 mb-8 text-sm">{t.subtitle}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setExploring(true); playClick(); }}
                  className="min-h-[56px] rounded-2xl font-bold text-xl text-white transition-transform hover:scale-105 active:scale-95 shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {t.startExploring}
                </button>
                <button
                  onClick={() => { setGameMode('earth-explorer'); playClick(); }}
                  className="min-h-[56px] rounded-2xl font-bold text-lg text-white transition-transform hover:scale-105 active:scale-95 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0891b2, #0d9488)' }}
                >
                  {t.exploreEarth}
                </button>
                <button
                  onClick={() => setShowInstructions(true)}
                  className="min-h-[44px] rounded-2xl font-bold text-sm text-indigo-300 border border-indigo-700 hover:border-indigo-400 transition-colors"
                >
                  ℹ️ {t.instructions}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Explore Earth button in-scene HUD */}
        {exploring && (
          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => { setGameMode('earth-explorer'); playClick(); }}
              className="min-h-[44px] px-4 py-2 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-teal-700 to-blue-700 hover:scale-105 active:scale-95 transition-transform shadow-lg"
            >
              🌍 {t.exploreEarth}
            </button>
          </div>
        )}

        {/* Hint when no panel open */}
        {exploring && !selectedPlanet && !selectedStar && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-10">
            <div className="bg-black/60 rounded-xl px-4 py-2 text-white text-xs">{t.subtitle}</div>
          </div>
        )}

        {/* Planet panel */}
        {selectedPlanet && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30 p-4" onClick={handleClosePlanetPanel}>
            <div
              className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl border border-white/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-6xl mb-3">{selectedPlanet.emoji}</div>
              <h3 className="text-3xl font-bold text-yellow-300 mb-1">{selectedPlanet.name}</h3>
              <div className="flex justify-center gap-4 text-xs text-indigo-300 mb-4 flex-wrap">
                <span>🌀 {t.orbitDistance}: {selectedPlanet.orbitRadius} {t.au}</span>
                <span>🌙 {t.knownMoons}: {selectedPlanet.moons}</span>
              </div>
              <div className="space-y-3 mb-5">
                {(selectedPlanet.facts[locale] ?? selectedPlanet.facts.en).map((fact, i) => (
                  <p key={i} className="text-white text-sm leading-relaxed bg-white/5 rounded-xl px-4 py-2">{fact}</p>
                ))}
              </div>
              <button onClick={handleClosePlanetPanel}
                className="min-h-[48px] px-8 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 transition-transform">
                {t.closePanel}
              </button>
            </div>
          </div>
        )}

        {/* Star panel */}
        {selectedStar && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 p-4" onClick={handleCloseStarPanel}>
            <div
              className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-white/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-5xl mb-2" style={{ color: selectedStar.color }}>★</div>
              <h3 className="text-2xl font-bold text-white mb-1">{selectedStar.name}</h3>
              <div className="text-gray-400 text-xs mb-3">{selectedStar.bayer} · {selectedStar.constellation}</div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <div className="text-gray-400">{t.distance}</div>
                  <div className="text-cyan-300 font-bold">{selectedStar.distanceLY} ly</div>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <div className="text-gray-400">{t.temperature}</div>
                  <div className="text-orange-300 font-bold">{selectedStar.temperatureK.toLocaleString()} K</div>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <div className="text-gray-400">{t.starType}</div>
                  <div className="text-yellow-300 font-bold">{selectedStar.spectralType}</div>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <div className="text-gray-400">{t.constellation}</div>
                  <div className="text-purple-300 font-bold text-[11px]">{selectedStar.constellation}</div>
                </div>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed mb-5">
                {selectedStar.facts[locale] || selectedStar.facts.en}
              </p>
              <button onClick={handleCloseStarPanel}
                className="min-h-[44px] px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 transition-transform text-sm">
                {t.starInfoClose}
              </button>
            </div>
          </div>
        )}

        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => { setShowInstructions(false); if (!exploring) setExploring(true); }}
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
