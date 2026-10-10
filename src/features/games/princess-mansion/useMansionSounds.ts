'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { useRetroSounds, MelodyNote } from '@/hooks/useRetroSounds';
import { artUrl, type ActivityId, type DestinationId } from './data';

type SoundOwner = ReturnType<typeof useRetroSounds>;
type Clip = 'button.mp3' | 'page.mp3' | 'place.mp3' | 'welcome.mp3' | 'pop.mp3' | 'bubbles.wav' | 'flush.wav' | 'munch.wav' | 'potion.wav' | 'slide.wav' | 'shells.wav' | 'fanfare.wav';
interface Settings { owner: SoundOwner; active: boolean; ambientEnabled: boolean; destination: DestinationId }
export const AMBIENT_VOLUME = 0.13;

class MansionAudio {
  private ambient: HTMLAudioElement;
  private voices = new Map<Clip, HTMLAudioElement[]>();
  private tokens = new WeakMap<HTMLAudioElement, number>();
  private activated = false;
  private alive = true;
  private failed = false;
  private lastClips = new Map<Clip, number>();
  private lastMelodyAt = -Infinity;
  private ambientFile = 'palace-ambient.wav';

  constructor(private settings: () => Settings, private report: (problem: boolean) => void) {
    this.ambientFile = settings().destination === 'beach' ? 'beach-ambient.wav' : 'palace-ambient.wav';
    this.ambient = this.audio(this.ambientFile);
    this.ambient.loop = true;
    this.ambient.volume = AMBIENT_VOLUME;
    document.addEventListener('pointerdown', this.activate, true);
    document.addEventListener('keydown', this.activate, true);
    document.addEventListener('visibilitychange', this.sync);
    window.addEventListener('blur', this.sync);
    window.addEventListener('focus', this.sync);
    window.addEventListener('pagehide', this.stopAll);
    window.addEventListener('pageshow', this.sync);
  }
  private audio(file: string): HTMLAudioElement {
    const audio = new Audio(artUrl(`audio/${file}`));
    audio.preload = 'auto';
    audio.addEventListener('error', () => this.fail(new Error(`Could not load mansion audio: ${audio.src}`)));
    return audio;
  }
  private fail(error: unknown): void {
    if (!this.alive || this.failed) return;
    this.failed = true;
    console.warn('Princess Mansion sound is unavailable', error);
    this.report(true);
    this.stopAll();
  }
  private stop(audio: HTMLAudioElement): void {
    this.tokens.set(audio, (this.tokens.get(audio) ?? 0) + 1);
    audio.pause();
  }
  private play(audio: HTMLAudioElement): void {
    const token = (this.tokens.get(audio) ?? 0) + 1;
    this.tokens.set(audio, token);
    void audio.play().catch(error => {
      if (this.alive && this.tokens.get(audio) === token) this.fail(error);
    });
  }
  private activate = (): void => { this.activated = true; this.sync(); };
  private stopAll = (): void => {
    this.stop(this.ambient);
    for (const voices of this.voices.values()) for (const voice of voices) this.stop(voice);
    this.settings().owner.stopMelodies();
  };
  sync = (): void => {
    const { owner, active, ambientEnabled, destination } = this.settings();
    if (!this.alive || this.failed) { this.stopAll(); return; }
    const file = destination === 'beach' ? 'beach-ambient.wav' : 'palace-ambient.wav';
    if (file !== this.ambientFile) {
      this.stop(this.ambient);
      this.ambientFile = file;
      this.ambient.src = artUrl(`audio/${file}`);
      this.ambient.load();
    }
    if (owner.isMuted || document.hidden || !document.hasFocus()) { this.stopAll(); return; }
    if (active && ambientEnabled && this.activated) {
      if (this.ambient.paused) this.play(this.ambient);
    } else this.stop(this.ambient);
  };
  private canPlay(): boolean {
    if (!this.alive || this.failed || this.settings().owner.isMuted || document.hidden || !document.hasFocus()) return false;
    // React capture handlers can precede the document's gesture listener.
    if (!this.activated && navigator.userActivation?.isActive) this.activated = true;
    return this.activated;
  }
  clip(file: Clip, volume = 0.22): boolean {
    if (!this.canPlay()) return false;
    const time = performance.now();
    if (file !== 'fanfare.wav' && time - (this.lastClips.get(file) ?? -Infinity) < 90) return false;
    this.lastClips.set(file, time);
    const voices = this.voices.get(file) ?? [];
    if (file === 'fanfare.wav') for (const voice of voices) this.stop(voice);
    let voice = voices.find(audio => audio.paused || audio.ended);
    if (!voice) {
      if (voices.length < 3) { voice = this.audio(file); voices.push(voice); this.voices.set(file, voices); }
      else { voice = voices[0]; this.stop(voice); }
    }
    voice.volume = volume;
    voice.currentTime = 0;
    this.play(voice);
    return true;
  }
  melody(frequencies: readonly number[], volume = 0.095, spacing = 0.1): void {
    if (!this.canPlay()) return;
    const time = performance.now();
    if (time - this.lastMelodyAt < 90) return;
    this.lastMelodyAt = time;
    const notes: MelodyNote[] = frequencies.map((frequency, index) => ({ frequency, at: index * spacing, duration: 0.28 }));
    const result = this.settings().owner.playMelody(notes, volume);
    if (result === 'unavailable' || result === 'invalid') this.fail(new Error(`Web Audio could not play the mansion melody: ${result}`));
  }
  retry(): void {
    this.failed = false;
    this.report(false);
    this.activated = true;
    this.ambient.load();
    for (const voices of this.voices.values()) for (const voice of voices) voice.load();
    this.sync();
  }
  dispose(): void {
    this.alive = false;
    this.stopAll();
    document.removeEventListener('pointerdown', this.activate, true);
    document.removeEventListener('keydown', this.activate, true);
    document.removeEventListener('visibilitychange', this.sync);
    window.removeEventListener('blur', this.sync);
    window.removeEventListener('focus', this.sync);
    window.removeEventListener('pagehide', this.stopAll);
    window.removeEventListener('pageshow', this.sync);
    for (const audio of [this.ambient, ...[...this.voices.values()].flat()]) { audio.removeAttribute('src'); audio.load(); }
    this.voices.clear();
  }
}

export function useMansionSounds(owner: SoundOwner, options: { active: boolean; ambientEnabled: boolean; destination?: DestinationId }) {
  const [problem, setProblem] = useState(false);
  const settings = useRef<Settings>({ owner, ...options, destination: options.destination ?? 'home' });
  const media = useRef<MansionAudio | null>(null);
  const announced = useRef(new Set<string>());
  useEffect(() => {
    const audio = new MansionAudio(() => settings.current, setProblem);
    media.current = audio;
    return () => { audio.dispose(); if (media.current === audio) media.current = null; };
  }, []);
  useEffect(() => {
    settings.current = { owner, active: options.active, ambientEnabled: options.ambientEnabled, destination: options.destination ?? 'home' };
    media.current?.sync();
  }, [owner, options.active, options.ambientEnabled, options.destination]);
  const playClick = useCallback(() => media.current?.clip('button.mp3', 0.22), []);
  const playWhoosh = useCallback(() => media.current?.clip('page.mp3', 0.15), []);
  const playDrop = useCallback(() => media.current?.clip('place.mp3', 0.23), []);
  const playSuccess = useCallback(() => media.current?.melody([523.25, 659.25, 783.99, 1046.5]), []);
  const playLevelUp = useCallback(() => {
    media.current?.clip('welcome.mp3', 0.14);
  }, []);
  const playUnlock = useCallback((key: string) => {
    if (!announced.current.has(key) && media.current?.clip('fanfare.wav', 0.32)) announced.current.add(key);
  }, []);
  const playPurchase = useCallback(() => {
    media.current?.clip('pop.mp3', 0.16);
    media.current?.melody([783.99, 1046.5, 1318.51], 0.07, 0.095);
  }, []);
  const playIngredient = useCallback((correct: boolean) => {
    if (correct) media.current?.clip('potion.wav', 0.12);
    else media.current?.clip('button.mp3', 0.12);
  }, []);
  const playWin = useCallback(() => media.current?.melody([523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51], 0.11, 0.13), []);
  const playBeep = useCallback(() => media.current?.melody([440, 349.23], 0.055, 0.13), []);
  const playQueue = useCallback(() => media.current?.melody([659.25, 783.99], 0.045, 0.15), []);
  const retry = useCallback(() => media.current?.retry(), []);
  const playCare = useCallback((activity: ActivityId, completed = false) => {
    const audio = media.current;
    if (!audio) return;
    if (activity === 'bath' || activity === 'wash') audio.clip('bubbles.wav', 0.3);
    else if (activity === 'toilet') audio.clip(completed ? 'flush.wav' : 'place.mp3', 0.24);
    else if (activity === 'meal' || activity === 'icecream') audio.clip('munch.wav', 0.32);
    else if (activity === 'book') audio.clip('page.mp3', 0.11);
    else if (activity === 'piano' || activity === 'dance') audio.melody([523.25, 587.33, 659.25, 783.99, 659.25], 0.08, 0.12);
    else if (activity === 'bed' || activity === 'couch') audio.melody([659.25, 523.25, 392], 0.045, 0.19);
    else if (activity === 'slide') audio.clip('slide.wav', 0.26);
    else if (activity === 'shells') audio.clip('shells.wav', 0.24);
    else if (activity === 'splash') audio.clip('bubbles.wav', 0.24);
    else if (activity === 'potion') audio.clip('potion.wav', 0.26);
    else if (activity === 'treehouse' || activity === 'sandcastle') audio.clip('place.mp3', 0.16);
    else audio.clip('pop.mp3', 0.16);
    if (completed) audio.melody([659.25, 783.99, 1046.5], 0.085, 0.11);
  }, []);
  return { ...owner, playClick, playWhoosh, playDrop, playSuccess, playLevelUp, playUnlock, playPurchase, playIngredient, playWin, playBeep, playQueue, playCare, problem, retry };
}
