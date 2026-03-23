'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import Phaser from 'phaser';
import { PhaserGameContainer } from '../shared/phaser/PhaserGameContainer';
import { GameWrapper } from '../shared/GameWrapper';
import { BGMenuScene, BGBoardScene } from './scenes';

const W = 700;
const H = 500;

const translations: Record<string, string> = {
  en: 'Backgammon (Phaser)',
  he: 'שש בש (פייזר)',
  zh: '双陆棋 (Phaser)',
  es: 'Backgammon (Phaser)',
};

export default function BackgammonPhaserGame() {
  const locale = useLocale();
  const title = translations[locale] ?? translations['en'];

  const config = useMemo<Phaser.Types.Core.GameConfig>(
    () => ({
      type: Phaser.AUTO,
      width: W,
      height: H,
      backgroundColor: '#5d4037',
      scene: [
        class extends BGMenuScene {
          init(data: { locale?: string }) {
            super.init({ ...data, locale: locale });
          }
        },
        class extends BGBoardScene {
          init(data: { difficulty: 'easy' | 'medium' | 'hard'; locale: string }) {
            super.init({ ...data, locale: data.locale || locale });
          }
        },
      ],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
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
