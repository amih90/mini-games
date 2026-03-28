import { useState, useCallback } from 'react';

const STORAGE_KEY = 'wild-friends-progress';

function loadProgress(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveProgress(scenes: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
  } catch {
    // localStorage unavailable
  }
}

export function useSceneProgress() {
  const [completedScenes, setCompletedScenes] = useState<string[]>(loadProgress);

  const completeScene = useCallback((sceneId: string) => {
    setCompletedScenes((prev) => {
      if (prev.includes(sceneId)) return prev;
      const next = [...prev, sceneId];
      saveProgress(next);
      return next;
    });
  }, []);

  const isSceneCompleted = useCallback(
    (sceneId: string) => completedScenes.includes(sceneId),
    [completedScenes]
  );

  const allScenesCompleted = completedScenes.length >= 5;

  const resetProgress = useCallback(() => {
    setCompletedScenes([]);
    saveProgress([]);
  }, []);

  return {
    completedScenes,
    completedCount: completedScenes.length,
    totalScenes: 5,
    completeScene,
    isSceneCompleted,
    allScenesCompleted,
    resetProgress,
  };
}
