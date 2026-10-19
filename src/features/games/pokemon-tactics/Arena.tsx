'use client';

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Html, Line, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { SpeciesId } from './types';
import { ARENA_FOV, ARENA_PITCH, arenaCameraPosition } from './camera';
import { ResourceBars } from './ResourceBars';

export type ArenaTheme = 'classic' | 'moonwell' | 'obsidian';
export interface ArenaCell { col: number; row: number }
export interface ArenaUnit extends ArenaCell {
  id: string;
  species: SpeciesId;
  name: string;
  owner: 'player' | 'enemy';
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
}
export interface ArenaEffect { id: number; from: ArenaCell; to: ArenaCell; color: string; progress: number; duration: number }
interface ArenaProps {
  theme: ArenaTheme;
  units: ArenaUnit[];
  activeId?: string;
  selectedId?: string;
  cursor: ArenaCell;
  reachable: ArenaCell[];
  attackCells: ArenaCell[];
  validTargets: string[];
  grid: boolean;
  camp: boolean;
  reducedMotion: boolean;
  paused: boolean;
  effect?: ArenaEffect;
  onCell: (cell: ArenaCell) => void;
  loadingLabel: string;
  errorLabel: string;
  healthLabel: string;
  energyLabel: string;
}
const point = (cell: ArenaCell): [number, number, number] => [(cell.col - 5.5) * 1.2, .07, (cell.row - 3.5) * 1.2];
const root = '/games/pokemon-tactics';

class ArenaBoundary extends Component<{ children: ReactNode; label: string }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: Error) { console.error('Pokémon tactics arena failed to load', error); }
  render() { return this.state.error ? <div className="pt-arena-error" role="alert">{this.props.label}</div> : this.props.children; }
}

function TexturedGround({ theme }: { theme: ArenaTheme }) {
  const source = useTexture(`${root}/textures/${theme === 'classic' ? 'forest_floor' : theme === 'moonwell' ? 'mossy_cobblestone' : 'rock_boulder_dry'}.jpg`);
  const texture = useMemo(() => {
    const t = source.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(14, 14);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [source]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.05, 0]} receiveShadow>
    <planeGeometry args={[70, 70]} />
    <meshStandardMaterial map={texture} color={theme === 'moonwell' ? '#71869a' : '#819181'} roughness={1} />
  </mesh>;
}

function Court() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Arena surface requires a 2D canvas context');
    context.fillStyle = '#c2a172';
    context.fillRect(0, 0, 512, 512);
    let seed = 7102;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 45000; i++) {
      context.fillStyle = `rgba(${170 + Math.floor(random() * 65)},${140 + Math.floor(random() * 40)},${100 + Math.floor(random() * 35)},.10)`;
      context.fillRect(random() * 512, random() * 512, 2, 2);
    }
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const stripe = (width: number, depth: number, x: number, z: number, key: string) =>
    <mesh key={key} position={[x, .037, z]} receiveShadow><boxGeometry args={[width, .01, depth]} /><meshStandardMaterial color="#f8efd7" roughness={1} /></mesh>;
  return <group>
    <mesh position={[0, -.17, 0]} receiveShadow><boxGeometry args={[16.6, .34, 11.2]} /><meshStandardMaterial color="#877861" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .01, 0]} receiveShadow><planeGeometry args={[16.6, 11.2]} /><meshStandardMaterial map={texture} roughness={1} /></mesh>
    {stripe(.1, 9.7, -7.2, 0, 'left')}{stripe(.1, 9.7, 7.2, 0, 'right')}
    {stripe(14.5, .1, 0, -4.8, 'back')}{stripe(14.5, .1, 0, 4.8, 'front')}
    {stripe(.09, 3.55, 0, -3.025, 'half-back')}{stripe(.09, 3.55, 0, 3.025, 'half-front')}
    {[.72, 1.25].map(radius => <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, .045, 0]}><ringGeometry args={[radius - .045, radius + .045, 80]} /><meshStandardMaterial color="#f8efd7" /></mesh>)}
    {[-1, 1].flatMap(side => [stripe(1, .09, side * 7.7, -1.3, `${side}-top`), stripe(1, .09, side * 7.7, 1.3, `${side}-bottom`), stripe(.09, 2.6, side * 8.2, 0, `${side}-edge`)])}
  </group>;
}

function Tree({ x, z, size = 1, moon = false }: { x: number; z: number; size?: number; moon?: boolean }) {
  return <group position={[x, 0, z]} scale={size}>
    <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[.16, .3, 3, 8]} /><meshStandardMaterial color="#65513a" /></mesh>
    {[-1, 0, 1].map((n, i) => <mesh key={n} position={[n * .7, 3.5 + (i % 2) * .7, n * .4]} scale={[1, 1.3, 1]} castShadow><icosahedronGeometry args={[1.5, 1]} /><meshStandardMaterial color={moon ? '#345d64' : '#4d6d45'} /></mesh>)}
  </group>;
}

function Stone({ x, y, z, size }: { x: number; y: number; z: number; size: [number, number, number] }) {
  const source = useTexture(`${root}/textures/mossy_cobblestone.jpg`);
  return <mesh position={[x, y, z]} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial map={source} color="#a4a18d" roughness={1} /></mesh>;
}

function Arch({ x, z }: { x: number; z: number }) {
  return <group>
    <Stone x={x - 1.7} y={2.2} z={z} size={[.7, 4.4, .8]} /><Stone x={x + 1.7} y={2.2} z={z} size={[.7, 4.4, .8]} />
    {Array.from({ length: 9 }, (_, i) => <group key={i} rotation={[0, 0, i * Math.PI / 8 - Math.PI / 2]} position={[x + 1.7 * Math.cos(i * Math.PI / 8), 4.3 + 1.7 * Math.sin(i * Math.PI / 8), z]}><Stone x={0} y={0} z={0} size={[.7, .7, .85]} /></group>)}
  </group>;
}

function Tower({ x, z }: { x: number; z: number }) {
  return <group><Stone x={x} y={4} z={z} size={[3.2, 8, 3.2]} />
    {Array.from({ length: 4 }, (_, i) => <Stone key={i} x={x - 1.2 + i * .8} y={8.4} z={z + 1.5} size={[.5, .8, .6]} />)}
    <mesh position={[x, 4.8, z + 1.62]}><planeGeometry args={[1.1, 2.5]} /><meshStandardMaterial color="#57271e" side={THREE.DoubleSide} /></mesh>
    <mesh position={[x, 4.8, z + 1.64]}><planeGeometry args={[.14, 1.6]} /><meshStandardMaterial color="#be9d60" /></mesh>
  </group>;
}

function Scenery({ theme, camp }: { theme: ArenaTheme; camp: boolean }) {
  const rocks = useTexture(`${root}/textures/rock_boulder_dry.jpg`);
  return <group>
    {Array.from({ length: 14 }, (_, i) => <mesh key={i} position={[(i - 7) * 4.5, 1, -23 - (i % 4) * 3]} scale={[1, 1 + (i % 3) * .3, .8]} castShadow><dodecahedronGeometry args={[5 + (i % 4), 1]} /><meshStandardMaterial map={rocks} color={theme === 'moonwell' ? '#526d81' : '#8c8269'} /></mesh>)}
    {Array.from({ length: 12 }, (_, i) => <Tree key={`tree${i}`} x={(i < 6 ? -1 : 1) * (12 + i % 3 * 2)} z={(i % 6 - 3) * 4} size={.8 + i % 3 * .15} moon={theme === 'moonwell'} />)}
    {Array.from({ length: 8 }, (_, i) => <mesh key={`rock${i}`} position={[(i < 4 ? -1 : 1) * (10 + i % 3), .5, (i % 4 - 1.5) * 5]} scale={[1.4, .8, 1]} castShadow receiveShadow><dodecahedronGeometry args={[1 + i % 2 * .5, 1]} /><meshStandardMaterial map={rocks} color="#a4a18d" /></mesh>)}
    {theme === 'moonwell' ? <>
      {[-11, -5, 2, 9].map(x => <Arch key={x} x={x} z={-11} />)}
      {[-10, 10].map(x => <group key={x}><mesh position={[x, 2.8, -4]} scale={[.5, 1.5, .5]}><octahedronGeometry args={[1]} /><meshStandardMaterial color="#99dbf5" emissive="#2375b4" emissiveIntensity={.8} /></mesh><pointLight position={[x, 2, -4]} color="#57a7ff" intensity={8} distance={10} /></group>)}
    </> : <><Tower x={-8} z={theme === 'obsidian' ? -13 : -19} /><Tower x={8} z={theme === 'obsidian' ? -13 : -19} /><Stone x={0} y={4.5} z={theme === 'obsidian' ? -13 : -19} size={[14, 9, 2]} /><mesh position={[0, 2.5, theme === 'obsidian' ? -11.98 : -17.98]}><planeGeometry args={[3.2, 5]} /><meshStandardMaterial color="#31261c" /></mesh></>}
    {(camp || theme === 'obsidian') && [-8, 8].map(x => <group key={`fire${x}`} position={[x, 0, -7]}><mesh position={[0, .25, 0]}><cylinderGeometry args={[.65, .8, .5, 10]} /><meshStandardMaterial color="#695548" /></mesh><mesh position={[0, 1, 0]}><coneGeometry args={[.4, 1.1, 7]} /><meshStandardMaterial color="#ffcc6e" emissive="#ff8b24" emissiveIntensity={1.4} /></mesh><pointLight position={[0, 1.5, 0]} color="#ffae55" intensity={12} distance={9} /></group>)}
  </group>;
}

function CreatureMaterial({ unit, foreground }: { unit: ArenaUnit; foreground: boolean }) {
  const texture = useTexture(`${root}/pokemon/${unit.species}.png`);
  return <meshBasicMaterial map={texture} transparent alphaTest={.03} depthWrite={false} depthTest={!foreground} color={unit.hp === 0 ? '#71665e' : '#ffffff'} opacity={unit.hp === 0 ? .45 : 1} />;
}

function Creature({ unit, active, selected, targetable, reduced, paused, onCell, healthLabel, energyLabel }: { unit: ArenaUnit; active: boolean; selected: boolean; targetable: boolean; reduced: boolean; paused: boolean; onCell: ArenaProps['onCell']; healthLabel: string; energyLabel: string }) {
  const ref = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const [x, , z] = point(unit);
  const [initialPosition] = useState<[number, number, number]>([x, 0, z]);
  const destination = useMemo(() => new THREE.Vector3(x, 0, z), [x, z]);
  useFrame(({ clock }, delta) => {
    if (body.current && !paused) {
      if (reduced) body.current.position.copy(destination);
      else body.current.position.lerp(destination, Math.min(1, delta * 12));
    }
    if (ref.current) ref.current.position.y = reduced || paused || unit.hp === 0 ? 1.05 : 1.05 + Math.sin(clock.elapsedTime * 2.2 + unit.col) * .065;
  });
  return <group ref={body} position={initialPosition}>
    {targetable && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .105, 0]}><ringGeometry args={[.55, .7, 32]} /><meshBasicMaterial color="#a62e25" depthWrite={false} /></mesh>}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .08, 0]}><circleGeometry args={[.48, 32]} /><meshBasicMaterial color="#261a14" transparent opacity={.2} depthWrite={false} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .085, 0]}><ringGeometry args={[selected || active ? .5 : .39, selected || active ? .58 : .44, 32]} /><meshBasicMaterial color={selected || active ? '#f4d27a' : unit.owner === 'player' ? '#7ca559' : '#d97153'} transparent opacity={.9} /></mesh>
    <Billboard ref={ref} position={[0, 1.05, 0]}>
      <mesh renderOrder={selected ? 30 : active ? 20 : 0} onClick={event => { event.stopPropagation(); onCell({ col: unit.col, row: unit.row }); }}>
        <planeGeometry args={[1.85, 1.85]} />
        <Suspense fallback={<meshBasicMaterial transparent opacity={0} depthWrite={false} />}>
          <CreatureMaterial unit={unit} foreground={selected || active} />
        </Suspense>
      </mesh>
    </Billboard>
    <Html position={[0, 2.1, 0]} center zIndexRange={[4, 0]} wrapperClass={selected ? 'pt-label-selected' : active ? 'pt-label-active' : 'pt-label-normal'} style={{ pointerEvents: 'none' }}>
      <div data-unit-id={unit.id} data-selected={selected} className={`pt-unit-label ${unit.owner} ${active ? 'active' : ''} ${selected ? 'selected' : ''}`}><span>{unit.name}</span><ResourceBars unit={unit} healthLabel={`${unit.name} · ${healthLabel}`} energyLabel={`${unit.name} · ${energyLabel}`} /></div>
    </Html>
  </group>;
}

function SpellEffect({ effect }: { effect: ArenaEffect }) {
  const from = useMemo(() => new THREE.Vector3(...point(effect.from)).add(new THREE.Vector3(0, 1.1, 0)), [effect.from]);
  const to = useMemo(() => new THREE.Vector3(...point(effect.to)).add(new THREE.Vector3(0, 1.1, 0)), [effect.to]);
  const position = from.clone().lerp(to, effect.progress);
  position.y += Math.sin(effect.progress * Math.PI) * 1.5;
  return <mesh position={position}><sphereGeometry args={[.25, 16, 12]} /><meshBasicMaterial color={effect.color} /></mesh>;
}

function Content(props: ArenaProps) {
  const { size } = useThree();
  const cameraDistance = Math.max(1, 1.5 / (size.width / size.height));
  const reachable = new Set(props.reachable.map(c => `${c.col},${c.row}`));
  const attackCells = new Set(props.attackCells.map(c => `${c.col},${c.row}`));
  const lines = useMemo(() => [
    ...Array.from({ length: 13 }, (_, c) => [[-7.2 + c * 1.2, .055, -4.8], [-7.2 + c * 1.2, .055, 4.8]] as [number, number, number][]),
    ...Array.from({ length: 9 }, (_, r) => [[-7.2, .055, -4.8 + r * 1.2], [7.2, .055, -4.8 + r * 1.2]] as [number, number, number][]),
  ], []);
  return <>
    <color attach="background" args={[props.theme === 'moonwell' ? '#253e56' : props.theme === 'obsidian' ? '#655344' : '#7b8673']} />
    <fog attach="fog" args={[props.theme === 'moonwell' ? '#3e5c76' : '#8c8975', 36 * cameraDistance, 78 * cameraDistance]} />
    <hemisphereLight args={[props.theme === 'moonwell' ? '#b1d2f1' : '#e2e6d4', '#59422b', 1.8]} />
    <directionalLight position={[-13, 23, 10]} intensity={2.2} color={props.theme === 'moonwell' ? '#b7ceff' : '#ffe8cb'} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-bias={-.0005} />
    <TexturedGround theme={props.theme} /><Court /><Scenery theme={props.theme} camp={props.camp} />
    {props.grid && lines.map((points, i) => <Line key={i} points={points} color="#685640" transparent opacity={.55} lineWidth={1.1} />)}
    {Array.from({ length: 96 }, (_, i) => {
      const col = i % 12, row = Math.floor(i / 12), cursor = props.cursor.col === col && props.cursor.row === row;
      const canMove = reachable.has(`${col},${row}`);
      const canAttack = attackCells.has(`${col},${row}`);
      const placement = props.camp && col < 4;
      return <group key={i} position={point({ col, row })}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={e => { e.stopPropagation(); props.onCell({ col, row }); }}>
          <planeGeometry args={[1.14, 1.14]} /><meshBasicMaterial color={cursor ? '#ffe5a0' : canMove || placement ? '#487c72' : canAttack ? '#b96a48' : '#ffffff'} transparent opacity={cursor ? .55 : canMove || placement ? .35 : canAttack ? .16 : .001} depthWrite={false} />
        </mesh>
        {(canMove || placement) && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .02, 0]} raycast={() => null}><circleGeometry args={[.1, 12]} /><meshBasicMaterial color="#f7f3da" depthWrite={false} /></mesh>}
        {(canMove || placement || canAttack || cursor) && <Line points={[[-.54, .025, -.54], [.54, .025, -.54], [.54, .025, .54], [-.54, .025, .54], [-.54, .025, -.54]]} color={cursor ? '#fff2ca' : canAttack ? '#a62e25' : '#2e665d'} lineWidth={cursor ? 3 : 2} dashed={!cursor && !canAttack} dashSize={.12} gapSize={.07} raycast={() => null} />}
      </group>;
    })}
    {props.units.map(unit => <Creature key={unit.id} unit={unit} active={unit.id === props.activeId} selected={unit.id === props.selectedId} targetable={props.validTargets.includes(unit.id)} reduced={props.reducedMotion} paused={props.paused} onCell={props.onCell} healthLabel={props.healthLabel} energyLabel={props.energyLabel} />)}
    {props.effect && <SpellEffect key={props.effect.id} effect={props.effect} />}
  </>;
}

function ArenaCamera() {
  const { size } = useThree();
  return <PerspectiveCamera makeDefault position={arenaCameraPosition(size.width / size.height)} rotation={[-ARENA_PITCH, 0, 0]} fov={ARENA_FOV} near={.1} far={180} />;
}

export default function Arena(props: ArenaProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const context = document.createElement('canvas').getContext('webgl2');
      if (!context) console.error('Pokémon tactics arena requires WebGL 2');
      setSupported(!!context);
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  if (supported === null) return <div className="pt-arena-error" role="status">{props.loadingLabel}</div>;
  if (!supported) return <div className="pt-arena-error" role="alert">{props.errorLabel}</div>;
  return <ArenaBoundary label={props.errorLabel}>
    <Canvas resize={{ debounce: 0 }} shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.5]} camera={{ position: [0, 20, 15], fov: ARENA_FOV }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
      <ArenaCamera />
      <Suspense fallback={<Html center><div className="pt-panel" role="status">{props.loadingLabel}</div></Html>}>
        <Content {...props} />
      </Suspense>
    </Canvas>
  </ArenaBoundary>;
}
