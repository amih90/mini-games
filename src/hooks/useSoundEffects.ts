'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Sound file paths
const SOUNDS = {
  click: '/sounds/click.mp3',
  success: '/sounds/success.mp3',
  flip: '/sounds/flip.mp3',
  match: '/sounds/match.mp3',
  win: '/sounds/win.mp3',
} as const;

type SoundName = keyof typeof SOUNDS;

const STORAGE_KEY = 'mini-games-sound-muted';

export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Map<SoundName, AudioBuffer>>(new Map());

  // Load mute preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsMuted(stored === 'true');
    }
  }, []);

  // Initialize audio context on first user interaction
  const unlockAudio = useCallback(() => {
    if (isUnlocked) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      setIsUnlocked(true);

      // Preload all sounds
      Object.entries(SOUNDS).forEach(async ([name, path]) => {
        try {
          const response = await fetch(path);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
          audioBuffersRef.current.set(name as SoundName, audioBuffer);
        } catch {
          // Sound file might not exist yet - that's okay
          console.debug(`Could not load sound: ${path}`);
        }
      });
    } catch {
      console.debug('Web Audio API not supported');
    }
  }, [isUnlocked]);

  // Add click listener to unlock audio
  useEffect(() => {
    const handleInteraction = () => {
      unlockAudio();
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [unlockAudio]);

  const playSound = useCallback(
    (name: SoundName) => {
      if (isMuted || !audioContextRef.current) return;

      const buffer = audioBuffersRef.current.get(name);
      if (!buffer) return;

      try {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
      } catch {
        // Ignore playback errors
      }
    },
    [isMuted]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  return {
    isMuted,
    isUnlocked,
    toggleMute,
    playClick: useCallback(() => playSound('click'), [playSound]),
    playSuccess: useCallback(() => playSound('success'), [playSound]),
    playFlip: useCallback(() => playSound('flip'), [playSound]),
    playMatch: useCallback(() => playSound('match'), [playSound]),
    playWin: useCallback(() => playSound('win'), [playSound]),
  };
}
