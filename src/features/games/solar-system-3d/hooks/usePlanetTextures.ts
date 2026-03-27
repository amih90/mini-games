'use client';

import { useTexture } from '@react-three/drei';

// Texture paths relative to /public
const TEXTURE_PATHS = {
  sun:     '/textures/planets/2k_sun.jpg',
  mercury: '/textures/planets/2k_mercury.jpg',
  venus:   '/textures/planets/2k_venus_surface.jpg',
  earthDay:   '/textures/planets/2k_earth_daymap.jpg',
  earthNight: '/textures/planets/2k_earth_nightmap.jpg',
  earthClouds:'/textures/planets/2k_earth_clouds.jpg',
  mars:    '/textures/planets/2k_mars.jpg',
  jupiter: '/textures/planets/2k_jupiter.jpg',
  saturn:  '/textures/planets/2k_saturn.jpg',
  saturnRing: '/textures/planets/2k_saturn_ring_alpha.png',
  uranus:  '/textures/planets/2k_uranus.jpg',
  neptune: '/textures/planets/2k_neptune.jpg',
  moon:    '/textures/planets/2k_moon.jpg',
  milkyWay:'/textures/planets/2k_stars_milky_way.jpg',
} as const;

export type PlanetTextureKey = keyof typeof TEXTURE_PATHS;

/** Load all planet textures at once using drei's useTexture (Suspense-ready). */
export function usePlanetTextures() {
  return useTexture(TEXTURE_PATHS);
}

export { TEXTURE_PATHS };
