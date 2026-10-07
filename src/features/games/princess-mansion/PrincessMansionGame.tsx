'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { MotionConfig } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { GameWrapper } from '../shared/GameWrapper';
import { InstructionsModal } from '../shared/InstructionsModal';
import { WinModal } from '../shared/WinModal';
import { useRetroSounds } from '@/hooks/useRetroSounds';
import {
  NEED_IDS, NEED_TEXTURES, PRINCESS_IDS, PRINCESSES, ROOM_IDS, STATIONS,
  artUrl, clamp, getStation, roomIndex, type Difficulty,
} from './data';
import { type SceneBridge, type SceneControls } from './scene';
import { MansionWorld } from './MansionWorld';
import { MansionDialog } from './MansionDialog';
import { useMansionSession } from './useMansionSession';
import { useMansionSounds } from './useMansionSounds';
import styles from './mansion.module.css';

type Dialog = 'instructions' | 'album' | 'pause' | 'confirmNew' | 'setup' | 'celebration' | null;
const ROOM_ICONS = ['☾', '📚', '🍰', '🚪', '🫧', '🧸', '♫', '🌿'];
const DIFFICULTY_ICONS = { easy: '🦋', medium: '🌷', hard: '⭐' };

export default function PrincessMansionGame() {
  const t = useTranslations('princessMansion');
  const locale = useLocale();
  const session = useMansionSession();
  const { controller, initial, writer, error, startError, saveStatus, saveNow } = session;
  const retro = useRetroSounds();
  const returnFocus = useRef<HTMLElement | null>(null);
  const copy = useRef(t);
  const [requestedDialog, setDialog] = useState<Dialog>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [controls, setControls] = useState<SceneControls | null>(null);
  const [moving, setMoving] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [assetError, setAssetError] = useState(false);
  const [rendererVersion, setRendererVersion] = useState(0);
  const [feedback, setFeedback] = useState('');
  const subscribe = useCallback((listener: () => void) => controller?.subscribe(listener) ?? (() => {}), [controller]);
  const getSnapshot = useCallback(() => controller?.state ?? null, [controller]);
  const state = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const dialog = requestedDialog ?? (state && !state.tutorialSeen ? 'instructions' : state && state.princesses.length === PRINCESS_IDS.length && !state.collectionCelebrated ? 'celebration' : null);
  const selected = state?.princesses.find(princess => princess.id === state.selectedId);
  const room = state?.cameraRoom ?? 'dining';
  const station = selected?.activity ? getStation(selected.activity.stationId) : undefined;
  const mayInvite = state && PRINCESS_IDS.some(id => !state.princesses.some(princess => princess.id === id) && state.hearts >= PRINCESSES[id].invitation);
  const blocked = Boolean(error) && initial === null;
  const modalOpen = dialog !== null || initial !== null || blocked || assetError;
  const sounds = useMansionSounds(retro, {
    active: Boolean(state) && initial === null && !loadingAssets && !blocked && !assetError && dialog !== 'pause',
    ambientEnabled: state?.ambientEnabled ?? true,
  });
  const sound = useRef(sounds);
  useEffect(() => { sound.current = sounds; copy.current = t; }, [sounds, t]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    if (!controller) return;
    const removeEffects = controller.onEffect(effect => {
      const translate = copy.current;
      if (effect.type === 'error') {
        console.warn('Princess Mansion rejected an invalid action', effect.code);
        setFeedback(translate('errors.invalidAction'));
        return;
      }
      if ('princessId' in effect) setFeedback(translate(`feedback.${effect.type}`, {
        name: translate(`princesses.${effect.princessId}`),
        ...(effect.type === 'autonomous' ? { activity: translate(`activities.${getStation(effect.stationId)?.activity}`) } : {}),
      }));
      if (effect.type === 'completed') {
        const kind = getStation(effect.stationId)?.activity;
        if (kind) sound.current.playCare(kind, true);
      } else if (effect.type === 'invited') {
        sound.current.playLevelUp();
        if (controller.state.princesses.length === PRINCESS_IDS.length && !controller.state.collectionCelebrated) setDialog('celebration');
      }
      else if (effect.type === 'refused' || effect.type === 'insisted') sound.current.playBeep();
      else if (effect.type === 'queued') sound.current.playQueue();
      else if (effect.type === 'placed' || effect.type === 'autonomous') {
        const placed = controller.state.princesses.find(princess => princess.id === (effect.type === 'autonomous' ? effect.princessId : controller.state.selectedId));
        const kind = placed?.activity ? getStation(placed.activity.stationId)?.activity : null;
        if (kind) sound.current.playCare(kind);
        else sound.current.playDrop();
      } else if (effect.type === 'selected') sound.current.playClick();
    });
    return removeEffects;
  }, [controller]);
  useEffect(() => { controller?.pause('dialog', modalOpen); }, [controller, modalOpen]);
  const pause = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement;
    sound.current.playClick();
    setDialog('pause');
  }, []);
  const decorative = useCallback(() => sound.current.playClick(), []);
  const reportAssetError = useCallback(() => setAssetError(true), []);
  const bridge = useMemo<SceneBridge>(() => ({
    ready: setControls, loading: setLoadingAssets, moving: setMoving, error: reportAssetError, pause, decorative,
  }), [decorative, pause, reportAssetError]);
  const playWin = useCallback(() => sound.current.playWin(), []);

  const open = (next: Dialog, audible = true) => {
    if (!modalOpen && document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement;
    controller?.pause('dialog', true);
    saveNow();
    if (audible) sound.current.playClick();
    setDialog(next);
  };
  const close = () => {
    sound.current.playClick();
    session.clearStartError();
    if (controller && !controller.state.tutorialSeen) {
      controller.dispatch({ type: 'tutorial' });
      controller.pause('onboarding', false);
      saveNow();
    }
    setDialog(null);
  };
  const requestNew = () => {
    session.clearStartError();
    open(controller || (session.loaded && session.loaded.kind !== 'empty') ? 'confirmNew' : 'setup');
  };
  const start = () => {
    if (session.start(difficulty)) {
      setAssetError(false);
      setFeedback('');
      setMoving(false);
      setControls(null);
      setLoadingAssets(true);
      setDialog('instructions');
      sound.current.playWhoosh();
    }
  };
  const finishCelebration = () => { controller?.dispatch({ type: 'celebrated' }); saveNow(); close(); };
  const changeRoom = (delta: number) => {
    const next = ROOM_IDS[clamp(roomIndex(room) + delta, 0, ROOM_IDS.length - 1)];
    controller?.dispatch({ type: 'camera', room: next });
    sound.current.playWhoosh();
  };
  const activityStatus = selected?.activity?.kind === 'waiting' ? t('waiting') : selected?.activity?.kind === 'active' && station
    ? t('activityProgress', { activity: t(`activities.${station.activity}`), percent: Math.round(selected.activity.elapsed / selected.activity.duration * 100) })
    : selected?.autonomy.walk ? t('exploring') : selected ? t('favorite', { activity: t(`activities.${PRINCESSES[selected.id].favorite}`) }) : '';
  const setupOpen = dialog === 'setup' || (initial === 'setup' && dialog === null);
  const showRegularDialog = !blocked && !assetError && !setupOpen;
  const dialogProps = { closeLabel: t('close'), returnFocus };

  return (
    <MotionConfig reducedMotion="user">
      <GameWrapper title={t('title')} fullHeight theme="storybook" sound={sounds} onInstructionsClick={() => open('instructions', false)} className={styles.shell}>
        <div className={styles.game} dir={locale === 'he' ? 'rtl' : 'ltr'}>
          <section className={styles.playArea} onScroll={() => controls?.refreshBounds()} aria-hidden={modalOpen} inert={modalOpen} data-testid="mansion-game" data-adventure-id={state?.adventureId} data-active-time={state?.activeTime} data-room={room} data-moving={moving}>
            <div className={styles.toolbar}>
              <div className={styles.hearts} role="status" aria-label={t('careHearts')}><Image src={artUrl('icons/heart.svg')} width={27} height={27} alt="" /><span>{state?.hearts ?? 0}</span><span className={styles.softLabel}>{t('careHearts')}</span></div>
              <div className={styles.toolbarActions}>
                <span className={styles.saveStatus} role="status">{t(saveStatus)}</span>
                {state && <span className={styles.difficultyBadge} data-level={state.difficulty}><span aria-hidden="true">{DIFFICULTY_ICONS[state.difficulty]}</span> {t(state.difficulty)}</span>}
                <button type="button" className={`${styles.button} ${mayInvite ? styles.inviteReady : ''}`} onClick={() => open('album')} disabled={!controller} aria-label={t('album')}>
                  <span aria-hidden="true">♛</span> {t('princessCount', { count: state?.princesses.length ?? 1, total: PRINCESS_IDS.length })}
                </button>
                <button type="button" className={styles.iconButton} onClick={() => open('pause')} disabled={!controller} aria-label={t('pause')}>Ⅱ</button>
              </div>
            </div>

            <div className={styles.world} data-testid="mansion-world" dir="ltr">
              {controller ? <MansionWorld key={`${controller.state.adventureId}:${rendererVersion}`} controller={controller} bridge={bridge} label={t('worldLabel')} /> : <div className={styles.cover} style={{ backgroundImage: `url("${artUrl('rooms/dining.svg')}")` }} />}
              <div className={styles.roomHeading} dir={locale === 'he' ? 'rtl' : 'ltr'}><h2>{t(`rooms.${room}`)}</h2><p>{t(`roomDescriptions.${room}`)}</p></div>
              {loadingAssets && controller && !assetError && <div className={styles.assetLoading} role="status">{t('loadingAssets')}</div>}
              {moving && <div className={styles.moveHint} dir={locale === 'he' ? 'rtl' : 'ltr'}>{t('moveHint')}<button type="button" onClick={() => { controls?.cancelMove(); sound.current.playDrop(); }}>{t('cancel')}</button></div>}
              <button type="button" className={`${styles.cameraArrow} ${styles.previous}`} onClick={() => changeRoom(-1)} disabled={!controller || roomIndex(room) === 0 || loadingAssets} aria-label={t('previousRoom')}>‹</button>
              <button type="button" className={`${styles.cameraArrow} ${styles.next}`} onClick={() => changeRoom(1)} disabled={!controller || roomIndex(room) === ROOM_IDS.length - 1 || loadingAssets} aria-label={t('nextRoom')}>›</button>
            </div>

            <nav className={styles.roomMap} aria-label={t('roomNavigation')} dir="ltr">
              {ROOM_IDS.map((id, index) => <button type="button" key={id} className={`${styles.roomButton} ${room === id ? styles.currentRoom : ''}`} aria-current={room === id ? 'location' : undefined} onClick={() => { controller?.dispatch({ type: 'camera', room: id }); sound.current.playWhoosh(); }} disabled={!controller || loadingAssets}>
                <span aria-hidden="true">{ROOM_ICONS[index]}</span><bdi>{t(`rooms.${id}`)}</bdi>
              </button>)}
            </nav>

            <div className={styles.princessStrip} aria-label={t('choosePrincess')}>
              {state?.princesses.map(princess => <button type="button" key={princess.id} className={`${styles.portraitButton} ${selected?.id === princess.id ? styles.selectedPortrait : ''}`} aria-pressed={selected?.id === princess.id} aria-label={t(`princesses.${princess.id}`)} onClick={() => controller?.dispatch({ type: 'select', id: princess.id })} disabled={loadingAssets}>
                <Image src={artUrl(`characters/${princess.id}-portrait.svg`)} width={44} height={44} alt="" draggable={false} /><span>{t(`princesses.${princess.id}`)}</span>
                {Math.min(...Object.values(princess.needs)) < 30 && <span className={styles.needDot} aria-label={t('needsCare')} />}
              </button>)}
              <button type="button" className={styles.albumButton} onClick={() => open('album')} disabled={!controller}>{mayInvite ? t('inviteReady') : t('album')}</button>
            </div>

            {selected && <section className={styles.carePanel} aria-label={t('carePanel', { name: t(`princesses.${selected.id}`) })}>
              <div className={styles.princessSummary}>
                <div><strong>{t(`princesses.${selected.id}`)}</strong><span className={styles.happiness}><Image src={artUrl('icons/heart.svg')} width={17} height={17} alt="" />{Math.round(selected.happiness)}%</span></div>
                <p>{activityStatus}</p>
              </div>
              <div className={styles.needs}>
                {NEED_IDS.map(need => <div key={need} className={styles.need} title={`${t(`needs.${need}`)}: ${Math.round(selected.needs[need])}%`}>
                  <div className={styles.needLabel}><Image src={artUrl(`icons/${NEED_TEXTURES[need]}.svg`)} width={18} height={18} alt="" /><span>{t(`needs.${need}`)}</span></div>
                  <div className={styles.needTrack} role="progressbar" aria-label={t(`needs.${need}`)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(selected.needs[need])}><div className={`${styles.needFill} ${selected.needs[need] < 30 ? styles.lowNeed : ''}`} style={{ width: `${selected.needs[need]}%` }} /></div>
                </div>)}
              </div>
              <div className={styles.careActions}>
                <button type="button" className={`${styles.button} ${moving ? styles.activeMove : ''}`} onClick={() => { if (moving) sound.current.playDrop(); controls?.movePrincess(); }} disabled={!controls || loadingAssets} aria-pressed={moving}>{moving ? t('stopMoving') : t('move')}</button>
                {selected.activity && <button type="button" className={styles.button} onClick={() => { controller?.dispatch({ type: 'cancel', id: selected.id }); saveNow(); sound.current.playDrop(); }} disabled={loadingAssets}>{t('cancelActivity')}</button>}
              </div>
            </section>}
            <div className={styles.attractions} aria-label={t('attractions')}>
              {STATIONS.filter(item => item.room === room).map(item => {
                const count = state?.princesses.filter(princess => princess.activity?.kind === 'active' && princess.activity.stationId === item.id).length ?? 0;
                return <button type="button" className={styles.attractionButton} key={item.id} data-testid={`station-${item.id}`} onClick={() => controls?.placeAtStation(item.id)} disabled={!selected || !controls || loadingAssets} aria-label={t('placeAt', { activity: t(`activities.${item.activity}`), count, capacity: item.slots.length })}>
                  <span>{t(`activities.${item.activity}`)}</span><span className={styles.occupancy}>{count}/{item.slots.length}</span>
                </button>;
              })}
            </div>
            <div className={styles.footerNote}>
              <span className={styles.feedback} role="status" aria-live="polite">{feedback || t('gentleHint')}</span>
              {writer === 'single' && <span className={styles.singleTab} role="status">{t('singleTab')}</span>}
              {sounds.problem && <span className={styles.audioProblem} role="status">{t('audioProblem')} <button type="button" onClick={sounds.retry}>{t('retryAudio')}</button></span>}
            </div>
          </section>

          {initial === 'loading' && <div className={styles.initialLoading} role="status">{t('loadingAssets')}</div>}
          {showRegularDialog && dialog === 'album' && state && <MansionDialog title={t('album')} onClose={close} {...dialogProps}>
            <p className={styles.dialogDescription}>{t('albumDescription')}</p>
            <div className={styles.albumGrid}>{PRINCESS_IDS.map(id => {
              const joined = state.princesses.some(princess => princess.id === id);
              const available = state.hearts >= PRINCESSES[id].invitation;
              return <article className={`${styles.albumCard} ${!joined && !available ? styles.lockedCard : ''}`} style={{ borderTopColor: PRINCESSES[id].color }} key={id}>
                <span className={styles.albumCrown} aria-hidden="true">{joined ? '♛' : available ? '✦' : '♡'}</span>
                <Image src={artUrl(`characters/${id}-portrait.svg`)} width={112} height={112} alt="" draggable={false} />
                <h3>{t(`princesses.${id}`)}</h3><p>{t(`traits.${id}`)}</p>
                <small>{t('favorite', { activity: t(`activities.${PRINCESSES[id].favorite}`) })}</small>
                <button type="button" className={styles.button} disabled={joined || !available} onClick={() => controller?.dispatch({ type: 'invite', id })}>{joined ? t('joined') : available ? t('invite') : t('inviteAt', { count: PRINCESSES[id].invitation })}</button>
              </article>;
            })}</div>
          </MansionDialog>}

          {showRegularDialog && dialog === 'pause' && <MansionDialog title={t('pauseTitle')} onClose={close} {...dialogProps}>
            <p className={styles.dialogDescription}>{t('pauseDescription')}</p>
            {state && <fieldset className={styles.preferences}><legend>{t('preferencesTitle')}</legend>
              <label className={styles.setting}><span className={styles.settingIcon} aria-hidden="true">♫</span><span><strong>{t('ambientTitle')}</strong><small>{t('ambientDescription')}</small></span><input type="checkbox" aria-label={t('ambientTitle')} checked={state.ambientEnabled} onChange={event => { controller?.dispatch({ type: 'ambient', enabled: event.target.checked }); saveNow(); sound.current.playClick(); }} /></label>
              <label className={styles.setting}><span className={styles.settingIcon} aria-hidden="true">♛</span><span><strong>{t('autonomyTitle')}</strong><small>{t('autonomyDescription')}</small></span><input type="checkbox" aria-label={t('autonomyTitle')} checked={state.autonomyEnabled} onChange={event => { controller?.dispatch({ type: 'autonomy', enabled: event.target.checked }); saveNow(); sound.current.playClick(); }} /></label>
            </fieldset>}
            <p className={styles.saveNote}>{t('saveLocal')} {t('noOffline')}</p>
            <div className={styles.dialogActions}><button type="button" className={`${styles.button} ${styles.primaryButton}`} onClick={close}>{t('resume')}</button><button type="button" className={styles.button} onClick={requestNew}>{t('newGame')}</button></div>
          </MansionDialog>}
          {showRegularDialog && dialog === 'confirmNew' && <MansionDialog title={t('confirmTitle')} onClose={close} {...dialogProps}>
            <p className={styles.dialogDescription}>{t('confirmMessage')}</p>
            <div className={styles.dialogActions}><button type="button" className={styles.button} data-autofocus onClick={close}>{t('cancel')}</button><button type="button" className={`${styles.button} ${styles.dangerButton}`} onClick={() => { sound.current.playClick(); setDialog('setup'); }}>{t('newConfirm')}</button></div>
          </MansionDialog>}
          {setupOpen && <MansionDialog title={t('startTitle')} onClose={controller || initial !== 'setup' ? close : undefined} {...dialogProps}>
            <p className={styles.dialogDescription}>{t('startDescription')}</p>
            <div className={styles.welcomeCourt} aria-hidden="true"><span>✦</span><Image src={artUrl('characters/flora-portrait.svg')} width={82} height={82} alt="" /><Image className={styles.welcomePortrait} src={artUrl('characters/liora-portrait.svg')} width={138} height={138} alt="" /><Image src={artUrl('characters/celeste-portrait.svg')} width={82} height={82} alt="" /><span>✦</span></div>
            <fieldset className={styles.difficultyChoices}><legend>{t('chooseDifficulty')}</legend>{(['easy', 'medium', 'hard'] as const).map(value => <button type="button" key={value} data-level={value} className={`${styles.difficultyChoice} ${difficulty === value ? styles.chosenDifficulty : ''}`} aria-pressed={difficulty === value} onClick={() => { setDifficulty(value); sound.current.playClick(); }}><span className={styles.difficultyIcon} aria-hidden="true">{DIFFICULTY_ICONS[value]}</span><strong>{t(value)}</strong><span>{t(`${value}Description`)}</span></button>)}</fieldset>
            {startError && <p role="alert" className={styles.errorMessage}>{t(`errors.${startError}`)}</p>}
            <p className={styles.saveNote}>{t('saveLocal')} {t('noOffline')}</p>
            <div className={styles.dialogActions}>{controller && <button type="button" className={styles.button} onClick={close}>{t('cancel')}</button>}<button type="button" className={`${styles.button} ${styles.primaryButton}`} onClick={start}>{t('start')}</button></div>
          </MansionDialog>}
          {initial === 'recovery' && dialog === null && <MansionDialog title={t('backupTitle')} {...dialogProps}>
            <p className={styles.dialogDescription}>{t('backupDescription')}</p>
            {error && <p role="alert" className={styles.errorMessage}>{t(`errors.${error}`)}</p>}
            <div className={styles.dialogActions}><button type="button" className={`${styles.button} ${styles.primaryButton}`} onClick={() => { sound.current.playClick(); session.recover(); }}>{t('recover')}</button><button type="button" className={styles.button} onClick={requestNew}>{t('newGame')}</button></div>
          </MansionDialog>}
          {initial === 'problem' && dialog === null && <MansionDialog title={writer === 'blocked' ? t('anotherTabTitle') : t('saveProblem')} {...dialogProps}>
            <p role="alert" className={styles.dialogDescription}>{writer === 'blocked' ? t('anotherTabDescription') : t(`errors.${error ?? 'storageUnavailable'}`)}</p>
            <div className={styles.dialogActions}><button type="button" className={styles.button} onClick={() => { sound.current.playClick(); window.location.reload(); }}>{t('reload')}</button>{writer !== 'blocked' && error !== 'storageUnavailable' && <button type="button" className={styles.button} onClick={requestNew}>{t('newGame')}</button>}</div>
          </MansionDialog>}
          {blocked && <MansionDialog title={t('saveProblem')} {...dialogProps}><p role="alert" className={styles.dialogDescription}>{t(`errors.${error}`)}</p><div className={styles.dialogActions}><button type="button" className={`${styles.button} ${styles.primaryButton}`} onClick={() => { sound.current.playClick(); if (error === 'conflict') window.location.reload(); else saveNow(true); }}>{error === 'conflict' ? t('reload') : t('retrySave')}</button></div></MansionDialog>}
          {assetError && !blocked && <MansionDialog title={t('assetErrorTitle')} {...dialogProps}><p role="alert" className={styles.dialogDescription}>{t('errors.assetFailed')}</p><button type="button" className={styles.button} onClick={() => { sound.current.playClick(); setAssetError(false); setLoadingAssets(true); controller?.pause('bootstrap', true); setRendererVersion(value => value + 1); }}>{t('retry')}</button></MansionDialog>}

          <InstructionsModal isOpen={showRegularDialog && dialog === 'instructions'} onClose={close} title={t('instructionsTitle')} locale={locale} theme="storybook"
            instructions={(['care', 'rooms', 'listen', 'friends'] as const).map(id => ({ icon: { care: '💛', rooms: '🏡', listen: '🌷', friends: '♛' }[id], title: t(`instructions.${id}.title`), description: t(`instructions.${id}.description`) }))}
            controls={(['pointer', 'keyboard', 'tap', 'map'] as const).map(id => ({ icon: { pointer: '👆', keyboard: '⌨️', tap: '✋', map: '🗺️' }[id], description: t(`controls.${id}`) }))} tip={t('instructionsTip')} />
          <WinModal isOpen={showRegularDialog && dialog === 'celebration'} onPlayAgain={finishCelebration} onClose={finishCelebration} title={t('celebrationTitle')} description={t('celebrationDescription')} actionLabel={t('keepCaring')} onSound={playWin} keyboardShortcut={false} theme="storybook">
            <div className={styles.celebrationPortraits}>{PRINCESS_IDS.map(id => <Image src={artUrl(`characters/${id}-portrait.svg`)} width={40} height={40} key={id} alt={t(`princesses.${id}`)} />)}</div>
          </WinModal>
        </div>
      </GameWrapper>
    </MotionConfig>
  );
}
