import { useState, useCallback } from 'react';

const STORAGE_KEY = 'wild-friends-album';

export interface AlbumEntry {
  animalId: string;
  discoveredAt: number;
  sceneId: string;
}

function loadAlbum(): AlbumEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveAlbum(entries: AlbumEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable
  }
}

export function useAnimalAlbum() {
  const [album, setAlbum] = useState<AlbumEntry[]>(loadAlbum);

  const addAnimal = useCallback((animalId: string, sceneId: string) => {
    setAlbum((prev) => {
      if (prev.some((e) => e.animalId === animalId)) return prev;
      const next = [...prev, { animalId, discoveredAt: Date.now(), sceneId }];
      saveAlbum(next);
      return next;
    });
  }, []);

  const isDiscovered = useCallback(
    (animalId: string) => album.some((e) => e.animalId === animalId),
    [album]
  );

  const resetAlbum = useCallback(() => {
    setAlbum([]);
    saveAlbum([]);
  }, []);

  return {
    album,
    discoveredCount: album.length,
    totalCount: 15,
    addAnimal,
    isDiscovered,
    resetAlbum,
  };
}
