'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'mini-games-sound-muted';
const muteListeners = new Set<() => void>();
let muted = false;
const readMute = () => muted;
const unmuted = () => false;
const noSubscription = () => () => {};
export interface MelodyNote { frequency: number; at: number; duration: number }
export type MelodyPlayback = 'played' | 'muted' | 'unavailable' | 'invalid';
function subscribeMute(listener: () => void) { muteListeners.add(listener); return () => { muteListeners.delete(listener); }; }
function updateMute(value: boolean) {
  if (muted === value) return;
  muted = value;
  for (const listener of muteListeners) listener();
}

/**
 * Hook for generating retro-style game sounds using Web Audio API
 * Creates procedural sounds without requiring audio files
 */
export function useRetroSounds({ enabled = true }: { enabled?: boolean } = {}) {
  const isMuted = useSyncExternalStore(enabled ? subscribeMute : noSubscription, enabled ? readMute : unmuted, unmuted);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const melodyGains = useRef(new Set<GainNode>());

  // Load mute preference from localStorage
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      updateMute(stored === 'true');
    } catch (error) {
      console.warn('Sound preferences could not be loaded', error);
    }
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) updateMute(event.newValue === 'true'); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [enabled]);

  // Initialize audio context on first user interaction
  const unlockAudio = useCallback(() => {
    if (!enabled || muted || typeof window === 'undefined') return;
    const existing = audioContextRef.current;
    if (existing) {
      if (existing.state === 'suspended') void existing.resume().catch(error => console.warn('Audio context could not be resumed', error));
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) { console.debug('Web Audio API not supported'); return; }
      audioContextRef.current = new AudioContextClass();
      if (audioContextRef.current.state === 'suspended') void audioContextRef.current.resume().catch(error => console.warn('Audio context could not be resumed', error));
      setIsUnlocked(true);
    } catch (error) {
      console.debug('Web Audio API not supported', error);
    }
  }, [enabled]);

  // Add click listener to unlock audio
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleInteraction = () => {
      unlockAudio();
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [enabled, unlockAudio]);

  useEffect(() => () => {
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== 'closed') void context.close().catch(error => console.warn('Audio context could not be closed', error));
  }, []);

  const stopMelodies = useCallback(() => {
    const context = audioContextRef.current;
    if (context && context.state !== 'closed') for (const gain of melodyGains.current) {
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setValueAtTime(0, context.currentTime);
    }
    melodyGains.current.clear();
  }, []);
  useEffect(() => { if (isMuted) stopMelodies(); }, [isMuted, stopMelodies]);

  const playMelody = useCallback((notes: readonly MelodyNote[], volume = 0.12): MelodyPlayback => {
    if (!enabled || muted) return 'muted';
    if (!notes.length || notes.length > 16 || !Number.isFinite(volume) || volume < 0 || volume > 0.3 ||
      notes.some(note => !Number.isFinite(note.frequency) || note.frequency < 40 || note.frequency > 4000 ||
        !Number.isFinite(note.at) || note.at < 0 || note.at > 5 || !Number.isFinite(note.duration) || note.duration <= 0 || note.duration > 3)) {
      console.warn('Game melody contains invalid notes');
      return 'invalid';
    }
    unlockAudio();
    const context = audioContextRef.current;
    if (!context || context.state === 'closed') return 'unavailable';
    try {
      const master = context.createGain();
      master.gain.value = volume;
      master.connect(context.destination);
      melodyGains.current.add(master);
      let remaining = notes.length;
      for (const note of notes) {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const start = context.currentTime + note.at;
        oscillator.type = 'triangle';
        oscillator.frequency.value = note.frequency;
        oscillator.connect(envelope);
        envelope.connect(master);
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.exponentialRampToValueAtTime(0.65, start + Math.min(0.018, note.duration / 4));
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
        oscillator.onended = () => {
          oscillator.disconnect();
          envelope.disconnect();
          if (--remaining === 0) { melodyGains.current.delete(master); master.disconnect(); }
        };
        oscillator.start(start);
        oscillator.stop(start + note.duration);
      }
      return 'played';
    } catch (error) {
      console.warn('Game melody could not be played', error);
      return 'unavailable';
    }
  }, [enabled, unlockAudio]);

  /**
   * Play a simple beep sound
   */
  const playBeep = useCallback(
    (frequency = 440, duration = 0.1) => {
      if (isMuted || !audioContextRef.current) return;

      try {
        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      } catch (error) {
        // Ignore playback errors
      }
    },
    [isMuted]
  );

  /**
   * Play a click/button press sound
   */
  const playClick = useCallback(() => {
    playBeep(800, 0.05);
  }, [playBeep]);

  /**
   * Play a success/positive feedback sound
   */
  const playSuccess = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      
      // Rising tone
      oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.1); // G5

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a level up sound
   */
  const playLevelUp = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const notes = [523, 659, 784, 1047]; // C-E-G-C arpeggio

      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'square';

        const startTime = ctx.currentTime + i * 0.1;
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.15);
      });
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a game over sound
   */
  const playGameOver = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sawtooth';
      
      // Falling tone
      oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
      oscillator.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5); // A2

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a collision/hit sound
   */
  const playHit = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 100;

      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.08);
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a power-up/item collect sound
   */
  const playPowerUp = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const notes = [440, 554, 659, 880]; // A-C#-E-A

      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'triangle';

        const startTime = ctx.currentTime + i * 0.05;
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.1);
      });
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a win/victory sound
   */
  const playWin = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      // Victory fanfare: C-E-G-C-G-C
      const melody = [
        { freq: 523, time: 0 },
        { freq: 659, time: 0.15 },
        { freq: 784, time: 0.3 },
        { freq: 1047, time: 0.45 },
        { freq: 784, time: 0.6 },
        { freq: 1047, time: 0.75 },
      ];

      melody.forEach(({ freq, time }) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const startTime = ctx.currentTime + time;
        gainNode.gain.setValueAtTime(0.25, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.15);
      });
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a jump sound
   */
  const playJump = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a move/place piece sound (board games)
   */
  const playMove = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'triangle';
      oscillator.frequency.value = 600;
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.06);
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a capture/flip piece sound (board games)
   */
  const playCapture = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc1.type = 'square';
      osc1.frequency.value = 300;
      osc2.type = 'square';
      osc2.frequency.value = 500;
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.04);
      osc1.stop(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.12);
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a shoot/fire sound (action games)
   */
  const playShoot = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a countdown tick sound
   */
  const playTick = useCallback(() => {
    playBeep(1000, 0.03);
  }, [playBeep]);

  /**
   * Play a whoosh/swipe sound
   */
  const playWhoosh = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.5;
      const gainNode = ctx.createGain();
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      source.start(ctx.currentTime);
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a dice roll sound
   */
  const playDice = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      for (let i = 0; i < 4; i++) {
        const bufferSize = Math.floor(ctx.sampleRate * 0.04);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * 0.3;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000 + i * 500;
        const gainNode = ctx.createGain();
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        const startTime = ctx.currentTime + i * 0.06;
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.04);
        source.start(startTime);
      }
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a flip card sound
   */
  const playFlip = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06);
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.06);
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a match/pair found sound
   */
  const playMatch = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const notes = [523, 659, 784]; // C-E-G
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        const startTime = ctx.currentTime + i * 0.08;
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.12);
      });
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a countdown/warning sound
   */
  const playCountdown = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'square';
      oscillator.frequency.value = 880;
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  /**
   * Play a drop/place sound - descending tone
   */
  const playDrop = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (error) {
      // Ignore
    }
  }, [isMuted]);

  const setMuted = useCallback((value: boolean) => {
    if (!enabled) return;
    updateMute(value);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEY, String(value)); }
      catch (error) { console.warn('Sound preferences could not be saved', error); }
    }
  }, [enabled]);

  const toggleMute = useCallback(() => setMuted(!muted), [setMuted]);

  return {
    isMuted,
    isUnlocked,
    setMuted,
    toggleMute,
    playClick,
    playSuccess,
    playLevelUp,
    playGameOver,
    playHit,
    playPowerUp,
    playWin,
    playJump,
    playBeep,
    playMove,
    playCapture,
    playShoot,
    playTick,
    playWhoosh,
    playDice,
    playFlip,
    playMatch,
    playCountdown,
    playDrop,
    playMelody,
    stopMelodies,
  };
}
