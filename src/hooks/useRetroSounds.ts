'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'mini-games-sound-muted';

/**
 * Hook for generating retro-style game sounds using Web Audio API
 * Creates procedural sounds without requiring audio files
 */
export function useRetroSounds() {
  const [isMuted, setIsMuted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load mute preference from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsMuted(stored === 'true');
    }
  }, []);

  // Initialize audio context on first user interaction
  const unlockAudio = useCallback(() => {
    if (isUnlocked || typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      setIsUnlocked(true);
    } catch (error) {
      console.debug('Web Audio API not supported', error);
    }
  }, [isUnlocked]);

  // Add click listener to unlock audio
  useEffect(() => {
    if (typeof window === 'undefined') return;

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

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(newValue));
      }
      return newValue;
    });
  }, []);

  return {
    isMuted,
    isUnlocked,
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
  };
}
