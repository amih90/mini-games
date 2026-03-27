'use client';

import { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { InstructionsModal } from '@/features/games/shared/InstructionsModal';
import { GameWrapper } from '../shared/GameWrapper';
import { usePlanetTextures } from './hooks/usePlanetTextures';
import { SunWithCorona } from './components/SunWithCorona';
import { PlanetWithTexture } from './components/PlanetWithTexture';
import { SaturnRings } from './components/SaturnRings';
import { EarthWithMoon } from './components/EarthWithMoon';
import { StarObject } from './components/StarObject';
import { NAMED_STARS, NamedStar } from './data/namedStars';
import EarthExplorerScene from './EarthExplorerScene';

// \u2500\u2500\u2500 Types \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'difficulty' | 'instructions' | 'playing' | 'gameover' | 'win';
type GameMode = 'solar-system' | 'earth-explorer';

interface PlanetData {
  name: string;
  radius: number;
  orbitRadius: number;
  speed: number;
  textureKey: 'mercury' | 'venus' | 'earthDay' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
  emoji: string;
  facts: Record<string, string>;
}

interface DifficultyConfig {
  activePlanets: number;
  orbitSpeedMultiplier: number;
  timeLimit: number;
  glowDuration: number;
}

// \u2500\u2500\u2500 Planet Data \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const ALL_PLANETS: PlanetData[] = [
  {
    name: 'Mercury', radius: 0.3, orbitRadius: 3.0, speed: 0.04,
    textureKey: 'mercury', emoji: '\u263F',
    facts: {
      en: 'Mercury is the closest planet to the Sun \u2014 and it has no moons!',
      he: '\u05de\u05e8\u05e7\u05d5\u05e8\u05d9 \u05d4\u05d5\u05d0 \u05d4\u05db\u05d5\u05db\u05d1 \u05d4\u05e7\u05e8\u05d5\u05d1 \u05d1\u05d9\u05d5\u05ea\u05e8 \u05dc\u05e9\u05de\u05e9 \u2014 \u05d5\u05d0\u05d9\u05df \u05dc\u05d5 \u05d9\u05e8\u05d7\u05d9\u05dd!',
      zh: '\u6c34\u661f\u662f\u79bb\u592a\u9633\u6700\u8fd1\u7684\u884c\u661f\u2014\u2014\u800c\u4e14\u5b83\u6ca1\u6709\u536b\u661f\uff01',
      es: '\u00a1Mercurio es el planeta m\u00e1s cercano al Sol y no tiene lunas!',
    },
  },
  {
    name: 'Venus', radius: 0.5, orbitRadius: 4.8, speed: 0.025,
    textureKey: 'venus', emoji: '\u2640',
    facts: {
      en: "Venus is the hottest planet \u2014 hotter than Mercury, even though it's farther from the Sun!",
      he: '\u05e0\u05d5\u05d2\u05d4 \u05d4\u05d5\u05d0 \u05d4\u05db\u05d5\u05db\u05d1 \u05d4\u05d7\u05dd \u05d1\u05d9\u05d5\u05ea\u05e8!',
      zh: '\u91d1\u661f\u662f\u6700\u70ed\u7684\u884c\u661f\uff01',
      es: '\u00a1Venus es el planeta m\u00e1s caliente!',
    },
  },
  {
    name: 'Earth', radius: 0.55, orbitRadius: 6.5, speed: 0.02,
    textureKey: 'earthDay', emoji: '\ud83c\udf0d',
    facts: {
      en: "Earth is the only planet we know of that has life \u2014 and it's 71% covered in water!",
      he: '\u05db\u05d3\u05d5\u05e8 \u05d4\u05d0\u05e8\u05e5 \u05d4\u05d5\u05d0 \u05d4\u05db\u05d5\u05db\u05d1 \u05d4\u05d9\u05d7\u05d9\u05d3\u05d9 \u05e9\u05d9\u05e9 \u05d1\u05d5 \u05d7\u05d9\u05d9\u05dd!',
      zh: '\u5730\u7403\u662f\u6211\u4eec\u5df2\u77e5\u552f\u4e00\u6709\u751f\u547d\u7684\u884c\u661f\uff01',
      es: '\u00a1La Tierra es el \u00fanico planeta con vida!',
    },
  },
  {
    name: 'Mars', radius: 0.42, orbitRadius: 8.5, speed: 0.015,
    textureKey: 'mars', emoji: '\u2642',
    facts: {
      en: 'Mars is called the Red Planet because its soil contains iron oxide \u2014 rust!',
      he: '\u05de\u05d0\u05d3\u05d9\u05dd \u05e0\u05e7\u05e8\u05d0 \u05d4\u05db\u05d5\u05db\u05d1 \u05d4\u05d0\u05d3\u05d5\u05dd!',
      zh: '\u706b\u661f\u88ab\u79f0\u4e3a\u7ea2\u8272\u661f\u7403\uff01',
      es: '\u00a1Marte se llama el Planeta Rojo!',
    },
  },
  {
    name: 'Jupiter', radius: 1.1, orbitRadius: 12.0, speed: 0.008,
    textureKey: 'jupiter', emoji: '\u2643',
    facts: {
      en: "Jupiter is so big that 1,300 Earths could fit inside it \u2014 it's the largest planet!",
      he: '\u05e6\u05d3\u05e7 \u05db\u05dc \u05db\u05da \u05d2\u05d3\u05d5\u05dc \u2014 \u05d4\u05d5\u05d0 \u05d4\u05db\u05d5\u05db\u05d1 \u05d4\u05d2\u05d3\u05d5\u05dc \u05d1\u05d9\u05d5\u05ea\u05e8!',
      zh: '\u6728\u661f\u662f\u6700\u5927\u7684\u884c\u661f\uff01',
      es: '\u00a1J\u00fapiter es el planeta m\u00e1s grande!',
    },
  },
  {
    name: 'Saturn', radius: 0.95, orbitRadius: 16.0, speed: 0.006,
    textureKey: 'saturn', emoji: '\u2644',
    facts: {
      en: "Saturn has beautiful rings made of ice and rock \u2014 they're as wide as 282 Earths!",
      he: '\u05dc\u05e9\u05d1\u05ea\u05d0\u05d9 \u05d9\u05e9 \u05d8\u05d1\u05e2\u05d5\u05ea \u05d9\u05e4\u05d4\u05e4\u05d9\u05d5\u05ea!',
      zh: '\u571f\u661f\u6709\u7f8e\u4e3d\u7684\u73af\uff01',
      es: '\u00a1Saturno tiene hermosos anillos!',
    },
  },
  {
    name: 'Uranus', radius: 0.7, orbitRadius: 20.0, speed: 0.004,
    textureKey: 'uranus', emoji: '\u26e2',
    facts: {
      en: "Uranus spins on its side like a rolling ball \u2014 it's tilted 98 degrees!",
      he: '\u05d0\u05d5\u05e8\u05e0\u05d5\u05e1 \u05de\u05e1\u05ea\u05d5\u05d1\u05d1 \u05e2\u05dc \u05e6\u05d9\u05d3\u05d5!',
      zh: '\u5929\u738b\u661f\u50cf\u6eda\u7403\u4e00\u6837\u4fa7\u7740\u65cb\u8f6c\uff01',
      es: '\u00a1Urano gira de lado!',
    },
  },
  {
    name: 'Neptune', radius: 0.68, orbitRadius: 24.0, speed: 0.003,
    textureKey: 'neptune', emoji: '\u2646',
    facts: {
      en: 'Neptune has winds faster than any other planet \u2014 up to 2,100 km/h!',
      he: '\u05dc\u05e0\u05e4\u05d8\u05d5\u05df \u05d9\u05e9 \u05e8\u05d5\u05d7\u05d5\u05ea \u05de\u05d4\u05d9\u05e8\u05d5\u05ea \u05d9\u05d5\u05ea\u05e8!',
      zh: '\u6d77\u738b\u661f\u6709\u6700\u5feb\u7684\u98ce\uff01',
      es: '\u00a1Neptuno tiene vientos muy r\u00e1pidos!',
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
    title: 'Solar System Explorer', chooseDifficulty: 'Choose Difficulty',
    easy: 'Easy', medium: 'Medium', hard: 'Hard',
    gameOver: 'Game Over!', youWin: 'Mission Complete!', playAgain: 'Play Again',
    score: 'Score', time: 'Time', collected: 'Collected',
    clickPlanet: 'Click glowing planets to collect facts!',
    exploreEarth: 'Explore Earth', starInfoClose: 'Amazing!',
  },
  he: {
    title: '\u05d7\u05d5\u05e7\u05e8 \u05de\u05e2\u05e8\u05db\u05ea \u05d4\u05e9\u05de\u05e9', chooseDifficulty: '\u05d1\u05d7\u05e8 \u05e8\u05de\u05ea \u05e7\u05d5\u05e9\u05d9',
    easy: '\u05e7\u05dc', medium: '\u05d1\u05d9\u05e0\u05d5\u05e0\u05d9', hard: '\u05e7\u05e9\u05d4',
    gameOver: '\u05d4\u05de\u05e9\u05d7\u05e7 \u05e0\u05d2\u05de\u05e8!', youWin: '\u05de\u05e9\u05d9\u05de\u05d4 \u05d4\u05d5\u05e9\u05dc\u05de\u05d4!', playAgain: '\u05e9\u05d7\u05e7 \u05e9\u05d5\u05d1',
    score: '\u05e0\u05d9\u05e7\u05d5\u05d3', time: '\u05d6\u05de\u05df', collected: '\u05e0\u05d0\u05e1\u05e3',
    clickPlanet: '\u05dc\u05d7\u05e5 \u05e2\u05dc \u05db\u05d5\u05db\u05d1\u05d9 \u05dc\u05db\u05ea \u05d6\u05d5\u05d4\u05e8\u05d9\u05dd!',
    exploreEarth: '\u05d7\u05e7\u05d5\u05e8 \u05db\u05d3\u05d5\u05e8 \u05d4\u05d0\u05e8\u05e5', starInfoClose: '\u05de\u05d3\u05d4\u05d9\u05dd!',
  },
  zh: {
    title: '\u592a\u9633\u7cfb\u63a2\u7d22\u8005', chooseDifficulty: '\u9009\u62e9\u96be\u5ea6',
    easy: '\u5bb9\u6613', medium: '\u4e2d\u7b49', hard: '\u56f0\u96be',
    gameOver: '\u6e38\u620f\u7ed3\u675f\uff01', youWin: '\u4efb\u52a1\u5b8c\u6210\uff01', playAgain: '\u518d\u73a9\u4e00\u6b21',
    score: '\u5f97\u5206', time: '\u65f6\u95f4', collected: '\u5df2\u6536\u96c6',
    clickPlanet: '\u70b9\u51fb\u53d1\u5149\u7684\u884c\u661f\u6536\u96c6\u4e8b\u5b9e\uff01',
    exploreEarth: '\u63a2\u7d22\u5730\u7403', starInfoClose: '\u592a\u68d2\u4e86\uff01',
  },
  es: {
    title: 'Explorador del Sistema Solar', chooseDifficulty: 'Elige dificultad',
    easy: 'F\u00e1cil', medium: 'Medio', hard: 'Dif\u00edcil',
    gameOver: '\u00a1Fin del juego!', youWin: '\u00a1Misi\u00f3n cumplida!', playAgain: 'Jugar de nuevo',
    score: 'Puntuaci\u00f3n', time: 'Tiempo', collected: 'Recopilados',
    clickPlanet: '\u00a1Haz clic en los planetas brillantes!',
    exploreEarth: 'Explorar la Tierra', starInfoClose: '\u00a1Incre\u00edble!',
  },
};

const instructionsData: Record<string, {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}> = {
  en: {
    instructions: [
      { icon: '\ud83c\udf1e', title: 'The Solar System', description: 'All 8 planets orbit around the Sun. Each planet has a different size and orbit speed!' },
      { icon: '\u2728', title: 'Watch for the glow', description: 'When a planet lights up, it has a fact card ready for you to collect!' },
      { icon: '\ud83d\uddb1\ufe0f', title: 'Click to collect', description: 'Click the glowing planet to collect its fact card. Collect all planets to win!' },
    ],
    controls: [
      { icon: '\ud83d\uddb1\ufe0f', description: 'Drag to rotate camera, scroll to zoom' },
      { icon: '\u2728', description: 'Click glowing planets to collect facts' },
      { icon: '\u2b50', description: 'Click distant stars to learn about them' },
      { icon: '\u26f3', description: 'Number keys 1-8 to target planets' },
    ],
    tip: "Use the free-roam camera to zoom in on planets \u2014 you'll see their real NASA-derived textures up close!",
  },
  he: {
    instructions: [
      { icon: '\ud83c\udf1e', title: '\u05de\u05e2\u05e8\u05db\u05ea \u05d4\u05e9\u05de\u05e9', description: '\u05db\u05dc 8 \u05db\u05d5\u05db\u05d1\u05d9 \u05d4\u05dc\u05db\u05ea \u05de\u05e7\u05d9\u05e4\u05d9\u05dd \u05d0\u05ea \u05d4\u05e9\u05de\u05e9!' },
      { icon: '\u2728', title: '\u05d7\u05e4\u05e9\u05d5 \u05d0\u05ea \u05d4\u05d6\u05d5\u05d4\u05e8', description: '\u05db\u05e9\u05db\u05d5\u05db\u05d1 \u05e0\u05d3\u05dc\u05e7, \u05d4\u05d5\u05d0 \u05de\u05d5\u05db\u05df \u05dc\u05d0\u05d9\u05e1\u05d5\u05e3!' },
      { icon: '\ud83d\uddb1\ufe0f', title: '\u05dc\u05d7\u05e5 \u05dc\u05d0\u05d9\u05e1\u05d5\u05e3', description: '\u05dc\u05d7\u05e5 \u05e2\u05dc \u05db\u05d5\u05db\u05d1 \u05d4\u05d6\u05d5\u05d4\u05e8 \u05dc\u05d0\u05d9\u05e1\u05d5\u05e3!' },
    ],
    controls: [
      { icon: '\ud83d\uddb1\ufe0f', description: '\u05d2\u05e8\u05d5\u05e8 \u05dc\u05e1\u05d9\u05d1\u05d5\u05d1 \u05de\u05e6\u05dc\u05de\u05d4, \u05d2\u05dc\u05d2\u05dc \u05dc\u05d6\u05d5\u05dd' },
      { icon: '\u2728', description: '\u05dc\u05d7\u05e5 \u05e2\u05dc \u05db\u05d5\u05db\u05d1\u05d9 \u05dc\u05db\u05ea \u05d6\u05d5\u05d4\u05e8\u05d9\u05dd' },
      { icon: '\u26f3', description: '\u05de\u05e7\u05e9\u05d9\u05dd 1-8 \u05dc\u05d1\u05d7\u05d9\u05e8\u05ea \u05db\u05d5\u05db\u05d1\u05d9\u05dd' },
      { icon: '\ud83d\udc46', description: '\u05d4\u05e7\u05e9 \u05d1\u05de\u05db\u05e9\u05d9\u05e8 \u05e0\u05d9\u05d9\u05d3' },
    ],
    tip: '\u05d4\u05e9\u05ea\u05de\u05e9 \u05d1\u05de\u05e6\u05dc\u05de\u05d4 \u05d4\u05d7\u05d5\u05e4\u05e9\u05d9\u05ea \u05db\u05d3\u05d9 \u05dc\u05d4\u05ea\u05e7\u05e8\u05d1 \u05dc\u05db\u05d5\u05db\u05d1\u05d9\u05dd!',
  },
  zh: {
    instructions: [
      { icon: '\ud83c\udf1e', title: '\u592a\u9633\u7cfb', description: '\u6240\u67088\u9897\u884c\u661f\u90fd\u56f4\u7ed5\u592a\u9633\u8fd0\u884c\uff01' },
      { icon: '\u2728', title: '\u6ce8\u610f\u53d1\u5149', description: '\u5f53\u884c\u661f\u53d1\u5149\u65f6\uff0c\u5b83\u6709\u4e00\u5f20\u4e8b\u5b9e\u5361\u7b49\u4f60\u6536\u96c6\uff01' },
      { icon: '\ud83d\uddb1\ufe0f', title: '\u70b9\u51fb\u6536\u96c6', description: '\u70b9\u51fb\u53d1\u5149\u7684\u884c\u661f\u6536\u96c6\u5b83\u7684\u4e8b\u5b9e\u5361\u3002' },
    ],
    controls: [
      { icon: '\ud83d\uddb1\ufe0f', description: '\u62d6\u52a8\u65cb\u8f6c\u76f8\u673a\uff0c\u6eda\u52a8\u7f29\u653e' },
      { icon: '\u2728', description: '\u70b9\u51fb\u53d1\u5149\u884c\u661f' },
      { icon: '\u26f3', description: '\u6570\u5b57\u952e1-8\u9009\u62e9\u884c\u661f' },
      { icon: '\ud83d\udc46', description: '\u5728\u79fb\u52a8\u8bbe\u5907\u4e0a\u89e6\u6478' },
    ],
    tip: '\u4f7f\u7528\u81ea\u7531\u8f6c\u52a8\u76f8\u673a\u8fdb\u884c\u653e\u5927\uff01',
  },
  es: {
    instructions: [
      { icon: '\ud83c\udf1e', title: 'El Sistema Solar', description: '\u00a1Los 8 planetas orbitan alrededor del Sol!' },
      { icon: '\u2728', title: 'Observa el brillo', description: '\u00a1Cuando un planeta brilla, tiene una tarjeta lista!' },
      { icon: '\ud83d\uddb1\ufe0f', title: 'Haz clic para recopilar', description: '\u00a1Haz clic en el planeta brillante!' },
    ],
    controls: [
      { icon: '\ud83d\uddb1\ufe0f', description: 'Arrastra para rotar, rueda para zoom' },
      { icon: '\u2728', description: 'Clic en planetas brillantes' },
      { icon: '\u26f3', description: 'Teclas 1-8 para planetas' },
      { icon: '\ud83d\udc46', description: 'Toca en m\u00f3vil' },
    ],
    tip: '\u00a1Usa la c\u00e1mara libre para acercarte a los planetas!',
  },
};

// \u2500\u2500\u2500 Milky Way Skybox \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function MilkyWaySkybox({ texture }: { texture: THREE.Texture }) {
  return (
    <mesh>
      <sphereGeometry args={[490, 32, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

// \u2500\u2500\u2500 Orbit Ring \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function OrbitRing({ radius }: { radius: number }) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.12 }))} />;
}

// \u2500\u2500\u2500 Saturn Planet (with rings) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

interface SaturnPlanetProps {
  planet: PlanetData;
  isGlowing: boolean;
  isCollected: boolean;
  speedMultiplier: number;
  saturnTexture: THREE.Texture;
  ringTexture: THREE.Texture;
  onClick: () => void;
}

function SaturnPlanet({ planet, isGlowing, isCollected, speedMultiplier, saturnTexture, ringTexture, onClick }: SaturnPlanetProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const angle = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    angle.current += planet.speed * speedMultiplier * delta;
    const x = Math.cos(angle.current) * planet.orbitRadius;
    const z = Math.sin(angle.current) * planet.orbitRadius;
    if (groupRef.current) groupRef.current.position.set(x, 0, z);
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.4;
    if (glowRef.current && isGlowing) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + Math.sin(state.clock.elapsedTime * 6) * 0.15;
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isCollected) onClick();
  }, [isCollected, onClick]);

  if (isCollected) return null;

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[planet.radius, 32, 32]} />
        <meshStandardMaterial
          map={saturnTexture}
          emissive={isGlowing ? '#ffffff' : '#000000'}
          emissiveIntensity={isGlowing ? 0.3 : 0}
          roughness={0.8}
        />
      </mesh>
      <SaturnRings ringTexture={ringTexture} />
      {isGlowing && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[planet.radius * 1.8, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

// \u2500\u2500\u2500 Game Scene \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

interface GameSceneProps {
  activePlanets: PlanetData[];
  glowingPlanet: string | null;
  collectedPlanets: string[];
  speedMultiplier: number;
  onPlanetClick: (planet: PlanetData) => void;
  onStarClick: (star: NamedStar) => void;
  locale: string;
}

function GameScene({ activePlanets, glowingPlanet, collectedPlanets, speedMultiplier, onPlanetClick, onStarClick, locale }: GameSceneProps) {
  const textures = usePlanetTextures();
  const earthPlanet = activePlanets.find(p => p.name === 'Earth');
  const earthIsCollected = collectedPlanets.includes('Earth');

  return (
    <>
      <ambientLight intensity={0.04} />
      <MilkyWaySkybox texture={textures.milkyWay} />
      <SunWithCorona texture={textures.sun} />
      {activePlanets.map(planet => (
        <OrbitRing key={'orbit-' + planet.name} radius={planet.orbitRadius} />
      ))}
      {activePlanets.map(planet => {
        if (planet.name === 'Saturn') {
          return (
            <SaturnPlanet
              key={planet.name}
              planet={planet}
              isGlowing={glowingPlanet === planet.name}
              isCollected={collectedPlanets.includes(planet.name)}
              speedMultiplier={speedMultiplier}
              saturnTexture={textures.saturn}
              ringTexture={textures.saturnRing}
              onClick={() => onPlanetClick(planet)}
            />
          );
        }
        if (planet.name === 'Earth') {
          return (
            <EarthWithMoon
              key={planet.name}
              radius={planet.radius}
              orbitRadius={planet.orbitRadius}
              speed={planet.speed}
              speedMultiplier={speedMultiplier}
              earthTexture={textures.earthDay}
              moonTexture={textures.moon}
              isGlowing={glowingPlanet === planet.name}
              isCollected={earthIsCollected}
              onClick={() => onPlanetClick(planet)}
            />
          );
        }
        return (
          <PlanetWithTexture
            key={planet.name}
            name={planet.name}
            emoji={planet.emoji}
            radius={planet.radius}
            orbitRadius={planet.orbitRadius}
            speed={planet.speed}
            speedMultiplier={speedMultiplier}
            texture={textures[planet.textureKey]}
            isGlowing={glowingPlanet === planet.name}
            isCollected={collectedPlanets.includes(planet.name)}
            onClick={() => onPlanetClick(planet)}
          />
        );
      })}
      {NAMED_STARS.map(star => (
        <StarObject
          key={star.id}
          star={star}
          skyRadius={200}
          locale={locale}
          onStarClick={onStarClick}
        />
      ))}
      <EffectComposer>
        <Bloom luminanceThreshold={0.3} intensity={1.2} radius={0.6} />
        <Vignette darkness={0.4} offset={0.3} />
      </EffectComposer>
    </>
  );
}

// \u2500\u2500\u2500 Main Component \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

interface SolarSystem3DGameProps {
  locale?: string;
}

export default function SolarSystem3DGame({ locale = 'en' }: SolarSystem3DGameProps) {
  const t = translations[locale] || translations.en;
  const isRtl = locale === 'he';
  const instrData = instructionsData[locale] || instructionsData.en;

  const { playClick, playSuccess, playBeep, playHit, playGameOver, playWin } = useRetroSounds();

  const [gameMode, setGameMode] = useState<GameMode>('solar-system');
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
  const [selectedStar, setSelectedStar] = useState<NamedStar | null>(null);
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

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('solar-system-3d-highscore', String(score));
    }
  }, [score, highScore]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); setPhase('gameover'); playGameOver(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase, playGameOver]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const cfg = DIFFICULTY_SETTINGS[difficulty];
    const scheduleGlow = () => {
      glowIntervalRef.current = setTimeout(() => {
        setGlowingPlanet(prev => { if (prev) return prev; return null; });
        setCollectedPlanets(collected => {
          setActivePlanets(planets => {
            const available = planets.filter(p => !collected.includes(p.name));
            if (available.length === 0) return planets;
            const chosen = available[Math.floor(Math.random() * available.length)];
            setGlowingPlanet(chosen.name);
            playBeep();
            glowTimerRef.current = setTimeout(() => { setGlowingPlanet(null); scheduleGlow(); }, cfg.glowDuration);
            return planets;
          });
          return collected;
        });
      }, 1500 + Math.random() * 1000);
    };
    scheduleGlow();
    return () => { clearTimeout(glowIntervalRef.current!); clearTimeout(glowTimerRef.current!); };
  }, [phase, difficulty, playBeep]);

  const startGame = useCallback((diff: Difficulty) => {
    const cfg = DIFFICULTY_SETTINGS[diff];
    setDifficulty(diff);
    setScore(0); setLives(3); setTimeLeft(cfg.timeLimit);
    setCollectedPlanets([]); setGlowingPlanet(null); setCurrentFact(null);
    setActivePlanets(ALL_PLANETS.slice(0, cfg.activePlanets));
    setPhase('instructions'); setShowInstructions(true);
    playClick();
  }, [playClick]);

  const startPlaying = useCallback(() => { setShowInstructions(false); setPhase('playing'); }, []);

  const handlePlanetClick = useCallback((planet: PlanetData) => {
    if (phase !== 'playing') return;
    if (glowingPlanet === planet.name) {
      clearTimeout(glowTimerRef.current!);
      playSuccess();
      setGlowingPlanet(null);
      setScore(prev => prev + 200);
      setCurrentFact({ planet, fact: planet.facts[locale] || planet.facts.en });
      setCollectedPlanets(prev => {
        const next = [...prev, planet.name];
        const cfg = DIFFICULTY_SETTINGS[difficulty];
        if (next.length >= cfg.activePlanets) {
          setTimeout(() => { setCurrentFact(null); setPhase('win'); playWin(); }, 2000);
        } else {
          setTimeout(() => {
            setCurrentFact(null);
            glowIntervalRef.current = setTimeout(() => {
              setCollectedPlanets(c2 => {
                setActivePlanets(planets => {
                  const available = planets.filter(p => !c2.includes(p.name));
                  if (available.length === 0) return planets;
                  const chosen = available[Math.floor(Math.random() * available.length)];
                  setGlowingPlanet(chosen.name);
                  playBeep();
                  glowTimerRef.current = setTimeout(() => { setGlowingPlanet(null); }, DIFFICULTY_SETTINGS[difficulty].glowDuration);
                  return planets;
                });
                return c2;
              });
            }, 1000);
          }, 2000);
        }
        return next;
      });
    } else if (planet.name !== glowingPlanet) {
      playHit();
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) { setPhase('gameover'); playGameOver(); }
        return next;
      });
    }
  }, [phase, glowingPlanet, locale, difficulty, playSuccess, playHit, playWin, playGameOver, playBeep]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const handleKey = (e: KeyboardEvent) => {
      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= activePlanets.length) handlePlanetClick(activePlanets[idx - 1]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, activePlanets, handlePlanetClick]);

  const handleStarClick = useCallback((star: NamedStar) => { setSelectedStar(star); playBeep(); }, [playBeep]);

  const cfg = DIFFICULTY_SETTINGS[difficulty];

  if (gameMode === 'earth-explorer') {
    return (
      <GameWrapper title="\ud83c\udf0d Earth Explorer" onInstructionsClick={() => {}} fullHeight>
        <EarthExplorerScene locale={locale} onBack={() => setGameMode('solar-system')} />
      </GameWrapper>
    );
  }

  return (
    <GameWrapper title={t.title} onInstructionsClick={() => setShowInstructions(true)} fullHeight>
    <div className="relative w-full h-full bg-black overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {(phase === 'playing' || phase === 'win' || phase === 'gameover') && (
        <Canvas camera={{ position: [0, 28, 28], fov: 55 }} style={{ position: 'absolute', inset: 0 }}>
          <Suspense fallback={null}>
            <GameScene
              activePlanets={activePlanets}
              glowingPlanet={glowingPlanet}
              collectedPlanets={collectedPlanets}
              speedMultiplier={cfg.orbitSpeedMultiplier}
              onPlanetClick={handlePlanetClick}
              onStarClick={handleStarClick}
              locale={locale}
            />
          </Suspense>
          <OrbitControls enablePan={false} minDistance={5} maxDistance={80} enableDamping dampingFactor={0.05} />
        </Canvas>
      )}

      {phase === 'playing' && (
        <div className="absolute top-4 left-0 right-0 flex justify-between items-start px-4 pointer-events-none z-10">
          <div className="bg-black/60 rounded-2xl px-4 py-2 text-white text-sm font-bold space-y-1">
            <div>\u2b50 {t.score}: {score}</div>
            <div>\u2764\ufe0f {'\u2764\ufe0f'.repeat(lives)}</div>
            <div>\ud83c\udf0d {t.collected}: {collectedPlanets.length}/{cfg.activePlanets}</div>
          </div>
          <div className="bg-black/60 rounded-2xl px-4 py-2 text-white text-center font-bold">
            <div className="text-2xl">{timeLeft}s</div>
            <div className="text-xs">{t.time}</div>
          </div>
        </div>
      )}

      {phase === 'playing' && !currentFact && (
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
          <div className="inline-block bg-black/60 rounded-xl px-4 py-2 text-white text-sm">
            {glowingPlanet ? ('\u2728 ' + glowingPlanet + ' is glowing! Click it!') : t.clickPlanet}
          </div>
        </div>
      )}

      {currentFact && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 p-4">
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 max-w-md text-center shadow-2xl border-2 border-yellow-400">
            <div className="text-6xl mb-3">{currentFact.planet.emoji}</div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-2">{currentFact.planet.name}!</h3>
            <p className="text-white text-lg leading-relaxed mb-6">{currentFact.fact}</p>
            <div className="text-yellow-300 text-sm animate-pulse">\u231b Continuing in a moment...</div>
          </div>
        </div>
      )}

      {selectedStar && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-30 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-white/20">
            <div className="text-4xl mb-2" style={{ color: selectedStar.color }}>\u2605</div>
            <h3 className="text-xl font-bold text-white mb-1">{selectedStar.name}</h3>
            <div className="text-gray-400 text-xs mb-3">{selectedStar.bayer} \u00b7 {selectedStar.constellation}</div>
            <div className="flex justify-center gap-4 text-sm mb-4">
              <span className="text-yellow-300">Mag: {selectedStar.apparentMagnitude}</span>
              <span className="text-cyan-300">{selectedStar.distanceLY} ly</span>
              <span className="text-red-300">{selectedStar.temperatureK.toLocaleString()}K</span>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed mb-5">
              {selectedStar.facts[locale] || selectedStar.facts.en}
            </p>
            <button
              onClick={() => setSelectedStar(null)}
              className="min-h-[44px] px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 transition-transform text-sm"
            >
              {t.starInfoClose}
            </button>
          </div>
        </div>
      )}

      {phase === 'difficulty' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-black z-20">
          <div className="text-center px-6 max-w-md">
            <div className="text-7xl mb-4">\ud83e\ude90</div>
            <h1 className="text-4xl font-bold text-white mb-2">{t.title}</h1>
            <p className="text-indigo-300 mb-6">{t.chooseDifficulty}</p>
            <div className="flex flex-col gap-3">
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
                  {d === 'easy' ? '\ud83d\udfe2' : d === 'medium' ? '\ud83d\udfe1' : '\ud83d\udd34'} {t[d]}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setGameMode('earth-explorer'); playClick(); }}
              className="mt-5 min-h-[48px] w-full rounded-2xl font-bold text-white bg-gradient-to-r from-blue-700 to-teal-700 hover:scale-105 active:scale-95 transition-transform text-base shadow-lg"
            >
              \ud83c\udf0d {t.exploreEarth}
            </button>
          </div>
        </div>
      )}

      {phase === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="text-7xl mb-4">\ud83d\udcab</div>
            <h2 className="text-4xl font-bold text-white mb-2">{t.gameOver}</h2>
            <p className="text-2xl text-yellow-400 mb-2">{t.score}: {score}</p>
            <p className="text-indigo-300 mb-8">{t.collected}: {collectedPlanets.length}/{cfg.activePlanets}</p>
            <button onClick={() => setPhase('difficulty')} className="min-h-[56px] px-8 rounded-2xl font-bold text-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 transition-transform">
              {t.playAgain}
            </button>
          </div>
        </div>
      )}

      {phase === 'win' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="text-7xl mb-4">\ud83d\ude80</div>
            <h2 className="text-4xl font-bold text-yellow-400 mb-2">{t.youWin}</h2>
            <p className="text-2xl text-white mb-8">{t.score}: {score}</p>
            <button onClick={() => setPhase('difficulty')} className="min-h-[56px] px-8 rounded-2xl font-bold text-xl text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 transition-transform">
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
