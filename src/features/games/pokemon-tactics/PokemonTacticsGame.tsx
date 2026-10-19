'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Arena, { type ArenaCell, type ArenaEffect, type ArenaTheme, type ArenaUnit } from './Arena';
import { createCampaign, distance, generateEnemies, getActiveUnit, getAIAction, getDamagePreview, getReachableCells, getUnitMoves, parseGameState, transition } from './engine';
import { evolutions, MAX_ROSTER, MAX_STAGE, MAX_TEAM, speciesCatalog, speciesIds, trainingCost, victoryReward } from './data';
import type { Difficulty, GameAction, GameState, Move, SpeciesId, Unit } from './types';
import { getText, moveName, pokemonName, type TextKey } from './localization';
import { GameWrapper } from '../shared/GameWrapper';
import { InstructionsModal } from '../shared/InstructionsModal';
import { useDialogFocus } from '../shared/useDialogFocus';
import { useTacticsAudio } from './useTacticsAudio';
import { ActionIcon, type ActionSymbol } from './ActionIcon';
import { ResourceBars } from './ResourceBars';
import './tactics.css';

const SAVE_KEY = 'mini-games:pokemon-tactics:v1';
const ART = '/games/pokemon-tactics';
const SHOP_PAGE_SIZE = 6;
const spellArt: Record<string, string> = {
  scratch: 'enchant-red-1', tackle: 'enchant-orange-1', quickAttack: 'haste-fire-1', lick: 'evil-eye-eerie-1',
  ember: 'fireball-red-1', flamethrower: 'beam-red-3', waterGun: 'beam-sky-1', icyWind: 'ice-blue-3',
  vineWhip: 'beam-jade-1', synthesis: 'heal-jade-3', thunderShock: 'lighting-sky-1', thunderbolt: 'lighting-sky-3',
  rockThrow: 'protect-orange-1', rockTomb: 'protect-orange-3', shadowBall: 'fireball-eerie-3', willOWisp: 'fireball-eerie-1',
};
const elementColors = { normal: '#efe5ce', fire: '#ffad52', water: '#70c5ff', grass: '#a0da73', electric: '#fff09a', rock: '#d6b68b', ghost: '#caa0ff', ice: '#bcf4ff' };
function loadCampaign(): { state: GameState; error: TextKey | null; showInstructions: boolean } {
  if (typeof window === 'undefined') return { state: createCampaign('easy'), error: null, showInstructions: true };
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return { state: createCampaign('easy'), error: null, showInstructions: true };
    const result = parseGameState(saved);
    if (result.state) return { state: result.state, error: null, showInstructions: false };
    console.warn('Pokémon tactics save rejected', result.error);
    return { state: createCampaign('easy'), error: 'invalidSave', showInstructions: false };
  } catch (error) {
    console.warn('Pokémon tactics storage could not be read', error);
    return { state: createCampaign('easy'), error: 'saveError', showInstructions: false };
  }
}
function Portrait({ species, name, label }: { species: SpeciesId; name: string; label: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="pt-art-error" role="alert">{label}: {name}</span> : <Image src={`${ART}/pokemon/${species}.png`} alt={name} width={475} height={475} unoptimized onError={() => { console.error(`Pokémon artwork unavailable: ${species}`); setFailed(true); }} />;
}
function ConfirmDialog({ message, confirm, cancel, labels, children }: { message: string; confirm: () => void; cancel: () => void; labels: { confirm: string; cancel: string }; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(true, ref, cancel);
  return <div className="pt-dialog-backdrop"><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="pt-confirm-message" className="pt-dialog pt-panel">
    <p id="pt-confirm-message">{message}</p>{children}<div><button className="pt-primary" onClick={confirm}>{labels.confirm}</button><button onClick={cancel}>{labels.cancel}</button></div>
  </div></div>;
}
function GameDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(true, ref, onClose);
  return <div className="pt-dialog-backdrop"><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="pt-dialog pt-panel"><h2>{title}</h2>{children}</div></div>;
}
function IconButton({ label, icon, onClick, disabled = false, className = '' }: { label: string; icon: ActionSymbol; onClick: () => void; disabled?: boolean; className?: string }) {
  return <button className={`pt-icon-button ${className}`} aria-label={label} title={label} disabled={disabled} onClick={onClick}><ActionIcon kind={icon} /></button>;
}

export default function PokemonTacticsGame() {
  const locale = useLocale(), text = getText(locale);
  const [initial] = useState(loadCampaign);
  const [state, setState] = useState(initial.state);
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>(initial.state.difficulty);
  const stateRef = useRef(state);
  const [storageError, setStorageError] = useState<TextKey | null>(initial.error);
  const [showStorageWarning, setShowStorageWarning] = useState(!!initial.error);
  const saveBlocked = useRef(initial.error === 'invalidSave');
  const [error, setError] = useState<TextKey | null>(null);
  const [theme, setTheme] = useState<ArenaTheme>('classic');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shopPage, setShopPage] = useState(0);
  const [moveId, setMoveId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<ArenaCell>({ col: 1, row: 3 });
  const [grid, setGrid] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [fast, setFast] = useState(false);
  const [autoFight, setAutoFight] = useState(false);
  const [paused, setPaused] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [guide, setGuide] = useState(initial.showInstructions);
  const [settings, setSettings] = useState(false);
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<'reset' | 'retry' | null>(null);
  const [effect, setEffect] = useState<ArenaEffect>();
  const pendingImpact = useRef<GameState | null>(null);
  const flightElapsed = useRef(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [log, setLog] = useState<{ species: SpeciesId; move?: string; action: TextKey }[]>([]);
  const sound = useTacticsAudio(paused || instructions || guide || settings || evolutionOpen || !!confirmation || state.phase === 'victory' || state.phase === 'defeat' || state.phase === 'complete');
  const { playShoot, playMove, playCapture, playPowerUp, playClick, playWin, playGameOver } = sound;
  const active = getActiveUnit(state);
  const camp = state.phase === 'camp' || state.phase === 'deployment';
  const selected = (camp ? state.roster : state.battleUnits).find(u => u.id === selectedId) ?? active;
  const evolution = selected && evolutions[selected.species];
  const actor = active?.owner === 'player' ? active : undefined;
  const moves = actor ? getUnitMoves(actor) : [];
  const selectedMove = moves.find(move => move.id === moveId) ?? moves[1];
  const target = state.battleUnits.find(u => u.id === targetId);
  const scenePaused = paused || instructions || guide || settings || evolutionOpen || !!confirmation;
  const interactionPaused = scenePaused || !!effect || lockedUntil > 0;
  const canAct = state.phase === 'battle' && !!actor && !interactionPaused && !autoFight;
  const reachable = canAct && actor ? getReachableCells(state, actor.id).map(c => ({ col: c.x, row: c.y })) : [];
  const canMove = canAct && reachable.some(c => c.col === cursor.col && c.row === cursor.row);
  const attackCells = canAct && actor?.position && selectedMove ? Array.from({ length: 96 }, (_, i) => ({ col: i % 12, row: Math.floor(i / 12) })).filter(c => distance(actor.position!, { x: c.col, y: c.row }) <= selectedMove.range) : [];
  const validTargets = canAct && actor?.position && selectedMove ? state.battleUnits.filter(u => u.hp > 0 && u.position && distance(actor.position!, u.position) <= selectedMove.range && (selectedMove.kind === 'heal' ? u.owner === 'player' && u.hp < u.maxHp : u.owner === 'enemy')).map(u => u.id) : [];
  const canUse = !!(canAct && selectedMove && target?.hp && actor?.position && target.position &&
    (selectedMove.kind === 'heal' ? actor.owner === target.owner && target.hp < target.maxHp : actor.owner !== target.owner) &&
    distance(actor.position, target.position) <= selectedMove.range && actor.energy >= selectedMove.energy && !(actor.cooldowns[selectedMove.id] > 0));
  const outcome = state.phase === 'victory' || state.phase === 'defeat' || state.phase === 'complete' ? state.phase : null;
  const displayedError = error ?? (showStorageWarning ? storageError : null);
  const name = (species: SpeciesId) => pokemonName(species, locale);

  const commit = useCallback((next: GameState) => {
    if (next.phase !== 'battle') setAutoFight(false);
    if (next.phase === 'victory' || next.phase === 'complete') playWin();
    if (next.phase === 'defeat') playGameOver();
    if (next.activeId !== stateRef.current.activeId) { setMoveId(null); setTargetId(null); }
    stateRef.current = next;
    setState(next);
    if (!saveBlocked.current) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); setStorageError(null); }
      catch (cause) { console.warn('Pokémon tactics progress could not be saved', cause); setStorageError('saveError'); setShowStorageWarning(true); }
    }
  }, [playWin, playGameOver]);
  const execute = useCallback((action: GameAction) => {
    if (pendingImpact.current && action.type !== 'reset') return false;
    const before = stateRef.current;
    const result = transition(before, action);
    if (result.error) {
      const code: TextKey = result.error === 'insufficientGold' ? 'insufficientGold' : result.error === 'rosterFull' ? 'rosterFull' : 'invalidAction';
      console.warn('Pokémon tactics action rejected', result.error, action.type);
      setError(code);
      return false;
    }
    setError(null);
    if (action.type === 'reset') { pendingImpact.current = null; saveBlocked.current = false; setStorageError(null); setSelectedId(null); setTargetId(null); setMoveId(null); setLog([]); setEffect(undefined); setLockedUntil(0); }
    const acting = getActiveUnit(before);
    if (action.type === 'useMove' && acting?.position) {
      const victim = before.battleUnits.find(u => u.id === action.targetId);
      const move = getUnitMoves(acting).find(m => m.id === action.moveId);
      if (victim?.position && move) {
        setLog(history => [{ species: acting.species, move: move.name, action: 'use' as const }, ...history].slice(0, 15));
        if (move.kind === 'heal') playPowerUp();
        else playShoot();
        if (!reducedMotion) {
          pendingImpact.current = result.state;
          flightElapsed.current = 0;
          setEffect({ id: Date.now(), from: { col: acting.position.x, row: acting.position.y }, to: { col: victim.position.x, row: victim.position.y }, color: elementColors[move.element], progress: 0, duration: fast ? 120 : 450 });
          return true;
        }
      }
    } else if (action.type === 'move') { playMove(); }
    else if (action.type === 'buyCreature') { setSelectedId(result.state.roster[result.state.roster.length - 1].id); playCapture(); }
    else if (action.type === 'train' || action.type === 'evolve' || action.type === 'rest' || action.type === 'usePotion') playPowerUp();
    else playClick();
    if (['useMove', 'move', 'defend', 'usePotion', 'wait'].includes(action.type)) setLockedUntil(Date.now() + (reducedMotion || fast ? 150 : 750));
    commit(result.state);
    return true;
  }, [fast, reducedMotion, playShoot, playMove, playCapture, playPowerUp, playClick, commit]);
  const flightId = effect?.id, flightDuration = effect?.duration;
  useEffect(() => {
    if (flightId === undefined || flightDuration === undefined || scenePaused) return;
    let previous = performance.now(), frame: number;
    const tick = (now: number) => {
      flightElapsed.current += now - previous;
      previous = now;
      const progress = Math.min(1, flightElapsed.current / flightDuration);
      if (progress < 1) {
        setEffect(current => current ? { ...current, progress } : current);
        frame = requestAnimationFrame(tick);
      } else {
        const next = pendingImpact.current;
        pendingImpact.current = null;
        setEffect(undefined);
        if (next) {
          commit(next);
          setLockedUntil(Date.now() + (fast ? 150 : 650));
        }
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [flightId, flightDuration, scenePaused, fast, commit]);
  useEffect(() => {
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.repeat || instructions || guide || settings || evolutionOpen || confirmation || outcome) return;
      event.preventDefault();
      playClick();
      setPaused(value => !value);
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [instructions, guide, settings, evolutionOpen, confirmation, outcome, playClick]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const timer = setTimeout(() => setLockedUntil(0), Math.max(0, lockedUntil - Date.now()));
    return () => clearTimeout(timer);
  }, [lockedUntil]);
  useEffect(() => {
    if (state.phase !== 'battle' || !active || (active.owner === 'player' && !autoFight) || effect || paused || instructions || guide || settings || evolutionOpen || confirmation || Date.now() < lockedUntil) return;
    const timer = setTimeout(() => {
      const current = stateRef.current;
      const owner = getActiveUnit(current)?.owner;
      const action = owner ? getAIAction(current, owner) : null;
      if (action) {
        if (owner === 'player') {
          setSelectedId(current.activeId);
          if (action.type === 'useMove') { setMoveId(action.moveId); setTargetId(action.targetId); }
        }
        if (!execute(action)) { setAutoFight(false); setPaused(true); }
      } else { console.error('Automatic turn has no legal action', current.activeId); setError('invalidAction'); setAutoFight(false); setPaused(true); }
    }, fast || reducedMotion ? 160 : 700);
    return () => clearTimeout(timer);
  }, [state, active, autoFight, effect, paused, instructions, guide, settings, evolutionOpen, confirmation, lockedUntil, fast, reducedMotion, execute]);

  const selectCell = (cell: ArenaCell) => {
    if (paused || instructions || guide || settings || evolutionOpen || confirmation) return;
    setCursor(cell);
    if (camp) {
      const occupant = state.roster.find(u => state.deployment[u.id]?.x === cell.col && state.deployment[u.id]?.y === cell.row);
      if (occupant) { setSelectedId(occupant.id); playClick(); }
      else if (selectedId) execute({ type: 'deploy', unitId: selectedId, position: { x: cell.col, y: cell.row } });
    } else {
      const occupant = state.battleUnits.find(u => u.position?.x === cell.col && u.position?.y === cell.row && u.hp > 0);
      if (occupant) { setSelectedId(occupant.id); setTargetId(occupant.id); playClick(); }
    }
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest('button,input,select,summary')) return;
    if (paused || instructions || guide || settings || evolutionOpen || confirmation) return;
    const step: Record<string, [number, number]> = { ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0], ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1] };
    if (step[event.key]) { event.preventDefault(); const [x, y] = step[event.key]; setCursor(c => ({ col: Math.max(0, Math.min(11, c.col + x)), row: Math.max(0, Math.min(7, c.row + y)) })); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectCell(cursor); }
    else if (['1', '2', '3'].includes(event.key)) { const move = moves[Number(event.key) - 1]; if (move) setMoveId(move.id); }
  };
  const renderUnits: ArenaUnit[] = (camp
    ? state.roster.flatMap(u => state.deployment[u.id] ? [{ ...u, position: state.deployment[u.id] }] : [])
    : state.battleUnits.filter(u => u.position)).map(u => ({
      id: u.id, species: u.species, name: name(u.species), hp: u.hp, maxHp: u.maxHp, energy: u.energy, maxEnergy: u.maxEnergy, owner: u.owner,
      col: u.position!.x, row: u.position!.y,
    }));
  const deployedCount = Object.keys(state.deployment).length;
  const shopPages = Math.ceil(speciesIds.length / SHOP_PAGE_SIZE);
  const shopSpecies = speciesIds.slice(shopPage * SHOP_PAGE_SIZE, (shopPage + 1) * SHOP_PAGE_SIZE);
  const previewEnemies = generateEnemies(state.stage, state.difficulty);
  const nextRivals = state.phase === 'victory' ? generateEnemies(state.stage + 1, state.difficulty) : [];
  const inspected = selected ?? active;
  const applyPotion = (unit: Unit) => execute({ type: 'usePotion', potion: unit.hp === 0 ? 'revivePotion' : 'healingPotion', targetId: unit.id });
  const moveButton = (move: Move, i: number) => {
    const cooldown = actor?.cooldowns[move.id] ?? 0;
    return <div className="pt-move-slot" key={move.id}><button aria-label={`${moveName(move.name, locale)} · ${text.cost} ${move.energy} · ${text.range} ${move.range}`} title={moveName(move.name, locale)} aria-pressed={selectedMove?.id === move.id} disabled={!canAct || cooldown > 0 || (actor?.energy ?? 0) < move.energy} onClick={() => { setMoveId(move.id); playClick(); }}>
      <Image src={`${ART}/spells/${spellArt[move.id]}.png`} width={80} height={80} unoptimized alt="" /><ActionIcon kind={move.kind === 'heal' ? 'heal' : move.element === 'normal' ? 'attack' : move.element} /><span className="pt-key">{i + 1}</span><span className="pt-cost">{cooldown ? `⏳${cooldown}` : move.energy ? `💧${move.energy}` : '∞'}</span>
    </button><span className="pt-range" title={text.range} aria-label={`${text.range}: ${move.range}`}><span aria-hidden="true">🎯</span>{move.range}</span></div>;
  };
  const reset = () => { execute({ type: 'reset', difficulty: newDifficulty }); setShopPage(0); setConfirmation(null); setPaused(false); };

  return <GameWrapper title={text.title} fullHeight theme="fieldnotes" className="pt-shell" sound={sound} onInstructionsClick={() => setGuide(true)}>
    <div className={`pt-game pt-theme-${theme} ${reducedMotion ? 'pt-reduced-motion' : ''}`} data-flight-progress={effect?.progress} dir={locale === 'he' ? 'rtl' : 'ltr'}>
      <div className="pt-hud">
        <span className="pt-money" aria-label={`${text.gold}: ${state.gold}`}><ActionIcon kind="coin" />{state.gold}</span>
        <span className="pt-stage" title={text.encounter}>🏆 {state.stage}/10</span>
        <div className="pt-initiative" aria-label={camp ? text.next : text.initiative}>{(camp ? previewEnemies : state.initiative.flatMap(id => state.battleUnits.find(u => u.id === id && u.hp > 0) ?? [])).map(u => <div key={u.id} className={`pt-turn ${u.owner} ${active?.id === u.id ? 'active' : ''}`} title={name(u.species)}><Portrait species={u.species} name={name(u.species)} label={text.artError} /></div>)}</div>
        {state.phase === 'battle' && <button className="pt-auto-button" aria-label={text.autoFight} title={text.autoTip} aria-pressed={autoFight} onClick={() => { setAutoFight(value => !value); playClick(); }}><span aria-hidden="true">🤖</span><small>{text.auto}</small></button>}
        <IconButton label={text.settings} icon="settings" onClick={() => setSettings(true)} />
        <IconButton label={paused ? text.resume : text.pause} icon={paused ? 'play' : 'pause'} onClick={() => { playClick(); setPaused(p => !p); }} />
      </div>
      {displayedError && <div className="pt-error" role="alert">{text[displayedError]}<button onClick={() => { setError(null); setShowStorageWarning(false); }}>{text.close}</button></div>}
      <div className={`pt-content ${camp ? 'pt-camp' : 'pt-battle'}`}>
        <div className="pt-board" tabIndex={0} role="group" aria-label={`${text.battle} · ${text.encounter} ${state.stage}`} onKeyDown={keyboard}>
          <Arena theme={theme} units={renderUnits} activeId={active?.id} selectedId={selectedId ?? active?.id} cursor={cursor} reachable={reachable} attackCells={attackCells} validTargets={validTargets} grid={grid} camp={camp} reducedMotion={reducedMotion} paused={scenePaused} effect={effect} onCell={selectCell} loadingLabel={text.loading} errorLabel={text.renderError} healthLabel={text.health} energyLabel={text.energy} />
          <div className="pt-visual-hint" aria-label={camp ? state.roster.length ? text.placeTip : text.empty : active?.owner === 'enemy' ? text.computerTurn : text.turnTip}>
            <span aria-hidden="true">{camp ? state.roster.length ? <>👆 → <i className="pt-zone-swatch move" /></> : '🪙 → 🛒' : active?.owner === 'enemy' ? '🤖 ⏳' : <>👆 <i className="pt-zone-swatch move" /> → 🎯</>}</span>
          </div>
          <div className="pt-zone-key"><span title={text.move} aria-label={text.move}><i className="pt-zone-swatch move" /><ActionIcon kind="move" /></span><span title={text.range} aria-label={text.range}><i className="pt-zone-swatch" /><ActionIcon kind="attack" /></span></div>
          <span className="pt-sr-only pt-cursor-label">{text.cell} {cursor.col + 1}, {cursor.row + 1}</span>
        </div>
        {camp && <aside className="pt-shop" aria-label={text.shop}>
          <div className="pt-stock">{shopSpecies.map(id => <button key={id} onClick={() => execute({ type: 'buyCreature', species: id })} disabled={state.gold < speciesCatalog[id].price || state.roster.length >= MAX_ROSTER} aria-label={`${text.buy} ${name(id)} · ${speciesCatalog[id].price} ${text.gold}`} title={`${text.buy} ${name(id)}`}>
            <Portrait species={id} name={name(id)} label={text.artError} /><small><ActionIcon kind="coin" />{speciesCatalog[id].price}</small>
          </button>)}</div>
          <div className="pt-shop-footer"><nav className="pt-shop-pages" aria-label={text.shop}>
            <button aria-label={text.previousPage} title={text.previousPage} disabled={shopPage === 0} onClick={() => { setShopPage(page => page - 1); playClick(); }}><span aria-hidden="true">‹</span></button>
            <span role="status" aria-label={text.shopPage}>{shopPage + 1}/{shopPages}</span>
            <button aria-label={text.nextPage} title={text.nextPage} disabled={shopPage === shopPages - 1} onClick={() => { setShopPage(page => page + 1); playClick(); }}><span aria-hidden="true">›</span></button>
          </nav>
          <div className="pt-supplies"><button aria-label={text.healthItem} title={text.healthItem} disabled={state.gold < 30} onClick={() => execute({ type: 'buyPotion', potion: 'healingPotion' })}><ActionIcon kind="heal" /><small>30 · {state.potions.healingPotion}</small></button>{state.difficulty === 'easy' ? <button className="pt-camp-action pt-rest-button" aria-label={text.rest} title={text.rest} disabled={!state.roster.some(u => u.hp < u.maxHp || u.energy < u.maxEnergy || u.statuses.length || Object.values(u.cooldowns).some(n => n > 0))} onClick={() => execute({ type: 'rest' })}><ActionIcon kind="rest" /><span className="pt-free-badge" aria-hidden="true"><ActionIcon kind="coin" /><b>0</b></span></button> : <button aria-label={text.reviveItem} title={text.reviveItem} disabled={state.gold < 80} onClick={() => execute({ type: 'buyPotion', potion: 'revivePotion' })}><ActionIcon kind="revive" /><small>80 · {state.potions.revivePotion}</small></button>}</div>
          </div>
        </aside>}
      </div>
      {camp ? <div className="pt-roster pt-dock">
        <div className="pt-roster-list">{state.roster.map(unit => <button key={unit.id} className="pt-roster-card" aria-pressed={selectedId === unit.id} onClick={() => { setSelectedId(unit.id); playClick(); }} aria-label={`${text.select} ${name(unit.species)} ${text.level} ${unit.level}`} title={name(unit.species)}>
          <Portrait species={unit.species} name={name(unit.species)} label={text.artError} /><span className="pt-roster-health" style={{ width: `${unit.hp / unit.maxHp * 100}%` }} /><small>{state.deployment[unit.id] ? '✅' : unit.hp === 0 ? '💤' : '＋'} {unit.level}⭐</small>
        </button>)}</div>
        {selected && <div className="pt-care">
          <IconButton label={selected.hp === 0 ? text.revive : text.heal} icon={selected.hp === 0 ? 'revive' : 'heal'} disabled={selected.hp === 0 ? state.potions.revivePotion === 0 : selected.hp === selected.maxHp || state.potions.healingPotion === 0} onClick={() => applyPotion(selected)} />
          <button className="pt-icon-button pt-camp-action pt-train-button" aria-label={`${text.train} · ${trainingCost(selected.level)}`} title={text.train} disabled={selected.level >= 5 || selected.hp === 0 || state.gold < trainingCost(selected.level)} onClick={() => execute({ type: 'train', unitId: selected.id })}><ActionIcon kind="train" /><small className="pt-price-badge"><ActionIcon kind="coin" />{trainingCost(selected.level)}</small></button>
          {evolution && <button className="pt-icon-button pt-evolve-button" aria-label={`${text.evolve} ${name(selected.species)} → ${name(evolution.species)} · ${evolution.cost} ${text.gold}`} title={`${text.evolve} → ${name(evolution.species)}`} disabled={selected.hp === 0 || state.gold < evolution.cost} onClick={() => setEvolutionOpen(true)}><Portrait species={evolution.species} name={name(evolution.species)} label={text.artError} /><ActionIcon kind="evolve" /><small>{evolution.cost}</small></button>}
          <IconButton label={text.bench} icon="bench" className="pt-camp-action pt-bench-button" disabled={!state.deployment[selected.id]} onClick={() => execute({ type: 'bench', unitId: selected.id })} />
        </div>}
        <div className="pt-start"><span aria-label={`${text.deployed}: ${deployedCount}/${MAX_TEAM}`}>{deployedCount}/{MAX_TEAM}</span><IconButton label={text.start} icon="play" className="pt-primary" disabled={deployedCount === 0 || !state.roster.some(u => state.deployment[u.id] && u.hp > 0)} onClick={() => execute({ type: 'startBattle' })} />{state.checkpoint && <IconButton label={text.retry} icon="back" onClick={() => setConfirmation('retry')} />}</div>
      </div> : <div className="pt-command pt-dock">
        <div className={`pt-unit-mini ${active?.owner === 'enemy' ? 'enemy' : ''}`} aria-label={active?.owner === 'enemy' ? text.computerTurn : text.yourTurn}>{active && <><Portrait species={active.species} name={name(active.species)} label={text.artError} /><ResourceBars key={active.id} unit={active} healthLabel={text.health} energyLabel={text.energy} numbers /></>}</div>
        <div className="pt-moves">{moves.map(moveButton)}</div>
        <div className="pt-preview" aria-live="polite">{target && selectedMove && actor && <><div className="pt-target-resources"><Portrait species={target.species} name={name(target.species)} label={text.artError} /><ResourceBars key={target.id} unit={target} healthLabel={`${text.target} · ${text.health}`} energyLabel={`${text.target} · ${text.energy}`} numbers /></div><strong>{canUse ? selectedMove.kind === 'heal' ? '+' : '−' : '🚫'}{canUse ? selectedMove.kind === 'heal' ? Math.min(selectedMove.power, target.maxHp - target.hp) : getDamagePreview(state, actor, target, selectedMove) : ''}</strong><span className="pt-sr-only">{text.preview}: {selectedMove.kind === 'heal' ? Math.min(selectedMove.power, target.maxHp - target.hp) : getDamagePreview(state, actor, target, selectedMove)}</span></>}</div>
        <div className="pt-actions">
          <IconButton label={text.move} icon="move" className="pt-move-action" disabled={!canMove} onClick={() => execute({ type: 'move', position: { x: cursor.col, y: cursor.row } })} />
          <IconButton label={`${text.confirm} · ${text.use}`} icon={selectedMove?.kind === 'heal' ? 'heal' : 'attack'} className="pt-primary" disabled={!canUse} onClick={() => selectedMove && target && execute({ type: 'useMove', moveId: selectedMove.id, targetId: target.id })} />
          <IconButton label={text.defend} icon="defend" disabled={!canAct} onClick={() => execute({ type: 'defend' })} />
          <IconButton label={text.wait} icon="wait" disabled={!canAct || state.moved || (!!actor && state.waitedIds.includes(actor.id))} onClick={() => execute({ type: 'wait' })} />
          <IconButton label={`${text.heal} · ${state.potions.healingPotion}`} icon="heal" disabled={!canAct || !target || target.owner !== 'player' || target.hp === 0 || target.hp === target.maxHp || !actor?.position || !target.position || distance(actor.position, target.position) > 3 || state.potions.healingPotion === 0} onClick={() => target && applyPotion(target)} />
        </div>
      </div>}
      {evolutionOpen && camp && selected && evolution && <GameDialog title={`${text.evolve} · ${name(selected.species)}`} onClose={() => setEvolutionOpen(false)}>
        <div className="pt-evolution-preview"><Portrait species={selected.species} name={name(selected.species)} label={text.artError} /><ActionIcon kind="evolve" /><Portrait species={evolution.species} name={name(evolution.species)} label={text.artError} /></div>
        <p>{text.gold}: {evolution.cost} · {text.health}: +25 · {text.energy}: +8</p>
        <div><IconButton label={text.cancel} icon="back" onClick={() => setEvolutionOpen(false)} /><IconButton label={text.confirmEvolution} icon="evolve" className="pt-primary" disabled={selected.hp === 0 || state.gold < evolution.cost} onClick={() => { if (execute({ type: 'evolve', unitId: selected.id })) setEvolutionOpen(false); }} /></div>
      </GameDialog>}
      {settings && <GameDialog title={text.settings} onClose={() => setSettings(false)}>
        <div className="pt-toolbar">
          <label>{text.theme}<select aria-label={text.theme} value={theme} onChange={e => setTheme(e.target.value === 'moonwell' ? 'moonwell' : e.target.value === 'obsidian' ? 'obsidian' : 'classic')}>{(['classic', 'moonwell', 'obsidian'] as const).map(t => <option key={t} value={t}>{text[t]}</option>)}</select></label>
          <label>{text.difficulty}<select aria-label={text.difficulty} value={state.difficulty} disabled={state.roster.length > 0 || !camp} onChange={e => execute({ type: 'reset', difficulty: e.target.value === 'easy' ? 'easy' : e.target.value === 'hard' ? 'hard' : 'medium' })}>{(['easy', 'medium', 'hard'] as const).map(d => <option key={d} value={d}>{text[d]}</option>)}</select></label>
          <label><input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)} />{text.grid}</label>
          <label><input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} />{text.motion}</label>
          <label><input type="checkbox" checked={fast} onChange={e => setFast(e.target.checked)} />{text.fast}</label>
        </div>
        <p className="pt-notice">{storageError ? text[storageError] : text.saved}</p>
        <p>{text.recoveryRules}</p>
        <p>{text.energyRules}</p>
        {sound.musicFailed && <p role="alert">{text.musicError}</p>}
        {inspected && <details><summary>{text.stats} · {name(inspected.species)}</summary><p>{text.health}: {inspected.hp}/{inspected.maxHp} · {text.energy}: {inspected.energy}/{inspected.maxEnergy}</p><p>{(['attack', 'defense', 'speed', 'movement'] as const).map(stat => `${text[stat]}: ${inspected[stat]}`).join(' · ')}</p><p>{getUnitMoves(inspected).map(m => `${moveName(m.name, locale)}: ${text.range} ${m.range}`).join(' · ')}</p></details>}
        <details><summary>{text.history}</summary>{log.map((entry, i) => <p key={i}>{name(entry.species)} · {entry.move ? moveName(entry.move, locale) : text[entry.action]}</p>)}</details>
        <details><summary>{text.credits}</summary><p>{text.creditsText} <a href={`${ART}/CREDITS.txt`}>{text.credits}</a></p></details>
        <div><IconButton label={text.newRun} icon="back" onClick={() => { setSettings(false); setConfirmation('reset'); }} /><IconButton label={text.close} icon="play" onClick={() => setSettings(false)} /></div>
      </GameDialog>}
      {guide && <GameDialog title={text.title} onClose={() => setGuide(false)}>
        <div className="pt-picture-guide">
          <div aria-label={text.tutorialBuy}><ActionIcon kind="coin" /><span aria-hidden="true">→</span><Portrait species="pikachu" name={name('pikachu')} label={text.artError} /></div>
          <div aria-label={text.tutorialPlace}><Portrait species="pikachu" name={name('pikachu')} label={text.artError} /><span aria-hidden="true">→</span><ActionIcon kind="field" /></div>
          <div aria-label={text.tutorialBattle}><ActionIcon kind="move" /><span aria-hidden="true">→</span><Image src={`${ART}/spells/lighting-sky-1.png`} width={80} height={80} unoptimized alt={moveName('Thunder Shock', locale)} /><span aria-hidden="true">→</span><ActionIcon kind="attack" /></div>
        </div><div><IconButton label={text.instructions} icon="help" onClick={() => { setGuide(false); setInstructions(true); }} /><IconButton label={text.close} icon="play" className="pt-primary" onClick={() => setGuide(false)} /></div>
      </GameDialog>}
      {paused && !instructions && !confirmation && !outcome && !settings && !guide && <GameDialog title={text.paused} onClose={() => setPaused(false)}><div><IconButton label={text.resume} icon="play" className="pt-primary" onClick={() => setPaused(false)} /><IconButton label={text.newRun} icon="back" onClick={() => setConfirmation('reset')} /></div></GameDialog>}
      {outcome && !confirmation && !instructions && !settings && !guide && <GameDialog title={text[outcome]}>
        <span className={`pt-outcome-picture ${outcome !== 'defeat' ? 'pt-victory-trophy' : ''}`} aria-hidden="true">{outcome === 'defeat' ? '💤' : '🏆'}</span>
        {outcome !== 'defeat' && <section className="pt-victory-summary">
          <p className="pt-earned-gold" aria-label={text.earnedGold}><ActionIcon kind="coin" /><strong>+{victoryReward(state.stage, state.difficulty)}</strong><span>{text.earnedGold}</span></p>
          {nextRivals.length > 0 ? <>
            <h3>{text.nextRivals} · {state.stage + 1}/{MAX_STAGE}{state.stage + 1 === MAX_STAGE && <span aria-hidden="true"> 👑</span>}</h3>
            <ul className="pt-next-rivals" aria-label={text.nextRivals}>{nextRivals.map(unit => <li key={unit.id}>
              <Portrait species={unit.species} name={name(unit.species)} label={text.artError} />
              <small><span className="pt-sr-only">{text.level} </span>{unit.level}<span aria-hidden="true">★</span></small>
            </li>)}</ul>
            <p className="pt-next-goal"><span aria-hidden="true">🎯</span><span><strong>{text.nextGoal}</strong>{state.stage + 1 === MAX_STAGE ? text.bossGoal : text.victoryGoal}</span></p>
          </> : <p className="pt-next-goal"><span aria-hidden="true">🏁</span><strong>{text.completedGoal}</strong></p>}
        </section>}
        <div>
          {state.phase === 'victory' && <IconButton label={text.next} icon="play" className="pt-primary" onClick={() => execute({ type: 'continue' })} />}
          {state.phase === 'complete' && <IconButton label={text.settings} icon="settings" onClick={() => setSettings(true)} />}
          {state.phase === 'defeat' && <><IconButton label={text.retry} icon="back" onClick={() => execute({ type: 'retry' })} /><IconButton label={text.recover} icon="rest" className="pt-camp-action pt-rest-button" onClick={() => execute({ type: 'recover' })} /></>}
          {state.phase === 'defeat' && <IconButton label={text.newRun} icon="coin" onClick={() => setConfirmation('reset')} />}
        </div></GameDialog>}
      {confirmation && <ConfirmDialog message={confirmation === 'reset' ? text.confirmReset : text.confirmRetry} labels={text} cancel={() => setConfirmation(null)} confirm={confirmation === 'reset' ? reset : () => { execute({ type: 'retry' }); setConfirmation(null); }}>
        {confirmation === 'reset' && <label>{text.difficulty}<select aria-label={text.difficulty} value={newDifficulty} onChange={e => setNewDifficulty(e.target.value === 'hard' ? 'hard' : e.target.value === 'medium' ? 'medium' : 'easy')}>{(['easy', 'medium', 'hard'] as const).map(d => <option key={d} value={d}>{text[d]}</option>)}</select></label>}
      </ConfirmDialog>}
      <InstructionsModal isOpen={instructions} onClose={() => setInstructions(false)} title={text.title} locale={locale} theme="fieldnotes"
        instructions={[{ icon: '🪙', title: text.tutorialBuy, description: text.tutorialBuyText }, { icon: '♟️', title: text.tutorialPlace, description: text.tutorialPlaceText }, { icon: '⚔️', title: text.tutorialBattle, description: text.tutorialBattleText }, { icon: '🧪', title: text.tutorialCamp, description: `${text.tutorialCampText} ${text.recoveryRules}` }]}
        controls={[{ icon: '🖱️', description: text.controlsMouse }, { icon: '⌨️', description: text.controlsKeys }]} tip={`${text.tip} ${text.energyRules}`} />
    </div>
  </GameWrapper>;
}
