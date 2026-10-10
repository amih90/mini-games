'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type Difficulty } from './data';
import { MansionController, command, createAdventure, type Command, type MansionState } from './model';
import { LOCK_KEY, SAVE_KEY, MansionSaveStore, type LoadedSave, type SaveError } from './persistence';

export function useMansionSession() {
  const [controller, setController] = useState<MansionController | null>(null);
  const [initial, setInitial] = useState<'loading' | 'setup' | 'recovery' | 'problem' | null>('loading');
  const [writer, setWriter] = useState<'checking' | 'owner' | 'blocked' | 'single'>('checking');
  const [loaded, setLoaded] = useState<LoadedSave | null>(null);
  const [error, setError] = useState<SaveError | null>(null);
  const [startError, setStartError] = useState<SaveError | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const store = useRef<MansionSaveStore | null>(null);
  const active = useRef<MansionController | null>(null);
  const owned = useRef(false);
  const mounted = useRef(false);
  const lastWritten = useRef<MansionState | null>(null);
  const pendingSave = useRef(false);
  const saveError = useRef<SaveError | null>(null);

  const activate = useCallback((state: MansionState) => {
    active.current?.dispose();
    const next = new MansionController(state);
    next.pause('bootstrap', true);
    next.pause('onboarding', !state.tutorialSeen);
    active.current = next;
    lastWritten.current = state;
    setController(next);
    setInitial(null);
    setError(null);
    saveError.current = null;
    setSaveStatus('saved');
  }, []);

  const saveNow = useCallback((retry = false): boolean => {
    const current = active.current;
    if (!current || current.disposed || !owned.current || !store.current || (!retry && saveError.current)) return false;
    if (!retry && current.state === lastWritten.current) return true;
    const result = store.current.save(current.state);
    if (!result.ok) {
      saveError.current = result.error;
      current.pause('save-error', true);
      if (mounted.current) { setError(result.error); setSaveStatus('error'); }
      return false;
    }
    lastWritten.current = result.state;
    saveError.current = null;
    current.pause('save-error', false);
    if (mounted.current) { current.commit(result.state); setError(null); setSaveStatus('saved'); }
    return true;
  }, []);

  const transact = useCallback((action: Command): boolean => {
    const current = active.current;
    if (!current || current.disposed || !owned.current || !store.current || saveError.current) return false;
    const transition = command(current.state, action);
    if (transition.effects.some(effect => effect.type === 'error')) {
      current.commit(current.state, transition.effects);
      return false;
    }
    if (transition.state === current.state) {
      current.commit(current.state, transition.effects);
      return true;
    }
    const result = store.current.save(transition.state);
    if (!result.ok) {
      saveError.current = result.error;
      current.pause('save-error', true);
      if (mounted.current) { setError(result.error); setSaveStatus('error'); }
      return false;
    }
    lastWritten.current = result.state;
    current.commit(result.state, transition.effects);
    if (mounted.current) setSaveStatus('saved');
    return true;
  }, []);

  useEffect(() => {
    mounted.current = true;
    let alive = true;
    let release: (() => void) | undefined;
    const read = () => {
      try {
        store.current = new MansionSaveStore(window.localStorage);
        const result = store.current.load();
        setLoaded(result);
        if (result.kind === 'valid') activate(result.state);
        else if (result.kind === 'empty') setInitial('setup');
        else if (result.kind === 'recoverable') setInitial('recovery');
        else { setInitial('problem'); setError(result.error); }
      } catch (cause) {
        console.warn('Princess Mansion cannot access browser storage', cause);
        setInitial('problem');
        setError('storageUnavailable');
      }
    };
    queueMicrotask(() => {
      if (!alive) return;
      if ('locks' in navigator && navigator.locks) {
        void navigator.locks.request(LOCK_KEY, { mode: 'exclusive', ifAvailable: true }, async lock => {
          if (!alive) return;
          if (!lock) { setWriter('blocked'); setInitial('problem'); return; }
          owned.current = true;
          setWriter('owner');
          read();
          await new Promise<void>(resolve => { release = resolve; });
        }).catch(cause => {
          console.warn('Princess Mansion could not acquire its save lock', cause);
          if (alive) { setInitial('problem'); setError('storageUnavailable'); }
        });
      } else {
        owned.current = true;
        setWriter('single');
        read();
      }
    });
    return () => {
      mounted.current = false;
      saveNow();
      alive = false;
      owned.current = false;
      release?.();
      active.current?.dispose();
      active.current = null;
    };
  }, [activate, saveNow]);

  useEffect(() => {
    if (!controller) return;
    const schedule = () => {
      if (pendingSave.current || saveError.current) return;
      pendingSave.current = true;
      setSaveStatus('saving');
      queueMicrotask(() => {
        pendingSave.current = false;
        if (!controller.disposed && active.current === controller) saveNow();
      });
    };
    const remove = controller.onEffect(effect => { if (effect.type !== 'error') schedule(); });
    const interval = window.setInterval(() => saveNow(), 10000);
    const visibility = () => {
      controller.pause('hidden', document.hidden);
      if (document.hidden) saveNow();
    };
    const blur = () => { controller.pause('unfocused', true); saveNow(); };
    const focus = () => { controller.pause('unfocused', false); };
    const leave = () => { controller.pause('leaving', true); saveNow(); };
    const beforeUnload = () => { saveNow(); };
    const returnToPage = () => { controller.pause('leaving', false); visibility(); controller.pause('unfocused', !document.hasFocus()); };
    const external = (event: StorageEvent) => {
      if (event.key !== SAVE_KEY && event.key !== null) return;
      owned.current = false;
      saveError.current = 'conflict';
      controller.pause('save-error', true);
      setError('conflict');
      setSaveStatus('error');
    };
    visibility();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', blur);
    window.addEventListener('focus', focus);
    window.addEventListener('pagehide', leave);
    window.addEventListener('pageshow', returnToPage);
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('storage', external);
    return () => {
      remove();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', blur);
      window.removeEventListener('focus', focus);
      window.removeEventListener('pagehide', leave);
      window.removeEventListener('pageshow', returnToPage);
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('storage', external);
    };
  }, [controller, saveNow]);

  const start = useCallback((difficulty: Difficulty): boolean => {
    if (!owned.current || !store.current) return false;
    setStartError(null);
    const result = store.current.save(createAdventure(difficulty, crypto.randomUUID()));
    if (!result.ok) { setStartError(result.error); return false; }
    activate(result.state);
    return true;
  }, [activate]);

  const recover = useCallback(() => {
    if (loaded?.kind !== 'recoverable' || !owned.current || !store.current) return;
    const result = store.current.save(loaded.state);
    if (result.ok) activate(result.state);
    else { setError(result.error); setSaveStatus('error'); }
  }, [activate, loaded]);

  const clearStartError = useCallback(() => setStartError(null), []);
  return { controller, initial, writer, loaded, error, startError, saveStatus, start, clearStartError, recover, saveNow, transact };
}
