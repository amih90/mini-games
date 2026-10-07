'use client';

import Phaser from 'phaser';
import { useEffect, useMemo, useRef } from 'react';
import { PhaserGameContainer } from '../shared/phaser/PhaserGameContainer';
import { MansionController } from './model';
import { MansionScene, type SceneBridge } from './scene';
import styles from './mansion.module.css';

interface SceneLifetime { active: object | null }
function royalScene(controller: MansionController, bridge: SceneBridge, lifetime: SceneLifetime) {
  return class RoyalScene extends MansionScene {
    constructor() {
      const marker = {};
      lifetime.active = marker;
      const current = () => lifetime.active === marker && !controller.disposed;
      super(controller, {
        ready: value => { if (current()) bridge.ready(value); },
        loading: value => { if (current()) bridge.loading(value); },
        error: () => { if (current()) bridge.error(); },
        moving: value => { if (current()) bridge.moving(value); },
        pause: () => { if (current()) bridge.pause(); },
        decorative: () => { if (current()) bridge.decorative(); },
      });
    }
  };
}

export function MansionWorld({ controller, bridge, label }: { controller: MansionController; bridge: SceneBridge; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const lifetime = useMemo<SceneLifetime>(() => ({ active: null }), []);
  const config = useMemo<Phaser.Types.Core.GameConfig>(() => {
    const scene = royalScene(controller, bridge, lifetime);
    return {
      type: Phaser.AUTO, backgroundColor: '#e7ceac', scene,
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      render: { antialias: true, roundPixels: false },
      input: { activePointers: 2 }, audio: { noAudio: true },
      fps: { target: 60 }, banner: false,
      callbacks: { postBoot: game => game.canvas.setAttribute('aria-label', label) },
    };
  }, [bridge, controller, label, lifetime]);
  useEffect(() => () => { lifetime.active = null; }, [lifetime]);
  useEffect(() => { host.current?.querySelector('canvas')?.setAttribute('aria-label', label); }, [label]);
  return <div ref={host} className={styles.canvasHost} role="group" aria-label={label}><PhaserGameContainer config={config} className={styles.canvasHost} /></div>;
}
