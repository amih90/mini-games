'use client';

import { useCallback, useRef } from 'react';

export function useBattleSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  /** Deep bass cannon fire + metallic whine */
  const playCannonFire = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc2.start(now);
    osc2.stop(now + 0.2);
  }, [getCtx]);

  /** Shell impact crack + rumble */
  const playShellImpact = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.3);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const noiseGain = ctx.createGain();
    source.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    source.start(now);

    const osc = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc.connect(g2);
    g2.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    g2.gain.setValueAtTime(0.3, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  }, [getCtx]);

  /** Multi-layer explosion: noise + bass boom */
  const playExplosion = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 1.5);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 500;
    const expGain = ctx.createGain();
    src.connect(lowpass);
    lowpass.connect(expGain);
    expGain.connect(ctx.destination);
    expGain.gain.setValueAtTime(1.0, now);
    expGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    src.start(now);

    const sub = ctx.createOscillator();
    const sg = ctx.createGain();
    sub.connect(sg);
    sg.connect(ctx.destination);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(50, now);
    sub.frequency.exponentialRampToValueAtTime(15, now + 0.8);
    sg.gain.setValueAtTime(0.8, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    sub.start(now);
    sub.stop(now + 0.8);
  }, [getCtx]);

  /** Diesel engine idle drone */
  const playEngineStart = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, now);
    osc.frequency.setValueAtTime(55, now + 0.3);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.start(now);
    osc.stop(now + 0.8);
  }, [getCtx]);

  /** Metallic ricochet ping */
  const playRicochet = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  }, [getCtx]);

  return { playCannonFire, playShellImpact, playExplosion, playEngineStart, playRicochet };
}
