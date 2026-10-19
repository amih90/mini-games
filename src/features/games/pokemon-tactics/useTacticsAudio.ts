'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRetroSounds } from '@/hooks/useRetroSounds';

export function useTacticsAudio(paused: boolean) {
  const retro = useRetroSounds();
  const { playMelody, isMuted, isUnlocked, toggleMute } = retro;
  const music = useRef<HTMLAudioElement | null>(null);
  const [musicFailed, setMusicFailed] = useState(false);
  useEffect(() => {
    const track = new Audio('/games/pokemon-tactics/music/jump.mp3');
    track.loop = true;
    track.volume = .14;
    track.preload = 'none';
    const failed = () => { console.error('Pokémon tactics background music could not load', track.error); setMusicFailed(true); };
    track.addEventListener('error', failed);
    music.current = track;
    return () => { track.pause(); track.removeEventListener('error', failed); track.removeAttribute('src'); track.load(); music.current = null; };
  }, []);
  useEffect(() => {
    const track = music.current;
    if (!track) return;
    if (!isUnlocked || isMuted || paused) { track.pause(); return; }
    let cancelled = false;
    const start = () => { void track.play().catch(error => {
      if (cancelled || error instanceof DOMException && error.name === 'AbortError') return;
      console.warn('Pokémon tactics music playback failed', error);
      setMusicFailed(true);
    }); };
    const visibility = () => { if (document.hidden) track.pause(); else start(); };
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', visibility);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', visibility); track.pause(); };
  }, [isUnlocked, isMuted, paused]);
  const notes = useCallback((frequencies: number[], duration = .12) => {
    playMelody(frequencies.map((frequency, i) => ({ frequency, at: i * duration, duration })), .035);
  }, [playMelody]);
  return useMemo(() => ({
    isMuted, toggleMute, musicFailed,
    playClick: () => notes([660], .045),
    playMove: () => notes([330, 440], .065),
    playCapture: () => notes([440, 554, 660]),
    playPowerUp: () => notes([523, 659, 784]),
    playShoot: () => notes([392, 523], .075),
    playWin: () => notes([523, 659, 784, 1047], .16),
    playGameOver: () => notes([392, 330, 262], .2),
  }), [isMuted, toggleMute, musicFailed, notes]);
}
