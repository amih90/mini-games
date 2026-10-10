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
  ACTIVITIES, ACTIVITY_PICTURES, NEED_IDS, NEED_TEXTURES, PRINCESS_IDS, PRINCESSES, RECIPES, SHOP_IDS, SHOPS, STATIONS,
  artUrl, clamp, destinationForRoom, getStation, roomIndex, roomsForWorld, worldForRoom,
  type ActivityId, type Difficulty, type NeedId, type OutingId, type PrincessId, type RoomId, type ShopId,
} from './data';
import { portraitPath } from './catalog';
import { activeDestination, activityId, pendingInvitations, type Command } from './model';
import { type SceneBridge, type SceneControls } from './scene';
import { MansionWorld } from './MansionWorld';
import { MansionDialog } from './MansionDialog';
import { MansionInvitation } from './MansionInvitation';
import { CollectionPanel, PotionPanel, ShopPanel, TravelPanel } from './MansionPanels';
import { useMansionSession } from './useMansionSession';
import { useMansionSounds } from './useMansionSounds';
import styles from './mansion.module.css';

type Dialog = 'instructions' | 'album' | 'pause' | 'confirmNew' | 'setup' | 'celebration' | 'unlock' | 'travel' | 'shop' | 'wardrobe' | 'toybox' | 'bag' | null;
const ROOM_PICTURES: Record<RoomId, string> = {
  bedroom: ACTIVITY_PICTURES.bed, lounge: ACTIVITY_PICTURES.book, dining: ACTIVITY_PICTURES.meal,
  restroom: ACTIVITY_PICTURES.toilet, bathroom: ACTIVITY_PICTURES.bath, games: ACTIVITY_PICTURES.toys,
  ballroom: ACTIVITY_PICTURES.piano, yard: ACTIVITY_PICTURES.swing, playground: ACTIVITY_PICTURES.slide,
  basement: ACTIVITY_PICTURES.potion, boutique: 'items/rose-gala.svg', toyshop: 'items/plush-dragon.svg',
  icecream: ACTIVITY_PICTURES.icecream, beach: ACTIVITY_PICTURES.sandcastle, 'beach-shade': 'props/hammock.svg',
};
const NEED_PICTURES: Record<NeedId, string> = {
  satiety: ACTIVITY_PICTURES.meal, energy: ACTIVITY_PICTURES.bed, hygiene: ACTIVITY_PICTURES.bath,
  toiletComfort: ACTIVITY_PICTURES.toilet, fun: ACTIVITY_PICTURES.toys,
};
const WISH_ACTIVITIES: Record<NeedId, ActivityId> = { satiety: 'meal', energy: 'bed', hygiene: 'bath', toiletComfort: 'toilet', fun: 'toys' };
const DIFFICULTY_ICONS = { easy: '🦋', medium: '🌷', hard: '⭐' };

export default function PrincessMansionGame() {
  const t = useTranslations('princessMansion');
  const locale = useLocale();
  const session = useMansionSession();
  const { controller, initial, writer, error, startError, saveStatus, saveNow, transact } = session;
  const retro = useRetroSounds();
  const returnFocus = useRef<HTMLElement | null>(null);
  const playArea = useRef<HTMLElement | null>(null);
  const copy = useRef(t);
  const [requestedDialog, setDialog] = useState<Dialog>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [controls, setControls] = useState<SceneControls | null>(null);
  const [moving, setMoving] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [assetError, setAssetError] = useState(false);
  const [rendererVersion, setRendererVersion] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [shop, setShop] = useState<ShopId>('outfits');
  const welcomedFromNotice = useRef<string | null>(null);
  const celebratedAdventures = useRef(new Set<string>());
  const subscribe = useCallback((listener: () => void) => controller?.subscribe(listener) ?? (() => {}), [controller]);
  const getSnapshot = useCallback(() => controller?.state ?? null, [controller]);
  const state = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const invitations = state ? pendingInvitations(state) : [];
  const dialog = requestedDialog ?? (state && !state.tutorialSeen ? 'instructions'
    : invitations.length > 0 && !loadingAssets && controls && !assetError ? 'unlock'
      : state && state.princesses.length === PRINCESS_IDS.length && !state.collectionCelebrated ? 'celebration' : null);
  const selected = state?.princesses.find(princess => princess.id === state.selectedId);
  const room = state?.cameraRoom ?? 'dining';
  const currentActivity = selected ? activityId(selected) : null;
  const destination = state ? activeDestination(state) : 'home';
  const world = worldForRoom(room);
  const rooms = roomsForWorld(world);
  const activeShop = SHOP_IDS.find(id => SHOPS[id].room === room);
  const wishStation = (need: NeedId) => {
    const candidates = STATIONS.filter(station => ACTIVITIES[station.activity].need === need && destinationForRoom(station.room) === destination);
    const available = candidates.filter(station => (state?.princesses.filter(princess => princess.id !== selected?.id && princess.activity?.kind === 'active' && princess.activity.stationId === station.id).length ?? 0) < station.slots.length);
    const choices = available.length > 0 ? available : candidates;
    return choices.find(station => station.id === selected?.activity?.stationId)
      ?? choices.find(station => station.room === selected?.room)
      ?? choices.find(station => selected && station.activity === PRINCESSES[selected.id].favorite)
      ?? choices.find(station => station.activity === WISH_ACTIVITIES[need])
      ?? choices[0];
  };
  const mayInvite = state && PRINCESS_IDS.some(id => !state.princesses.some(princess => princess.id === id) && state.hearts >= PRINCESSES[id].invitation);
  const blocked = Boolean(error) && initial === null;
  const modalOpen = dialog !== null || initial !== null || blocked || assetError;
  const sounds = useMansionSounds(retro, {
    active: Boolean(state) && initial === null && !loadingAssets && !modalOpen,
    ambientEnabled: state?.ambientEnabled ?? true,
    destination,
  });
  const sound = useRef(sounds);
  useEffect(() => { sound.current = sounds; copy.current = t; }, [sounds, t]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    const button = playArea.current?.querySelector<HTMLButtonElement>(`[data-testid="room-${room}"]`);
    const map = button?.parentElement;
    if (!button || !map) return;
    const target = button.getBoundingClientRect();
    map.scrollTo({ left: map.scrollLeft + target.left - map.getBoundingClientRect().left - (map.clientWidth - target.width) / 2 });
  }, [room]);
  useEffect(() => {
    if (!controller) return;
    const removeEffects = controller.onEffect(effect => {
      const translate = copy.current;
      if (effect.type === 'error') {
        console.warn('Princess Mansion rejected an invalid action', effect.code);
        setFeedback(translate(`errors.${effect.code}`));
        return;
      }
      if (effect.type === 'unlocked') {
        if (document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement;
        controller.pause('dialog', true);
        return;
      }
      if (effect.type === 'purchased') {
        setFeedback(translate('feedback.purchased', { item: translate(`shopping.items.${effect.itemId}.name`) }));
        sound.current.playPurchase();
        return;
      }
      if (effect.type === 'traveled') {
        setFeedback(translate('feedback.traveled', { place: translate(`destinations.${effect.destination}`) }));
        sound.current.playWhoosh();
        return;
      }
      if (effect.type === 'ingredient') {
        const activity = controller.state.princesses.find(princess => princess.id === effect.princessId)?.activity;
        const lesson = activity?.kind === 'active' ? activity.potion : null;
        const ingredient = lesson ? RECIPES[lesson.recipe].ingredients[lesson.ingredients.length] : undefined;
        if (effect.correct) setFeedback(translate('lesson.good'));
        else if (ingredient) setFeedback(translate('lesson.wrong', { ingredient: translate(`lesson.ingredients.${ingredient}`) }));
        else { console.warn('Princess Mansion could not present its potion hint'); setFeedback(translate('errors.invalidAction')); }
        sound.current.playIngredient(effect.correct);
        return;
      }
      if ('princessId' in effect) setFeedback(translate(`feedback.${effect.type === 'completed' && !effect.rewarded ? 'played' : effect.type}`, {
        name: translate(`princesses.${effect.princessId}`),
        ...(effect.type === 'autonomous' ? { activity: translate(`activities.${getStation(effect.stationId)?.activity}`) } : {}),
      }));
      if (effect.type === 'completed') {
        sound.current.playCare(effect.activityId, true);
      } else if (effect.type === 'invited') {
        sound.current.playLevelUp();
      }
      else if (effect.type === 'refused' || effect.type === 'insisted') sound.current.playBeep();
      else if (effect.type === 'queued') sound.current.playQueue();
      else if (effect.type === 'placed' || effect.type === 'autonomous') {
        const placed = controller.state.princesses.find(princess => princess.id === (effect.type === 'autonomous' ? effect.princessId : controller.state.selectedId));
        const kind = placed ? activityId(placed) : null;
        if (kind) sound.current.playCare(kind);
        else sound.current.playDrop();
      } else if (effect.type === 'selected') sound.current.playClick();
      else if (effect.type === 'equipped') sound.current.playDrop();
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
  const visitShop = useCallback((id: ShopId) => {
    if (!controller || controller.disposed) return;
    controller.dispatch({ type: 'camera', room: SHOPS[id].room });
    if (controller.state.cameraRoom !== SHOPS[id].room) return;
    if (document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement;
    controller.pause('dialog', true);
    saveNow();
    sound.current.playClick();
    setShop(id);
    setDialog('shop');
  }, [controller, saveNow]);
  const bridge = useMemo<SceneBridge>(() => ({
    ready: setControls, loading: setLoadingAssets, moving: setMoving, error: reportAssetError, pause, decorative, shop: visitShop,
  }), [decorative, pause, reportAssetError, visitShop]);
  const announceInvitation = useCallback((key: string) => sound.current.playUnlock(key), []);
  const playWin = useCallback(() => {
    const key = controller?.state.adventureId;
    if (!key || celebratedAdventures.current.has(key)) return;
    celebratedAdventures.current.add(key);
    if (welcomedFromNotice.current !== key) sound.current.playWin();
  }, [controller]);

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
      if (!transact({ type: 'tutorial' })) return;
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
  const finishCelebration = () => { if (transact({ type: 'celebrated' })) close(); };
  const perform = (action: Command): boolean => {
    const previousActionId = controller?.state.nextActionId;
    if (!transact(action)) return false;
    if (action.type === 'ingredient') {
      const activity = controller?.state.princesses.find(princess => princess.id === action.id)?.activity;
      if (activity?.kind === 'active' && activity.potion?.stage === 'mixing' && playArea.current) {
        playArea.current.scrollTop = 0;
        playArea.current.querySelector('canvas')?.focus({ preventScroll: true });
      }
    }
    if (action.type === 'equip' || action.type === 'toy' || (action.type === 'serve' && controller?.state.nextActionId !== previousActionId) ||
      (action.type === 'invite' && controller?.state.princesses.length === PRINCESS_IDS.length)) setDialog(null);
    return true;
  };
  const depart = (place: OutingId, companions: PrincessId[]) => { if (transact({ type: 'travel', destination: place, companions })) setDialog(null); };
  const invitationDecision = (id: PrincessId, invite: boolean) => {
    const previous = welcomedFromNotice.current;
    if (invite) welcomedFromNotice.current = controller?.state.princesses.length === PRINCESS_IDS.length - 1 ? controller.state.adventureId : null;
    if (!transact(invite ? { type: 'invite', id } : { type: 'acknowledge', id })) { welcomedFromNotice.current = previous; return; }
    sound.current.playClick();
    setDialog(null);
  };
  const navigate = (next: RoomId) => { controls?.navigate(next); sound.current.playWhoosh(); };
  const fulfilWish = (need: NeedId) => {
    if (!selected || !controls || !controller) return;
    const station = wishStation(need);
    if (!station && need === 'satiety') { if (destination === 'mall' && state && !Object.values(state.inventory.treats).some(quantity => quantity > 0)) visitShop('treats'); else open('bag'); return; }
    if (!station) { setFeedback(t('errors.returnFirst')); return; }
    controls.cancelMove();
    if (selected.activity?.stationId === station.id) controller.dispatch({ type: 'select', id: selected.id });
    else controller.dispatch({ type: 'place', id: selected.id, room: station.room, x: station.x, y: 480, stationId: station.id });
    saveNow();
  };
  const changeRoom = (delta: number) => {
    navigate(rooms[clamp(roomIndex(room) + delta, 0, rooms.length - 1)]);
  };
  const activityStatus = selected?.activity?.kind === 'waiting' ? t('waiting') : selected?.activity?.kind === 'active' && currentActivity
    ? t('activityProgress', { activity: t(`activities.${currentActivity}`), percent: Math.round(selected.activity.elapsed / selected.activity.duration * 100) })
    : selected?.autonomy.walk ? t('exploring') : selected ? t('favorite', { activity: t(`activities.${PRINCESSES[selected.id].favorite}`) }) : '';
  const setupOpen = dialog === 'setup' || (initial === 'setup' && dialog === null);
  const showRegularDialog = !blocked && !assetError && !setupOpen;
  const dialogProps = { closeLabel: t('close'), returnFocus };

  return (
    <MotionConfig reducedMotion="user">
      <GameWrapper title={t('title')} fullHeight theme="storybook" sound={sounds} onInstructionsClick={() => open('instructions', false)} className={styles.shell}>
        <div className={styles.game} dir={locale === 'he' ? 'rtl' : 'ltr'}>
          <section ref={playArea} className={styles.playArea} onScroll={() => controls?.refreshBounds()} aria-hidden={modalOpen} inert={modalOpen} data-testid="mansion-game" data-adventure-id={state?.adventureId} data-active-time={state?.activeTime} data-room={room} data-world={world} data-destination={destination} data-coins={state?.coins} data-ready={Boolean(controls) && !loadingAssets && !assetError} data-moving={moving}>
            <div className={styles.toolbar}>
              <div className={styles.hearts} role="status" aria-label={t('careHearts')}><Image src={artUrl('icons/heart.svg')} width={40} height={40} alt="" /><strong>{state?.hearts ?? 0}</strong></div>
              <div className={styles.wallet} data-testid="mansion-wallet" aria-label={t('wallet', { count: state?.coins ?? 0 })}><Image src={artUrl('icons/coin.svg')} width={40} height={40} alt="" /><strong>{state?.coins ?? 0}</strong></div>
              <div className={styles.toolbarActions}>
                <span className={styles.screenReaderOnly} role="status">{t(saveStatus)}</span>
                <button type="button" className={styles.pictureButton} onClick={() => open('pause')} disabled={!controller} aria-label={t('pause')} title={t('pause')}><Image src={artUrl('icons/pause.svg')} width={56} height={56} alt="" /></button>
              </div>
            </div>

            <div className={styles.adventureBar}>
              <div className={styles.adventureActions}>
                {destination === 'home' ? <>
                  <div className={styles.floorChoices} role="group" aria-label={t('floors')}>
                    <button type="button" className={`${styles.pictureButton} ${world === 'mansion' ? styles.currentFloor : ''}`} data-testid="floor-mansion" aria-pressed={world === 'mansion'} aria-label={t('mainFloor')} title={t('mainFloor')} disabled={!controls || loadingAssets} onClick={() => navigate(world === 'mansion' ? room : 'dining')}><Image src={artUrl('icons/home.svg')} width={56} height={56} alt="" /></button>
                    <button type="button" className={`${styles.pictureButton} ${world === 'basement' ? styles.currentFloor : ''}`} data-testid="floor-basement" aria-pressed={world === 'basement'} aria-label={t('basementFloor')} title={t('basementFloor')} disabled={!controls || loadingAssets} onClick={() => navigate('basement')}><Image src={artUrl(ACTIVITY_PICTURES.potion)} width={56} height={56} alt="" /></button>
                  </div>
                  <button type="button" className={styles.pictureButton} aria-label={t('travel')} title={t('travel')} disabled={!controls || loadingAssets} onClick={() => open('travel')}><Image src={artUrl('icons/travel.svg')} width={56} height={56} alt="" /></button>
                </> : <button type="button" className={styles.pictureButton} aria-label={t('returnHome')} title={t('returnHome')} disabled={!controls || loadingAssets} onClick={() => transact({ type: 'return' })}><Image src={artUrl('icons/home.svg')} width={56} height={56} alt="" /></button>}
              </div>
              {state?.trip && <span className={styles.screenReaderOnly}>{t('trip.status', { count: state.trip.companions.length, home: state.princesses.length - state.trip.companions.length })}</span>}
            </div>

            <div className={styles.world} data-testid="mansion-world" dir="ltr">
              {controller ? <MansionWorld key={`${controller.state.adventureId}:${rendererVersion}`} controller={controller} bridge={bridge} label={t('worldLabel')} /> : <div className={styles.cover} style={{ backgroundImage: `url("${artUrl('rooms/dining.svg')}")` }} />}
              <div className={styles.roomHeading} dir={locale === 'he' ? 'rtl' : 'ltr'}><h2>{t(`rooms.${room}`)}</h2><p>{t(`roomDescriptions.${room}`)}</p></div>
              {loadingAssets && controller && !assetError && <div className={styles.assetLoading} role="status">{t('loadingAssets')}</div>}
              {moving && <div className={styles.moveHint} dir={locale === 'he' ? 'rtl' : 'ltr'}><Image src={artUrl('icons/grab.svg')} width={36} height={36} alt="" /><span>{t('moveHint')}</span><button type="button" className={styles.pictureButton} aria-label={t('cancel')} onClick={() => { controls?.cancelMove(); sound.current.playDrop(); }}><Image src={artUrl('icons/stop.svg')} width={48} height={48} alt="" /></button></div>}
              {rooms.length > 1 && <>
                <button type="button" className={`${styles.cameraArrow} ${styles.previous}`} onClick={() => changeRoom(-1)} disabled={!controller || roomIndex(room) === 0 || loadingAssets} aria-label={t('previousRoom')}>‹</button>
                <button type="button" className={`${styles.cameraArrow} ${styles.next}`} onClick={() => changeRoom(1)} disabled={!controller || roomIndex(room) === rooms.length - 1 || loadingAssets} aria-label={t('nextRoom')}>›</button>
              </>}
              <div className={styles.princessStrip} aria-label={t('choosePrincess')} dir={locale === 'he' ? 'rtl' : 'ltr'}>
                {state?.princesses.map(princess => {
                  const here = destinationForRoom(princess.room) === destination;
                  const need = NEED_IDS.reduce((lowest, id) => princess.needs[id] < princess.needs[lowest] ? id : lowest, NEED_IDS[0]);
                  return <button type="button" key={princess.id} className={`${styles.portraitButton} ${selected?.id === princess.id ? styles.selectedPortrait : ''} ${!here ? styles.homePortrait : ''}`} aria-pressed={selected?.id === princess.id} aria-label={t(`princesses.${princess.id}`)} aria-describedby={!here ? `resting-${princess.id}` : undefined} onClick={() => controller?.dispatch({ type: 'select', id: princess.id })} disabled={loadingAssets || !here}>
                    <Image src={artUrl(portraitPath(princess.id, princess.outfit))} width={64} height={64} alt="" draggable={false} /><span>{t(`princesses.${princess.id}`)}</span>
                    {!here && <span className={styles.restingBadge}><span aria-hidden="true">zZ</span><span id={`resting-${princess.id}`} className={styles.screenReaderOnly}>{t('trip.resting')}</span></span>}
                    {here && princess.needs[need] < 30 && <Image className={styles.needDot} src={artUrl(`icons/${NEED_TEXTURES[need]}.svg`)} width={28} height={28} alt={t('needsCare')} />}
                  </button>;
                })}
                <button type="button" className={`${styles.albumButton} ${mayInvite ? styles.inviteReady : ''}`} aria-label={t('album')} title={mayInvite ? t('inviteReady') : t('album')} onClick={() => open('album')} disabled={!controller}><Image src={artUrl('icons/album.svg')} width={56} height={56} alt="" /><span className={styles.collectionCount} aria-label={t('princessCount', { count: state?.princesses.length ?? 1, total: PRINCESS_IDS.length })}>{mayInvite ? '+' : state?.princesses.length ?? 1}</span></button>
              </div>
              {selected && <div className={styles.careActions} dir={locale === 'he' ? 'rtl' : 'ltr'}>
                <button type="button" className={`${styles.pictureButton} ${moving ? styles.activeMove : ''}`} onClick={() => { if (moving) sound.current.playDrop(); controls?.movePrincess(); }} disabled={!controls || loadingAssets} aria-pressed={moving} aria-label={moving ? t('stopMoving') : t('move')} title={moving ? t('stopMoving') : t('move')}><Image src={artUrl(`icons/${moving ? 'stop' : 'grab'}.svg`)} width={56} height={56} alt="" /></button>
                <button type="button" className={styles.pictureButton} onClick={() => { controller?.dispatch({ type: 'cancel', id: selected.id }); saveNow(); sound.current.playDrop(); }} disabled={loadingAssets || !selected.activity} aria-label={t('cancelActivity')} title={t('cancelActivity')}><Image src={artUrl('icons/stop.svg')} width={56} height={56} alt="" /></button>
              </div>}
              {state && room === 'basement' && <PotionPanel key={`${selected?.id}:${selected?.activity?.kind === 'active' ? selected.activity.actionId : 'waiting'}`} state={state} onCommand={perform} />}
              <div className={styles.footerNote} dir={locale === 'he' ? 'rtl' : 'ltr'}>
                <span className={feedback ? styles.feedback : styles.screenReaderOnly} role="status" aria-live="polite">{feedback || t('gentleHint')}</span>
                {writer === 'single' && <span className={styles.singleTab} role="status">{t('singleTab')}</span>}
                {sounds.problem && <span className={styles.audioProblem} role="status">{t('audioProblem')} <button type="button" onClick={sounds.retry}>{t('retryAudio')}</button></span>}
              </div>
            </div>

            {selected && <section className={styles.carePanel} aria-label={t('carePanel', { name: t(`princesses.${selected.id}`) })}>
              <div className={styles.princessSummary}>
                <Image src={artUrl(portraitPath(selected.id, selected.outfit))} width={56} height={56} alt={t(`princesses.${selected.id}`)} />
                <span className={styles.happiness}><Image src={artUrl('icons/heart.svg')} width={20} height={20} alt="" />{Math.round(selected.happiness)}%</span>
                <p className={styles.screenReaderOnly}>{activityStatus}</p>
              </div>
              <div className={styles.needs}>
                {NEED_IDS.map(need => <div key={need} className={styles.need} data-low={selected.needs[need] < 30}>
                  <button type="button" className={styles.wishButton} data-testid={`wish-${need}`} aria-label={t('careWish', { need: t(`needs.${need}`) })} title={t('careWish', { need: t(`needs.${need}`) })} disabled={!controls || loadingAssets || (!wishStation(need) && need !== 'satiety')} onClick={() => fulfilWish(need)}>
                    <Image src={artUrl(NEED_PICTURES[need])} width={56} height={56} alt="" />
                    <span className={styles.wishMarker} aria-hidden="true">{selected.needs[need] < 30 ? '!' : selected.needs[need] >= 90 ? '✓' : ''}</span>
                  </button>
                  <div className={styles.needTrack} role="progressbar" aria-label={t(`needs.${need}`)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(selected.needs[need])}><div className={`${styles.needFill} ${selected.needs[need] < 30 ? styles.lowNeed : ''}`} style={{ width: `${selected.needs[need]}%` }} /></div>
                </div>)}
              </div>
            </section>}
            <div className={styles.placeDock}>
              <nav className={styles.roomMap} data-single={rooms.length === 1} aria-label={t('roomNavigation')} dir="ltr">
                {rooms.map(id => <button type="button" key={id} data-testid={`room-${id}`} className={`${styles.roomButton} ${room === id ? styles.currentRoom : ''}`} aria-current={room === id ? 'location' : undefined} aria-label={t(`rooms.${id}`)} title={t(`rooms.${id}`)} onClick={() => navigate(id)} disabled={!controls || loadingAssets}>
                  <span className={styles.roomPicture}><Image src={artUrl(`rooms/${id}.svg`)} width={116} height={52} alt="" /><Image src={artUrl(ROOM_PICTURES[id])} width={60} height={60} alt="" /></span><bdi>{t(`rooms.${id}`)}</bdi>
                </button>)}
              </nav>
              <div className={styles.attractions} aria-label={t('attractions')}>
                {activeShop && <button type="button" className={`${styles.attractionButton} ${styles.shopButton}`} aria-label={t('shopping.shopAt', { name: t(`shopping.${activeShop}Title`) })} title={t(`shopping.${activeShop}Title`)} data-testid={`shop-${activeShop}`} disabled={!selected || !controls || loadingAssets} onClick={() => visitShop(activeShop)}><Image src={artUrl(ROOM_PICTURES[room])} width={60} height={60} alt="" /><Image className={styles.shopBadge} src={artUrl('icons/cart.svg')} width={24} height={24} alt="" /></button>}
                {STATIONS.filter(item => item.room === room).map(item => {
                  const occupants = state?.princesses.filter(princess => princess.activity?.kind === 'active' && princess.activity.stationId === item.id) ?? [];
                  return <button type="button" className={styles.attractionButton} key={item.id} data-testid={`station-${item.id}`} title={t(`activities.${item.activity}`)} onClick={() => controls?.placeAtStation(item.id)} disabled={!selected || !controls || loadingAssets} aria-label={t('placeAt', { activity: t(`activities.${item.activity}`), count: occupants.length, capacity: item.slots.length })}>
                    <Image src={artUrl(item.appearance === 'hammock' ? 'props/hammock.svg' : ACTIVITY_PICTURES[item.activity])} width={60} height={60} alt="" />
                    <span className={styles.occupancy} aria-hidden="true">{item.slots.map((_, index) => <span key={index} data-occupied={index < occupants.length}>{index < occupants.length ? '●' : '○'}</span>)}</span>
                  </button>;
                })}
              </div>
              <div className={styles.inventoryActions}>
                <button type="button" className={styles.pictureButton} disabled={loadingAssets || !selected} aria-label={t('shopping.wardrobeTitle')} title={t('shopping.wardrobeTitle')} onClick={() => open('wardrobe')}><Image src={artUrl('icons/wardrobe.svg')} width={56} height={56} alt="" /></button>
                <button type="button" className={styles.pictureButton} disabled={loadingAssets || !selected} aria-label={t('shopping.toyboxTitle')} title={t('shopping.toyboxTitle')} onClick={() => open('toybox')}><Image src={artUrl('items/plush-dragon.svg')} width={56} height={56} alt="" /></button>
                <button type="button" className={styles.pictureButton} disabled={loadingAssets || !selected} aria-label={t('shopping.bagTitle')} title={t('shopping.bagTitle')} onClick={() => open('bag')}><Image src={artUrl('icons/bag.svg')} width={56} height={56} alt="" /></button>
              </div>
            </div>
          </section>

          {initial === 'loading' && <div className={styles.initialLoading} role="status">{t('loadingAssets')}</div>}
          {showRegularDialog && dialog === 'album' && state && <MansionDialog title={t('album')} onClose={close} {...dialogProps}>
            <p className={styles.dialogDescription}>{t('albumDescription')}</p>
            <div className={styles.albumGrid}>{PRINCESS_IDS.map(id => {
              const princess = state.princesses.find(princess => princess.id === id);
              const joined = Boolean(princess);
              const available = state.hearts >= PRINCESSES[id].invitation;
              return <article className={`${styles.albumCard} ${!joined && !available ? styles.lockedCard : ''}`} style={{ borderTopColor: PRINCESSES[id].color }} key={id}>
                <span className={styles.albumCrown} aria-hidden="true">{joined ? '♛' : available ? '✦' : '♡'}</span>
                <Image src={artUrl(portraitPath(id, princess?.outfit))} width={112} height={112} alt="" draggable={false} />
                <h3>{t(`princesses.${id}`)}</h3><p>{t(`traits.${id}`)}</p>
                <small>{t('favorite', { activity: t(`activities.${PRINCESSES[id].favorite}`) })}</small>
                <button type="button" className={styles.button} disabled={joined || !available || loadingAssets} onClick={() => perform({ type: 'invite', id })}><Image src={artUrl(`icons/${joined ? 'check' : 'heart'}.svg`)} width={48} height={48} alt="" /><span>{joined ? t('joined') : available ? t('invite') : t('inviteAt', { count: PRINCESSES[id].invitation })}</span></button>
              </article>;
            })}</div>
          </MansionDialog>}

          {showRegularDialog && dialog === 'travel' && state && <MansionDialog title={t('trip.title')} onClose={close} {...dialogProps}><TravelPanel state={state} onDepart={depart} /></MansionDialog>}
          {showRegularDialog && dialog === 'shop' && state && <MansionDialog title={t(`shopping.${shop}Title`)} onClose={close} {...dialogProps}><ShopPanel key={shop} shop={shop} state={state} feedback={feedback} onCommand={perform} /></MansionDialog>}
          {showRegularDialog && (dialog === 'wardrobe' || dialog === 'toybox' || dialog === 'bag') && state && <MansionDialog title={t(`shopping.${dialog}Title`)} onClose={close} {...dialogProps}><CollectionPanel kind={dialog} state={state} feedback={feedback} onCommand={perform} onChoose={next => setDialog(next)} /></MansionDialog>}
          {showRegularDialog && dialog === 'unlock' && state && invitations[0] && <MansionInvitation key={`${state.adventureId}:${invitations[0]}`} id={invitations[0]} adventureId={state.adventureId} pendingCount={invitations.length} away={destination !== 'home'} returnFocus={returnFocus} onAnnounce={announceInvitation} onInvite={() => invitationDecision(invitations[0], true)} onLater={() => invitationDecision(invitations[0], false)} />}

          {showRegularDialog && dialog === 'pause' && <MansionDialog title={t('pauseTitle')} onClose={close} {...dialogProps}>
            <p className={styles.dialogDescription}>{t('pauseDescription')}</p>
            {state && <fieldset className={styles.preferences}><legend>{t('preferencesTitle')}</legend>
              <label className={styles.setting}><span className={styles.settingIcon} aria-hidden="true">♫</span><span><strong>{t('ambientTitle')}</strong><small>{t('ambientDescription')}</small></span><input type="checkbox" aria-label={t('ambientTitle')} checked={state.ambientEnabled} onChange={event => { transact({ type: 'ambient', enabled: event.target.checked }); sound.current.playClick(); }} /></label>
              <label className={styles.setting}><span className={styles.settingIcon} aria-hidden="true">♛</span><span><strong>{t('autonomyTitle')}</strong><small id="mansion-autonomy-description">{t(state.trip ? 'autonomyAwayDescription' : 'autonomyDescription')}</small></span><input type="checkbox" aria-label={t('autonomyTitle')} aria-describedby="mansion-autonomy-description" disabled={Boolean(state.trip)} checked={state.autonomyEnabled} onChange={event => { transact({ type: 'autonomy', enabled: event.target.checked }); sound.current.playClick(); }} /></label>
            </fieldset>}
            <p className={styles.saveNote}>{t('saveLocal')} {t('noOffline')}</p>
            <div className={styles.dialogActions}><button type="button" className={`${styles.button} ${styles.primaryButton}`} onClick={close}><Image src={artUrl('icons/play.svg')} width={56} height={56} alt="" /><span>{t('resume')}</span></button><button type="button" className={styles.button} onClick={requestNew}><Image src={artUrl('icons/home.svg')} width={48} height={48} alt="" /><span>{t('newGame')}</span></button></div>
          </MansionDialog>}
          {showRegularDialog && dialog === 'confirmNew' && <MansionDialog title={t('confirmTitle')} onClose={close} {...dialogProps}>
            <p className={styles.dialogDescription}>{t('confirmMessage')}</p>
            <div className={styles.dialogActions}><button type="button" className={styles.button} data-autofocus onClick={close}><Image src={artUrl('icons/stop.svg')} width={48} height={48} alt="" /><span>{t('cancel')}</span></button><button type="button" className={`${styles.button} ${styles.dangerButton}`} onClick={() => { sound.current.playClick(); setDialog('setup'); }}><Image src={artUrl('icons/home.svg')} width={48} height={48} alt="" /><span>{t('newConfirm')}</span></button></div>
          </MansionDialog>}
          {setupOpen && <MansionDialog title={t('startTitle')} onClose={controller || initial !== 'setup' ? close : undefined} {...dialogProps}>
            <p className={styles.dialogDescription}>{t('startDescription')}</p>
            <div className={styles.welcomeCourt} aria-hidden="true"><span>✦</span><Image src={artUrl('characters/flora-portrait.svg')} width={82} height={82} alt="" /><Image className={styles.welcomePortrait} src={artUrl('characters/liora-portrait.svg')} width={138} height={138} alt="" /><Image src={artUrl('characters/celeste-portrait.svg')} width={82} height={82} alt="" /><span>✦</span></div>
            <fieldset className={styles.difficultyChoices}><legend>{t('chooseDifficulty')}</legend>{(['easy', 'medium', 'hard'] as const).map(value => <button type="button" key={value} data-level={value} className={`${styles.difficultyChoice} ${difficulty === value ? styles.chosenDifficulty : ''}`} aria-pressed={difficulty === value} onClick={() => { setDifficulty(value); sound.current.playClick(); }}><span className={styles.difficultyIcon} aria-hidden="true">{DIFFICULTY_ICONS[value]}</span><strong>{t(value)}</strong><span>{t(`${value}Description`)}</span></button>)}</fieldset>
            {startError && <p role="alert" className={styles.errorMessage}>{t(`errors.${startError}`)}</p>}
            <p className={styles.saveNote}>{t('saveLocal')} {t('noOffline')}</p>
            <div className={styles.dialogActions}>{controller && <button type="button" className={styles.button} onClick={close}>{t('cancel')}</button>}<button type="button" className={`${styles.button} ${styles.primaryButton}`} onClick={start}><Image src={artUrl('icons/play.svg')} width={56} height={56} alt="" /><span>{t('start')}</span></button></div>
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
            instructions={(['care', 'rooms', 'listen', 'friends'] as const).map(id => ({ icon: <Image src={artUrl(`icons/${{ care: 'grab', rooms: 'home', listen: 'heart', friends: 'album' }[id]}.svg`)} width={64} height={64} alt="" />, title: t(`instructions.${id}.title`), description: t(`instructions.${id}.description`) }))}
            controls={(['pointer', 'keyboard', 'tap', 'map'] as const).map(id => ({ icon: { pointer: '👆', keyboard: '⌨️', tap: '✋', map: '🗺️' }[id], description: t(`controls.${id}`) }))} tip={t('instructionsTip')} />
          <WinModal isOpen={showRegularDialog && dialog === 'celebration'} onPlayAgain={finishCelebration} onClose={finishCelebration} title={t('celebrationTitle')} description={t('celebrationDescription')} actionLabel={t('keepCaring')} onSound={playWin} keyboardShortcut={false} theme="storybook">
            <div className={styles.celebrationPortraits}>{PRINCESS_IDS.map(id => <Image src={artUrl(portraitPath(id, state?.princesses.find(princess => princess.id === id)?.outfit))} width={40} height={40} key={id} alt={t(`princesses.${id}`)} />)}</div>
          </WinModal>
        </div>
      </GameWrapper>
    </MotionConfig>
  );
}
