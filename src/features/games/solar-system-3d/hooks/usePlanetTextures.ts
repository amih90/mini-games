'use client';

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// Prefix for static assets — handles GitHub Pages basePath (/mini-games) vs local ('')
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// Texture paths relative to /public
export const TEXTURE_PATHS = {
  sun:        `${BASE}/textures/planets/2k_sun.jpg`,
  mercury:    `${BASE}/textures/planets/2k_mercury.jpg`,
  venus:      `${BASE}/textures/planets/2k_venus_surface.jpg`,
  earthDay:   `${BASE}/textures/planets/2k_earth_daymap.jpg`,
  earthNight: `${BASE}/textures/planets/2k_earth_nightmap.jpg`,
  earthClouds:`${BASE}/textures/planets/2k_earth_clouds.jpg`,
  mars:       `${BASE}/textures/planets/2k_mars.jpg`,
  jupiter:    `${BASE}/textures/planets/2k_jupiter.jpg`,
  saturn:     `${BASE}/textures/planets/2k_saturn.jpg`,
  saturnRing: `${BASE}/textures/planets/2k_saturn_ring_alpha.png`,
  uranus:     `${BASE}/textures/planets/2k_uranus.jpg`,
  neptune:    `${BASE}/textures/planets/2k_neptune.jpg`,
  moon:       `${BASE}/textures/planets/2k_moon.jpg`,
  milkyWay:   `${BASE}/textures/planets/2k_stars_milky_way.jpg`,
} as const;

export type PlanetTextureKey = keyof typeof TEXTURE_PATHS;
export type PlanetTextureMap = Record<PlanetTextureKey, THREE.Texture>;

/** Fallback colors used when a texture fails to load */
const FALLBACK_COLORS: Record<PlanetTextureKey, string> = {
  sun: '#ffcc00', mercury: '#b5b5b5', venus: '#e8cda0',
  earthDay: '#2255aa', earthNight: '#000011', earthClouds: '#ffffff',
  mars: '#cc4422', jupiter: '#c88b3a', saturn: '#e4d191',
  saturnRing: '#c8b560', uranus: '#88ccdd', neptune: '#3355cc',
  moon: '#aaaaaa', milkyWay: '#000022',
};

function createFallback(color: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 1; canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
  return new THREE.CanvasTexture(canvas);
}

function makeFallbackMap(): PlanetTextureMap {
  return Object.fromEntries(
    (Object.keys(TEXTURE_PATHS) as PlanetTextureKey[]).map(k => [k, createFallback(FALLBACK_COLORS[k])])
  ) as PlanetTextureMap;
}

// Module-level cache shared across all component instances
let cachedMap: PlanetTextureMap | null = null;
let loadingPromise: Promise<PlanetTextureMap> | null = null;

function loadAllTextures(): Promise<PlanetTextureMap> {
  if (loadingPromise) return loadingPromise;
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = '';
  const fallbacks = makeFallbackMap();
  const result: PlanetTextureMap = { ...fallbacks };
  const entries = Object.entries(TEXTURE_PATHS) as [PlanetTextureKey, string][];
  loadingPromise = Promise.all(
    entries.map(([key, url]) =>
      new Promise<void>((resolve) => {
        loader.load(
          url,
          (tex) => { result[key] = tex; resolve(); },
          undefined,
          () => { console.warn(`[textures] Failed to load ${url}, using fallback`); resolve(); }
        );
      })
    )
  ).then(() => { cachedMap = result; return result; });
  return loadingPromise;
}

/**
 * Load all planet textures using THREE.TextureLoader directly (no Suspense).
 * Individual failures fall back to 1×1 solid-color textures — the game always renders.
 */
export function usePlanetTextures(): PlanetTextureMap {
  const [textures, setTextures] = useState<PlanetTextureMap>(
    () => cachedMap ?? makeFallbackMap()
  );
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (cachedMap) { setTextures(cachedMap); return; }
    loadAllTextures().then(setTextures);
  }, []);

  return textures;
}
