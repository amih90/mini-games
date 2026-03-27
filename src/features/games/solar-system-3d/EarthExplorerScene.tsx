'use client';

import { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { usePlanetTextures } from './hooks/usePlanetTextures';
import { EarthHotspotMarker } from './components/EarthHotspotMarker';
import { EARTH_HOTSPOTS, EarthHotspot, HotspotCategory } from './data/earthHotspots';

// ─── Translations ─────────────────────────────────────────────────────────────

const t: Record<string, Record<string, string>> = {
  en: {
    title: 'Earth Explorer',
    backToSolar: '← Solar System',
    filterAll: 'All',
    filterNature: '🌿 Nature',
    filterGeography: '🏔️ Geography',
    filterHistory: '🏺 History',
    filterScience: '🔭 Science',
    close: 'Explore more!',
    tapHotspot: 'Tap any glowing marker to learn about Earth!',
  },
  he: {
    title: 'חוקר כדור הארץ',
    backToSolar: '← מערכת השמש',
    filterAll: 'הכל',
    filterNature: '🌿 טבע',
    filterGeography: '🏔️ גאוגרפיה',
    filterHistory: '🏺 היסטוריה',
    filterScience: '🔭 מדע',
    close: 'גלה עוד!',
    tapHotspot: '!הקש על כל סמן זוהר כדי ללמוד על כדור הארץ',
  },
  zh: {
    title: '地球探索者',
    backToSolar: '← 太阳系',
    filterAll: '全部',
    filterNature: '🌿 自然',
    filterGeography: '🏔️ 地理',
    filterHistory: '🏺 历史',
    filterScience: '🔭 科学',
    close: '继续探索！',
    tapHotspot: '点击任何发光标记了解地球！',
  },
  es: {
    title: 'Explorador de la Tierra',
    backToSolar: '← Sistema Solar',
    filterAll: 'Todo',
    filterNature: '🌿 Naturaleza',
    filterGeography: '🏔️ Geografía',
    filterHistory: '🏺 Historia',
    filterScience: '🔭 Ciencia',
    close: '¡Explorar más!',
    tapHotspot: '¡Toca cualquier marcador brillante para aprender sobre la Tierra!',
  },
};

// ─── Earth 3D with day/night layers ──────────────────────────────────────────

const EARTH_RADIUS = 1.5;

function EarthGlobe() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const cloudRef = useRef<THREE.Mesh>(null!);
  const textures = usePlanetTextures();

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.03;
    if (cloudRef.current) cloudRef.current.rotation.y -= delta * 0.015;
  });

  return (
    <group>
      {/* Earth surface */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={textures.earthDay}
          emissiveMap={textures.earthNight}
          emissive="#001133"
          emissiveIntensity={0.6}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      {/* Cloud layer */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[EARTH_RADIUS + 0.015, 64, 64]} />
        <meshStandardMaterial
          alphaMap={textures.earthClouds}
          transparent
          opacity={0.5}
          color="#ffffff"
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.05, 32, 32]} />
        <meshBasicMaterial color="#4488ff" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      {/* Sun light aimed from fixed direction */}
      <directionalLight position={[8, 2, 4]} intensity={2.5} color="#fff8e0" />
      <ambientLight intensity={0.08} />
    </group>
  );
}

// ─── Earth Scene ──────────────────────────────────────────────────────────────

interface EarthSceneProps {
  activeCategory: HotspotCategory | 'all';
  locale: string;
  onHotspotClick: (hotspot: EarthHotspot) => void;
}

function EarthScene({ activeCategory, locale, onHotspotClick }: EarthSceneProps) {
  const filtered = activeCategory === 'all'
    ? EARTH_HOTSPOTS
    : EARTH_HOTSPOTS.filter(h => h.category === activeCategory);

  return (
    <>
      <EarthGlobe />
      {filtered.map(hotspot => (
        <EarthHotspotMarker
          key={hotspot.id}
          hotspot={hotspot}
          earthRadius={EARTH_RADIUS}
          locale={locale}
          onHotspotClick={onHotspotClick}
        />
      ))}
      <EffectComposer>
        <Bloom luminanceThreshold={0.5} intensity={0.6} radius={0.4} />
        <Vignette darkness={0.4} offset={0.3} />
      </EffectComposer>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface EarthExplorerSceneProps {
  locale?: string;
  onBack: () => void;
}

export default function EarthExplorerScene({ locale = 'en', onBack }: EarthExplorerSceneProps) {
  const tr = t[locale] || t.en;
  const isRtl = locale === 'he';
  const [activeCategory, setActiveCategory] = useState<HotspotCategory | 'all'>('all');
  const [selectedHotspot, setSelectedHotspot] = useState<EarthHotspot | null>(null);

  const handleHotspotClick = useCallback((hotspot: EarthHotspot) => {
    setSelectedHotspot(hotspot);
  }, []);

  const categories: Array<{ key: HotspotCategory | 'all'; label: string }> = [
    { key: 'all', label: tr.filterAll },
    { key: 'nature', label: tr.filterNature },
    { key: 'geography', label: tr.filterGeography },
    { key: 'history', label: tr.filterHistory },
    { key: 'science', label: tr.filterScience },
  ];

  return (
    <div className="relative w-full h-full bg-black overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} style={{ position: 'absolute', inset: 0 }}>
        <Suspense fallback={null}>
          <EarthScene
            activeCategory={activeCategory}
            locale={locale}
            onHotspotClick={handleHotspotClick}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={2.2}
          maxDistance={7}
          autoRotate={!selectedHotspot}
          autoRotateSpeed={0.4}
        />
      </Canvas>

      {/* Category filter pills (top) */}
      <div className="absolute top-2 left-0 right-0 flex justify-center gap-2 px-4 flex-wrap z-10 pointer-events-auto">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeCategory === cat.key
                ? 'bg-white text-black shadow-lg scale-105'
                : 'bg-black/50 text-white border border-white/30 hover:bg-white/20'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute bottom-4 left-4 z-10 bg-black/60 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-black/80 transition-colors"
      >
        {tr.backToSolar}
      </button>

      {/* Hint */}
      {!selectedHotspot && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="bg-black/60 text-white text-xs rounded-xl px-4 py-2 max-w-xs text-center">
            {tr.tapHotspot}
          </div>
        </div>
      )}

      {/* Hotspot fact popup */}
      {selectedHotspot && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 p-4">
          <div className="bg-gradient-to-br from-blue-900 to-teal-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border-2 border-cyan-400">
            <div className="text-5xl mb-3">{selectedHotspot.emoji}</div>
            <h3 className="text-xl font-bold text-cyan-300 mb-3">{selectedHotspot.name}</h3>
            <p className="text-white text-base leading-relaxed mb-5">
              {selectedHotspot.facts[locale] || selectedHotspot.facts.en}
            </p>
            <button
              onClick={() => setSelectedHotspot(null)}
              className="min-h-[48px] px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:scale-105 transition-transform"
            >
              {tr.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
