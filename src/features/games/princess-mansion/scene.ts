import Phaser from 'phaser';
import {
  CHARACTER_PARTS, NEED_TEXTURES, PRINCESS_IDS, PROP_TEXTURES, ROOM_IDS, ROOM_WIDTH, STATIONS, WORLD_HEIGHT,
  artUrl, clamp, getStation, roomIndex, urgentNeed, type PrincessId, type RoomId, type Station,
} from './data';
import { MansionController, type Princess } from './model';

export interface SceneControls {
  movePrincess(): void;
  cancelMove(): void;
  placeAtStation(stationId: string): void;
  refreshBounds(): void;
}
export interface SceneBridge {
  ready(controls: SceneControls | null): void;
  loading(value: boolean): void;
  error(): void;
  moving(value: boolean): void;
  pause(): void;
  decorative(): void;
}
interface Carry { id: PrincessId; x: number; y: number; offsetX: number; offsetY: number }
const SCALE = 0.58;
const DOM_INPUT_EVENTS = ['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend'] as const;
let sceneNumber = 0;
const characterKey = (id: PrincessId, part: string) => `princess-${id}-${part}`;

class PrincessActor {
  root: Phaser.GameObjects.Container;
  private parts = new Map<string, Phaser.GameObjects.Image>();
  private halo: Phaser.GameObjects.Graphics;
  private thought: Phaser.GameObjects.Container;
  private thoughtIcon: Phaser.GameObjects.Image;
  private sleep: Phaser.GameObjects.Text;
  private accessory: Phaser.GameObjects.Graphics;
  private lastActivity = '';
  private lastRoom: RoomId;
  private worldX = 0;
  private worldY = 0;
  hidden = false;
  private headOnly = false;

  constructor(private scene: Phaser.Scene, princess: Princess) {
    this.lastRoom = princess.room;
    this.root = scene.add.container(roomIndex(princess.room) * ROOM_WIDTH + princess.x, princess.y).setScale(SCALE);
    const shadow = scene.add.graphics().fillStyle(0x74594e, 0.14).fillEllipse(0, -5, 162, 23);
    this.halo = scene.add.graphics().lineStyle(3, 0xf5df9f, 0.85).strokeEllipse(0, -6, 178, 28);
    this.root.add([shadow, this.halo]);
    for (const part of ['hair', 'left-leg', 'right-leg', 'dress', 'left-arm', 'right-arm', 'head']) {
      const image = scene.add.image(-120, -325, characterKey(princess.id, part)).setOrigin(0);
      this.parts.set(part, image);
      this.root.add(image);
    }
    this.parts.get('left-arm')?.setOrigin(85 / 240, 164 / 340).setPosition(-35, -161);
    this.parts.get('right-arm')?.setOrigin(155 / 240, 164 / 340).setPosition(35, -161);
    this.parts.get('left-leg')?.setOrigin(92 / 240, 303 / 340).setPosition(-28, -22);
    this.parts.get('right-leg')?.setOrigin(154 / 240, 303 / 340).setPosition(34, -22);
    this.accessory = scene.add.graphics();
    this.root.add(this.accessory);
    const bubble = scene.add.graphics().fillStyle(0xfffcf0, 0.96).fillRoundedRect(-35, -393, 70, 59, 24)
      .fillCircle(-17, -326, 5).lineStyle(2, 0xdfcfaf).strokeRoundedRect(-35, -393, 70, 59, 24);
    this.thoughtIcon = scene.add.image(0, -362, 'icon-star').setDisplaySize(36, 36);
    this.thought = scene.add.container(0, 0, [bubble, this.thoughtIcon]);
    this.sleep = scene.add.text(-4, -372, 'z  Z  z', { fontFamily: 'Georgia, serif', fontSize: '28px', color: '#8298a5' });
    this.root.add([this.thought, this.sleep]);
  }

  hit(x: number, y: number): boolean {
    return !this.hidden && Math.abs(x - this.worldX) < 68 && y > this.worldY - 195 && y < this.worldY + (this.headOnly ? -70 : 12);
  }

  update(princess: Princess, time: number, delta: number, selected: boolean, carry: Carry | null, reduced: boolean): void {
    const activity = princess.activity?.kind === 'active' ? princess.activity : null;
    const station = activity ? getStation(activity.stationId) : undefined;
    const kind = station?.activity;
    this.hidden = kind === 'toilet' && carry?.id !== princess.id;
    this.root.setVisible(!this.hidden);
    if (this.hidden) return;
    const isCarried = carry?.id === princess.id;
    const marker = `${kind ?? 'idle'}:${activity?.actionId ?? 0}`;
    let x = roomIndex(princess.room) * ROOM_WIDTH + princess.x;
    let y = princess.y;
    if (station && activity) {
      x = roomIndex(station.room) * ROOM_WIDTH + station.x + station.slots[activity.slot];
      if (kind === 'bed') { x -= 27; y = station.y + 40; }
      else if (kind === 'bath') y = station.y - 30;
      else if (kind === 'meal') y = station.y + (station.appearance === 'snack' ? 10 : -35);
      else if (kind === 'piano' && station.appearance === 'music-box') { x -= 70; y = station.y; }
      else if (kind === 'couch' || kind === 'book' || kind === 'piano') y = station.y - 18;
      else if (kind === 'toys') y = station.y - 35;
      else if (kind === 'draw') x += activity.slot === 0 ? -95 : 95;
      else if (kind === 'wash') x -= 58;
      else if (kind === 'swing') { x += reduced ? 0 : Math.sin(time * 1.7) * 12; y = station.y - 30; }
      else if (kind === 'dance') x += reduced ? 0 : Math.sin(time * 2.5) * 8;
    }
    if (isCarried && carry) { x = carry.x; y = carry.y - 12; }
    const walking = !activity && !isCarried && (princess.autonomy.walk !== null || Math.abs(this.root.x - x) > 2) && (this.lastRoom === princess.room || Math.abs(this.root.x - x) < 200);
    if ((!walking && this.lastRoom !== princess.room) || marker !== this.lastActivity || isCarried) this.root.setPosition(x, y);
    else this.root.setPosition(Phaser.Math.Linear(this.root.x, x, clamp(delta / 90, 0, 1)), Phaser.Math.Linear(this.root.y, y, clamp(delta / 90, 0, 1)));
    this.lastActivity = marker;
    this.lastRoom = princess.room;
    this.worldX = this.root.x;
    this.worldY = this.root.y;
    const facing = princess.facing;
    this.root.setScale(facing * SCALE * (isCarried ? 1.07 : 1), SCALE * (isCarried ? 1.07 : 1));
    this.sleep.setScale(facing, 1);
    this.root.setDepth(isCarried ? 1800 : kind === 'bed' || kind === 'bath' ? 420 : (activity ? 700 : 810) + princess.y * 0.01);
    this.root.rotation = reduced ? 0 : kind === 'dance' ? Math.sin(time * 3.4) * 0.07 : kind === 'garden' ? Math.sin(time * 1.6) * 0.035 : 0;
    this.halo.setVisible(selected && !activity && !isCarried);
    this.headOnly = kind === 'bed' || kind === 'bath';
    for (const [name, image] of this.parts) image.setVisible(!this.headOnly || name === 'head' || name === 'hair');
    this.parts.get('hair')?.setRotation(!reduced && walking ? Math.sin(time * 8) * 0.025 : 0).setCrop(this.headOnly ? new Phaser.Geom.Rectangle(0, 0, 240, 160) : undefined);
    const seated = ['meal', 'couch', 'book', 'piano', 'swing'].includes(kind ?? '') && station?.appearance !== 'music-box';
    this.parts.get('dress')?.setTexture(characterKey(princess.id, seated ? 'seated' : 'dress'));
    const blinking = !reduced && Math.sin(time * 0.86 + roomIndex(princess.room)) > 0.997;
    const sleeping = kind === 'bed' || kind === 'couch';
    this.parts.get('head')?.setTexture(characterKey(princess.id, sleeping || blinking ? 'closed' : princess.poutUntil > time * 1000 ? 'pout' : 'head'));
    this.parts.get('head')?.setY(-325 + (sleeping && !reduced ? Math.sin(time * 1.7) * 1.6 : 0));
    const leftArm = this.parts.get('left-arm');
    const rightArm = this.parts.get('right-arm');
    if (leftArm && rightArm) {
      const cycle = reduced ? 0 : Math.sin(time * (walking ? 8 : 3));
      let left = walking ? cycle * 0.24 : 0;
      let right = walking ? -cycle * 0.24 : 0;
      const idleGesture = (time + PRINCESS_IDS.indexOf(princess.id) * 1.9) % 14;
      if (isCarried) { left = 0.9; right = -0.9; }
      else if (kind === 'meal') right = 1.8 + cycle * 0.38;
      else if (kind === 'piano' || kind === 'toys' || kind === 'wash') { left = -0.6 + cycle * 0.15; right = 0.6 - cycle * 0.15; }
      else if (kind === 'draw') right = -0.8 + cycle * 0.3;
      else if (kind === 'book') { left = -0.8; right = 0.8; }
      else if (kind === 'dance') { left = 0.55 + cycle * 0.2; right = -0.55 - cycle * 0.2; }
      else if (kind === 'swing') { left = -0.8; right = 0.8; }
      else if (kind === 'garden') right = 0.9 + cycle * 0.15;
      else if (princess.poutUntil > time * 1000) { left = -1; right = 1; }
      else if (!activity && !walking && !reduced && idleGesture < 2.2) right = -1.15 + Math.sin(time * 8) * 0.18;
      else if (!activity && !walking && !reduced && idleGesture > 9 && idleGesture < 10.5) left = -0.65;
      leftArm.rotation = left;
      rightArm.rotation = right;
    }
    for (const name of ['left-leg', 'right-leg']) {
      const leg = this.parts.get(name);
      if (leg) {
        leg.setY(seated ? -52 : -22);
        leg.rotation = reduced ? 0 : walking || kind === 'dance' ? Math.sin(time * 8 + (name === 'left-leg' ? 0 : Math.PI)) * 0.22 : 0;
      }
    }
    const need = urgentNeed(princess.needs);
    this.thought.setVisible(need !== null && !activity && !isCarried && !sleeping);
    if (need) this.thoughtIcon.setTexture(`icon-${NEED_TEXTURES[need]}`);
    this.thought.setY(reduced ? 0 : Math.sin(time * 1.7) * 4);
    this.sleep.setVisible(sleeping);
    this.sleep.setY(-372 - (reduced ? 0 : (Math.sin(time * 1.3) + 1) * 8)).setAlpha(reduced ? 0.85 : 0.65 + Math.sin(time * 1.3) * 0.2);
    this.accessory.clear();
    if (kind === 'meal') {
      const chewing = reduced ? 1 : 1 + Math.sin(time * 9) * 0.35;
      this.accessory.fillStyle(0x9b665e).fillEllipse(2, -194, 11, 5 * chewing);
      this.accessory.lineStyle(3, 0xc5af86).lineBetween(15, -168, 5, -194).fillStyle(0xe5d4b0).fillEllipse(3, -196, 9, 5);
    } else if (kind === 'book') {
      this.accessory.fillStyle(0xfaf0d2).fillRoundedRect(-31, -159, 65, 43, 3).lineStyle(2, 0xb6a281).lineBetween(0, -159, 0, -116);
      const flip = reduced ? 12 : Math.sin(time * 1.5) * 19;
      this.accessory.lineStyle(1, 0xd2bea0).lineBetween(5, -153, flip, -144).lineBetween(5, -143, flip, -134);
    } else if (kind === 'garden') {
      this.accessory.fillStyle(0x9bbba9).fillRoundedRect(44, -116, 34, 28, 5).lineStyle(4, 0x6d9c89).lineBetween(75, -110, 97, -123);
      if (!reduced) this.accessory.fillStyle(0xb5dce3, 0.7).fillCircle(100, -111 + (time * 33) % 24, 3).fillCircle(106, -100 + (time * 33) % 24, 2);
    }
  }
}

class StationView {
  back: Phaser.GameObjects.Image;
  private front?: Phaser.GameObjects.Image;
  private details: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Graphics;
  private shade?: Phaser.GameObjects.Graphics;
  private count: Phaser.GameObjects.Text;
  private x: number;

  constructor(private scene: Phaser.Scene, readonly station: Station) {
    this.x = roomIndex(station.room) * ROOM_WIDTH + station.x;
    const type = station.activity;
    const back = station.appearance === 'music-box' ? 'music-box' : type === 'bed' ? 'bed-back' : type === 'bath' ? 'bath-back' : type === 'meal' ? `${station.appearance ?? 'meal'}-back` : type === 'toilet' ? 'toilet-open' : type;
    this.back = scene.add.image(this.x, station.y, `prop-${back}`).setOrigin(0.5, 1).setDisplaySize(station.width, station.height).setDepth(250);
    if (type === 'bed' || type === 'bath' || type === 'meal') {
      this.front = scene.add.image(this.x, station.y, `prop-${type === 'meal' ? station.appearance ?? type : type}-front`).setOrigin(0.5, 1).setDisplaySize(station.width, station.height).setDepth(type === 'meal' ? 730 : 550);
    }
    this.details = scene.add.graphics().setDepth(780);
    this.glow = scene.add.graphics().setDepth(790);
    this.count = scene.add.text(this.x, station.y - station.height - 16, '', { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#786452', backgroundColor: '#fff9e9', padding: { x: 8, y: 4 } }).setOrigin(0.5).setDepth(800);
    if (type === 'bed') this.shade = scene.add.graphics().fillStyle(0x60677d, 0.12).fillRoundedRect(this.x - station.width / 2, station.y - station.height, station.width, station.height, 16).setDepth(770);
  }
  update(princesses: readonly Princess[], time: number, highlighted: boolean, visible: boolean, reduced: boolean): void {
    const active = princesses.filter(princess => princess.activity?.kind === 'active' && princess.activity.stationId === this.station.id);
    const waiting = princesses.filter(princess => princess.activity?.kind === 'waiting' && princess.activity.stationId === this.station.id).length;
    this.back.setVisible(visible);
    this.front?.setVisible(visible);
    this.details.setVisible(visible);
    this.glow.setVisible(visible);
    this.shade?.setVisible(visible && active.length > 0);
    if (this.station.activity === 'bed') this.front?.setDisplaySize(this.station.width, this.station.height * (active.length && !reduced ? 1 + Math.sin(time * 1.7) * 0.006 : 1));
    this.count.setVisible(visible && (highlighted || waiting > 0));
    this.count.setText(`${active.length}/${this.station.slots.length}${waiting ? ` +${waiting}` : ''}`);
    if (!visible) return;
    if (this.station.activity === 'toilet') this.back.setTexture(active.length ? 'prop-toilet-closed' : 'prop-toilet-open').setDisplaySize(this.station.width, this.station.height);
    this.glow.clear();
    if (highlighted) this.glow.lineStyle(4, 0xf6dfa1, 0.95).strokeRoundedRect(this.x - this.station.width / 2 - 7, this.station.y - this.station.height - 7, this.station.width + 14, this.station.height + 14, 18);
    this.details.clear();
    const y = this.station.y;
    const wave = reduced ? 0 : Math.sin(time * 2.1);
    if (this.station.activity === 'bath') {
      this.details.lineStyle(4, 0xafd8df, 0.65).lineBetween(this.x + 117, y - 189, this.x + 117, y - 138);
      for (let index = 0; index < 6; index++) {
        const rise = reduced ? index * 13 : ((time * 27 + index * 21) % 90);
        this.details.lineStyle(1.3, 0xa8cbd1, 0.7).fillStyle(0xf3ffff, 0.45).fillCircle(this.x - 99 + index * 31, y - 138 - rise, 5 + index % 3 * 3)
          .strokeCircle(this.x - 99 + index * 31, y - 138 - rise, 5 + index % 3 * 3);
      }
    } else if (this.station.activity === 'meal') {
      this.details.lineStyle(2, 0xfff9e9, 0.7);
      for (let i = 0; i < 3; i++) this.details.lineBetween(this.x - 13 + i * 13 + wave * 3, y - this.station.height + 17, this.x - 13 + i * 13 - wave * 2, y - this.station.height - 7);
    } else if (this.station.activity === 'wash' && active.length) {
      this.details.lineStyle(4, 0xb1dbe1, 0.7).lineBetween(this.x + 26, y - 145, this.x + 26, y - 109);
    } else if ((this.station.activity === 'piano' || this.station.activity === 'dance') && active.length) {
      for (let i = 0; i < 3; i++) {
        const rise = reduced ? 20 + i * 15 : (time * 35 + i * 33) % 100;
        const nx = this.x + 15 + i * 29 + wave * 4;
        const ny = y - this.station.height - rise;
        this.details.lineStyle(2, 0xa295bf, 0.75).lineBetween(nx, ny, nx, ny - 18).lineBetween(nx, ny - 18, nx + 10, ny - 21).fillStyle(0xa295bf, 0.7).fillEllipse(nx - 4, ny, 10, 6);
      }
    } else if (this.station.activity === 'toys' && active.length) {
      this.details.fillStyle(0xe2bf93).fillRoundedRect(this.x + wave * 5 - 8, y - 154 + wave * 5, 21, 18, 3);
    } else if (this.station.activity === 'draw' && active.length) {
      this.details.lineStyle(3, 0xd4a4b9, 0.85).lineBetween(this.x - 10, y - 164, this.x + 20 + wave * 9, y - 152).lineBetween(this.x - 10, y - 150, this.x + 30 - wave * 8, y - 137);
    } else if (this.station.activity === 'swing') {
      this.back.rotation = active.length && !reduced ? wave * 0.04 : 0;
    } else if (this.station.activity === 'garden') {
      for (let i = 0; i < 3; i++) {
        const bx = this.x - 60 + i * 55 + (reduced ? 0 : Math.sin(time + i) * 12);
        const by = y - 160 + (reduced ? 0 : Math.cos(time * 1.4 + i) * 10);
        this.details.fillStyle(i % 2 ? 0xdbb2c3 : 0xe4d099, 0.85).fillEllipse(bx - 4, by, 10, 14).fillEllipse(bx + 4, by, 10, 14).lineStyle(1, 0x8b8876).lineBetween(bx, by - 4, bx, by + 5);
      }
    }
  }
}

export class MansionScene extends Phaser.Scene implements SceneControls {
  private actors = new Map<PrincessId, PrincessActor>();
  private stations: StationView[] = [];
  private backgrounds: Phaser.GameObjects.Image[] = [];
  private carry: Carry | null = null;
  private pointerId: number | null = null;
  private pressedId: PrincessId | null = null;
  private pointerStart = { x: 0, y: 0, scrollX: 0 };
  private dragging = false;
  private lastCenter = 0;
  private reduced = false;
  private loadingCharacters = false;
  private assetFailed = false;
  private removeEffects?: () => void;
  private particleCount = 0;
  private cameraTween?: Phaser.Tweens.Tween;
  private media?: MediaQueryList;
  private assetPause = `mansion-assets-${++sceneNumber}`;
  private shutdownDone = false;
  private viewport = { width: 0, height: 0 };
  private windowSize = { width: 0, height: 0 };

  constructor(private controller: MansionController, private bridge: SceneBridge) { super({ key: 'royal-mansion' }); }

  preload(): void {
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);
    this.controller.pause(this.assetPause, true);
    this.bridge.loading(true);
    this.load.on('loaderror', this.loadError, this);
    for (const room of ROOM_IDS) this.load.svg(`room-${room}`, artUrl(`rooms/${room}.svg`));
    for (const prop of PROP_TEXTURES) this.load.svg(`prop-${prop}`, artUrl(`props/${prop}.svg`));
    for (const icon of ['meal', 'moon', 'bubble', 'door', 'star', 'heart']) this.load.svg(`icon-${icon}`, artUrl(`icons/${icon}.svg`));
    this.loadCharacters();
  }

  private loadError(): void { this.assetFailed = true; this.controller.pause(this.assetPause, true); this.bridge.error(); }

  private loadCharacters(): void {
    for (const princess of this.controller.state.princesses) {
      if (!this.textures.exists(`portrait-${princess.id}`)) this.load.svg(`portrait-${princess.id}`, artUrl(`characters/${princess.id}-portrait.svg`));
      for (const part of CHARACTER_PARTS) {
        const key = characterKey(princess.id, part);
        if (!this.textures.exists(key)) this.load.svg(key, artUrl(`characters/${princess.id}-${part}.svg`));
      }
    }
  }

  create(): void {
    this.media = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = this.media.matches;
    this.media.addEventListener('change', this.motionChanged);
    if (this.assetFailed) { this.bridge.loading(false); return; }
    this.add.rectangle(ROOM_IDS.length * ROOM_WIDTH / 2, WORLD_HEIGHT / 2, ROOM_IDS.length * ROOM_WIDTH, WORLD_HEIGHT, 0xe0c6ac).setDepth(-200);
    for (const [index, room] of ROOM_IDS.entries()) {
      const background = this.add.image(index * ROOM_WIDTH, 0, `room-${room}`).setOrigin(0).setDepth(-100);
      this.backgrounds.push(background);
    }
    this.stations = STATIONS.map(station => new StationView(this, station));
    for (const princess of this.controller.state.princesses) this.actors.set(princess.id, new PrincessActor(this, princess));
    this.cameras.main.setBounds(0, 0, ROOM_IDS.length * ROOM_WIDTH, WORLD_HEIGHT);
    this.resize();
    this.scale.on('resize', this.resize, this);
    this.input.on('pointerdown', this.pointerDown, this);
    this.input.on('pointermove', this.pointerMove, this);
    this.input.on('pointerup', this.pointerUp, this);
    this.input.on('pointerupoutside', this.pointerCancel, this);
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('blur', this.windowBlur);
    this.game.canvas.addEventListener('pointercancel', this.pointerCancel);
    this.game.canvas.addEventListener('touchcancel', this.pointerCancel);
    // React can move the canvas without resizing it; refresh before Phaser normalizes input.
    for (const event of DOM_INPUT_EVENTS) this.game.canvas.addEventListener(event, this.refreshInputBounds, { capture: true, passive: true });
    this.game.canvas.tabIndex = 0;
    this.game.canvas.setAttribute('role', 'img');
    this.removeEffects = this.controller.onEffect(effect => {
      if (effect.type === 'completed' || effect.type === 'invited') {
        const princess = this.controller.state.princesses.find(item => item.id === effect.princessId);
        if (princess) this.sparkle(roomIndex(princess.room) * ROOM_WIDTH + princess.x, princess.y - 100, effect.type === 'invited' ? 14 : 8);
      }
    });
    this.update(0, 0);
    this.bridge.ready(this);
    this.bridge.loading(false);
    this.controller.pause(this.assetPause, false);
    this.controller.pause('bootstrap', false);
  }

  private motionChanged = (): void => { this.reduced = this.media?.matches ?? false; };
  private windowBlur = (): void => { this.pointerCancel(); };
  private refreshInputBounds = (): void => { this.scale.updateBounds(); };
  private resize(): void {
    if (this.windowSize.width !== window.innerWidth || this.windowSize.height !== window.innerHeight) {
      this.windowSize = { width: window.innerWidth, height: window.innerHeight };
      this.pointerCancel();
    }
    this.scale.updateBounds();
    if (this.viewport.width === this.scale.width && this.viewport.height === this.scale.height) return;
    this.viewport = { width: this.scale.width, height: this.scale.height };
    this.cameraTween?.stop();
    const camera = this.cameras.main;
    camera.setZoom(this.scale.height / WORLD_HEIGHT);
    camera.centerOn(this.controller.state.cameraCenterX, WORLD_HEIGHT / 2);
    this.lastCenter = this.controller.state.cameraCenterX;
  }
  private world(pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    return this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }
  private nearestStation(x: number, y: number): Station | undefined {
    return STATIONS.filter(station => {
      const sx = roomIndex(station.room) * ROOM_WIDTH + station.x;
      return Math.abs(x - sx) <= station.width / 2 + 26 && y >= station.y - station.height - 20 && y <= station.y + 34;
    }).sort((a, b) => Math.abs(x - (roomIndex(a.room) * ROOM_WIDTH + a.x)) - Math.abs(x - (roomIndex(b.room) * ROOM_WIDTH + b.x)))[0];
  }
  private pointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.controller.paused || this.pointerId !== null) return;
    this.game.canvas.focus({ preventScroll: true });
    this.pointerId = pointer.id;
    this.pointerStart = { x: pointer.x, y: pointer.y, scrollX: this.cameras.main.scrollX };
    this.dragging = false;
    const point = this.world(pointer);
    if (this.carry) {
      const station = this.nearestStation(point.x, point.y);
      this.drop(point.x, point.y, station?.id);
      this.pointerId = null;
      return;
    }
    this.pressedId = [...this.actors.entries()].reverse().find(([, actor]) => actor.hit(point.x, point.y))?.[0] ?? null;
  }
  private pointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId || this.controller.paused) return;
    const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.pointerStart.x, this.pointerStart.y);
    if (!this.dragging && distance < 6) return;
    if (!this.dragging) {
      this.dragging = true;
      this.cameraTween?.stop();
      if (this.pressedId) {
        const princess = this.controller.state.princesses.find(item => item.id === this.pressedId);
        if (princess) {
          const point = this.cameras.main.getWorldPoint(this.pointerStart.x, this.pointerStart.y);
          this.pickUp(princess.id);
          if (this.carry) { this.carry.offsetX = this.carry.x - point.x; this.carry.offsetY = this.carry.y - point.y; }
        }
      }
    }
    if (this.carry) {
      const point = this.world(pointer);
      this.carry.x = point.x + this.carry.offsetX;
      this.carry.y = point.y + this.carry.offsetY;
    } else this.cameras.main.scrollX = this.cameras.main.clampX(this.pointerStart.scrollX - (pointer.x - this.pointerStart.x) / this.cameras.main.zoom);
  }
  private pointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    if (!this.controller.paused) {
      const panning = this.dragging && !this.carry;
      if (this.dragging && this.carry) this.drop(this.carry.x, this.carry.y);
      else if (!this.dragging && this.pressedId) this.controller.dispatch({ type: 'select', id: this.pressedId });
      else if (!this.dragging) {
        const point = this.world(pointer);
        this.sparkle(point.x, point.y, 4);
        this.bridge.decorative();
      }
      if (panning) this.rememberCamera();
    }
    this.pointerId = null;
    this.pressedId = null;
    this.dragging = false;
  }
  private pointerCancel = (): void => {
    this.cancelMove();
    this.pointerId = null;
    this.pressedId = null;
    this.dragging = false;
  };
  private viewLeft(): number {
    const camera = this.cameras.main;
    // Phaser scroll coordinates use the unzoomed viewport center.
    return camera.scrollX + camera.width / 2 - camera.displayWidth / 2;
  }
  private rememberCamera(): void {
    const center = this.cameras.main.scrollX + this.cameras.main.width / 2;
    const room = ROOM_IDS[clamp(Math.floor(center / ROOM_WIDTH), 0, ROOM_IDS.length - 1)];
    this.lastCenter = center;
    this.controller.dispatch({ type: 'camera', room, centerX: center });
  }
  private pickUp(id: PrincessId): Carry | null {
    const princess = this.controller.state.princesses.find(item => item.id === id);
    if (!princess) { this.controller.dispatch({ type: 'select', id, focus: false }); return null; }
    const actor = this.actors.get(id);
    const visible = actor && !actor.hidden;
    const x = visible ? actor.root.x : roomIndex(princess.room) * ROOM_WIDTH + princess.x;
    const y = visible ? actor.root.y : princess.y;
    this.controller.dispatch({ type: 'select', id, focus: false });
    this.controller.dispatch({ type: 'cancel', id, focus: false });
    this.controller.hold(this.assetPause, id);
    this.carry = { id, x, y, offsetX: 0, offsetY: 0 };
    this.bridge.moving(true);
    return this.carry;
  }
  movePrincess(): void {
    if (this.controller.paused) return;
    if (this.carry) { this.cancelMove(); return; }
    this.cameraTween?.stop();
    const carry = this.pickUp(this.controller.state.selectedId);
    if (carry && (carry.x < this.viewLeft() + 50 || carry.x > this.viewLeft() + this.cameras.main.displayWidth - 50)) {
      carry.x = this.cameras.main.scrollX + this.cameras.main.width / 2;
      carry.y = 480;
    }
    this.game.canvas.focus({ preventScroll: true });
  }
  cancelMove(): void { this.carry = null; this.controller.hold(this.assetPause, null); this.bridge.moving(false); }
  refreshBounds(): void { this.scale.updateBounds(); }
  placeAtStation(stationId: string): void {
    if (this.controller.paused) return;
    const station = getStation(stationId);
    const id = this.carry?.id ?? this.controller.state.selectedId;
    if (!station) {
      this.controller.dispatch({ type: 'place', id, room: this.controller.state.cameraRoom, x: 70, y: 480, stationId });
      return;
    }
    this.controller.dispatch({ type: 'place', id, room: station.room, x: station.x, y: 480, stationId });
    this.cancelMove();
  }
  private drop(x: number, y: number, stationId?: string): void {
    if (!this.carry) return;
    if (x < 0 || x > ROOM_WIDTH * ROOM_IDS.length || y < 130 || y > WORLD_HEIGHT + 100) { this.cancelMove(); return; }
    const room = ROOM_IDS[clamp(Math.floor(x / ROOM_WIDTH), 0, ROOM_IDS.length - 1)];
    const station = stationId ? getStation(stationId) : this.nearestStation(x, clamp(y, 430, 490));
    this.controller.dispatch({ type: 'place', id: this.carry.id, room, x: x - roomIndex(room) * ROOM_WIDTH, y: clamp(y, 430, 490), stationId: station?.id });
    this.cancelMove();
    if (!station) this.rememberCamera();
  }
  private keyDown = (event: KeyboardEvent): void => {
    if (this.controller.paused || event.altKey || event.ctrlKey || event.metaKey) return;
    const element = document.activeElement;
    if (element instanceof HTMLElement && ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) return;
    const key = event.key.toLowerCase();
    if (!['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', ' ', 'enter', 'escape'].includes(key)) return;
    if (event.repeat && [' ', 'enter', 'escape'].includes(key)) return;
    event.preventDefault();
    if (key === 'escape') { if (this.carry) { this.cancelMove(); this.bridge.decorative(); } else this.bridge.pause(); return; }
    if (key === ' ' || key === 'enter') {
      if (this.carry) this.drop(this.carry.x, this.carry.y); else this.movePrincess();
      return;
    }
    const dx = key === 'arrowleft' || key === 'a' ? -1 : key === 'arrowright' || key === 'd' ? 1 : 0;
    const dy = key === 'arrowup' || key === 'w' ? -1 : key === 'arrowdown' || key === 's' ? 1 : 0;
    if (this.carry) {
      this.cameraTween?.stop();
      this.carry.x = clamp(this.carry.x + dx * 28, 70, ROOM_WIDTH * ROOM_IDS.length - 70);
      this.carry.y = clamp(this.carry.y + dy * 14, 430, 490);
      this.cameras.main.centerOn(this.carry.x, WORLD_HEIGHT / 2);
      this.rememberCamera();
    } else if (dx) {
      this.cameraTween?.stop();
      this.cameras.main.scrollX = this.cameras.main.clampX(this.cameras.main.scrollX + dx * 75);
      this.rememberCamera();
    } else {
      const index = clamp(roomIndex(this.controller.state.cameraRoom) + dy, 0, ROOM_IDS.length - 1);
      this.controller.dispatch({ type: 'camera', room: ROOM_IDS[index] });
    }
  };

  private sparkle(x: number, y: number, amount: number): void {
    if (this.reduced || x < this.viewLeft() - 40 || x > this.viewLeft() + this.cameras.main.displayWidth + 40) return;
    for (let i = 0; i < amount && this.particleCount < 80; i++) {
      const image = this.add.image(x, y, i % 3 ? 'icon-star' : 'icon-heart').setDisplaySize(12 + i % 3 * 4, 12 + i % 3 * 4).setDepth(1900);
      this.particleCount++;
      this.tweens.add({ targets: image, x: x + Math.cos(i * 2.4) * (35 + i * 3), y: y - 20 - i * 7, alpha: 0, angle: i * 23, duration: 1100, onComplete: () => { image.destroy(); this.particleCount--; } });
    }
  }

  update(_time: number, delta: number): void {
    if (this.assetFailed) return;
    this.controller.tick(delta);
    const state = this.controller.state;
    const missing = state.princesses.some(princess => !this.actors.has(princess.id));
    if (missing && !this.loadingCharacters) {
      this.loadingCharacters = true;
      this.controller.pause(this.assetPause, true);
      this.bridge.loading(true);
      this.loadCharacters();
      this.load.once('complete', () => {
        if (!this.assetFailed) {
          for (const princess of this.controller.state.princesses) {
            if (!this.actors.has(princess.id) && CHARACTER_PARTS.every(part => this.textures.exists(characterKey(princess.id, part)))) this.actors.set(princess.id, new PrincessActor(this, princess));
          }
          if (this.controller.state.princesses.every(princess => this.actors.has(princess.id))) {
            this.controller.pause(this.assetPause, false);
            this.bridge.loading(false);
          }
        }
        this.loadingCharacters = false;
      });
      this.load.start();
    }
    if (this.controller.paused && this.carry) this.pointerCancel();
    if (state.cameraCenterX !== this.lastCenter && !this.dragging) {
      this.lastCenter = state.cameraCenterX;
      this.cameraTween?.stop();
      const scrollX = this.cameras.main.clampX(state.cameraCenterX - this.cameras.main.width / 2);
      this.cameraTween = this.tweens.add({ targets: this.cameras.main, scrollX, duration: this.reduced ? 0 : 420, ease: 'Sine.easeInOut' });
      if (this.carry && this.pointerId === null) { this.carry.x = state.cameraCenterX; this.carry.y = 480; }
    }
    if (this.carry && this.dragging && this.pointerId !== null) {
      const pointer = this.input.manager.pointers.find(item => item.id === this.pointerId);
      if (pointer) {
        const direction = pointer.x < 54 ? -1 : pointer.x > this.scale.width - 54 ? 1 : 0;
        this.cameras.main.scrollX = this.cameras.main.clampX(this.cameras.main.scrollX + direction * delta * 0.5);
        const point = this.world(pointer);
        this.carry.x = point.x + this.carry.offsetX;
        this.carry.y = point.y + this.carry.offsetY;
      }
    }
    const left = this.viewLeft();
    const right = left + this.cameras.main.displayWidth;
    const time = state.activeTime / 1000;
    this.backgrounds.forEach((image, index) => {
      const base = index * ROOM_WIDTH;
      image.setVisible(base + ROOM_WIDTH >= left - 10 && base <= right + 10);
      image.setTint(index === 0 && state.princesses.some(princess => princess.activity?.kind === 'active' && getStation(princess.activity.stationId)?.activity === 'bed') ? 0xd0d4df : 0xffffff);
      image.setX(base + (this.reduced ? 0 : clamp((left - base) * 0.015, -7, 7))).setDisplaySize(ROOM_WIDTH + 8, WORLD_HEIGHT);
    });
    const highlighted = this.carry ? this.nearestStation(this.carry.x, this.carry.y)?.id : undefined;
    for (const view of this.stations) {
      const start = roomIndex(view.station.room) * ROOM_WIDTH;
      view.update(state.princesses, time, highlighted === view.station.id, start + ROOM_WIDTH >= left && start <= right, this.reduced);
    }
    for (const princess of state.princesses) {
      const actor = this.actors.get(princess.id);
      if (!actor) continue;
      const start = roomIndex(princess.room) * ROOM_WIDTH;
      if ((start + ROOM_WIDTH < left || start > right) && this.carry?.id !== princess.id) actor.root.setVisible(false);
      else actor.update(princess, time, delta, princess.id === state.selectedId, this.carry, this.reduced);
    }
  }

  private shutdown(): void {
    if (this.shutdownDone) return;
    this.shutdownDone = true;
    this.cameraTween?.stop();
    this.removeEffects?.();
    this.scale.off('resize', this.resize, this);
    this.load.off('loaderror', this.loadError, this);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('blur', this.windowBlur);
    this.media?.removeEventListener('change', this.motionChanged);
    this.game.canvas.removeEventListener('pointercancel', this.pointerCancel);
    this.game.canvas.removeEventListener('touchcancel', this.pointerCancel);
    for (const event of DOM_INPUT_EVENTS) this.game.canvas.removeEventListener(event, this.refreshInputBounds, true);
    this.bridge.ready(null);
    this.bridge.moving(false);
    this.controller.hold(this.assetPause, null);
    this.controller.pause(this.assetPause, false);
  }
}
