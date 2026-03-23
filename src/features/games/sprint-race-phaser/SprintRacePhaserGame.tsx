'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import Phaser from 'phaser';
import { PhaserGameContainer } from '../shared/phaser/PhaserGameContainer';
import { GameWrapper } from '../shared/GameWrapper';
import { MenuScene, RaceScene } from './scenes';

const W = 700;
const H = 500;

const translations: Record<string, string> = {
  en: 'Olympic Sprint',
  he: 'ספרינט אולימפי',
  zh: '奥运短跑',
  es: 'Sprint Olímpico',
};

export default function SprintRacePhaserGame() {
  const locale = useLocale();
  const title = translations[locale] ?? translations['en'];

  const config = useMemo<Phaser.Types.Core.GameConfig>(
    () => ({
      type: Phaser.AUTO,
      width: W,
      height: H,
      backgroundColor: '#1a237e',
      scene: [
        class extends MenuScene {
          init(data: { locale?: string }) {
            super.init({ ...data, locale: locale });
          }
        },
        class extends RaceScene {
          init(data: { eventType: string; locale: string }) {
            super.init({ ...data, locale: data.locale || locale } as Parameters<RaceScene['init']>[0]);
          }
        },
      ],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        touch: true,
      },
    }),
    [locale],
  );

  return (
    <GameWrapper title={title}>
      <div className="flex justify-center py-4">
        <PhaserGameContainer config={config} className="rounded-xl overflow-hidden shadow-lg" />
      </div>
    </GameWrapper>
  );
}
