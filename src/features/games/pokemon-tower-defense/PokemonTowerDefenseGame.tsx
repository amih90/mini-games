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
        description: 'Choose Meadow, Coastal Lagoon, Volcanic Highlands, Switchback Garden, or Spiral Island. Each path is different! Pick Easy to learn, Medium for a challenge, or Hard for tougher boss squads.',
      },
      {
        icon: '🌱',
        title: 'Build your team',
        description: 'Choose from 137 Pokémon, including 50 new base-form families. Place a defender beside the path, then train it to evolve into stronger forms.',
      },
      {
        icon: '🐉',
        title: 'Watch each wave',
        description: 'Mix your team’s types to beat boss squads! A red ring means an attack is coming: move your Pokémon away. On Medium and Hard, three hits knock it out and return rescue coins. Easy only makes it rest.',
      },
      {
        icon: '🌟',
        title: 'Help your team grow',
        description: 'Select a placed Pokémon to buy upgrades. When Eevee can evolve, you choose one of its eight evolutions—check the type and coin cost.',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Press Buy Pokémon and choose a starter or special defender. Tap clear ground to place and pay. Train starters with upgrades to evolve them. Buy stays available beside upgrades; hold a placed Pokémon to move it for free.' },
      { icon: '⌨️', description: 'Focus the field. Arrows or WASD move the cursor; Space or Enter places or selects. M lifts a selected Pokémon, then arrows/WASD and Enter drop it. Escape cancels or pauses.' },
      { icon: '🗺️', description: 'See the whole map first. Use the mouse wheel to zoom and drag empty ground to pan. Whole map resets the view.' },
      { icon: '👆', description: 'Tap to choose or place. Right-click the battlefield or click X on upgrades to cancel selection and moving without spending coins. Choose in the shop to build again.' },
      { icon: '⏸️', description: 'Escape or the pause button pauses. Opening these instructions pauses too.' },
    ],
    tip: 'Put a few different types near bends in the path. More time in range means more chances to defend the berries!',
  },
  he: {
    instructions: [
      {
        icon: '🟡',
        title: 'בוחרים מפה ואתגר',
        description: 'בחרו כר דשא, לגונת חוף, רמות געשיות, גן פניות או אי ספירלה. בכל מפה שביל אחר! קל עוזר ללמוד, בינוני מאתגר וקשה מביא צוותי בוסים חזקים יותר.',
      },
      {
        icon: '🌱',
        title: 'בונים צוות',
        description: 'בחרו מבין 137 פוקימונים, כולל 50 משפחות חדשות של צורות בסיס. הציבו מגן לצד השביל ושדרגו אותו כדי לפתח אותו לצורות חזקות יותר.',
      },
      {
        icon: '🐉',
        title: 'שמים לב לכל גל',
        description: 'שלבו סוגים כדי לנצח צוותי בוסים! טבעת אדומה אומרת שמתקפה מתקרבת: הזיזו את הפוקימון. בבינוני ובקשה שלוש פגיעות מוציאות אותו מהקרב ומחזירות מטבעות הצלה. בקל הוא רק נח לרגע.',
      },
      {
        icon: '🌟',
        title: 'עוזרים לצוות לגדול',
        description: 'בחרו פוקימון שהצבתם כדי לקנות שדרוגים. כשאיווי יכול להתפתח, אתם בוחרים אחת משמונה ההתפתחויות שלו — בדקו את הסוג ואת המחיר.',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'לחצו על קניית פוקימון ובחרו פוקימון פתיחה או מגן מיוחד. הקישו על שטח פנוי להצבה ולתשלום. שדרגו פוקימוני פתיחה כדי לפתח אותם. אפשר לקנות גם לצד השדרוגים; החזיקו בפוקימון שהוצב כדי להזיזו בחינם.' },
      { icon: '⌨️', description: 'בחרו בשדה המשחק. חצים או WASD מזיזים את הסמן; רווח או Enter מציבים או בוחרים. M מרים פוקימון נבחר, ואז חצים/WASD ו-Enter מעבירים אותו. Escape מבטל או משהה.' },
      { icon: '🗺️', description: 'בתחילה רואים את המפה כולה. גלגלת העכבר משנה תקריב; גררו שטח ריק להזזת התצוגה. ״המפה כולה״ מאפס.' },
      { icon: '👆', description: 'הקישו לבחירה ולהצבה. לחצן ימני בשדה או X בשדרוגים מבטלים בחירה והזזה בלי לשלם. בחרו בחנות כדי להציב שוב.' },
      { icon: '⏸️', description: 'Escape או כפתור ההשהיה עוצרים את המשחק. גם פתיחת ההוראות עוצרת אותו.' },
    ],
    tip: 'הציבו כמה סוגים שונים ליד פניות בשביל. כך האויבים נשארים בטווח יותר זמן ולצוות קל יותר להגן על הפירות!',
  },
  zh: {
    instructions: [
      {
        icon: '🟡',
        title: '选择地图和挑战',
        description: '选择草地、海岸泻湖、火山高地、折返花园或螺旋岛。每张地图的道路都不同！简单适合学习，普通有挑战，困难会带来更强的首领队伍。',
      },
      {
        icon: '🌱',
        title: '组建队伍',
        description: '从137只宝可梦中选择队员，其中包含50种全新的基础形态进化家族。把守卫放在道路旁并升级，让它进化得更强。',
      },
      {
        icon: '🐉',
        title: '留意每波敌人',
        description: '搭配不同属性来战胜首领队伍！红圈表示攻击快来了：把宝可梦移开。普通和困难模式中，三次受击会让队员倒下并返还救援金币。简单模式只会让它休息一会儿。',
      },
      {
        icon: '🌟',
        title: '帮助队伍成长',
        description: '选中已放置的宝可梦来购买升级。伊布可以进化时，由你从八种进化中选择一种——先看看属性和金币价格。',
      },
    ],
    controls: [
      { icon: '🖱️', description: '点击购买宝可梦，选择御三家或特殊守卫，再轻触空地放置并支付。升级御三家即可进化。升级面板旁也能购买；长按已放置的宝可梦可免费移动。' },
      { icon: '⌨️', description: '先聚焦战场。方向键或WASD移动光标；空格或Enter放置或选择。M抬起已选宝可梦，再用方向键/WASD和Enter放下。Escape取消或暂停。' },
      { icon: '🗺️', description: '开始时显示完整地图。鼠标滚轮缩放，拖动空地平移。“完整地图”重置视图。' },
      { icon: '👆', description: '轻触选择或放置。在战场右键点击或点击升级面板的X可取消选择和移动，不花金币。在商店选择后可再次放置。' },
      { icon: '⏸️', description: 'Escape或暂停按钮可暂停。打开说明也会暂停游戏。' },
    ],
    tip: '在道路转弯附近放置不同属性的队员。敌人在攻击范围内停留越久，队伍就越容易保护树果！',
  },
  es: {
    instructions: [
      {
        icon: '🟡',
        title: 'Elige mapa y reto',
        description: 'Elige Pradera, Laguna Costera, Tierras Volcánicas, Jardín Zigzag o Isla Espiral. ¡Cada camino es distinto! Fácil ayuda a aprender; Medio y Difícil traen grupos de jefes más fuertes.',
      },
      {
        icon: '🌱',
        title: 'Forma tu equipo',
        description: 'Elige entre 137 Pokémon, incluidas 50 nuevas familias de formas básicas. Coloca un defensor junto al camino y mejóralo para que evolucione y sea más fuerte.',
      },
      {
        icon: '🐉',
        title: 'Observa cada oleada',
        description: '¡Combina tipos para vencer grupos de jefes! Un círculo rojo avisa de un ataque: mueve tu Pokémon fuera. En Medio y Difícil, tres golpes lo derrotan y devuelven monedas de rescate. En Fácil solo descansa un momento.',
      },
      {
        icon: '🌟',
        title: 'Ayuda a tu equipo a crecer',
        description: 'Selecciona un Pokémon colocado para comprar mejoras. Cuando Eevee pueda evolucionar, tú eliges una de sus ocho evoluciones: mira el tipo y el precio.',
      },
    ],
    controls: [
      { icon: '🖱️', description: 'Pulsa Comprar Pokémon y elige un inicial o defensor especial. Toca terreno libre para colocarlo y pagar. Mejora a los iniciales para que evolucionen. Puedes comprar junto a las mejoras; mantén pulsado un Pokémon colocado para moverlo gratis.' },
      { icon: '⌨️', description: 'Enfoca el campo. Flechas o WASD mueven el cursor; Espacio o Enter colocan o seleccionan. M levanta al seleccionado; flechas/WASD y Enter lo colocan. Escape cancela o pausa.' },
      { icon: '🗺️', description: 'Primero ves el mapa completo. La rueda del ratón acerca; arrastra terreno vacío para desplazar. Mapa completo restablece la vista.' },
      { icon: '👆', description: 'Toca para elegir o colocar. El clic derecho en el campo o X en mejoras cancela selección y movimiento sin gastar. Elige en la tienda para volver a colocar.' },
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

  useEffect(() => {
    // The portal footer follows fullHeight games in the outer layout. Keep it
    // from making the tablet page scroll while playing; restore on navigation.
    const body = document.body;
    const root = document.documentElement;
    const previousHeight = body.style.height;
    const previousOverflow = body.style.overflow;
    const previousRootHeight = root.style.height;
    const previousRootOverflow = root.style.overflow;
    body.style.height = '100dvh';
    body.style.overflow = 'hidden';
    root.style.height = '100dvh';
    root.style.overflow = 'hidden';
    return () => {
      body.style.height = previousHeight;
      body.style.overflow = previousOverflow;
      root.style.height = previousRootHeight;
      root.style.overflow = previousRootOverflow;
    };
  }, []);

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
        theme="fieldnotes"
        fullHeight
        showSoundToggle={false}
        sound={sounds}
      >
        <iframe
          ref={iframeRef}
          src={`${basePath}/games/pokemon-tower-defense/index.html?locale=${encodeURIComponent(locale)}`}
          title={title}
          onLoad={handleIframeLoad}
          className="block h-full w-full border-0 bg-[#101c29]"
          allow="autoplay"
        />
      </GameWrapper>
      <InstructionsModal
        theme="fieldnotes"
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
