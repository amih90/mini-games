'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import { GameWrapper } from '../shared/GameWrapper';
import { InstructionsModal } from '../shared/InstructionsModal';
import { pokemonTowerDefenseConfig } from './game.config';

interface GameInstructions {
  instructions: { icon: string; title: string; description: string }[];
  controls: { icon: string; description: string }[];
  tip: string;
}

const instructionsByLocale: Record<string, GameInstructions> = {
  en: {
    instructions: [
      {
        icon: '🟡',
        title: 'Choose a map and challenge',
        description: 'Start in Meadow, explore the bigger Coastal Lagoon, or try the extra-large Volcanic Highlands. Then pick Easy, Medium, or Hard; Easy helps you learn.',
      },
      {
        icon: '🌱',
        title: 'Build your team',
        description: 'Buy one of 65 Pokémon, then click or tap empty ground beside the path. Your team attacks on its own to protect the berries.',
      },
      {
        icon: '🐉',
        title: 'Watch each wave',
        description: 'Different Pokémon arrive together, including evolved ones. Big bosses have special tricks, so mix your team’s types.',
      },
      {
        icon: '🌟',
        title: 'Help your team grow',
        description: 'Select a placed Pokémon to buy upgrades. When Eevee can evolve, you choose one of its eight evolutions—check the type and coin cost.',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Click or tap to buy, place, select, and upgrade.' },
      { icon: '⌨️', description: 'Focus the field. Arrows or WASD move the placement cursor; Space or Enter places or selects.' },
      { icon: '🗺️', description: 'See the whole map first. Zoom in, then drag empty ground with mouse or touch to pan. Whole map resets the view.' },
      { icon: '👆', description: 'Use the on-screen arrows and Place / select button on touch screens.' },
      { icon: '⏸️', description: 'Escape or the pause button pauses. Opening these instructions pauses too.' },
    ],
    tip: 'Put a few different types near bends in the path. More time in range means more chances to defend the berries!',
  },
  he: {
    instructions: [
      {
        icon: '🟡',
        title: 'בוחרים מפה ואתגר',
        description: 'התחילו בכר הדשא המוכר, עברו ללגונת החוף הגדולה יותר או נסו את הרמות הגעשיות הגדולות במיוחד. אחר כך בחרו קל, בינוני או קשה; קל עוזר ללמוד.',
      },
      {
        icon: '🌱',
        title: 'בונים צוות',
        description: 'קנו אחד מ־65 פוקימונים ואז לחצו או הקישו על שטח פנוי לצד השביל. הצוות תוקף לבד כדי להגן על הפירות.',
      },
      {
        icon: '🐉',
        title: 'שמים לב לכל גל',
        description: 'פוקימונים שונים מגיעים יחד, גם בצורות מפותחות. לבוסים הגדולים יש תכסיסים מיוחדים, אז שלבו סוגים שונים בצוות.',
      },
      {
        icon: '🌟',
        title: 'עוזרים לצוות לגדול',
        description: 'בחרו פוקימון שהצבתם כדי לקנות שדרוגים. כשאיווי יכול להתפתח, אתם בוחרים אחת משמונה ההתפתחויות שלו — בדקו את הסוג ואת המחיר.',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'לחצו או הקישו כדי לקנות, להציב, לבחור ולשדרג.' },
      { icon: '⌨️', description: 'בחרו בשדה המשחק. חצים או WASD מזיזים את סמן ההצבה; רווח או Enter מציבים או בוחרים.' },
      { icon: '🗺️', description: 'בתחילה רואים את המפה כולה. התקרבו וגררו שטח ריק בעכבר או במגע כדי להזיז את התצוגה. ״המפה כולה״ מאפס את התצוגה.' },
      { icon: '👆', description: 'במסך מגע השתמשו בחצים ובכפתור ״הצבה / בחירה״ שעל המסך.' },
      { icon: '⏸️', description: 'Escape או כפתור ההשהיה עוצרים את המשחק. גם פתיחת ההוראות עוצרת אותו.' },
    ],
    tip: 'הציבו כמה סוגים שונים ליד פניות בשביל. כך האויבים נשארים בטווח יותר זמן ולצוות קל יותר להגן על הפירות!',
  },
  zh: {
    instructions: [
      {
        icon: '🟡',
        title: '选择地图和挑战',
        description: '先选原来的草地、较大的海岸泻湖，或超大的火山高地，再选简单、普通或困难。简单模式适合慢慢学习。',
      },
      {
        icon: '🌱',
        title: '组建队伍',
        description: '从65只宝可梦中购买一只，再点击或轻触道路旁的空地。队伍会自动攻击，保护树果。',
      },
      {
        icon: '🐉',
        title: '留意每波敌人',
        description: '不同的宝可梦会一起到来，包括进化后的形态。巨大首领有特殊招数，所以要搭配不同属性的队员。',
      },
      {
        icon: '🌟',
        title: '帮助队伍成长',
        description: '选中已放置的宝可梦来购买升级。伊布可以进化时，由你从八种进化中选择一种——先看看属性和金币价格。',
      },
    ],
    controls: [
      { icon: '🖱️', description: '点击或轻触来购买、放置、选择和升级。' },
      { icon: '⌨️', description: '先选中战场。方向键或WASD移动放置光标；空格或Enter放置或选择。' },
      { icon: '🗺️', description: '开始时显示完整地图。放大后，用鼠标或触屏拖动空地来平移视图。“完整地图”可重置视图。' },
      { icon: '👆', description: '触屏可使用屏幕方向按钮和“放置 / 选择”按钮。' },
      { icon: '⏸️', description: 'Escape或暂停按钮可暂停。打开说明也会暂停游戏。' },
    ],
    tip: '在道路转弯附近放置不同属性的队员。敌人在攻击范围内停留越久，队伍就越容易保护树果！',
  },
  es: {
    instructions: [
      {
        icon: '🟡',
        title: 'Elige mapa y reto',
        description: 'Empieza en la Pradera, explora la Laguna Costera más grande o prueba las Tierras Altas Volcánicas extragrandes. Luego elige Fácil, Medio o Difícil; Fácil ayuda a aprender.',
      },
      {
        icon: '🌱',
        title: 'Forma tu equipo',
        description: 'Compra uno de los 65 Pokémon y toca o haz clic en el terreno libre junto al camino. Tu equipo ataca solo para proteger las bayas.',
      },
      {
        icon: '🐉',
        title: 'Observa cada oleada',
        description: 'Llegan distintos Pokémon juntos, también formas evolucionadas. Los grandes jefes tienen trucos especiales: combina tipos en tu equipo.',
      },
      {
        icon: '🌟',
        title: 'Ayuda a tu equipo a crecer',
        description: 'Selecciona un Pokémon colocado para comprar mejoras. Cuando Eevee pueda evolucionar, tú eliges una de sus ocho evoluciones: mira el tipo y el precio.',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Haz clic o toca para comprar, colocar, seleccionar y mejorar.' },
      { icon: '⌨️', description: 'Enfoca el campo. Flechas o WASD mueven el cursor de colocación; Espacio o Enter colocan o seleccionan.' },
      { icon: '🗺️', description: 'Primero ves el mapa completo. Acércate y arrastra terreno vacío con el ratón o el dedo para desplazar la vista. Mapa completo restablece la vista.' },
      { icon: '👆', description: 'En pantallas táctiles, usa las flechas y el botón Colocar / elegir.' },
      { icon: '⏸️', description: 'Escape o el botón de pausa detienen el juego. Abrir estas instrucciones también lo pausa.' },
    ],
    tip: 'Coloca varios tipos cerca de las curvas del camino. ¡Así los enemigos pasan más tiempo al alcance y tu equipo protege mejor las bayas!',
  },
};

// playMelody is the hook's public audio-unlock entry point. A zero-volume note
// primes its context without adding a second audible effect to iframe events.
const silentUnlockNote = [{ frequency: 440, at: 0, duration: 0.01 }];
const soundEnableNote = [{ frequency: 620, at: 0, duration: 0.08 }];

export default function PokemonTowerDefenseGame() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const locale = useLocale();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const sounds = useRetroSounds();
  const {
    isMuted,
    isUnlocked,
    setMuted,
    playMelody,
    playClick,
    playShoot,
    playHit,
    playSuccess,
    playLevelUp,
    playGameOver,
    playPowerUp,
  } = sounds;
  const title =
    pokemonTowerDefenseConfig.title[
      locale as keyof typeof pokemonTowerDefenseConfig.title
    ] ?? pokemonTowerDefenseConfig.title.en;
  const instructions = instructionsByLocale[locale] ?? instructionsByLocale.en;

  const syncInstructionsState = useCallback((open: boolean) => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        source: 'pokemon-tower-defense-portal',
        type: 'instructions-state',
        open,
      },
      window.location.origin,
    );
  }, []);

  const syncSoundState = useCallback((muted: boolean) => {
    iframeRef.current?.contentWindow?.postMessage(
      { source: 'pokemon-tower-defense-portal', type: 'sound-state', muted },
      window.location.origin,
    );
  }, []);

  const openInstructions = useCallback(() => {
    syncInstructionsState(true);
    setShowInstructions(true);
  }, [syncInstructionsState]);

  const closeInstructions = useCallback(() => {
    syncInstructionsState(false);
    setShowInstructions(false);
  }, [syncInstructionsState]);

  // The initial effect can run before the core has attached its listener.
  // onLoad repeats the current state after all iframe scripts have executed.
  const handleIframeLoad = useCallback(() => {
    syncInstructionsState(showInstructions);
    syncSoundState(isMuted);
  }, [isMuted, showInstructions, syncInstructionsState, syncSoundState]);

  useEffect(() => {
    syncInstructionsState(showInstructions);
  }, [showInstructions, syncInstructionsState]);

  useEffect(() => {
    syncSoundState(isMuted);
  }, [isMuted, syncSoundState]);

  useEffect(() => {
    const soundEvents = {
      click: playClick,
      shoot: playShoot,
      hit: playHit,
      success: playSuccess,
      levelUp: playLevelUp,
      gameOver: playGameOver,
      powerUp: playPowerUp,
    };

    const handleMessage = (event: MessageEvent<unknown>) => {
      const gameWindow = iframeRef.current?.contentWindow;
      if (
        !gameWindow ||
        event.origin !== window.location.origin ||
        event.source !== gameWindow ||
        !event.data ||
        typeof event.data !== 'object'
      ) {
        return;
      }

      const message = event.data as {
        source?: unknown;
        type?: unknown;
        event?: unknown;
        enabled?: unknown;
      };
      if (message.source !== 'pokemon-tower-defense') return;

      if (message.type === 'instructions') {
        openInstructions();
      } else if (message.type === 'sound-state-request') {
        syncSoundState(isMuted);
      } else if (
        message.type === 'sound-preference' &&
        typeof message.enabled === 'boolean'
      ) {
        setMuted(!message.enabled);
        syncSoundState(!message.enabled);
        if (message.enabled) playMelody(soundEnableNote, 0.03);
      } else if (message.type === 'userGesture') {
        playMelody(silentUnlockNote, 0);
      } else if (
        message.type === 'sound' &&
        typeof message.event === 'string' &&
        Object.prototype.hasOwnProperty.call(soundEvents, message.event)
      ) {
        if (!isUnlocked) playMelody(silentUnlockNote, 0);
        soundEvents[message.event as keyof typeof soundEvents]();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    isMuted,
    isUnlocked,
    setMuted,
    syncSoundState,
    openInstructions,
    playMelody,
    playClick,
    playShoot,
    playHit,
    playSuccess,
    playLevelUp,
    playGameOver,
    playPowerUp,
  ]);

  return (
    <>
      <GameWrapper
        title={title}
        className="bg-gradient-to-b from-emerald-700 via-emerald-600 to-teal-800"
        fullHeight
        showSoundToggle={false}
        sound={sounds}
        onInstructionsClick={openInstructions}
      >
        <iframe
          ref={iframeRef}
          src={`${basePath}/games/pokemon-tower-defense/index.html?locale=${encodeURIComponent(locale)}`}
          title={title}
          onLoad={handleIframeLoad}
          className="block h-full w-full border-0 bg-emerald-700"
          allow="autoplay"
        />
      </GameWrapper>
      <InstructionsModal
        isOpen={showInstructions}
        onClose={closeInstructions}
        title={title}
        instructions={instructions.instructions}
        controls={instructions.controls}
        tip={instructions.tip}
        locale={locale}
      />
    </>
  );
}
