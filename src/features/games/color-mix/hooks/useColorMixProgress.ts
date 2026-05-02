'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'colorMix.progress.v1';

export interface ColorMixSettings {
  cbAssist: boolean;
  reduceMotion: boolean;
}

export interface ColorMixProgress {
  /** levelId → 1|2|3 stars */
  stars: Record<number, number>;
  /** Set of discovered result-color ids (encoded as string[]) */
  discoveredColors: string[];
  /** Total accumulated score across all runs */
  totalScore: number;
  settings: ColorMixSettings;
  /** ISO timestamp of last update */
  updatedAt: string;
}

const DEFAULT_PROGRESS: ColorMixProgress = {
  stars: {},
  discoveredColors: [],
  totalScore: 0,
  settings: {
    cbAssist: false,
    reduceMotion: false,
  },
  updatedAt: new Date(0).toISOString(),
};

function loadProgress(): ColorMixProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<ColorMixProgress>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      stars: parsed.stars ?? {},
      discoveredColors: parsed.discoveredColors ?? [],
      settings: { ...DEFAULT_PROGRESS.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(p: ColorMixProgress) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* quota or private mode — silently skip */
  }
}

export function useColorMixProgress() {
  const [progress, setProgress] = useState<ColorMixProgress>(DEFAULT_PROGRESS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (p: ColorMixProgress) => ColorMixProgress) => {
    setProgress(prev => {
      const next = updater(prev);
      next.updatedAt = new Date().toISOString();
      saveProgress(next);
      return next;
    });
  }, []);

  const recordLevelStars = useCallback((levelId: number, stars: number) => {
    update(p => {
      const existing = p.stars[levelId] ?? 0;
      if (stars <= existing) return p;
      return { ...p, stars: { ...p.stars, [levelId]: stars } };
    });
  }, [update]);

  const discoverColor = useCallback((colorId: string) => {
    update(p => {
      if (p.discoveredColors.includes(colorId)) return p;
      return { ...p, discoveredColors: [...p.discoveredColors, colorId] };
    });
  }, [update]);

  const addScore = useCallback((amount: number) => {
    update(p => ({ ...p, totalScore: p.totalScore + amount }));
  }, [update]);

  const setSetting = useCallback(<K extends keyof ColorMixSettings>(key: K, value: ColorMixSettings[K]) => {
    update(p => ({ ...p, settings: { ...p.settings, [key]: value } }));
  }, [update]);

  const resetProgress = useCallback(() => {
    update(() => ({ ...DEFAULT_PROGRESS, updatedAt: new Date().toISOString() }));
  }, [update]);

  // Derived
  const totalStars = Object.values(progress.stars).reduce((sum, s) => sum + s, 0);
  const isLevelUnlocked = useCallback((levelId: number) => {
    if (levelId <= 1) return true;
    return (progress.stars[levelId - 1] ?? 0) > 0;
  }, [progress.stars]);
  const isLevelComplete = useCallback((levelId: number) => (progress.stars[levelId] ?? 0) > 0, [progress.stars]);
  const discoveredSet = new Set(progress.discoveredColors);

  return {
    progress,
    hydrated,
    totalStars,
    discoveredSet,
    isLevelUnlocked,
    isLevelComplete,
    recordLevelStars,
    discoverColor,
    addScore,
    setSetting,
    resetProgress,
  };
}
