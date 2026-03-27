'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Phaser from 'phaser';
import { PhaserGameContainer } from '../shared/phaser/PhaserGameContainer';
import { GameWrapper } from '../shared/GameWrapper';
import { BGMenuScene, BGBoardScene } from './scenes';

const W = 700;
const H = 500;

export default function BackgammonPhaserGame() {
  const locale = useLocale();
  const t = useTranslations('backgammonPhaser');

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
    <GameWrapper title={t('title')}>
      <div className="flex justify-center py-4">
        <PhaserGameContainer config={config} className="rounded-xl overflow-hidden shadow-lg" />
      </div>
    </GameWrapper>
  );
}
