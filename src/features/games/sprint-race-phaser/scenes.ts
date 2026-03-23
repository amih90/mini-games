import Phaser from 'phaser';
import { loadHighScore, saveHighScore, clamp, randomBetween } from '../shared/phaser/gameUtils';

/* ================================================================== */
/*  Procedural Sound Engine (Web Audio API)                            */
/* ================================================================== */

class RetroSFX {
  private ctx: AudioContext | null = null;
  _muted = false;

  get muted() { return this._muted; }
  set muted(v: boolean) {
    this._muted = v;
    if (typeof window !== 'undefined') localStorage.setItem('mini-games-sound-muted', String(v));
  }

  ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  unlock() { this.ensureCtx(); }

  click() { this.beep(1000, 0.05, 'square'); }

  countdown() { this.beep(440, 0.3, 'sine'); }

  whistle() {
    const ctx = this.ensureCtx();
    if (!ctx || this._muted) return;
    for (const freq of [2200, 2600]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 0.8, ctx.currentTime + 0.4);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.4);
    }
  }

  gunshot() {
    const ctx = this.ensureCtx();
    if (!ctx || this._muted) return;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 0.15);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain();
    src.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.6, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    src.start(ctx.currentTime);
  }

  crowdRoar() {
    const ctx = this.ensureCtx();
    if (!ctx || this._muted) return;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 2);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.3;
    const g = ctx.createGain();
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.01, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.3);
    g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.0);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);
    src.start(ctx.currentTime); src.stop(ctx.currentTime + 2.0);
  }

  hurdleHit() {
    const ctx = this.ensureCtx();
    if (!ctx || this._muted) return;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 0.08);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); src.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    src.start(ctx.currentTime);
    const o = ctx.createOscillator(); const g2 = ctx.createGain();
    o.connect(g2); g2.connect(ctx.destination);
    o.frequency.value = 80; o.type = 'sine';
    g2.gain.setValueAtTime(0.3, ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.12);
  }

  tap() {
    const ctx = this.ensureCtx();
    if (!ctx || this._muted) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 200 + Math.random() * 300; o.type = 'triangle';
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.04);
  }

  jump() {
    const ctx = this.ensureCtx();
    if (!ctx || this._muted) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(300, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    o.type = 'sine';
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15);
  }

  win() {
    const ctx = this.ensureCtx();
    if (!ctx || this._muted) return;
    const melody = [
      { freq: 523, time: 0 }, { freq: 659, time: 0.12 },
      { freq: 784, time: 0.24 }, { freq: 1047, time: 0.36 },
      { freq: 784, time: 0.48 }, { freq: 1047, time: 0.60 },
    ];
    for (const { freq, time } of melody) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq; o.type = 'sine';
      const s = ctx.currentTime + time;
      g.gain.setValueAtTime(0.25, s);
      g.gain.exponentialRampToValueAtTime(0.01, s + 0.12);
      o.start(s); o.stop(s + 0.12);
    }
  }

  gameOver() {
    const ctx = this.ensureCtx();
    if (!ctx || this._muted) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(440, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.5);
  }

  falseStart() { this.beep(200, 0.5, 'sawtooth'); }

  powerUp() {
    const ctx = this.ensureCtx();
    if (!ctx || this._muted) return;
    const notes = [440, 554, 659, 880];
    for (let i = 0; i < notes.length; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = notes[i]; o.type = 'triangle';
      const s = ctx.currentTime + i * 0.05;
      g.gain.setValueAtTime(0.2, s);
      g.gain.exponentialRampToValueAtTime(0.01, s + 0.1);
      o.start(s); o.stop(s + 0.1);
    }
  }

  whoosh() {
    const ctx = this.ensureCtx();
    if (!ctx || this._muted) return;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 0.08);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 0.5;
    const g = ctx.createGain();
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    src.start(ctx.currentTime);
  }

  private beep(freq = 440, dur = 0.1, type: OscillatorType = 'square') {
    const ctx = this.ensureCtx();
    if (!ctx || this._muted) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = freq; o.type = type;
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + dur);
  }
}

const sfx = new RetroSFX();

/* ================================================================== */
/*  Translations (4 languages)                                        */
/* ================================================================== */

const T: Record<string, Record<string, string>> = {
  en: {
    title: 'Olympic Sprint',
    ev100: '🏃 100m Sprint', ev200: '🏃 200m Sprint',
    ev400: '🏃 400m Sprint', ev110h: '🏃‍♂️ 110m Hurdles',
    desc100: 'Pure speed! Tap as fast as you can.',
    desc200: 'Staggered start on the curve.',
    desc400: 'Manage your stamina wisely!',
    desc110h: 'Sprint & jump over 10 hurdles!',
    ready: 'Ready…', set: 'Set…', go: 'GO!',
    tapToRun: 'TAP / SPACE to run!',
    jumpKey: 'UP to jump',
    youWon: '🥇 Gold Medal!', youSilver: '🥈 Silver Medal!',
    youBronze: '🥉 Bronze Medal!', youLost: 'Race Over',
    raceAgain: 'Race Again', nextEvent: 'Next Event', menu: 'Menu',
    best: 'Best', time: 'Time', newBest: '🌟 New Record!',
    you: 'YOU', position: 'Position', speed: 'Speed',
    sprint: 'SPRINT!', tapsPerSec: 'taps/s',
    falseStart: '⚠️ False Start!', photoFinish: '📸 Photo Finish!',
    howToPlay: 'TAP/SPACE = Run · UP = Jump (Hurdles)',
    stamina: 'Stamina', hurdlesCleared: 'Hurdles',
    selectEvent: 'Select Event',
  },
  he: {
    title: 'ספרינט אולימפי',
    ev100: '🏃 ספרינט 100 מ׳', ev200: '🏃 ספרינט 200 מ׳',
    ev400: '🏃 ספרינט 400 מ׳', ev110h: '🏃‍♂️ משוכות 110 מ׳',
    desc100: '!מהירות טהורה! הקישו הכי מהר',
    desc200: '.זינוק מדורג בעקומה',
    desc400: '!נהלו את הסיבולת שלכם',
    desc110h: '!רוצו וקפצו מעל 10 משוכות',
    ready: '…מוכנים', set: '…היכון', go: '!צא',
    tapToRun: '!לחץ / רווח כדי לרוץ',
    jumpKey: 'למעלה לקפוץ',
    youWon: '🥇 !מדליית זהב', youSilver: '🥈 !מדליית כסף',
    youBronze: '🥉 !מדליית ארד', youLost: 'המרוץ נגמר',
    raceAgain: 'שוב', nextEvent: 'התחרות הבאה', menu: 'תפריט',
    best: 'שיא', time: 'זמן', newBest: '!שיא חדש 🌟',
    you: 'את/ה', position: 'מיקום', speed: 'מהירות',
    sprint: '!רוץ', tapsPerSec: 'הקשות/שנ',
    falseStart: '!זינוק מוקדם ⚠️', photoFinish: '!פוטו פיניש 📸',
    howToPlay: 'הקשה/רווח = רוץ · למעלה = קפוץ',
    stamina: 'סיבולת', hurdlesCleared: 'משוכות',
    selectEvent: 'בחר תחרות',
  },
  zh: {
    title: '奥运短跑',
    ev100: '🏃 100米短跑', ev200: '🏃 200米短跑',
    ev400: '🏃 400米短跑', ev110h: '🏃‍♂️ 110米跨栏',
    desc100: '纯速度！尽快点击！',
    desc200: '弯道错位起跑。',
    desc400: '管理你的体力！',
    desc110h: '冲刺并跨越10个栏架！',
    ready: '准备…', set: '预备…', go: '跑！',
    tapToRun: '点击 / 空格 跑步！',
    jumpKey: '上键跳跃',
    youWon: '🥇 金牌！', youSilver: '🥈 银牌！',
    youBronze: '🥉 铜牌！', youLost: '比赛结束',
    raceAgain: '再来一次', nextEvent: '下一个项目', menu: '菜单',
    best: '最佳', time: '时间', newBest: '🌟 新纪录！',
    you: '你', position: '名次', speed: '速度',
    sprint: '冲刺！', tapsPerSec: '次/秒',
    falseStart: '⚠️ 抢跑！', photoFinish: '📸 冲刺决胜！',
    howToPlay: '点击/空格 = 跑 · 上 = 跳(跨栏)',
    stamina: '体力', hurdlesCleared: '跨栏',
    selectEvent: '选择项目',
  },
  es: {
    title: 'Sprint Olímpico',
    ev100: '🏃 100m Sprint', ev200: '🏃 200m Sprint',
    ev400: '🏃 400m Sprint', ev110h: '🏃‍♂️ 110m Vallas',
    desc100: '¡Velocidad pura! ¡Toca lo más rápido!',
    desc200: 'Salida escalonada en la curva.',
    desc400: '¡Gestiona tu energía!',
    desc110h: '¡Corre y salta 10 vallas!',
    ready: 'Listos…', set: 'Preparados…', go: '¡YA!',
    tapToRun: '¡Toca / Espacio para correr!',
    jumpKey: 'Arriba para saltar',
    youWon: '🥇 ¡Oro!', youSilver: '🥈 ¡Plata!',
    youBronze: '🥉 ¡Bronce!', youLost: 'Carrera terminada',
    raceAgain: 'Otra vez', nextEvent: 'Siguiente', menu: 'Menú',
    best: 'Mejor', time: 'Tiempo', newBest: '🌟 ¡Nuevo récord!',
    you: 'TÚ', position: 'Posición', speed: 'Velocidad',
    sprint: '¡Sprint!', tapsPerSec: 'toques/s',
    falseStart: '⚠️ ¡Salida falsa!', photoFinish: '📸 ¡Foto finish!',
    howToPlay: 'Toca/Espacio = Correr · Arriba = Saltar',
    stamina: 'Energía', hurdlesCleared: 'Vallas',
    selectEvent: 'Elegir evento',
  },
};

function t(locale: string, key: string): string {
  return T[locale]?.[key] ?? T['en'][key] ?? key;
}

/* ================================================================== */
/*  Event configuration                                               */
/* ================================================================== */

export type EventType = '100m' | '200m' | '400m' | '110m-hurdles';

interface EventDef {
  finishX: number; aiSpeed: number; aiVariance: number; aiCount: number;
  decelRate: number; boostPerTap: number; playerMax: number;
  hasHurdles: boolean; hurdleCount: number; hasStamina: boolean;
  staggeredStart: boolean; staggerPx: number; color: number;
}

const EVENTS: Record<EventType, EventDef> = {
  '100m': {
    finishX: 620, aiSpeed: 0.80, aiVariance: 0.15, aiCount: 4,
    decelRate: 0.96, boostPerTap: 0.85, playerMax: 5.5,
    hasHurdles: false, hurdleCount: 0, hasStamina: false,
    staggeredStart: false, staggerPx: 0, color: 0x4caf50,
  },
  '200m': {
    finishX: 640, aiSpeed: 0.82, aiVariance: 0.16, aiCount: 4,
    decelRate: 0.955, boostPerTap: 0.80, playerMax: 5.5,
    hasHurdles: false, hurdleCount: 0, hasStamina: false,
    staggeredStart: true, staggerPx: 18, color: 0x2196f3,
  },
  '400m': {
    finishX: 640, aiSpeed: 0.75, aiVariance: 0.18, aiCount: 4,
    decelRate: 0.95, boostPerTap: 0.70, playerMax: 5.0,
    hasHurdles: false, hurdleCount: 0, hasStamina: true,
    staggeredStart: true, staggerPx: 25, color: 0xff9800,
  },
  '110m-hurdles': {
    finishX: 630, aiSpeed: 0.78, aiVariance: 0.15, aiCount: 4,
    decelRate: 0.955, boostPerTap: 0.82, playerMax: 5.3,
    hasHurdles: true, hurdleCount: 10, hasStamina: false,
    staggeredStart: false, staggerPx: 0, color: 0xf44336,
  },
};

const EVENT_ORDER: EventType[] = ['100m', '200m', '400m', '110m-hurdles'];

const HS_KEYS: Record<EventType, string> = {
  '100m': 'sprint-100m-best',
  '200m': 'sprint-200m-best',
  '400m': 'sprint-400m-best',
  '110m-hurdles': 'sprint-110h-best',
};

/* ================================================================== */
/*  Runner data                                                       */
/* ================================================================== */

interface RunnerData {
  name: string; jerseyColor: number; skinTone: number; shortsColor: number;
  x: number; startX: number; speed: number; maxSpeed: number;
  finished: boolean; finishTime: number; frame: number; lane: number;
  body: Phaser.GameObjects.Graphics; nameLabel: Phaser.GameObjects.Text;
  isPlayer: boolean; isJumping: boolean; jumpFrame: number; jumpY: number;
  nextHurdleIdx: number; hurdlesCleared: number; hurdlesHit: number;
  stamina: number; crouching: boolean;
}

const AI_POOL = [
  { name: 'Bolt',  jersey: 0xf44336, skin: 0x8d5524, shorts: 0x222222, baseMax: 5.0 },
  { name: 'Flash', jersey: 0x9c27b0, skin: 0xc68642, shorts: 0x1a237e, baseMax: 4.8 },
  { name: 'Dash',  jersey: 0xff9800, skin: 0xffdbac, shorts: 0x333333, baseMax: 4.6 },
  { name: 'Blaze', jersey: 0x00bcd4, skin: 0xf1c27d, shorts: 0x004d40, baseMax: 4.9 },
  { name: 'Storm', jersey: 0x795548, skin: 0x8d5524, shorts: 0x212121, baseMax: 4.7 },
  { name: 'Jet',   jersey: 0x607d8b, skin: 0xe0ac69, shorts: 0x263238, baseMax: 5.1 },
  { name: 'Turbo', jersey: 0xcddc39, skin: 0xffdbac, shorts: 0x33691e, baseMax: 4.5 },
];

const W = 700;
const H = 500;
const TRACK_TOP = 90;
const START_X = 70;

/* ================================================================== */
/*  Visual helpers                                                     */
/* ================================================================== */

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg2 = (b >> 8) & 0xff, bb = b & 0xff;
  return (Math.floor(ar + (br - ar) * t) << 16)
       | (Math.floor(ag + (bg2 - ag) * t) << 8)
       | Math.floor(ab + (bb - ab) * t);
}

function fillGradientV(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, top: number, bot: number, steps = 20) {
  const sh = Math.ceil(h / steps);
  for (let i = 0; i < steps; i++) {
    g.fillStyle(lerpColor(top, bot, i / (steps - 1)), 1);
    g.fillRect(x, y + sh * i, w, sh + 1);
  }
}

/* ================================================================== */
/*  Menu Scene                                                         */
/* ================================================================== */

export class MenuScene extends Phaser.Scene {
  private locale!: string;
  private stars: { x: number; y: number; speed: number; alpha: number; size: number }[] = [];
  private starGfx!: Phaser.GameObjects.Graphics;

  constructor() { super({ key: 'MenuScene' }); }

  init(data: { locale?: string }) { this.locale = data.locale || 'en'; }

  create() {
    sfx.unlock();
    const cx = W / 2;

    const stored = typeof window !== 'undefined' ? localStorage.getItem('mini-games-sound-muted') : null;
    sfx.muted = stored === 'true';

    /* Gradient background */
    const bgGfx = this.add.graphics();
    fillGradientV(bgGfx, 0, 0, W, H, 0x0a0a2e, 0x1a237e, 30);

    /* Floating stars */
    this.starGfx = this.add.graphics().setDepth(0);
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: randomBetween(0, W), y: randomBetween(0, H),
        speed: randomBetween(0.2, 0.8),
        alpha: randomBetween(0.3, 0.9),
        size: randomBetween(0.5, 2),
      });
    }

    /* Olympic rings with glow */
    this.drawOlympicRings(cx, 36);

    /* Title with shadow */
    this.add.text(cx + 2, 77, t(this.locale, 'title'), {
      fontFamily: 'sans-serif', fontSize: '36px', fontStyle: 'bold',
      color: '#000000',
    }).setOrigin(0.5).setAlpha(0.3);
    const title = this.add.text(cx, 75, t(this.locale, 'title'), {
      fontFamily: 'sans-serif', fontSize: '36px', fontStyle: 'bold',
      color: '#ffd700', stroke: '#b8860b', strokeThickness: 3,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 79, yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.easeInOut' });

    /* Gold shimmer on title */
    this.tweens.add({
      targets: title, alpha: { from: 1, to: 0.85 },
      yoyo: true, repeat: -1, duration: 800, ease: 'Sine.easeInOut',
    });

    this.add.text(cx, 110, t(this.locale, 'selectEvent'), {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#90caf9',
    }).setOrigin(0.5);

    /* 2×2 event cards with glow */
    const events: EventType[] = ['100m', '200m', '400m', '110m-hurdles'];
    const evKeys = ['ev100', 'ev200', 'ev400', 'ev110h'];
    const descKeys = ['desc100', 'desc200', 'desc400', 'desc110h'];
    const cardW = 275, cardH = 115, gapX = 18, gapY = 14;
    const gridX = cx - cardW - gapX / 2;
    const gridY = 132;

    events.forEach((ev, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = gridX + col * (cardW + gapX) + cardW / 2;
      const y = gridY + row * (cardH + gapY) + cardH / 2;

      /* Card glow behind */
      const glow = this.add.rectangle(x, y, cardW + 6, cardH + 6, EVENTS[ev].color, 0.25);
      this.tweens.add({ targets: glow, alpha: { from: 0.15, to: 0.35 }, yoyo: true, repeat: -1, duration: 1200 + i * 200 });

      /* Card background with gradient (simulate with two rects) */
      const topColor = EVENTS[ev].color;
      const cg = this.add.graphics();
      cg.fillStyle(topColor, 0.9);
      cg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);
      /* Darker bottom half overlay */
      cg.fillStyle(0x000000, 0.2);
      cg.fillRect(x - cardW / 2, y, cardW, cardH / 2);

      /* Card border */
      cg.lineStyle(2, 0xffffff, 0.6);
      cg.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);

      /* Hit area */
      const hitRect = this.add.rectangle(x, y, cardW, cardH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      /* Event emoji icon */
      const icon = this.ev.hasHurdles ? '🏃‍♂️' : '🏃';
      this.add.text(x - cardW / 2 + 16, y - 12, icon, {
        fontSize: '28px',
      }).setOrigin(0, 0.5);

      this.add.text(x + 6, y - 26, t(this.locale, evKeys[i]), {
        fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#fff',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);
      this.add.text(x + 6, y + 2, t(this.locale, descKeys[i]), {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffffcc',
        wordWrap: { width: cardW - 40 },
      }).setOrigin(0.5);

      const best = loadHighScore(HS_KEYS[ev]);
      if (best > 0) {
        this.add.text(x, y + 35, `⏱ ${t(this.locale, 'best')}: ${(best / 1000).toFixed(2)}s`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#ffee00',
          stroke: '#000', strokeThickness: 1,
        }).setOrigin(0.5);
      }

      hitRect.on('pointerover', () => {
        cg.clear();
        cg.fillStyle(topColor, 1);
        cg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);
        cg.lineStyle(3, 0xffd700, 0.9);
        cg.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);
        sfx.click();
      });
      hitRect.on('pointerout', () => {
        cg.clear();
        cg.fillStyle(topColor, 0.9);
        cg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);
        cg.fillStyle(0x000000, 0.2);
        cg.fillRect(x - cardW / 2, y, cardW, cardH / 2);
        cg.lineStyle(2, 0xffffff, 0.6);
        cg.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);
      });
      hitRect.on('pointerdown', () => {
        sfx.click();
        this.scene.start('RaceScene', { eventType: ev, locale: this.locale });
      });
    });

    /* How to play */
    const helpBg = this.add.graphics();
    helpBg.fillStyle(0x000000, 0.3);
    helpBg.fillRoundedRect(cx - 200, H - 50, 400, 30, 8);
    this.add.text(cx, H - 35, t(this.locale, 'howToPlay'), {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#90caf9',
    }).setOrigin(0.5);

    /* Running silhouette at bottom */
    const silGfx = this.add.graphics().setDepth(1).setAlpha(0.12);
    for (let i = 0; i < 5; i++) {
      const sx = 50 + i * 140;
      this.drawRunnerSilhouette(silGfx, sx, H - 60, i * 2);
    }
  }

  update(_time: number) {
    /* Animate stars */
    this.starGfx.clear();
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > H) { star.y = 0; star.x = randomBetween(0, W); }
      const twinkle = 0.5 + 0.5 * Math.sin(_time * 0.003 + star.x);
      this.starGfx.fillStyle(0xffffff, star.alpha * twinkle);
      this.starGfx.fillCircle(star.x, star.y, star.size);
    }
  }

  private drawOlympicRings(cx: number, y: number) {
    const g = this.add.graphics();
    const r = 12, sp = r * 2 + 5;
    const rings = [
      { x: cx - sp, y, c: 0x0085c7 }, { x: cx, y, c: 0x444444 },
      { x: cx + sp, y, c: 0xdf0024 },
      { x: cx - sp / 2, y: y + r, c: 0xf4c300 },
      { x: cx + sp / 2, y: y + r, c: 0x009f3d },
    ];
    /* Glow behind rings */
    for (const ring of rings) {
      g.lineStyle(6, ring.c, 0.15);
      g.strokeCircle(ring.x, ring.y, r + 3);
    }
    /* Main rings */
    for (const ring of rings) {
      g.lineStyle(3, ring.c, 1);
      g.strokeCircle(ring.x, ring.y, r);
    }
  }

  private drawRunnerSilhouette(g: Phaser.GameObjects.Graphics, x: number, y: number, frame: number) {
    const swing = Math.sin(frame * 0.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(x, y - 14, 5);
    g.fillRect(x - 3, y - 9, 6, 12);
    g.lineStyle(2, 0xffffff, 1);
    g.beginPath(); g.moveTo(x, y + 3); g.lineTo(x + swing * 8, y + 16); g.stroke();
    g.beginPath(); g.moveTo(x, y + 3); g.lineTo(x - swing * 8, y + 16); g.stroke();
  }

  private get ev(): EventDef { return EVENTS['100m']; }
}

/* ================================================================== */
/*  Race Scene                                                         */
/* ================================================================== */

type Phase = 'countdown' | 'racing' | 'finished';

export class RaceScene extends Phaser.Scene {
  private locale!: string;
  private eventType!: EventType;
  private ev!: EventDef;
  private phase: Phase = 'countdown';
  private runners: RunnerData[] = [];
  private laneH = 50;

  /* HUD */
  private countdownText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private posText!: Phaser.GameObjects.Text;
  private speedBarBg!: Phaser.GameObjects.Graphics;
  private speedBarFill!: Phaser.GameObjects.Graphics;
  private tpsText!: Phaser.GameObjects.Text;
  private stBarFill?: Phaser.GameObjects.Graphics;
  private stBarBg?: Phaser.GameObjects.Graphics;

  /* Tap zone */
  private tapZone!: Phaser.GameObjects.Rectangle;
  private tapZoneLabel!: Phaser.GameObjects.Text;

  /* Particles */
  private dustGfx!: Phaser.GameObjects.Graphics;
  private dustParts: { x: number; y: number; vx: number; vy: number; life: number; size: number; color: number }[] = [];

  /* Crowd */
  private crowdGfx!: Phaser.GameObjects.Graphics;
  private crowdDots: { x: number; y: number; baseY: number; color: number; sp: number; size: number }[] = [];

  /* Speed lines */
  private speedLineGfx!: Phaser.GameObjects.Graphics;

  /* Confetti */
  private confettiGfx!: Phaser.GameObjects.Graphics;
  private confetti: { x: number; y: number; vx: number; vy: number; color: number; rot: number; life: number; w: number; h: number }[] = [];

  /* Hurdles */
  private hurdleXs: number[] = [];
  private hurdleGfx!: Phaser.GameObjects.Graphics;

  /* Stadium lights */
  private lightGfx!: Phaser.GameObjects.Graphics;

  /* Timing */
  private raceStart = 0;
  private elapsed = 0;
  private finishX = 600;
  private tapCount = 0;
  private lastTap = 0;
  private recentTaps: number[] = [];
  private resultShown = false;
  private falseStartFlag = false;
  private cdPhase = 0;

  constructor() { super({ key: 'RaceScene' }); }

  init(data: { eventType: EventType; locale: string }) {
    this.eventType = data.eventType || '100m';
    this.locale = data.locale || 'en';
    this.ev = EVENTS[this.eventType];
    this.phase = 'countdown';
    this.runners = [];
    this.tapCount = 0;
    this.lastTap = 0;
    this.recentTaps = [];
    this.elapsed = 0;
    this.resultShown = false;
    this.dustParts = [];
    this.crowdDots = [];
    this.hurdleXs = [];
    this.confetti = [];
    this.falseStartFlag = false;
    this.cdPhase = 0;
  }

  create() {
    sfx.unlock();
    const lanes = 1 + this.ev.aiCount;
    this.laneH = Math.min(50, Math.floor((H - TRACK_TOP - 90) / lanes));
    this.finishX = this.ev.finishX;

    /* ====== SKY GRADIENT ====== */
    const skyGfx = this.add.graphics();
    fillGradientV(skyGfx, 0, 0, W, TRACK_TOP, 0x0d1b2a, 0x1b3a5c, 16);

    /* ====== STADIUM STRUCTURE ====== */
    const stadiumGfx = this.add.graphics();
    /* Stadium wall */
    stadiumGfx.fillStyle(0x1a2332, 1);
    stadiumGfx.fillRect(0, 0, W, TRACK_TOP);
    /* Stadium upper band */
    stadiumGfx.fillStyle(0x263238, 1);
    stadiumGfx.fillRect(0, 0, W, 14);
    /* Railing */
    stadiumGfx.lineStyle(2, 0x546e7a, 0.8);
    stadiumGfx.beginPath();
    stadiumGfx.moveTo(0, TRACK_TOP - 2);
    stadiumGfx.lineTo(W, TRACK_TOP - 2);
    stadiumGfx.stroke();
    /* Railing posts */
    for (let px = 30; px < W; px += 40) {
      stadiumGfx.lineStyle(1, 0x78909c, 0.6);
      stadiumGfx.beginPath();
      stadiumGfx.moveTo(px, TRACK_TOP - 2);
      stadiumGfx.lineTo(px, TRACK_TOP - 10);
      stadiumGfx.stroke();
    }

    /* ====== FLOODLIGHTS ====== */
    this.lightGfx = this.add.graphics().setDepth(0);
    const lightPositions = [80, W - 80];
    const floodGfx = this.add.graphics().setDepth(0);
    for (const lx of lightPositions) {
      /* Pole */
      floodGfx.fillStyle(0x90a4ae, 0.8);
      floodGfx.fillRect(lx - 2, 2, 4, 12);
      /* Light fixture */
      floodGfx.fillStyle(0xffffff, 0.9);
      floodGfx.fillRect(lx - 5, 1, 10, 4);
      /* Light beam (soft glow) */
      floodGfx.fillStyle(0xffffff, 0.03);
      floodGfx.beginPath();
      floodGfx.moveTo(lx - 5, 5);
      floodGfx.lineTo(lx - 60, TRACK_TOP);
      floodGfx.lineTo(lx + 60, TRACK_TOP);
      floodGfx.lineTo(lx + 5, 5);
      floodGfx.closePath();
      floodGfx.fill();
      floodGfx.fillStyle(0xffffff, 0.02);
      floodGfx.beginPath();
      floodGfx.moveTo(lx - 5, 5);
      floodGfx.lineTo(lx - 90, TRACK_TOP);
      floodGfx.lineTo(lx + 90, TRACK_TOP);
      floodGfx.lineTo(lx + 5, 5);
      floodGfx.closePath();
      floodGfx.fill();
    }

    /* ====== CROWD (3 rows for depth) ====== */
    this.crowdGfx = this.add.graphics().setDepth(0);
    const rowConfigs = [
      { yMin: 14, yMax: 35, count: 50, sizeMin: 2, sizeMax: 3 },
      { yMin: 35, yMax: 58, count: 45, sizeMin: 2.5, sizeMax: 3.5 },
      { yMin: 55, yMax: TRACK_TOP - 10, count: 40, sizeMin: 3, sizeMax: 4.5 },
    ];
    const crowdColors = [0xff5252, 0x448aff, 0xffeb3b, 0x69f0ae, 0xffffff, 0xff80ab, 0xffa726, 0xce93d8, 0x80deea];
    for (const rc of rowConfigs) {
      for (let i = 0; i < rc.count; i++) {
        this.crowdDots.push({
          x: randomBetween(0, W),
          y: randomBetween(rc.yMin, rc.yMax),
          baseY: randomBetween(rc.yMin, rc.yMax),
          color: crowdColors[Math.floor(Math.random() * crowdColors.length)],
          sp: randomBetween(1.5, 4),
          size: randomBetween(rc.sizeMin, rc.sizeMax),
        });
      }
    }

    /* ====== GREEN INFIELD ====== */
    const trackBot = TRACK_TOP + lanes * this.laneH;
    const fieldGfx = this.add.graphics();
    fillGradientV(fieldGfx, 0, trackBot, W, H - trackBot, 0x2e7d32, 0x1b5e20, 8);
    /* Grass stripe pattern */
    for (let stripe = 0; stripe < 6; stripe++) {
      const sy = trackBot + stripe * 16;
      fieldGfx.fillStyle(stripe % 2 === 0 ? 0x388e3c : 0x2e7d32, 0.3);
      fieldGfx.fillRect(0, sy, W, 16);
    }

    /* ====== TRACK ====== */
    const trackGfx = this.add.graphics();
    for (let i = 0; i < lanes; i++) {
      const ly = TRACK_TOP + i * this.laneH;
      /* Lane gradient (terracotta with depth) */
      const baseColor = i % 2 === 0 ? 0xBF360C : 0xD84315;
      const darkEdge = i % 2 === 0 ? 0x8B2500 : 0xA63000;
      /* Top shadow edge */
      trackGfx.fillStyle(darkEdge, 0.5);
      trackGfx.fillRect(0, ly, W, 3);
      /* Main lane */
      trackGfx.fillStyle(baseColor, 0.9);
      trackGfx.fillRect(0, ly + 2, W, this.laneH - 4);
      /* Inner highlight */
      trackGfx.fillStyle(0xffffff, 0.04);
      trackGfx.fillRect(0, ly + this.laneH / 2 - 2, W, 4);
      /* Lane number badge */
      trackGfx.fillStyle(0x000000, 0.4);
      trackGfx.fillCircle(14, ly + this.laneH / 2, 9);
      trackGfx.fillStyle(0xffffff, 0.9);
      trackGfx.fillCircle(14, ly + this.laneH / 2, 7);
    }
    /* Lane numbers */
    for (let i = 0; i < lanes; i++) {
      const ly = TRACK_TOP + i * this.laneH;
      this.add.text(14, ly + this.laneH / 2, `${i + 1}`, {
        fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold',
        color: '#333', stroke: '#fff', strokeThickness: 0,
      }).setOrigin(0.5);
    }
    /* Lane dividers (dashed white) */
    for (let i = 0; i <= lanes; i++) {
      const divY = TRACK_TOP + i * this.laneH;
      for (let dx = 0; dx < W; dx += 12) {
        trackGfx.fillStyle(0xffffff, 0.3);
        trackGfx.fillRect(dx, divY - 1, 6, 2);
      }
    }

    /* Distance markers with diamond shapes */
    const trackLen = this.finishX - START_X;
    for (let m = 0; m <= 4; m++) {
      const mx = START_X + (trackLen * m) / 4;
      trackGfx.fillStyle(0xffffff, 0.5);
      /* Diamond marker */
      trackGfx.beginPath();
      trackGfx.moveTo(mx, TRACK_TOP - 6);
      trackGfx.lineTo(mx + 3, TRACK_TOP - 3);
      trackGfx.lineTo(mx, TRACK_TOP);
      trackGfx.lineTo(mx - 3, TRACK_TOP - 3);
      trackGfx.closePath();
      trackGfx.fill();
    }

    /* Stagger lines */
    if (this.ev.staggeredStart) {
      const sg = this.add.graphics();
      for (let i = 0; i < lanes; i++) {
        const sx = START_X + i * this.ev.staggerPx;
        sg.lineStyle(2, 0xffffff, 0.5);
        sg.beginPath(); sg.moveTo(sx, TRACK_TOP + i * this.laneH);
        sg.lineTo(sx, TRACK_TOP + (i + 1) * this.laneH); sg.stroke();
        /* Arrow marker */
        sg.fillStyle(0xffffff, 0.4);
        sg.beginPath();
        sg.moveTo(sx + 4, TRACK_TOP + i * this.laneH + this.laneH / 2 - 3);
        sg.lineTo(sx + 8, TRACK_TOP + i * this.laneH + this.laneH / 2);
        sg.lineTo(sx + 4, TRACK_TOP + i * this.laneH + this.laneH / 2 + 3);
        sg.closePath();
        sg.fill();
      }
    }

    /* ====== FINISH LINE (Enhanced) ====== */
    const flg = this.add.graphics();
    const tile = 7, rows = Math.ceil(lanes * this.laneH / tile);
    for (let r = 0; r < rows; r++) for (let c = 0; c < 4; c++) {
      flg.fillStyle((r + c) % 2 === 0 ? 0xffffff : 0x111111, 0.9);
      flg.fillRect(this.finishX + c * tile, TRACK_TOP + r * tile, tile, tile);
    }
    /* Finish banner */
    flg.fillStyle(0xffd700, 0.8);
    flg.fillRect(this.finishX - 2, TRACK_TOP - 12, 32, 10);
    flg.fillStyle(0x000000, 1);
    this.add.text(this.finishX + 14, TRACK_TOP - 7, 'FINISH', {
      fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#222',
    }).setOrigin(0.5);
    /* Finish flags */
    flg.fillStyle(0xff0000, 0.7);
    flg.beginPath();
    flg.moveTo(this.finishX - 4, TRACK_TOP - 22);
    flg.lineTo(this.finishX + 8, TRACK_TOP - 18);
    flg.lineTo(this.finishX - 4, TRACK_TOP - 14);
    flg.closePath();
    flg.fill();
    flg.fillStyle(0x78909c, 0.8);
    flg.fillRect(this.finishX - 5, TRACK_TOP - 22, 2, 22);

    /* ====== STARTING BLOCKS (3D) ====== */
    const sbg = this.add.graphics();
    for (let i = 0; i < lanes; i++) {
      const stg = this.ev.staggeredStart ? i * this.ev.staggerPx : 0;
      const bx = START_X + stg - 12;
      const by = TRACK_TOP + i * this.laneH + this.laneH / 2 + 6;
      /* Shadow */
      sbg.fillStyle(0x000000, 0.3);
      sbg.fillRect(bx + 1, by + 2, 14, 6);
      /* Block body */
      sbg.fillStyle(0x9e9e9e, 0.9);
      sbg.fillRect(bx, by, 14, 5);
      /* Top highlight */
      sbg.fillStyle(0xbdbdbd, 0.8);
      sbg.fillRect(bx, by, 14, 2);
      /* Foot pedals */
      sbg.fillStyle(0x616161, 0.9);
      sbg.fillRect(bx + 2, by - 4, 4, 4);
      sbg.fillRect(bx + 8, by - 3, 4, 3);
      /* Pedal top highlight */
      sbg.fillStyle(0x757575, 0.7);
      sbg.fillRect(bx + 2, by - 4, 4, 1);
      sbg.fillRect(bx + 8, by - 3, 4, 1);
    }

    /* ====== HURDLES ====== */
    this.hurdleGfx = this.add.graphics().setDepth(1);
    if (this.ev.hasHurdles) {
      const hStart = START_X + 40, hEnd = this.finishX - 20;
      const hSp = (hEnd - hStart) / this.ev.hurdleCount;
      for (let i = 0; i < this.ev.hurdleCount; i++) this.hurdleXs.push(hStart + hSp * (i + 0.5));
    }

    /* ====== RUNNERS ====== */
    this.createRunners();

    /* ====== EFFECTS LAYERS ====== */
    this.dustGfx = this.add.graphics().setDepth(3);
    this.speedLineGfx = this.add.graphics().setDepth(1);
    this.confettiGfx = this.add.graphics().setDepth(30);

    /* ====== HUD ====== */
    /* Timer panel */
    const hudBg = this.add.graphics().setDepth(5);
    hudBg.fillStyle(0x000000, 0.5);
    hudBg.fillRoundedRect(6, 4, 200, 28, 6);

    this.timerText = this.add.text(14, 10, `${t(this.locale, 'time')}: 0.00s`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#fff',
      stroke: '#000', strokeThickness: 2,
    }).setDepth(6);

    this.posText = this.add.text(W - 10, 10, '', {
      fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold',
      color: '#ffee00', stroke: '#000', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(6);

    /* Speed bar (styled) */
    this.add.text(14, 36, `${t(this.locale, 'speed')}:`, {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#fff', stroke: '#000', strokeThickness: 1,
    }).setDepth(6);
    this.speedBarBg = this.add.graphics().setDepth(5);
    this.speedBarBg.fillStyle(0x222222, 0.7);
    this.speedBarBg.fillRoundedRect(72, 35, 134, 14, 4);
    this.speedBarBg.lineStyle(1, 0x555555, 0.5);
    this.speedBarBg.strokeRoundedRect(72, 35, 134, 14, 4);
    this.speedBarFill = this.add.graphics().setDepth(6);
    this.tpsText = this.add.text(212, 36, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ccc',
    }).setDepth(6);

    /* Stamina bar (styled) */
    if (this.ev.hasStamina) {
      this.add.text(14, 54, `${t(this.locale, 'stamina')}:`, {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#fff', stroke: '#000', strokeThickness: 1,
      }).setDepth(6);
      this.stBarBg = this.add.graphics().setDepth(5);
      this.stBarBg.fillStyle(0x222222, 0.7);
      this.stBarBg.fillRoundedRect(72, 53, 134, 14, 4);
      this.stBarBg.lineStyle(1, 0x555555, 0.5);
      this.stBarBg.strokeRoundedRect(72, 53, 134, 14, 4);
      this.stBarFill = this.add.graphics().setDepth(6);
    }

    /* Countdown */
    this.countdownText = this.add.text(W / 2, H / 2 - 40, '', {
      fontFamily: 'sans-serif', fontSize: '80px', fontStyle: 'bold',
      color: '#fff', stroke: '#333', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(10);

    /* Tap zone */
    const tzH = 70, tzY = H - tzH / 2;
    this.tapZone = this.add.rectangle(W / 2, tzY, W, tzH, 0x2196f3, 0).setInteractive().setDepth(4);
    const tzLabel = this.ev.hasHurdles
      ? `👆 ${t(this.locale, 'sprint')}  ⬆️ ${t(this.locale, 'jumpKey')}`
      : `👆 ${t(this.locale, 'sprint')}`;
    this.tapZoneLabel = this.add.text(W / 2, tzY, tzLabel, {
      fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold',
      color: '#fff', stroke: '#0d47a1', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5).setAlpha(0);

    /* ====== INPUT ====== */
    this.input.on('pointerdown', () => {
      if (this.phase === 'countdown' && this.cdPhase >= 1) { this.triggerFalseStart(); return; }
      if (this.phase === 'racing') this.playerTap();
    });
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', (e: KeyboardEvent) => {
        if (this.phase === 'countdown' && this.cdPhase >= 1 && e.key !== 'ArrowUp') {
          this.triggerFalseStart(); return;
        }
        if (this.phase !== 'racing') return;
        if (e.key === 'ArrowUp' && this.ev.hasHurdles) this.playerJump();
        else this.playerTap();
      });
    }
    if (this.ev.hasHurdles) {
      let sy = 0;
      this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { sy = p.y; });
      this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (this.phase === 'racing' && sy - p.y > 30) this.playerJump();
      });
    }

    this.runCountdown();
  }

  /* ====== RUNNERS ====== */

  private createRunners() {
    this.runners.push(this.makeRunner(t(this.locale, 'you'), 0x2196f3, 0xffdbac, 0x1565c0, 0, this.ev.playerMax, true, 0));
    const shuffled = [...AI_POOL].sort(() => Math.random() - 0.5);
    for (let i = 0; i < this.ev.aiCount; i++) {
      const ai = shuffled[i % shuffled.length];
      const ms = ai.baseMax * this.ev.aiSpeed + randomBetween(-this.ev.aiVariance, this.ev.aiVariance);
      const stg = this.ev.staggeredStart ? (i + 1) * this.ev.staggerPx : 0;
      this.runners.push(this.makeRunner(ai.name, ai.jersey, ai.skin, ai.shorts, i + 1, ms, false, stg));
    }
  }

  private makeRunner(
    name: string, jersey: number, skin: number, shorts: number,
    lane: number, maxSpd: number, isPlayer: boolean, stagger: number,
  ): RunnerData {
    const y = TRACK_TOP + lane * this.laneH + this.laneH / 2;
    const sx = START_X + stagger;
    const body = this.add.graphics().setDepth(2);
    this.drawRunner(body, sx, y, jersey, skin, shorts, 0, true, 0, 0, maxSpd);
    const lbl = this.add.text(sx, TRACK_TOP + lane * this.laneH + 3, name, {
      fontFamily: 'sans-serif', fontSize: '10px', fontStyle: 'bold',
      color: isPlayer ? '#ffee00' : '#fff',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(2);
    return {
      name, jerseyColor: jersey, skinTone: skin, shortsColor: shorts,
      x: sx, startX: sx, speed: 0, maxSpeed: maxSpd,
      finished: false, finishTime: 0, frame: 0, lane,
      body, nameLabel: lbl, isPlayer,
      isJumping: false, jumpFrame: 0, jumpY: 0,
      nextHurdleIdx: 0, hurdlesCleared: 0, hurdlesHit: 0,
      stamina: 100, crouching: true,
    };
  }

  /* ====== DRAW RUNNER (Enhanced with shadows, trails, lean, proportional body) ====== */

  private drawRunner(
    g: Phaser.GameObjects.Graphics, x: number, y: number,
    jersey: number, skin: number, shorts: number,
    frame: number, crouching: boolean, jumpY: number,
    speed = 0, maxSpeed = 5,
  ) {
    g.clear();
    const s = this.laneH / 50;
    const dy = y + jumpY;
    const speedRatio = maxSpeed > 0 ? clamp(speed / maxSpeed, 0, 1) : 0;

    /* ---- Ground shadow ---- */
    const shadowAlpha = jumpY < 0 ? Math.max(0.06, 0.22 - Math.abs(jumpY) / 100) : 0.22;
    const shadowStretch = jumpY < 0 ? 1 + Math.abs(jumpY) / 30 : 1;
    g.fillStyle(0x000000, shadowAlpha);
    g.fillEllipse(x, y + 22 * s, 18 * s * shadowStretch, 3.5 * s);

    /* ---- Speed trail (ghost afterimages) ---- */
    if (!crouching && speedRatio > 0.5) {
      const trails = speedRatio > 0.85 ? 3 : speedRatio > 0.65 ? 2 : 1;
      for (let ti = 1; ti <= trails; ti++) {
        const tx = x - ti * 8 * s;
        const ta = (0.12 / ti) * ((speedRatio - 0.5) * 2);
        /* Ghost head */
        g.fillStyle(skin, ta);
        g.fillCircle(tx, dy - 12 * s, 5 * s);
        /* Ghost body */
        g.fillStyle(jersey, ta);
        g.fillRect(tx - 3.5 * s, dy - 5 * s, 7 * s, 12 * s);
      }
    }

    if (crouching) {
      /* ===== CROUCHING START POSE (Enhanced) ===== */
      const lean = 4 * s;
      /* Head */
      g.fillStyle(skin, 1);
      g.fillCircle(x + 8 * s, dy - 5 * s, 5.5 * s);
      /* Headband */
      g.fillStyle(jersey, 1);
      g.fillRect(x + 2.5 * s, dy - 9 * s, 11 * s, 2.5 * s);
      /* Eye (determined gaze forward) */
      g.fillStyle(0xffffff, 1);
      g.fillCircle(x + 12 * s, dy - 6 * s, 1.6 * s);
      g.fillStyle(0x111111, 1);
      g.fillCircle(x + 12.6 * s, dy - 6 * s, 0.8 * s);
      /* Neck */
      g.fillStyle(skin, 1);
      g.fillRect(x + 4 * s, dy - 0.5 * s, 3 * s, 3 * s);
      /* Torso (leaning forward) */
      g.fillStyle(jersey, 1);
      g.beginPath();
      g.moveTo(x + lean, dy + 2 * s);
      g.lineTo(x + 8 * s, dy + 2 * s);
      g.lineTo(x + 6 * s, dy + 10 * s);
      g.lineTo(x - 2 * s, dy + 10 * s);
      g.closePath();
      g.fill();
      /* Jersey stripe */
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(x + 1 * s, dy + 4 * s, 2 * s, 6 * s);
      /* Shorts */
      g.fillStyle(shorts, 1);
      g.fillRect(x - 3 * s, dy + 10 * s, 9 * s, 4 * s);
      /* Legs (tucked) */
      g.lineStyle(2.2 * s, skin, 1);
      g.beginPath(); g.moveTo(x - 1 * s, dy + 14 * s); g.lineTo(x - 6 * s, dy + 18 * s); g.stroke();
      g.beginPath(); g.moveTo(x + 5 * s, dy + 14 * s); g.lineTo(x + 8 * s, dy + 17 * s); g.stroke();
      /* Shoes */
      g.fillStyle(0x333333, 1);
      g.fillRect(x - 8 * s, dy + 17 * s, 5 * s, 2.5 * s);
      g.fillRect(x + 6 * s, dy + 16 * s, 5 * s, 2.5 * s);
      /* Shoe spikes detail */
      g.fillStyle(0xffffff, 0.3);
      g.fillRect(x - 4 * s, dy + 18.5 * s, s, s);
      g.fillRect(x + 9 * s, dy + 17.5 * s, s, s);
      /* Hands on ground (fists) */
      g.fillStyle(skin, 1);
      g.fillCircle(x - 4 * s, dy + 10 * s, 2.2 * s);
      g.fillCircle(x + 9 * s, dy + 7 * s, 2.2 * s);
      return;
    }

    /* ===== RUNNING POSE (Enhanced with forward lean, proper form) ===== */
    const cycle = frame * 0.55;
    const phase = Math.sin(cycle);
    const phase2 = Math.cos(cycle);
    const lean = speedRatio * 2.5 * s;

    /* ---- BACK LEG (drawn first, behind body) ---- */
    g.lineStyle(2.4 * s, skin, 1);
    const blKneeX = x - 2 * s + phase * 9 * s;
    const blKneeY = dy + 14 * s;
    const blFootX = x + phase * -6 * s;
    const blFootY = dy + 21 * s;
    g.beginPath(); g.moveTo(x - s, dy + 10 * s); g.lineTo(blKneeX, blKneeY); g.stroke();
    g.beginPath(); g.moveTo(blKneeX, blKneeY); g.lineTo(blFootX, blFootY); g.stroke();
    /* Back shoe */
    g.fillStyle(0x333333, 1);
    g.fillRect(blFootX - 2 * s, blFootY - s, 6 * s, 3 * s);
    /* Spike accent */
    g.fillStyle(jersey, 0.7);
    g.fillRect(blFootX - 2 * s, blFootY - s, 2 * s, 3 * s);

    /* ---- BACK ARM ---- */
    g.lineStyle(1.6 * s, skin, 1);
    const baElbowX = x - 5 * s + phase * 5 * s + lean;
    const baElbowY = dy + s;
    const baHandX = x - 2 * s - phase * 5 * s + lean;
    const baHandY = dy - 4 * s;
    g.beginPath(); g.moveTo(x - 3.5 * s + lean, dy - 2 * s); g.lineTo(baElbowX, baElbowY); g.stroke();
    g.beginPath(); g.moveTo(baElbowX, baElbowY); g.lineTo(baHandX, baHandY); g.stroke();
    g.fillStyle(skin, 1);
    g.fillCircle(baHandX, baHandY, 1.5 * s);

    /* ---- SHORTS ---- */
    g.fillStyle(shorts, 1);
    g.beginPath();
    g.moveTo(x - 4 * s + lean * 0.5, dy + 5 * s);
    g.lineTo(x + 4 * s + lean * 0.5, dy + 5 * s);
    g.lineTo(x + 5 * s, dy + 12 * s);
    g.lineTo(x - 5 * s, dy + 12 * s);
    g.closePath();
    g.fill();

    /* ---- TORSO (Jersey with number and stripe) ---- */
    g.fillStyle(jersey, 1);
    g.beginPath();
    g.moveTo(x - 4 * s + lean * 1.5, dy - 5 * s);
    g.lineTo(x + 4 * s + lean * 1.5, dy - 5 * s);
    g.lineTo(x + 4.5 * s + lean * 0.5, dy + 6 * s);
    g.lineTo(x - 4.5 * s + lean * 0.5, dy + 6 * s);
    g.closePath();
    g.fill();
    /* Jersey side stripe */
    g.fillStyle(0xffffff, 0.2);
    g.fillRect(x + 2 * s + lean, dy - 3 * s, 2 * s, 8 * s);
    /* Jersey collar */
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(x - 2.5 * s + lean * 1.5, dy - 5 * s, 5 * s, 1.5 * s);

    /* ---- FRONT LEG ---- */
    g.lineStyle(2.4 * s, skin, 1);
    const flKneeX = x + 2 * s - phase * 9 * s;
    const flKneeY = dy + 14 * s;
    const flFootX = x - phase * -6 * s;
    const flFootY = dy + 21 * s;
    g.beginPath(); g.moveTo(x + s, dy + 10 * s); g.lineTo(flKneeX, flKneeY); g.stroke();
    g.beginPath(); g.moveTo(flKneeX, flKneeY); g.lineTo(flFootX, flFootY); g.stroke();
    /* Front shoe */
    g.fillStyle(0x333333, 1);
    g.fillRect(flFootX - 2 * s, flFootY - s, 6 * s, 3 * s);
    g.fillStyle(jersey, 0.7);
    g.fillRect(flFootX - 2 * s, flFootY - s, 2 * s, 3 * s);

    /* ---- FRONT ARM ---- */
    g.lineStyle(1.6 * s, skin, 1);
    const faElbowX = x + 5 * s - phase * 5 * s + lean;
    const faElbowY = dy + s;
    const faHandX = x + 2 * s + phase * 5 * s + lean;
    const faHandY = dy - 4 * s;
    g.beginPath(); g.moveTo(x + 3.5 * s + lean, dy - 2 * s); g.lineTo(faElbowX, faElbowY); g.stroke();
    g.beginPath(); g.moveTo(faElbowX, faElbowY); g.lineTo(faHandX, faHandY); g.stroke();
    g.fillStyle(skin, 1);
    g.fillCircle(faHandX, faHandY, 1.5 * s);

    /* ---- NECK ---- */
    g.fillStyle(skin, 1);
    g.fillRect(x - 1.5 * s + lean * 1.5, dy - 8 * s, 3 * s, 4 * s);

    /* ---- HEAD (with subtle bob) ---- */
    const headBob = phase2 * 0.6 * s;
    const headX = x + lean * 1.8;
    const headY = dy - 12 * s + headBob;
    g.fillStyle(skin, 1);
    g.fillCircle(headX, headY, 5.5 * s);
    /* Hair / top of head darker shade */
    g.fillStyle(0x000000, 0.15);
    g.fillCircle(headX - 0.5 * s, headY - 1.5 * s, 4 * s);
    /* Headband */
    g.fillStyle(jersey, 1);
    g.fillRect(headX - 5.5 * s, headY - 2 * s, 11 * s, 2.5 * s);
    /* Eye */
    g.fillStyle(0xffffff, 1);
    g.fillCircle(headX + 3.5 * s, headY + 0.5 * s, 1.6 * s);
    g.fillStyle(0x111111, 1);
    g.fillCircle(headX + 4.2 * s, headY + 0.5 * s, 0.8 * s);
    /* Mouth (effort expression at high speed) */
    if (speedRatio > 0.6) {
      g.lineStyle(0.8 * s, skin * 0.7 & 0xffffff, 0.5);
      g.beginPath();
      g.moveTo(headX + 2 * s, headY + 3 * s);
      g.lineTo(headX + 4 * s, headY + 3 * s);
      g.stroke();
    }

    /* ---- SPEED LINES (at high speed) ---- */
    if (speedRatio > 0.7) {
      const lineAlpha = (speedRatio - 0.7) * 1.5;
      g.lineStyle(0.8 * s, 0xffffff, lineAlpha * 0.3);
      for (let li = 0; li < 3; li++) {
        const liy = dy - 8 * s + li * 10 * s + phase2 * 2 * s;
        g.beginPath();
        g.moveTo(x - 12 * s - li * 4 * s, liy);
        g.lineTo(x - 18 * s - li * 6 * s, liy);
        g.stroke();
      }
    }
  }

  /* ====== COUNTDOWN ====== */

  private runCountdown() {
    const steps: { key: string; sound: () => void; color: string }[] = [
      { key: 'ready', sound: () => sfx.countdown(), color: '#ff5252' },
      { key: 'set', sound: () => sfx.whistle(), color: '#ffeb3b' },
      { key: 'go', sound: () => sfx.gunshot(), color: '#76ff03' },
    ];
    let idx = 0;
    const show = () => {
      this.cdPhase = idx + 1;
      steps[idx].sound();
      this.countdownText.setText(t(this.locale, steps[idx].key));
      this.countdownText.setColor(steps[idx].color);

      /* Flash ring effect */
      const ring = this.add.circle(W / 2, H / 2 - 40, 60, Phaser.Display.Color.HexStringToColor(steps[idx].color).color, 0.2).setDepth(9);
      this.tweens.add({ targets: ring, scaleX: 2, scaleY: 2, alpha: 0, duration: 600, onComplete: () => ring.destroy() });

      this.tweens.add({
        targets: this.countdownText,
        scaleX: { from: 2.5, to: 1 }, scaleY: { from: 2.5, to: 1 },
        alpha: { from: 1, to: idx < 2 ? 0.3 : 0 },
        duration: 800, ease: 'Back.easeOut',
        onComplete: () => { idx++; if (idx < steps.length) show(); else { this.cdPhase = 0; this.startRace(); } },
      });
    };
    show();
  }

  private triggerFalseStart() {
    if (this.falseStartFlag) return;
    this.falseStartFlag = true;
    sfx.falseStart();
    /* Red flash */
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0.5).setDepth(50);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
    const warn = this.add.text(W / 2, H / 2 - 20, t(this.locale, 'falseStart'), {
      fontFamily: 'sans-serif', fontSize: '34px', fontStyle: 'bold',
      color: '#ff5252', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(51);
    this.tweens.add({ targets: warn, alpha: 0, y: H / 2 - 50, duration: 1500, onComplete: () => warn.destroy() });
    this.time.delayedCall(1500, () => { this.falseStartFlag = false; });
  }

  private startRace() {
    this.phase = 'racing';
    this.raceStart = this.time.now;
    for (const r of this.runners) r.crouching = false;
    sfx.crowdRoar();
    this.tapZone.setFillStyle(0x2196f3, 0.25);
    this.tapZoneLabel.setAlpha(1);
    this.tweens.add({ targets: this.tapZoneLabel, alpha: { from: 1, to: 0.4 }, yoyo: true, repeat: -1, duration: 500 });
  }

  /* ====== PLAYER INPUT ====== */

  private playerTap() {
    const now = this.time.now;
    this.tapCount++;
    this.lastTap = now;
    this.recentTaps.push(now);

    const p = this.runners[0];
    let boost = this.ev.boostPerTap;
    if (this.ev.hasStamina) {
      p.stamina = Math.max(0, p.stamina - 2);
      if (p.stamina < 20) boost *= 0.5;
      else if (p.stamina < 50) boost *= 0.8;
    }
    p.speed = clamp(p.speed + boost, 0, p.maxSpeed);
    sfx.tap();
    /* Tap zone pulse */
    this.tapZone.setFillStyle(0x64b5f6, 0.4);
    this.time.delayedCall(80, () => { if (this.phase === 'racing') this.tapZone.setFillStyle(0x2196f3, 0.25); });
    this.spawnDust(p);
  }

  private playerJump() {
    const p = this.runners[0];
    if (p.isJumping) return;
    p.isJumping = true;
    p.jumpFrame = 0;
    sfx.jump();
  }

  private spawnDust(r: RunnerData) {
    const y = TRACK_TOP + r.lane * this.laneH + this.laneH / 2 + 14;
    const dustColors = [0xd2b48c, 0xdeb887, 0xc8a882];
    for (let i = 0; i < 4; i++) {
      this.dustParts.push({
        x: r.x - 4 + randomBetween(-2, 2),
        y: y + randomBetween(-3, 3),
        vx: randomBetween(-2.0, -0.4),
        vy: randomBetween(-1.5, 0.5),
        life: 1,
        size: randomBetween(1.5, 4),
        color: dustColors[Math.floor(Math.random() * dustColors.length)],
      });
    }
  }

  /* ====== UPDATE ====== */

  update(_time: number, delta: number) {
    if (this.phase !== 'racing' && this.phase !== 'finished') return;
    const dt = delta / 16.67;
    const now = this.time.now;

    if (this.phase === 'racing') {
      this.elapsed = now - this.raceStart;
      this.timerText.setText(`${t(this.locale, 'time')}: ${(this.elapsed / 1000).toFixed(2)}s`);
    }

    /* ====== CROWD ANIMATION (with wave effect) ====== */
    this.crowdGfx.clear();
    for (const d of this.crowdDots) {
      /* Mexican wave: position-dependent phase offset creates ripple */
      const wavePhase = Math.sin(now * 0.004 + d.x * 0.02) * 3;
      const bounce = Math.sin(now * 0.003 * d.sp + d.x * 0.01) * 2;
      d.y = d.baseY + bounce + (this.phase === 'racing' ? wavePhase * 0.5 : 0);
      /* Draw head */
      this.crowdGfx.fillStyle(d.color, 0.7);
      this.crowdGfx.fillCircle(d.x, d.y, d.size);
      /* Draw tiny body below head */
      this.crowdGfx.fillStyle(d.color, 0.4);
      this.crowdGfx.fillRect(d.x - d.size * 0.5, d.y + d.size, d.size, d.size * 1.2);
    }
    /* Waving flags in crowd */
    if (this.phase === 'racing') {
      const flagColors = [0xff5252, 0x448aff, 0xffeb3b, 0x69f0ae, 0xffffff];
      for (let fi = 0; fi < 8; fi++) {
        const fx = 40 + fi * 85;
        const fy = 25 + Math.sin(now * 0.005 + fi) * 4;
        const flagWave = Math.sin(now * 0.008 + fi * 2) * 3;
        this.crowdGfx.fillStyle(flagColors[fi % flagColors.length], 0.6);
        /* Flag pole */
        this.crowdGfx.fillRect(fx, fy, 1, 12);
        /* Flag fabric (parallelogram simulated) */
        this.crowdGfx.beginPath();
        this.crowdGfx.moveTo(fx + 1, fy);
        this.crowdGfx.lineTo(fx + 10 + flagWave, fy + 1);
        this.crowdGfx.lineTo(fx + 10 + flagWave, fy + 7);
        this.crowdGfx.lineTo(fx + 1, fy + 6);
        this.crowdGfx.closePath();
        this.crowdGfx.fill();
      }
    }

    /* TPS */
    this.recentTaps = this.recentTaps.filter(tp => now - tp < 1000);
    this.tpsText.setText(`${this.recentTaps.length} ${t(this.locale, 'tapsPerSec')}`);

    /* ====== RUNNERS ====== */
    const positions: { idx: number; x: number }[] = [];
    for (let i = 0; i < this.runners.length; i++) {
      const r = this.runners[i];
      if (r.finished) { positions.push({ idx: i, x: r.x }); continue; }

      if (r.isPlayer) {
        if (now - this.lastTap > 180) r.speed *= this.ev.decelRate;
        if (this.ev.hasStamina && now - this.lastTap > 300) r.stamina = Math.min(100, r.stamina + 0.3 * dt);
        if (this.ev.hasStamina && r.stamina < 20) r.speed = Math.min(r.speed, r.maxSpeed * 0.6);
      } else if (this.phase === 'racing') {
        r.speed += randomBetween(0.02, 0.12) * dt;
        r.speed = clamp(r.speed, 0, r.maxSpeed);
        if (this.ev.hasStamina) {
          r.stamina -= 0.15 * dt;
          if (r.stamina < 30) r.speed = Math.min(r.speed, r.maxSpeed * 0.7);
        }
        if (this.ev.hasHurdles && !r.isJumping && r.nextHurdleIdx < this.hurdleXs.length) {
          const nh = this.hurdleXs[r.nextHurdleIdx];
          if (r.x >= nh - 20 && r.x < nh) {
            if (Math.random() > 0.15) { r.isJumping = true; r.jumpFrame = 0; }
          }
        }
      }

      r.x += r.speed * dt;
      r.frame += r.speed * 0.5;
      positions.push({ idx: i, x: r.x });

      /* Jump arc */
      if (r.isJumping) {
        r.jumpFrame++;
        r.jumpY = -Math.sin((r.jumpFrame / 20) * Math.PI) * 18;
        if (r.jumpFrame >= 20) { r.isJumping = false; r.jumpFrame = 0; r.jumpY = 0; }
      }

      /* Hurdle collision */
      if (this.ev.hasHurdles && r.nextHurdleIdx < this.hurdleXs.length) {
        const nh = this.hurdleXs[r.nextHurdleIdx];
        if (r.x >= nh - 4 && r.x <= nh + 12) {
          if (r.isJumping && r.jumpY < -6) {
            r.hurdlesCleared++;
            r.nextHurdleIdx++;
            if (r.isPlayer) r.speed = clamp(r.speed + 0.25, 0, r.maxSpeed);
          } else if (!r.isJumping) {
            r.hurdlesHit++;
            r.nextHurdleIdx++;
            r.speed *= 0.6;
            if (r.isPlayer) { sfx.hurdleHit(); this.cameras.main.shake(80, 0.008); }
          }
        }
      }

      /* Redraw runner */
      const ly = TRACK_TOP + r.lane * this.laneH + this.laneH / 2;
      this.drawRunner(r.body, r.x, ly, r.jerseyColor, r.skinTone, r.shortsColor, r.frame, r.crouching, r.jumpY, r.speed, r.maxSpeed);
      r.nameLabel.setX(r.x);

      if (r.x >= this.finishX && !r.finished) {
        r.finished = true; r.finishTime = this.elapsed; r.speed = 0;
      }
    }

    /* ====== HURDLES (Enhanced 3D) ====== */
    if (this.ev.hasHurdles) {
      this.hurdleGfx.clear();
      for (const hx of this.hurdleXs) {
        for (let lane = 0; lane < this.runners.length; lane++) {
          const hy = TRACK_TOP + lane * this.laneH + this.laneH / 2 + 10;
          /* Shadow */
          this.hurdleGfx.fillStyle(0x000000, 0.15);
          this.hurdleGfx.fillRect(hx, hy - 12, 12, 16);
          /* Left leg */
          this.hurdleGfx.fillStyle(0xeeeeee, 0.9);
          this.hurdleGfx.fillRect(hx, hy - 14, 2, 16);
          /* Right leg */
          this.hurdleGfx.fillRect(hx + 8, hy - 14, 2, 16);
          /* Crossbar */
          this.hurdleGfx.fillStyle(0xff5722, 0.95);
          this.hurdleGfx.fillRect(hx - 1, hy - 16, 12, 3);
          /* Crossbar stripe */
          this.hurdleGfx.fillStyle(0xffffff, 0.6);
          this.hurdleGfx.fillRect(hx - 1, hy - 15, 12, 1);
        }
      }
    }

    /* ====== SPEED BAR (Gradient fill) ====== */
    const pl = this.runners[0];
    const sr = pl.speed / pl.maxSpeed;
    this.speedBarFill.clear();
    if (sr > 0.01) {
      const barW = 130 * sr;
      const barColor = sr > 0.8 ? 0x76ff03 : sr > 0.5 ? 0xffee00 : sr > 0.25 ? 0xffa726 : 0xff5252;
      const barGlow = sr > 0.8 ? 0xb2ff59 : sr > 0.5 ? 0xfff176 : sr > 0.25 ? 0xffcc80 : 0xff8a80;
      /* Bar fill with gradient */
      this.speedBarFill.fillStyle(barColor, 0.9);
      this.speedBarFill.fillRoundedRect(74, 37, barW, 10, 3);
      /* Highlight on top */
      this.speedBarFill.fillStyle(barGlow, 0.4);
      this.speedBarFill.fillRect(74, 37, barW, 4);
    }

    /* Stamina bar */
    if (this.ev.hasStamina && this.stBarFill) {
      this.stBarFill.clear();
      const stRatio = pl.stamina / 100;
      if (stRatio > 0.01) {
        const stColor = pl.stamina > 50 ? 0x29b6f6 : pl.stamina > 20 ? 0xffb74d : 0xff5252;
        const stGlow = pl.stamina > 50 ? 0x81d4fa : pl.stamina > 20 ? 0xffe0b2 : 0xff8a80;
        this.stBarFill.fillStyle(stColor, 0.9);
        this.stBarFill.fillRoundedRect(74, 55, 130 * stRatio, 10, 3);
        this.stBarFill.fillStyle(stGlow, 0.4);
        this.stBarFill.fillRect(74, 55, 130 * stRatio, 4);
      }
    }

    /* ====== POSITION INDICATOR ====== */
    positions.sort((a, b) => b.x - a.x);
    const pos = positions.findIndex(p => p.idx === 0) + 1;
    const posColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#ffffff', '#cccccc'];
    const posColor = posColors[Math.min(pos - 1, posColors.length - 1)];
    this.posText.setColor(posColor);
    const posMedal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '';
    this.posText.setText(`${posMedal} ${t(this.locale, 'position')}: ${pos}/${this.runners.length}`);

    /* ====== DUST PARTICLES (Enhanced) ====== */
    this.dustGfx.clear();
    for (let i = this.dustParts.length - 1; i >= 0; i--) {
      const p = this.dustParts[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.035 * dt;
      p.vy -= 0.03 * dt;
      if (p.life <= 0) { this.dustParts.splice(i, 1); continue; }
      this.dustGfx.fillStyle(p.color, p.life * 0.6);
      this.dustGfx.fillCircle(p.x, p.y, p.size * p.life);
    }

    /* ====== CONFETTI (Post-result) ====== */
    if (this.confetti.length > 0) {
      this.confettiGfx.clear();
      for (let i = this.confetti.length - 1; i >= 0; i--) {
        const c = this.confetti[i];
        c.x += c.vx * dt; c.y += c.vy * dt;
        c.vy += 0.08 * dt;
        c.rot += 0.1 * dt;
        c.life -= 0.005 * dt;
        if (c.life <= 0 || c.y > H + 10) { this.confetti.splice(i, 1); continue; }
        this.confettiGfx.fillStyle(c.color, c.life);
        /* Rotating rectangle (approximated) */
        const cSin = Math.sin(c.rot), cCos = Math.cos(c.rot);
        this.confettiGfx.beginPath();
        this.confettiGfx.moveTo(c.x + cCos * c.w - cSin * c.h, c.y + cSin * c.w + cCos * c.h);
        this.confettiGfx.lineTo(c.x - cCos * c.w - cSin * c.h, c.y - cSin * c.w + cCos * c.h);
        this.confettiGfx.lineTo(c.x - cCos * c.w + cSin * c.h, c.y - cSin * c.w - cCos * c.h);
        this.confettiGfx.lineTo(c.x + cCos * c.w + cSin * c.h, c.y + cSin * c.w - cCos * c.h);
        this.confettiGfx.closePath();
        this.confettiGfx.fill();
      }
    }

    /* Check result */
    if (pl.finished && !this.resultShown) this.showResult();
    else if (!this.resultShown && this.runners.slice(1).every(r => r.finished)) this.showResult();
  }

  /* ====== RESULT SCREEN (Enhanced with podium, confetti, better layout) ====== */

  private showResult() {
    this.resultShown = true;
    this.phase = 'finished';
    this.tapZone.setFillStyle(0x000000, 0);
    this.tapZoneLabel.setAlpha(0);

    const sorted = [...this.runners].sort((a, b) => {
      if (!a.finished) return 1; if (!b.finished) return -1;
      return a.finishTime - b.finishTime;
    });
    const rank = sorted.findIndex(r => r.isPlayer) + 1;

    /* Photo finish */
    if (rank <= 3 && sorted.length > 1) {
      const close = sorted.filter(r => Math.abs(r.finishTime - sorted[0].finishTime) < 100);
      if (close.length > 1) {
        /* Camera flash */
        const camFlash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.6).setDepth(24);
        this.tweens.add({ targets: camFlash, alpha: 0, duration: 300, onComplete: () => camFlash.destroy() });

        const pf = this.add.text(W / 2, TRACK_TOP - 12, t(this.locale, 'photoFinish'), {
          fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold',
          color: '#ffee00', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({ targets: pf, alpha: 0, duration: 2000, delay: 1500 });
      }
    }

    if (rank === 1) sfx.win(); else if (rank <= 3) sfx.powerUp(); else sfx.gameOver();

    const pl = this.runners.find(r => r.isPlayer)!;
    const isNew = pl.finished ? saveHighScore(HS_KEYS[this.eventType], Math.round(pl.finishTime)) : false;

    /* Spawn confetti for medal finishes */
    if (rank <= 3) {
      const confettiColors = [0xffd700, 0xff5252, 0x448aff, 0x69f0ae, 0xffeb3b, 0xce93d8, 0xff80ab, 0x80deea];
      for (let c = 0; c < (rank === 1 ? 120 : 60); c++) {
        this.confetti.push({
          x: randomBetween(50, W - 50),
          y: randomBetween(-20, -100),
          vx: randomBetween(-2, 2),
          vy: randomBetween(0.5, 3),
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          rot: randomBetween(0, Math.PI * 2),
          life: 1,
          w: randomBetween(2, 4),
          h: randomBetween(1, 3),
        });
      }
    }

    /* ---- Overlay with gradient ---- */
    const overlayGfx = this.add.graphics().setDepth(20);
    overlayGfx.fillStyle(0x0a0a2e, 0.75);
    overlayGfx.fillRect(0, 0, W, H);
    /* Top decorative bar */
    overlayGfx.fillStyle(rank === 1 ? 0xffd700 : rank === 2 ? 0xc0c0c0 : rank === 3 ? 0xcd7f32 : 0x444444, 0.4);
    overlayGfx.fillRect(0, H / 2 - 130, W, 4);

    const titleKey = rank === 1 ? 'youWon' : rank === 2 ? 'youSilver' : rank === 3 ? 'youBronze' : 'youLost';
    const titleClr = rank === 1 ? '#ffd700' : rank === 2 ? '#e0e0e0' : rank === 3 ? '#cd7f32' : '#ff6666';

    /* Result title with glow */
    const resultTitle = this.add.text(W / 2, H / 2 - 110, t(this.locale, titleKey), {
      fontFamily: 'sans-serif', fontSize: '36px', fontStyle: 'bold',
      color: titleClr, stroke: '#222', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(21);
    if (rank === 1) {
      this.tweens.add({ targets: resultTitle, scaleX: { from: 0.8, to: 1.05 }, scaleY: { from: 0.8, to: 1.05 }, yoyo: true, repeat: 2, duration: 300, ease: 'Back.easeOut' });
    }

    /* ---- Mini Podium visual ---- */
    const podiumY = H / 2 - 70;
    const podiumGfx = this.add.graphics().setDepth(21);
    const podiumColors = [0xffd700, 0xc0c0c0, 0xcd7f32];
    const podiumHeights = [30, 22, 16];
    const podiumXs = [W / 2 - 55, W / 2, W / 2 + 55];
    const podiumOrder = [1, 0, 2]; /* Silver, Gold, Bronze from left */
    for (let pi = 0; pi < 3 && pi < sorted.length; pi++) {
      const drawIdx = podiumOrder[pi];
      const px = podiumXs[pi];
      const ph = podiumHeights[drawIdx];
      const pc = podiumColors[drawIdx];
      /* Podium block */
      podiumGfx.fillStyle(pc, 0.7);
      podiumGfx.fillRect(px - 22, podiumY + 30 - ph, 44, ph);
      /* Podium top highlight */
      podiumGfx.fillStyle(pc, 0.3);
      podiumGfx.fillRect(px - 22, podiumY + 30 - ph, 44, 3);
      /* Rank number */
      this.add.text(px, podiumY + 30 - ph / 2, `${drawIdx + 1}`, {
        fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#fff',
      }).setOrigin(0.5).setDepth(22);
      /* Runner name on podium */
      if (drawIdx < sorted.length) {
        const pName = sorted[drawIdx].isPlayer ? `★ ${sorted[drawIdx].name}` : sorted[drawIdx].name;
        this.add.text(px, podiumY + 30 - ph - 10, pName, {
          fontFamily: 'sans-serif', fontSize: '9px', fontStyle: 'bold',
          color: sorted[drawIdx].isPlayer ? '#ffee00' : '#fff',
          stroke: '#000', strokeThickness: 1,
        }).setOrigin(0.5).setDepth(22);
      }
    }

    /* ---- Results table ---- */
    const medals = ['🥇', '🥈', '🥉'];
    let ty = podiumY + 48;
    for (let i = 0; i < Math.min(sorted.length, 5); i++) {
      const r = sorted[i];
      const m = i < 3 ? medals[i] : `${i + 1}.`;
      const tm = r.finished ? `${(r.finishTime / 1000).toFixed(2)}s` : 'DNF';
      let txt = r.isPlayer ? `${m}  ${r.name} ← ${tm}` : `${m}  ${r.name} — ${tm}`;
      if (this.ev.hasHurdles) txt += `  (${r.hurdlesCleared}/${this.ev.hurdleCount})`;
      /* Row background */
      if (r.isPlayer) {
        overlayGfx.fillStyle(0xffd700, 0.1);
        overlayGfx.fillRect(W / 2 - 180, ty - 8, 360, 18);
      }
      this.add.text(W / 2, ty, txt, {
        fontFamily: 'monospace', fontSize: '14px',
        color: r.isPlayer ? '#ffee00' : '#ddd',
        stroke: '#000', strokeThickness: 1,
      }).setOrigin(0.5).setDepth(21);
      ty += 20;
    }

    if (isNew) {
      const nb = this.add.text(W / 2, ty + 6, t(this.locale, 'newBest'), {
        fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffdd00',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(21);
      this.tweens.add({ targets: nb, scaleX: 1.15, scaleY: 1.15, yoyo: true, repeat: 4, duration: 250 });
      ty += 30;
    }

    /* ---- Buttons (Enhanced with rounded style) ---- */
    const by = Math.max(ty + 22, H / 2 + 90);
    const bw = 130, bh = 38, bg = 14;

    const makeBtn = (cx: number, label: string, color: number, hover: number, cb: () => void) => {
      const btnGfx = this.add.graphics().setDepth(21);
      /* Button shadow */
      btnGfx.fillStyle(0x000000, 0.3);
      btnGfx.fillRoundedRect(cx - bw / 2 + 2, by - bh / 2 + 2, bw, bh, 8);
      /* Button body */
      btnGfx.fillStyle(color, 1);
      btnGfx.fillRoundedRect(cx - bw / 2, by - bh / 2, bw, bh, 8);
      /* Button highlight */
      btnGfx.fillStyle(0xffffff, 0.2);
      btnGfx.fillRoundedRect(cx - bw / 2 + 2, by - bh / 2 + 2, bw - 4, bh / 2 - 2, { tl: 6, tr: 6, bl: 0, br: 0 });

      const hitArea = this.add.rectangle(cx, by, bw, bh, 0x000000, 0).setInteractive({ useHandCursor: true }).setDepth(22);
      this.add.text(cx, by, label, {
        fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#fff',
        stroke: '#000', strokeThickness: 1,
      }).setOrigin(0.5).setDepth(23);

      hitArea.on('pointerover', () => {
        btnGfx.clear();
        btnGfx.fillStyle(0x000000, 0.3);
        btnGfx.fillRoundedRect(cx - bw / 2 + 2, by - bh / 2 + 2, bw, bh, 8);
        btnGfx.fillStyle(hover, 1);
        btnGfx.fillRoundedRect(cx - bw / 2, by - bh / 2, bw, bh, 8);
        btnGfx.fillStyle(0xffffff, 0.25);
        btnGfx.fillRoundedRect(cx - bw / 2 + 2, by - bh / 2 + 2, bw - 4, bh / 2 - 2, { tl: 6, tr: 6, bl: 0, br: 0 });
      });
      hitArea.on('pointerout', () => {
        btnGfx.clear();
        btnGfx.fillStyle(0x000000, 0.3);
        btnGfx.fillRoundedRect(cx - bw / 2 + 2, by - bh / 2 + 2, bw, bh, 8);
        btnGfx.fillStyle(color, 1);
        btnGfx.fillRoundedRect(cx - bw / 2, by - bh / 2, bw, bh, 8);
        btnGfx.fillStyle(0xffffff, 0.2);
        btnGfx.fillRoundedRect(cx - bw / 2 + 2, by - bh / 2 + 2, bw - 4, bh / 2 - 2, { tl: 6, tr: 6, bl: 0, br: 0 });
      });
      hitArea.on('pointerdown', () => { sfx.click(); cb(); });
    };

    makeBtn(W / 2 - bw - bg, t(this.locale, 'raceAgain'), 0x388e3c, 0x4caf50, () =>
      this.scene.start('RaceScene', { eventType: this.eventType, locale: this.locale }));
    const ni = (EVENT_ORDER.indexOf(this.eventType) + 1) % EVENT_ORDER.length;
    makeBtn(W / 2, t(this.locale, 'nextEvent'), 0x1565c0, 0x1976d2, () =>
      this.scene.start('RaceScene', { eventType: EVENT_ORDER[ni], locale: this.locale }));
    makeBtn(W / 2 + bw + bg, t(this.locale, 'menu'), 0x616161, 0x757575, () =>
      this.scene.start('MenuScene', { locale: this.locale }));
  }
}
